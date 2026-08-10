// src/merchant/createPlan.ts

import { encodeFunctionData, type Address, decodeEventLog } from "viem";

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

export interface CreatePlanParams {
  /**
   * Merchant SDK client.
   *
   * Contains:
   * - connected wallet
   * - public client
   * - Billing Protocol contract address
   * - API URL
   */
  client: MerchantClient;

  /**
   * Human-readable plan name.
   */
  name: string;

  /**
   * ERC-20 token used for billing.
   */
  paymentToken: Address;

  /**
   * Amount charged per billing cycle.
   *
   * This is sent to Solidity as uint256.
   */
  amount: bigint;

  /**
   * Named billing period.
   *
   * The SDK converts this to seconds before
   * calling the Billing Protocol.
   *
   * Example:
   *
   * FIVE_MINUTES -> 300
   * MONTHLY      -> 2592000
   */
  billingPeriodNamed: BillingPeriodNamed;

  /**
   * Named trial period.
   *
   * The current Solidity createPlan() implementation
   * does NOT receive a trial period.
   *
   * The contract initializes trialPeriod = 0.
   *
   * Therefore this value is currently backend/application
   * metadata and must not be sent to Solidity.
   */
  trialPeriodNamed: TrialPeriodNamed;

  /**
   * Maximum number of subscribers.
   *
   * The current Solidity createPlan() implementation
   * initializes this to zero.
   *
   * Therefore this is currently backend/application
   * metadata and must not be sent to Solidity.
   */
  maxSubscribers: number;

  /**
   * Whether subscriptions may renew.
   *
   * The current Solidity createPlan() implementation
   * initializes allowRenewal = true.
   *
   * Therefore this is currently backend/application
   * metadata and must not be sent to Solidity.
   */
  allowRenewal: boolean;

