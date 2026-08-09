// src/merchant/resumePlan.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanMirrorResponse, PlanRecord } from "../types/Plan";

import { getMerchantKernel } from "../kernels/getMerchantKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface ResumePlanParams {
  /**
   * Merchant SDK client.
   *
   * Contains the connected wallet, public client,
   * Billing Protocol address and API URL.
   */
  client: MerchantClient;

  /**
   * Canonical plan to resume.
   */
  plan: PlanRecord;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface ResumePlanResult {
  /**
   * Canonical plan returned by the backend.
   */
  plan: PlanRecord;

  /**
   * Kernel UserOperation hash.
   */
  userOperationHash: `0x${string}`;

  /**
   * Underlying transaction hash, when available.
   */
  transactionHash?: `0x${string}`;

  /**
   * UserOperation receipt.
   */
  receipt: any;
}

////////////////////////////////////////////////////////////
// RESUME PLAN
////////////////////////////////////////////////////////////

/**
 * Resumes an existing paused billing plan.
 *
 * Workflow:
 *
 * 1. Resolve the connected merchant.
 * 2. Resolve the merchant Kernel.
 * 3. Verify that the connected wallet corresponds to
 *    the merchant Kernel.
 * 4. Encode activatePlan(planId).
 * 5. Execute the operation through the merchant Kernel.
 * 6. Wait for the UserOperation receipt.
 * 7. Mirror the ACTIVE status to the backend.
 * 8. Return the canonical PlanRecord.
 *
 * MerchantResolver is deliberately not used.
 */
export async function resumePlan({
  client,
  plan,
}: ResumePlanParams): Promise<ResumePlanResult> {
  ////////////////////////////////////////////////////////////
  // CONFIGURATION
  ////////////////////////////////////////////////////////////

  if (!client.contractAddress) {
    throw new Error("Billing Protocol contract address is not configured.");
  }

  if (!client.apiUrl) {
    throw new Error("Merchant API URL is not configured.");
  }

  const contractAddress = client.contractAddress;

  ////////////////////////////////////////////////////////////
  // RESOLVE MERCHANT + KERNEL
  ////////////////////////////////////////////////////////////

  /*
   * The merchant already exists.
   *
   * getMerchantKernel() resolves the existing merchant
   * and reconstructs its Kernel from the connected wallet.
   *
   * No MerchantResolver is required.
   */
  const { merchant, kernel } = await getMerchantKernel({
    walletClient: client.walletClient,

    publicClient: client.publicClient,
  });

  ////////////////////////////////////////////////////////////
  // SAFETY CHECK
  ////////////////////////////////////////////////////////////

  if (kernel.address.toLowerCase() !== merchant.smartAccount.toLowerCase()) {
    throw new Error("Connected wallet does not own the merchant Kernel.");
  }

  ////////////////////////////////////////////////////////////
  // VALIDATION
  ////////////////////////////////////////////////////////////

  if (!Number.isInteger(plan.planId) || plan.planId <= 0) {
    throw new Error("Invalid plan ID.");
  }

  ////////////////////////////////////////////////////////////
  // ENCODE activatePlan()
  ////////////////////////////////////////////////////////////

  const data = encodeBillingProtocolCall("activatePlan", [BigInt(plan.planId)]);

  ////////////////////////////////////////////////////////////
  // EXECUTE USER OPERATION
  ////////////////////////////////////////////////////////////

  const userOperationHash = await executeUserOperation({
    kernel,

    kernelClient: kernel.client,

    contractAddress,

    data,
  });

  ////////////////////////////////////////////////////////////
  // WAIT FOR RECEIPT
  ////////////////////////////////////////////////////////////

  const receipt = await waitForReceipt({
    kernelClient: kernel.client,

    userOperationHash,
  });

  ////////////////////////////////////////////////////////////
  // VERIFY RECEIPT
  ////////////////////////////////////////////////////////////

  if (receipt?.status && receipt.status !== "success") {
    throw new Error("Plan resume transaction failed.");
  }

  ////////////////////////////////////////////////////////////
  // MIRROR BACKEND
  ////////////////////////////////////////////////////////////

  const mirrored = await mirror({
    apiUrl: client.apiUrl,

    endpoint: `/api/v1/plans/${plan.planId}/resume`,

    body: {
      planId: plan.planId,

      merchantId: merchant.merchantId,

      status: "ACTIVE",
    },
  }) as PlanMirrorResponse;

  ////////////////////////////////////////////////////////////
  // NORMALIZE PLAN
  ////////////////////////////////////////////////////////////

  const resumedPlan = normalizePlan(
    mirrored.plan ??
      mirrored ?? {
        ...plan,
        status: "ACTIVE",
      },
  );

  ////////////////////////////////////////////////////////////
  // TRANSACTION HASH
  ////////////////////////////////////////////////////////////

  const transactionHash = extractTransactionHash(receipt);

  ////////////////////////////////////////////////////////////
  // RETURN
  ////////////////////////////////////////////////////////////

  return {
    plan: resumedPlan,

    userOperationHash,

    transactionHash,

    receipt,
  };
}

////////////////////////////////////////////////////////////
// NORMALIZATION
////////////////////////////////////////////////////////////

function normalizePlan(input: any): PlanRecord {
  return {
    planId: Number(input.planId ?? input.plan_id),

    merchantId: Number(input.merchantId ?? input.merchant_id),

    paymentToken: input.paymentToken ?? input.payment_token,

    amount: BigInt(input.amount),

    billingIntervalSeconds: Number(
      input.billingIntervalSeconds ?? input.billing_interval_seconds,
    ),

    billingPeriodNamed: input.billingPeriodNamed ?? input.billing_period_named,

    trialPeriod: Number(input.trialPeriod ?? input.trial_period ?? 0),

    trialPeriodNamed:
      input.trialPeriodNamed ?? input.trial_period_named ?? "NONE",

    name: input.name,

    status: input.status ?? "ACTIVE",

    maxSubscribers: Number(input.maxSubscribers ?? input.max_subscribers ?? 0),

    allowRenewal: input.allowRenewal ?? input.allow_renewal ?? true,

    metadataURI: input.metadataURI ?? input.metadata_uri ?? "",

    createdAt: normalizeDate(input.createdAt ?? input.created_at),

    updatedAt: normalizeDate(input.updatedAt ?? input.updated_at),
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
    return new Date(value);
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  return new Date();
}

////////////////////////////////////////////////////////////
// TRANSACTION HASH
////////////////////////////////////////////////////////////

function extractTransactionHash(receipt: any): `0x${string}` | undefined {
  /*
   * ZeroDev versions can expose the underlying
   * transaction receipt differently.
   *
   * Never fabricate a transaction hash.
   */
  const hash = receipt?.receipt?.transactionHash ?? receipt?.transactionHash;

  return hash as `0x${string}` | undefined;
}
