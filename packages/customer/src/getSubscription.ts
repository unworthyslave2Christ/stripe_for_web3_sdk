// src/customer/getSubscription.ts

import type { CustomerClient } from "./CustomerClient";

import type {
    SubscriptionRecord,
    SubscriptionStatus,
    SubscriptionApiResponse,
} from "@stripe-for-web3/core";



////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface GetSubscriptionParams {

    /**
     * Customer SDK client.
     */
    client: CustomerClient;

    /**
     * Canonical subscription identifier.
     */
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

    const response =
        await fetch(
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

    if (
        !data?.subscription
    ) {

        throw new Error(
            `Subscription ${subscriptionId} was not returned by the API.`,
        );

    }

    const subscription =
        data.subscription;

    ////////////////////////////////////////////////////////////
    // NORMALIZE
    ////////////////////////////////////////////////////////////

    return {

        subscriptionId:
            Number(
                subscription.subscriptionId,
            ),

        customerId:
            subscription.customerId.toString(),

        merchantId:
            Number(
                subscription.merchantId,
            ),

        planId:
            Number(
                subscription.planId,
            ),

        smartAccount:
            subscription.smartAccount,

        permissionId:
            subscription.permissionId.toString(),

        status:
            subscription.status as SubscriptionStatus,

        nextBillingTime:
            normalizeDate(
                subscription.nextBillingTime,
            ),

        lastChargedAt:
            normalizeNullableDate(
                subscription.lastChargedAt,
            ),

        cancelledAt:
            normalizeNullableDate(
                subscription.cancelledAt,
            ),

        createdAt:
            normalizeDate(
                subscription.createdAt,
            ),

        transactionHash:
            subscription.transactionHash,
    };
}

////////////////////////////////////////////////////////////
// DATE NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeDate(
    value: unknown,
): Date {

    if (
        value instanceof Date
    ) {
        return value;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime(),
            )
        ) {

            throw new Error(
                `Invalid subscription timestamp: ${value}`,
            );

        }

        return date;
    }

    throw new Error(
        "Subscription timestamp is missing or invalid.",
    );
}

////////////////////////////////////////////////////////////
// NULLABLE DATE NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeNullableDate(
    value: unknown,
): Date | null {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    return normalizeDate(value);
}