  /**
   * Optional metadata URI.
   *
   * Backend/application metadata only.
   */
  metadataURI?: string;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface CreatePlanResult {
  /**
   * Canonical PlanRecord returned by the backend.
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
   * Indicates whether the plan was already present.
   */
  alreadyExists: boolean;
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
// CREATE PLAN
////////////////////////////////////////////////////////////

/**
 * Creates a billing plan for an existing merchant.
 *
 * Blockchain:
 *
 * createPlan(
 *     uint256 merchantId,
 *     string name,
 *     address paymentToken,
 *     uint256 amount,
 *     uint256 billingInterval
 * )
 *
 * The following are NOT blockchain arguments:
 *
 * - trialPeriodNamed
 * - trialPeriod
 * - maxSubscribers
 * - allowRenewal
 * - metadataURI
 * - billingPeriodNamed
 *
 * They are application/backend metadata.
 *
 * Current Solidity defaults:
 *
 * trialPeriod    = 0
 * maxSubscribers = 0
 * allowRenewal   = true
 */
export async function createPlan({
  client,
  name,
  paymentToken,
  amount,
  billingPeriodNamed,
  trialPeriodNamed,
  maxSubscribers,
  allowRenewal,
  metadataURI = "",
}: CreatePlanParams): Promise<CreatePlanResult> {
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
  // VALIDATION
  ////////////////////////////////////////////////////////////

  if (amount <= 0n) {
    throw new Error("Plan amount must be greater than zero.");
  }

  const billingIntervalSeconds = billingPeriodToSeconds(billingPeriodNamed);

  if (billingIntervalSeconds <= 0) {
    throw new Error("Billing interval must be greater than zero.");
  }

  /*
   * Calculate this for the backend representation.
   *
   * IMPORTANT:
   *
   * The current Solidity createPlan() does not accept
   * trialPeriod, so this value is NOT sent on-chain.
   */
  const trialPeriod = trialPeriodToSeconds(trialPeriodNamed);

  ////////////////////////////////////////////////////////////
  // RESOLVE MERCHANT + KERNEL
  ////////////////////////////////////////////////////////////

  /*
   * MerchantResolver is deliberately gone.
   *
   * getMerchantKernel() resolves the existing merchant
   * using the connected wallet and public client.
   */
  const { merchant, kernel } = await getMerchantKernel({
    walletClient: client.walletClient,

    publicClient: client.publicClient,

    apiUrl: client.apiUrl
  });

  ////////////////////////////////////////////////////////////
  // VERIFY MERCHANT KERNEL
  ////////////////////////////////////////////////////////////

  const merchantSmartAccount = kernel.address;

  if (
    merchantSmartAccount.toLowerCase() !== merchant.smartAccount.toLowerCase()
  ) {
    throw new Error("Connected wallet does not own the merchant Kernel.");
  }

  ////////////////////////////////////////////////////////////
  // MERCHANT ID
  ////////////////////////////////////////////////////////////

  const merchantId = BigInt(merchant.merchantId);

  ////////////////////////////////////////////////////////////
  // ENCODE createPlan()
  ////////////////////////////////////////////////////////////

  /*
   * THIS IS THE CRITICAL ALIGNMENT.
   *
   * Solidity:
   *
   * createPlan(
   *     uint256 merchantId,
   *     string name,
   *     address paymentToken,
   *     uint256 amount,
   *     uint256 billingInterval
   * )
   *
   * Therefore exactly these five arguments
   * are sent to the contract.
   */

  const data = encodeFunctionData({
    abi: protocolAbi,

    functionName: "createPlan",

    args: [
      merchantId,

      name,

      paymentToken,

      amount,

      BigInt(billingIntervalSeconds),
    ],
  });

  ////////////////////////////////////////////////////////////
  // ENCODE KERNEL CALL
  ////////////////////////////////////////////////////////////

  const callData = await kernel.account.encodeCalls([
    {
      to: contractAddress,

      value: 0n,

      data,
    },
  ]);

  ////////////////////////////////////////////////////////////
  // SEND USER OPERATION
  ////////////////////////////////////////////////////////////

  const userOperationHash = await kernel.client.sendUserOperation({
    callData,
  });

  ////////////////////////////////////////////////////////////
  // WAIT FOR USER OPERATION
  ////////////////////////////////////////////////////////////

  const userOperationReceipt = await kernel.client.waitForUserOperationReceipt({
    hash: userOperationHash,
  });

  const receipt = userOperationReceipt.receipt;

  ////////////////////////////////////////////////////////////
  // VERIFY RECEIPT
  ////////////////////////////////////////////////////////////

  if (receipt?.status && receipt.status !== "success") {
    throw new Error("Plan creation transaction failed.");
  }

  ////////////////////////////////////////////////////////////
  // RESOLVE PLAN ID
  ////////////////////////////////////////////////////////////

  const planId = await resolvePlanIdFromReceipt({
    publicClient: client.publicClient,

    contractAddress,

    receipt,

    merchantId: merchant.merchantId,
  });

  ////////////////////////////////////////////////////////////
  // TRANSACTION HASH
  ////////////////////////////////////////////////////////////

  const transactionHash = extractTransactionHash(userOperationReceipt);

  ////////////////////////////////////////////////////////////
  // BACKEND MIRROR
  ////////////////////////////////////////////////////////////

  /*
   * The backend receives the complete application-level
   * representation.
   *
   * The blockchain only received:
   *
   * merchantId
   * name
   * paymentToken
   * amount
   * billingIntervalSeconds
   *
   * The remaining values are persisted as application
   * metadata/defaults.
   */

  const mirrored = await mirror({
    apiUrl: client.apiUrl,

    endpoint: "/api/v1/plans",

    body: {
      planId,

      merchantId: merchant.merchantId,

      paymentToken,

      amount: amount.toString(),

      billingIntervalSeconds,

      billingPeriodNamed,

      /*
       * Current contract default.
       *
       * trialPeriodNamed is application metadata,
       * while this numeric field mirrors the current
       * on-chain default.
       */
      trialPeriod: 0,

      trialPeriodNamed,

      /*
       * Current contract default.
       */
      maxSubscribers: 0,

      /*
       * Current contract default.
       */
      allowRenewal: true,

      metadataURI,

      name,

      userOperationHash,

      transactionHash: transactionHash ?? null,
    },
  }) as PlanMirrorResponse;

  ////////////////////////////////////////////////////////////
  // NORMALIZE CANONICAL PLAN
  ////////////////////////////////////////////////////////////

  const plan = normalizePlan(mirrored.plan ?? mirrored);

  ////////////////////////////////////////////////////////////
  // RETURN
  ////////////////////////////////////////////////////////////

  return {
    plan,

    userOperationHash,

    transactionHash,

    alreadyExists: false,
  };
}

////////////////////////////////////////////////////////////
// RESOLVE PLAN ID
////////////////////////////////////////////////////////////

async function resolvePlanIdFromReceipt({
    publicClient,
    contractAddress,
    receipt,
    merchantId,
}: {
    publicClient: MerchantClient["publicClient"];

    contractAddress: Address;

    receipt: {
        blockNumber: bigint;
    };

    merchantId: number;
}): Promise<number> {
    const events =
        await publicClient.getContractEvents({
            address: contractAddress,

            abi: protocolAbi,

            eventName: "PlanCreated",

            fromBlock:
                receipt.blockNumber,

            toBlock:
                receipt.blockNumber,
        });

    for (const event of events) {
        const decoded = decodeEventLog({
            abi: protocolAbi,
            data: event.data,
            topics: event.topics,
            eventName: "PlanCreated",
        });

        if (!decoded.args) {
            continue;
        }

        const args = decoded.args as unknown as {
            merchantId: bigint;
            planId: bigint;
        };

        /*
         * PlanCreated is emitted as:
         *
         * emit PlanCreated(
         *     merchantId,
         *     planId
         * );
         */

        if (
            Number(args.merchantId) !==
            merchantId
        ) {
            continue;
        }

        return Number(
            args.planId,
        );
    }

    throw new Error(
        "PlanCreated event was not found for the merchant; unable to determine the canonical plan ID.",
    );
}


////////////////////////////////////////////////////////////
// NORMALIZATION
////////////////////////////////////////////////////////////

/**
 * Converts backend/Supabase representations into
 * the canonical SDK PlanRecord representation.
 *
 * The SDK exposes camelCase fields regardless of whether
 * the backend uses snake_case.
 */
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
