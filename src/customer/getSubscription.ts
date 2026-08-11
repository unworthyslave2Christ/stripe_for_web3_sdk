// src/customer/getSubscription.ts

import type { CustomerClient } from "./CustomerClient";

import type {
    SubscriptionRecord,
    SubscriptionStatus,
    SubscriptionApiResponse,
} from "../types/Subscription";

////////////////////////////////////////////////////////////
// PARAMETERS
////////////////////////////////////////////////////////////

export interface GetSubscriptionParams {
    client: CustomerClient;

    subscriptionId: number;
}

////////////////////////////////////////////////////////////
// GET SUBSCRIPTION
////////////////////////////////////////////////////////////

export async function getSubscription({
    client,

    subscriptionId,
}: GetSubscriptionParams): Promise<SubscriptionRecord> {

    ////////////////////////////////////////////////////////////
    // VALIDATE CLIENT
    ////////////////////////////////////////////////////////////

    if (!client.apiUrl) {
        throw new Error(
            "Customer API URL is not configured.",
        );
    }

    ////////////////////////////////////////////////////////////
    // VALIDATE SUBSCRIPTION ID
    ////////////////////////////////////////////////////////////

    if (
        !Number.isInteger(subscriptionId) ||
        subscriptionId <= 0
    ) {
        throw new Error(
            "Invalid subscriptionId.",
        );
    }

    ////////////////////////////////////////////////////////////
    // REQUEST
    ////////////////////////////////////////////////////////////

    const response = await fetch(
        `${client.apiUrl}/api/v1/subscriptions/${subscriptionId}`,
        {
            method: "GET",

            headers: {
                Accept:
                    "application/json",
            },

            cache:
                "no-store",
        },
    );

    ////////////////////////////////////////////////////////////
    // RESPONSE ERROR
    ////////////////////////////////////////////////////////////

    if (!response.ok) {

        let message =
            `Unable to retrieve subscription ${subscriptionId}.`;

        try {

            const errorBody =
                await response.json() as {
                    error?: string;
                };

            if (errorBody.error) {
                message =
                    errorBody.error;
            }

        } catch {
            // Preserve default error message.
        }

        throw new Error(message);
    }

    ////////////////////////////////////////////////////////////
    // RESPONSE BODY
    ////////////////////////////////////////////////////////////

    const data =
        await response.json() as SubscriptionApiResponse;

    ////////////////////////////////////////////////////////////
    // SUBSCRIPTION PRESENCE
    ////////////////////////////////////////////////////////////

    if (!data) {
        throw new Error(
            `Subscription ${subscriptionId} was not returned by the API.`,
        );
    }

    ////////////////////////////////////////////////////////////
    // NORMALIZE API RECORD
    ////////////////////////////////////////////////////////////

    return {
        subscriptionId:
            Number(data.subscription.subscriptionId),

        customerId:
            data.subscription.customerId.toString(),

        merchantId:
            Number(data.subscription.merchantId),

        planId:
            Number(data.subscription.planId),

        smartAccount:
            data.subscription.smartAccount,

        permissionId:
            data.subscription.permissionId.toString(),

        status:
            data.subscription.status as SubscriptionStatus,

        nextBillingTime:
            new Date(data.subscription.nextBillingTime),

        lastChargedAt:
            data.subscription.lastChargedAt === null ||
            data.subscription.lastChargedAt=== undefined
                ? null
                : Number(
                    data.subscription.lastChargedAt,
                ),

        cancelledAt:
            data.subscription.cancelledAt === null ||
            data.subscription.cancelledAt === undefined
                ? null
                : Number(
                    data.subscription.cancelledAt,
                ),

        createdAt:
            Number(data.subscription.createdAt),

        transactionHash:
            data.subscription.transactionHash,
    };
}