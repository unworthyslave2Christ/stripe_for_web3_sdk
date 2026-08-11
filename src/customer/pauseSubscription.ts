// src/customer/pauseSubscription.ts

import type { CustomerClient } from "./CustomerClient";

import type { SubscriptionRecord } from "../types/Subscription";

import { getCustomerKernel } from "../kernels/getCustomerKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface PauseSubscriptionParams {
    /**
     * Customer SDK client.
     */
    client: CustomerClient;

    /**
     * Subscription being paused.
     */
    subscription: SubscriptionRecord;
}

////////////////////////////////////////////////////////////
// PAUSE SUBSCRIPTION
////////////////////////////////////////////////////////////

export async function pauseSubscription({
    client,
    subscription,
}: PauseSubscriptionParams) {

    ////////////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////////////

    if (!client.contractAddress) {
        throw new Error(
            "Billing Protocol contract address is not configured.",
        );
    }

    if (!client.apiUrl) {
        throw new Error(
            "Customer API URL is not configured.",
        );
    }

    ////////////////////////////////////////////////////////////
    // VALIDATE SUBSCRIPTION
    ////////////////////////////////////////////////////////////

    if (
        !Number.isInteger(
            subscription.subscriptionId,
        ) ||
        subscription.subscriptionId <= 0
    ) {
        throw new Error(
            "Invalid subscription ID.",
        );
    }

    ////////////////////////////////////////////////////////////
    // CURRENT STATE
    ////////////////////////////////////////////////////////////

    if (
        subscription.status === "PAUSED"
    ) {
        throw new Error(
            `Subscription ${subscription.subscriptionId} is already paused.`,
        );
    }

    if (
        subscription.status === "CANCELLED"
    ) {
        throw new Error(
            `Subscription ${subscription.subscriptionId} is cancelled and cannot be paused.`,
        );
    }

    ////////////////////////////////////////////////////////////
    // CUSTOMER KERNEL
    ////////////////////////////////////////////////////////////

    const {
        customer,
        kernel,
        kernelClient,
    } = await getCustomerKernel({
        walletClient:
            client.walletClient,

        publicClient:
            client.publicClient,

        apiUrl:
            client.apiUrl,
    });

    ////////////////////////////////////////////////////////////
    // VERIFY CUSTOMER KERNEL
    ////////////////////////////////////////////////////////////

    if (
        kernel.address.toLowerCase() !==
        customer.smartAccount.toLowerCase()
    ) {
        throw new Error(
            "Customer Kernel verification failed.",
        );
    }

    ////////////////////////////////////////////////////////////
    // ENCODE BILLING PROTOCOL CALL
    ////////////////////////////////////////////////////////////

    const data =
        encodeBillingProtocolCall(
            "pauseSubscription",
            [
                BigInt(
                    subscription.subscriptionId,
                ),
            ],
        );

    ////////////////////////////////////////////////////////////
    // EXECUTE USER OPERATION
    ////////////////////////////////////////////////////////////

    const userOpHash =
        await executeUserOperation({
            kernel,

            kernelClient,

            contractAddress:
                client.contractAddress,

            data,
        });

    ////////////////////////////////////////////////////////////
    // WAIT FOR USER OPERATION RECEIPT
    ////////////////////////////////////////////////////////////

    const receipt =
        await waitForReceipt({
            kernelClient,

            userOperationHash:
                userOpHash,
        });

    ////////////////////////////////////////////////////////////
    // MIRROR BACKEND STATE
    ////////////////////////////////////////////////////////////

    await mirror({
        apiUrl:
            client.apiUrl,

        endpoint:
            `/api/v1/subscriptions/${subscription.subscriptionId}/pause`,

        body: {
            subscriptionId:
                subscription.subscriptionId,

            customerId:
                subscription.customerId,

            status:
                "PAUSED",
        },
    });

    ////////////////////////////////////////////////////////////
    // UPDATED SUBSCRIPTION RECORD
    ////////////////////////////////////////////////////////////

    const updatedSubscription:
        SubscriptionRecord = {
            ...subscription,

            status:
                "PAUSED",
        };

    ////////////////////////////////////////////////////////////
    // RETURN
    ////////////////////////////////////////////////////////////

    return {
        customer,

        subscription:
            updatedSubscription,

        kernel,

        userOpHash,

        receipt,
    };
}