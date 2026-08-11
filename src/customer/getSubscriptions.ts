// src/customer/getSubscriptions.ts

import type { CustomerClient } from "./CustomerClient";

import type {
    SubscriptionRecord,
    SubscriptionStatus,
    SubscriptionApiResponse,
} from "../types/Subscription";

////////////////////////////////////////////////////////////
// PARAMETERS
////////////////////////////////////////////////////////////

export interface GetSubscriptionsParams {
    client: CustomerClient;

    customerId: number;
}

////////////////////////////////////////////////////////////
// GET SUBSCRIPTIONS
////////////////////////////////////////////////////////////

export async function getSubscriptions({
    client,
    customerId,
}: GetSubscriptionsParams): Promise<SubscriptionRecord[]> {

    ////////////////////////////////////////////////////////////
    // VALIDATE CLIENT
    ////////////////////////////////////////////////////////////

    if (!client.apiUrl) {
        throw new Error(
            "Customer API URL is not configured.",
        );
    }

    ////////////////////////////////////////////////////////////
    // VALIDATE CUSTOMER ID
    ////////////////////////////////////////////////////////////

    if (
        !Number.isInteger(customerId) ||
        customerId > 0
    ) {
        throw new Error(
            "Invalid customerId.",
        );
    }

    ////////////////////////////////////////////////////////////
    // REQUEST
    ////////////////////////////////////////////////////////////

    const response = await fetch(
        `${client.apiUrl}/api/v1/customers/${encodeURIComponent(customerId)}/subscriptions`,
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
            "Unable to retrieve subscriptions.";

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
        await response.json() as
            | SubscriptionApiResponse[]
            | {
                subscriptions?: SubscriptionApiResponse[];
            };

    ////////////////////////////////////////////////////////////
    // EXTRACT SUBSCRIPTIONS
    ////////////////////////////////////////////////////////////

    const subscriptions =
        Array.isArray(data)
            ? data
            : data.subscriptions ?? [];

    ////////////////////////////////////////////////////////////
    // NORMALIZE
    ////////////////////////////////////////////////////////////

    return subscriptions.map(
        (subscription) => {

            return {
                subscriptionId:
                    Number(
                        subscription.subscription.subscriptionId,
                    ),

                customerId:
                    subscription.subscription.customerId.toString(),

                merchantId:
                    Number(
                        subscription.subscription.merchantId,
                    ),

                planId:
                    Number(
                        subscription.subscription.planId,
                    ),

                smartAccount:
                    subscription.subscription.smartAccount,

                permissionId:
                    subscription.subscription.permissionId.toString(),

                status:
                    subscription.subscription.status,

                nextBillingTime:
                    new Date(
                        subscription.subscription.nextBillingTime,
                    ),

                lastChargedAt:
                    subscription.subscription.lastChargedAt ===
                        null ||
                    subscription.subscription.lastChargedAt ===
                        undefined
                        ? null
                        : Number(
                            subscription.subscription.lastChargedAt,
                        ),

                cancelledAt:
                    subscription.subscription.cancelledAt ===
                        null ||
                    subscription.subscription.cancelledAt ===
                        undefined
                        ? null
                        : Number(
                            subscription.subscription.cancelledAt,
                        ),

                createdAt:
                    Number(
                        subscription.subscription.createdAt,
                    ),

                transactionHash:
                    subscription.subscription.transactionHash,
            };
        },
    );
}