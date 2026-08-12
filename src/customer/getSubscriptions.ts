// src/customer/getSubscriptions.ts

import type { CustomerClient } from "./CustomerClient";

import type {
  SubscriptionRecord,
  SubscriptionStatus,
} from "../types/Subscription";

////////////////////////////////////////////////////////////
// API RESPONSE
////////////////////////////////////////////////////////////

interface CustomerSubscriptionsApiResponse {
  subscriptions: Array<{
    subscriptionId: number;
    customerId: string;
    merchantId: number;
    planId: number;
    smartAccount: `0x${string}`;
    permissionId: string;
    status: string;
    nextBillingTime: string | number | Date;
    lastChargedAt: string | number | Date | null;
    cancelledAt: string | number | Date | null;
    createdAt: string | number | Date;
    transactionHash: `0x${string}`;
  }>;
}

////////////////////////////////////////////////////////////
// PARAMETERS
////////////////////////////////////////////////////////////

export interface GetSubscriptionsParams {
  client: CustomerClient;

  /**
   * Canonical customer UUID.
   */
  customerId: string;
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
    throw new Error("Customer API URL is not configured.");
  }

  ////////////////////////////////////////////////////////////
  // VALIDATE CUSTOMER ID
  ////////////////////////////////////////////////////////////

  if (!customerId || typeof customerId !== "string") {
    throw new Error("Invalid customerId.");
  }

  ////////////////////////////////////////////////////////////
  // REQUEST
  ////////////////////////////////////////////////////////////

  const response = await fetch(
    `${client.apiUrl}/api/v1/customers/${encodeURIComponent(customerId)}/subscriptions`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      cache: "no-store",
    },
  );

  ////////////////////////////////////////////////////////////
  // RESPONSE ERROR
  ////////////////////////////////////////////////////////////

  if (!response.ok) {
    let message = "Unable to retrieve subscriptions.";

    try {
      const errorBody = (await response.json()) as {
        error?: string;
      };

      if (errorBody.error) {
        message = errorBody.error;
      }
    } catch {
      // Preserve default message.
    }

    throw new Error(message);
  }

  ////////////////////////////////////////////////////////////
  // RESPONSE BODY
  ////////////////////////////////////////////////////////////

  const data = (await response.json()) as CustomerSubscriptionsApiResponse;

  ////////////////////////////////////////////////////////////
  // NORMALIZE
  ////////////////////////////////////////////////////////////

  return data.subscriptions.map((subscription) => ({
    subscriptionId: Number(subscription.subscriptionId),

    customerId: subscription.customerId.toString(),

    merchantId: Number(subscription.merchantId),

    planId: Number(subscription.planId),

    smartAccount: subscription.smartAccount,

    permissionId: subscription.permissionId.toString(),

    status: subscription.status as SubscriptionStatus,

    nextBillingTime: normalizeDate(subscription.nextBillingTime),

    lastChargedAt: normalizeNullableDate(subscription.lastChargedAt),

    cancelledAt: normalizeNullableDate(subscription.cancelledAt),

    createdAt: normalizeDate(subscription.createdAt),

    transactionHash: subscription.transactionHash,
  }));
}

////////////////////////////////////////////////////////////
// DATE NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid subscription timestamp: ${value}`);
    }

    return date;
  }

  throw new Error("Subscription timestamp is missing or invalid.");
}

////////////////////////////////////////////////////////////
// NULLABLE DATE NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeNullableDate(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  return normalizeDate(value);
}
