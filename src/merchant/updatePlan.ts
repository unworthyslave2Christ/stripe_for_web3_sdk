// src/merchant/updatePlan.ts

import { encodeFunctionData, type Address } from "viem";

import type { MerchantClient } from "./MerchantClient";

import type {
  PlanRecord,
  BillingPeriodNamed,
  TrialPeriodNamed,
  PlanMirrorResponse,
} from "../types/Plan";

import { getMerchantKernel } from "../kernels/getMerchantKernel";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

import protocolAbi from "../contracts/abi/Web3BillingProtocol.json";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface UpdatePlanParams {
  /**
   * Merchant SDK client.
   */
  client: MerchantClient;

  /**
   * Existing canonical plan.
   *
   * Used to determine which fields actually changed.
   */
  originalPlan: PlanRecord;

  /**
   * Desired canonical plan state.
   */
  updatedPlan: PlanRecord;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface UpdatePlanResult {
  /**
   * Canonical PlanRecord returned by the backend.
   */
  plan: PlanRecord;

  /**
   * UserOperation hash.
   *
   * Undefined when no blockchain fields changed.
   */
  userOperationHash?: `0x${string}`;

  /**
   * Underlying transaction hash when available.
   */
  transactionHash?: `0x${string}`;

  /**
   * Merchant Kernel smart account.
   */
  smartAccount: Address;

  /**
   * Whether the plan actually required an on-chain update.
   */
  unchanged: boolean;

  /**
   * Receipt returned by the Kernel client.
   */
  receipt?: any;

  alreadyExists?: boolean;
}

////////////////////////////////////////////////////////////
// BILLING PERIOD -> SECONDS
////////////////////////////////////////////////////////////

function billingPeriodToSeconds(period: BillingPeriodNamed): number {
  switch (period) {
    case "FIVE_MINUTES":
      return 5 * 60;

    case "HOURLY":
      return 60 * 60;

    case "DAILY":
      return 24 * 60 * 60;

    case "WEEKLY":
      return 7 * 24 * 60 * 60;

    case "MONTHLY":
      return 30 * 24 * 60 * 60;

    case "QUARTERLY":
      return 90 * 24 * 60 * 60;

    case "YEARLY":
      return 365 * 24 * 60 * 60;

    default: {
      const exhaustiveCheck: never = period;

      throw new Error(`Unsupported billing period: ${String(exhaustiveCheck)}`);
    }
  }
}

////////////////////////////////////////////////////////////
// TRIAL PERIOD -> SECONDS
////////////////////////////////////////////////////////////

function trialPeriodToSeconds(period: TrialPeriodNamed): number {
  switch (period) {
    case "NONE":
      return 0;

    case "FIVE_MINUTES":
      return 5 * 60;

    case "HOURLY":
      return 60 * 60;

    case "DAILY":
      return 24 * 60 * 60;

    case "WEEKLY":
      return 7 * 24 * 60 * 60;

    case "MONTHLY":
      return 30 * 24 * 60 * 60;

    case "QUARTERLY":
      return 90 * 24 * 60 * 60;

    case "YEARLY":
      return 365 * 24 * 60 * 60;

    default: {
      const exhaustiveCheck: never = period;

      throw new Error(`Unsupported trial period: ${String(exhaustiveCheck)}`);
    }
  }
}

////////////////////////////////////////////////////////////
// UPDATE PLAN
////////////////////////////////////////////////////////////

/**
 * Updates an existing billing plan.
 *
 * MerchantResolver is deliberately NOT used.
 *
 * The connected wallet resolves the existing merchant and
 * its Kernel through getMerchantKernel().
 *
 * Named periods remain application/backend values:
 *
 * billingPeriodNamed -> billingIntervalSeconds
 * trialPeriodNamed   -> trialPeriod
 *
 * The blockchain receives only the numeric values required
 * by the Solidity update functions.
 */
export async function updatePlan({
  client,
  originalPlan,
  updatedPlan,
}: UpdatePlanParams): Promise<UpdatePlanResult> {
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
  // BASIC VALIDATION
  ////////////////////////////////////////////////////////////

  if (originalPlan.planId !== updatedPlan.planId) {
    throw new Error("Cannot update a plan using a different plan ID.");
  }

  if (originalPlan.merchantId !== updatedPlan.merchantId) {
    throw new Error("Cannot change the merchant associated with a plan.");
  }

  if (updatedPlan.amount <= 0n) {
    throw new Error("Plan amount must be greater than zero.");
  }

  ////////////////////////////////////////////////////////////
  // RESOLVE MERCHANT + KERNEL
  ////////////////////////////////////////////////////////////

  /*
   * MerchantResolver is intentionally absent.
   *
   * The connected wallet is used to resolve the existing
   * merchant and reconstruct its Kernel.
   */
  const { merchant, kernel } = await getMerchantKernel({
    walletClient: client.walletClient,

    publicClient: client.publicClient,

    apiUrl: client.apiUrl
  });

  ////////////////////////////////////////////////////////////
  // VERIFY MERCHANT
  ////////////////////////////////////////////////////////////

  if (merchant.merchantId !== updatedPlan.merchantId) {
    throw new Error(
      "Connected wallet does not own the merchant associated with this plan.",
    );
  }

  ////////////////////////////////////////////////////////////
  // VERIFY KERNEL
  ////////////////////////////////////////////////////////////

  const merchantSmartAccount = kernel.address;

  if (
    merchantSmartAccount.toLowerCase() !== merchant.smartAccount.toLowerCase()
  ) {
    throw new Error("Connected wallet does not own the merchant Kernel.");
  }

  ////////////////////////////////////////////////////////////
  // PERIOD CONVERSION
  ////////////////////////////////////////////////////////////

  const originalBillingPeriod = originalPlan.billingPeriodNamed;

  const updatedBillingPeriod = updatedPlan.billingPeriodNamed;

  const originalBillingIntervalSeconds = originalBillingPeriod
    ? billingPeriodToSeconds(originalBillingPeriod)
    : originalPlan.billingIntervalSeconds;

  const updatedBillingIntervalSeconds = updatedBillingPeriod
    ? billingPeriodToSeconds(updatedBillingPeriod)
    : updatedPlan.billingIntervalSeconds;

  const originalTrialPeriod = originalPlan.trialPeriodNamed
    ? trialPeriodToSeconds(originalPlan.trialPeriodNamed)
    : originalPlan.trialPeriod;

  const updatedTrialPeriod = updatedPlan.trialPeriodNamed
    ? trialPeriodToSeconds(updatedPlan.trialPeriodNamed)
    : updatedPlan.trialPeriod;

  ////////////////////////////////////////////////////////////
  // DETERMINE CHANGES
  ////////////////////////////////////////////////////////////

  const planId = BigInt(updatedPlan.planId);

  const calls: `0x${string}`[] = [];

  ////////////////////////////////////////////////////////////
  // AMOUNT
  ////////////////////////////////////////////////////////////

  if (originalPlan.amount !== updatedPlan.amount) {
    calls.push(
      encodeFunctionData({
        abi: protocolAbi,

        functionName: "updatePlanAmount",

        args: [planId, updatedPlan.amount],
      }),
    );
  }

  ////////////////////////////////////////////////////////////
  // NAME
  ////////////////////////////////////////////////////////////

  if (originalPlan.name !== updatedPlan.name) {
    calls.push(
      encodeFunctionData({
        abi: protocolAbi,

        functionName: "updatePlanName",

        args: [planId, updatedPlan.name],
      }),
    );
  }

  ////////////////////////////////////////////////////////////
  // BILLING INTERVAL
  ////////////////////////////////////////////////////////////

  if (originalBillingIntervalSeconds !== updatedBillingIntervalSeconds) {
    if (updatedBillingIntervalSeconds <= 0) {
      throw new Error("Billing interval must be greater than zero.");
    }

    calls.push(
      encodeFunctionData({
        abi: protocolAbi,

        functionName: "updatePlanInterval",

        args: [planId, BigInt(updatedBillingIntervalSeconds)],
      }),
    );
  }

  ////////////////////////////////////////////////////////////
  // PAYMENT TOKEN
  ////////////////////////////////////////////////////////////

  if (
    originalPlan.paymentToken.toLowerCase() !==
    updatedPlan.paymentToken.toLowerCase()
  ) {
    calls.push(
      encodeFunctionData({
        abi: protocolAbi,

        functionName: "updatePlanPaymentToken",

        args: [planId, updatedPlan.paymentToken],
      }),
    );
  }

  ////////////////////////////////////////////////////////////
  // TRIAL PERIOD
  ////////////////////////////////////////////////////////////

  if (originalTrialPeriod !== updatedTrialPeriod) {
    calls.push(
      encodeFunctionData({
        abi: protocolAbi,

        functionName: "updateTrialPeriod",

        args: [planId, BigInt(updatedTrialPeriod)],
      }),
    );
  }

  ////////////////////////////////////////////////////////////
  // MAX SUBSCRIBERS
  ////////////////////////////////////////////////////////////

  if (originalPlan.maxSubscribers !== updatedPlan.maxSubscribers) {
    calls.push(
      encodeFunctionData({
        abi: protocolAbi,

        functionName: "updateMaxSubscribers",

        args: [planId, BigInt(updatedPlan.maxSubscribers)],
      }),
    );
  }

  ////////////////////////////////////////////////////////////
  // AUTO RENEWAL
  ////////////////////////////////////////////////////////////

  if (originalPlan.allowRenewal !== updatedPlan.allowRenewal) {
    calls.push(
      encodeFunctionData({
        abi: protocolAbi,

        functionName: "setAutoRenewal",

        args: [planId, updatedPlan.allowRenewal],
      }),
    );
  }

  ////////////////////////////////////////////////////////////
  // NO BLOCKCHAIN CHANGES
  ////////////////////////////////////////////////////////////

  /*
   * billingPeriodNamed and metadataURI may have changed
   * without requiring an on-chain transaction.
   *
   * If no blockchain field changed, simply mirror the
   * canonical application record.
   */
  if (calls.length === 0) {
    const mirrored = await mirror({
      apiUrl: client.apiUrl,

      endpoint: "/api/v1/plans",

      body: {
        ...updatedPlan,

        planId: updatedPlan.planId,

        merchantId: updatedPlan.merchantId,

        amount: updatedPlan.amount.toString(),

        billingIntervalSeconds: updatedBillingIntervalSeconds,

        trialPeriod: updatedTrialPeriod,

        billingPeriodNamed: updatedPlan.billingPeriodNamed,

        trialPeriodNamed: updatedPlan.trialPeriodNamed,

        transactionHash: null,

        userOperationHash: null,
      },
    }) as PlanMirrorResponse;

    const plan = normalizePlan(mirrored.plan ?? mirrored);

    return {
      plan,

      smartAccount: merchantSmartAccount,

      unchanged: true,

      alreadyExists: false,
    };
  }

  ////////////////////////////////////////////////////////////
  // ENCODE KERNEL CALLS
  ////////////////////////////////////////////////////////////

  const callData = await kernel.account.encodeCalls(
    calls.map((data) => ({
      to: contractAddress,

      value: 0n,

      data,
    })),
  );

  ////////////////////////////////////////////////////////////
  // EXECUTE USER OPERATION
  ////////////////////////////////////////////////////////////

  const userOperationHash = await kernel.client.sendUserOperation({
    callData,
  });

  ////////////////////////////////////////////////////////////
  // WAIT FOR RECEIPT
  ////////////////////////////////////////////////////////////

  const userOperationReceipt = await kernel.client.waitForUserOperationReceipt({
    hash: userOperationHash,
  });

  const receipt = userOperationReceipt.receipt;

  ////////////////////////////////////////////////////////////
  // VERIFY RECEIPT
  ////////////////////////////////////////////////////////////

  if (receipt?.status && receipt.status !== "success") {
    throw new Error("Plan update transaction failed.");
  }

  ////////////////////////////////////////////////////////////
  // TRANSACTION HASH
  ////////////////////////////////////////////////////////////

  const transactionHash = extractTransactionHash(userOperationReceipt);

  ////////////////////////////////////////////////////////////
  // BACKEND MIRROR
  ////////////////////////////////////////////////////////////

  /*
   * The blockchain has now been updated.
   *
   * The backend receives the complete canonical PlanRecord,
   * including the named-period metadata.
   */
  const mirrored = await mirror({
      apiUrl: client.apiUrl,

      endpoint:
          `/api/v1/plans/${updatedPlan.planId}`,

      method: "PATCH",

      body: {
          ...updatedPlan,

          planId:
              updatedPlan.planId,

          merchantId:
              merchant.merchantId,

          paymentToken:
              updatedPlan.paymentToken,

          amount:
              updatedPlan.amount.toString(),

          billingIntervalSeconds:
              updatedBillingIntervalSeconds,

          billingPeriodNamed:
              updatedPlan.billingPeriodNamed,

          trialPeriod:
              updatedTrialPeriod,

          trialPeriodNamed:
              updatedPlan.trialPeriodNamed,

          maxSubscribers:
              updatedPlan.maxSubscribers,

          allowRenewal:
              updatedPlan.allowRenewal,

          metadataURI:
              updatedPlan.metadataURI,

          name:
              updatedPlan.name,

          userOperationHash,

          transactionHash:
              transactionHash ?? null,
      },
  }) as PlanMirrorResponse;

  ////////////////////////////////////////////////////////////
  // NORMALIZE
  ////////////////////////////////////////////////////////////

  const plan = normalizePlan(mirrored.plan ?? mirrored);

  ////////////////////////////////////////////////////////////
  // RETURN
  ////////////////////////////////////////////////////////////

  return {
    plan,

    userOperationHash,

    transactionHash,

    smartAccount: merchantSmartAccount,

    unchanged: false,

    receipt,

    alreadyExists: false,
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
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (typeof value === "number") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}

////////////////////////////////////////////////////////////
// TRANSACTION HASH
////////////////////////////////////////////////////////////

function extractTransactionHash(receipt: any): `0x${string}` | undefined {
  const hash = receipt?.receipt?.transactionHash ?? receipt?.transactionHash;

  return hash as `0x${string}` | undefined;
}
