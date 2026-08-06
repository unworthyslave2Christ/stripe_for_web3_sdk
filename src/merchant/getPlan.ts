// src/merchant/getPlan.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanRecord, PlanStatus } from "../types/Plan";

export interface GetPlanParams {
  client: MerchantClient;

  planId: number;
}

interface PlanApiResponse {
  plan_id: number;

  merchant_id: number;

  payment_token: `0x${string}`;

  amount: string;

  billing_interval_seconds: number;

  trial_period: number;

  max_subscribers: number;

  allow_renewal: boolean;

  metadata_uri: string;

  name: string;

  status: string;

  billing_period_named: string;

  trial_period_named: string;

  created_at: string;

  updated_at: string;
}

export async function getPlan({
  client,

  planId,
}: GetPlanParams): Promise<PlanRecord> {
  const response = await fetch(
    `${client.apiUrl ?? ""}/plans/${planId}`,

    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },

      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve billing plan.");
  }

  const data = await response.json() as PlanApiResponse;

  return {
    planId: data.plan_id,

    merchantId: data.merchant_id,

    paymentToken: data.payment_token,

    amount: BigInt(data.amount),

    billingIntervalSeconds: BigInt(data.billing_interval_seconds),

    trialPeriod: BigInt(data.trial_period),

    maxSubscribers: data.max_subscribers,

    allowRenewal: data.allow_renewal,

    metadataURI: data.metadata_uri,

    name: data.name,

    status: data.status as PlanStatus,

    billingPeriodNamed: data.billing_period_named,

    trialPeriodNamed: data.trial_period_named,

    createdAt: Number(data.created_at),

    updatedAt: Number(data.updated_at),
  };
}
