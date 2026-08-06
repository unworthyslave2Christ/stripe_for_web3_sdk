// src/customer/getSubscriptions.ts

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

export interface GetSubscriptionsParams {
  client: CustomerClient;

  customerId: string;
}

export async function getSubscriptions({
  client,

  customerId,
}: GetSubscriptionsParams): Promise<SubscriptionRecord[]> {
  const response = await fetch(
    `${client.apiUrl ?? ""}/customers/${customerId}/subscriptions`,

    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },

      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve subscriptions.");
  }

  const data = (await response.json()) as SubscriptionApiResponse[];

  return data.map((subscription) => ({
    subscriptionId: subscription.subscription_id,
    
    merchantId: subscription.merchant_id,

    planId: subscription.plan_id,

    customerId: subscription.customer_id,

    smartAccount: subscription.smart_account,

    permissionId: subscription.permission_id.toString(),

    status: subscription.status as SubscriptionStatus,

    nextBillingTime: Number(subscription.next_billing_time),

    lastChargedAt: Number(subscription.last_charged_at),

    cancelledAt: Number(subscription.cancelled_at),

    createdAt: Number(subscription.created_at),
  }));
}
