// src/merchant/getPlan.ts

import type { MerchantClient } from "./MerchantClient";

import type {
  BillingPeriodNamed,
  PlanRecord,
  PlanStatus,
  TrialPeriodNamed,
} from "../types/Plan";



////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface GetPlanParams {
  /**
   * Merchant SDK client.
   *
   * Only the API URL is required for this read operation.
   */
  client: MerchantClient;

  /**
   * Protocol/backend plan identifier.
   */
  planId: number;
}

////////////////////////////////////////////////////////////
// API RESPONSE
////////////////////////////////////////////////////////////

export interface GetPlanApiResponse {
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

////////////////////////////////////////////////////////////
// GET PLAN
////////////////////////////////////////////////////////////

/**
 * Retrieves a billing plan from the backend.
 *
 * This is a read-only operation.
 *
 * It deliberately does NOT:
 *
 * - use walletClient
 * - use publicClient
 * - rebuild the merchant Kernel
 * - use MerchantResolver
 *
 * The backend is the canonical persistence layer for PlanRecord.
 */
export async function getPlan({
  client,
  planId,
}: GetPlanParams): Promise<PlanRecord> {
  ////////////////////////////////////////////////////////////
  // CONFIGURATION
  ////////////////////////////////////////////////////////////

  if (!client.apiUrl) {
    throw new Error("Merchant API URL is not configured.");
  }

  ////////////////////////////////////////////////////////////
  // VALIDATION
  ////////////////////////////////////////////////////////////

  if (!Number.isInteger(planId) || planId <= 0) {
    throw new Error("Invalid plan ID.");
  }

  ////////////////////////////////////////////////////////////
  // REQUEST
  ////////////////////////////////////////////////////////////

  const response = await fetch(`${client.apiUrl}/api/v1/plans?planId=${planId}`, {
    method: "GET",

    headers: {
      Accept: "application/json",
    },

    cache: "no-store",
  });

  ////////////////////////////////////////////////////////////
  // RESPONSE VALIDATION
  ////////////////////////////////////////////////////////////

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Billing plan ${planId} was not found.`);
    }

    throw new Error("Unable to retrieve billing plan.");
  }

  ////////////////////////////////////////////////////////////
  // PARSE RESPONSE
  ////////////////////////////////////////////////////////////

  const body = (await response.json()) as
    | {
        plan?: GetPlanApiResponse;
      }
    | GetPlanApiResponse;

  let data:
        GetPlanApiResponse | undefined;


    ////////////////////////////////////////////////////////////
    // COLLECTION RESPONSE
    ////////////////////////////////////////////////////////////

    if (
        "plans" in body &&
        Array.isArray(body.plans)
    ) {

        if (body.plans.length === 0) {
            throw new Error(
                `Billing plan ${planId} was not found.`,
            );
        }

        data =
            body.plans[0];
    }

    
  ////////////////////////////////////////////////////////////
  // NORMALIZE
  ////////////////////////////////////////////////////////////

  return normalizePlan(data as GetPlanApiResponse) as PlanRecord;
}

////////////////////////////////////////////////////////////
// NORMALIZATION
////////////////////////////////////////////////////////////

/**
 * Converts the backend/Supabase representation into
 * the canonical SDK PlanRecord representation.
 */
function normalizePlan(input: GetPlanApiResponse): PlanRecord {
  return {
    planId: Number(input.plan_id),

    merchantId: Number(input.merchant_id),

    paymentToken: input.payment_token,

    amount: BigInt(input.amount),

    billingIntervalSeconds: Number(input.billing_interval_seconds),

    billingPeriodNamed: input.billing_period_named as BillingPeriodNamed,

    trialPeriod: Number(input.trial_period),

    trialPeriodNamed: input.trial_period_named as TrialPeriodNamed,

    maxSubscribers: Number(input.max_subscribers),

    allowRenewal: Boolean(input.allow_renewal),

    metadataURI: input.metadata_uri ?? "",

    name: input.name,

    status: input.status as PlanStatus,

    createdAt: normalizeDate(input.created_at),

    updatedAt: normalizeDate(input.updated_at),
  };
}

////////////////////////////////////////////////////////////
// DATE NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid plan timestamp: ${value}`);
    }

    return date;
  }

  if (typeof value === "number") {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid plan timestamp: ${value}`);
    }

    return date;
  }

  throw new Error("Plan timestamp is missing or invalid.");
}
