// src/customer/getSubscription.ts

import type { CustomerClient } from "./CustomerClient";

import type { SubscriptionRecord, SubscriptionStatus } from "../types/Subscription";

interface SubscriptionApiResponse {
  subscription_id: number;

  merchant_id: number;

  plan_id: number;

  customer_id: string;

  smart_account: `0x${string}`;

  permission_id: number;

  status: string;

  next_billing_time: string;

  last_charged_at: string | null;

  cancelled_at: string | null;

  created_at: string;
}

export interface GetSubscriptionParams {
  client: CustomerClient;

  subscriptionId: number;
}

export async function getSubscription({
  client,

  subscriptionId,
}: GetSubscriptionParams): Promise<SubscriptionRecord> {
  const response = await fetch(
    `${client.apiUrl ?? ""}/subscriptions/${subscriptionId}`,

    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },

      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve subscription.");
  }

  const data = (await response.json()) as SubscriptionApiResponse;

  return {
    subscriptionId: data.subscription_id,

    merchantId: data.merchant_id,

    planId: data.plan_id,

    customerId: data.customer_id,

    smartAccount: data.smart_account,

    permissionId: data.permission_id.toString(),

    status: data.status as SubscriptionStatus,

    nextBillingTime: Number(data.next_billing_time),

    lastChargedAt: Number(data.last_charged_at),

    cancelledAt: Number(data.cancelled_at),

    createdAt: Number(data.created_at),
  };
}
