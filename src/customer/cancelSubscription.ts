// src/customer/cancelSubscription.ts

import type { CustomerClient } from "./CustomerClient";

import type { SubscriptionRecord } from "../types/Subscription";

import { getCustomerKernel } from "../kernels/getCustomerKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

////////////////////////////////////////////////////////////
// PARAMETERS
////////////////////////////////////////////////////////////

export interface CancelSubscriptionParams {
    client: CustomerClient;

    subscription: SubscriptionRecord;
}

////////////////////////////////////////////////////////////
// CANCEL SUBSCRIPTION
////////////////////////////////////////////////////////////

export async function cancelSubscription({
    client,
    subscription,
}: CancelSubscriptionParams) {

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
    // ENCODE BILLING PROTOCOL CALL
    ////////////////////////////////////////////////////////////

    const data =
        encodeBillingProtocolCall(
            "cancelSubscription",

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
            `/api/v1/subscriptions/${subscription.subscriptionId}/cancel`,

        body: {

            subscriptionId:
                subscription.subscriptionId,

            status:
                "CANCELLED",

        },

    });


    ////////////////////////////////////////////////////////////
    // RETURN
    ////////////////////////////////////////////////////////////

    return {

        customer,

        subscription: {

            ...subscription,

            status:
                "CANCELLED",

            cancelledAt:
                Math.floor(
                    Date.now() / 1000,
                ),

        },

        kernel,

        userOpHash,

        receipt,

    };

}