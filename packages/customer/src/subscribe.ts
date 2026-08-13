// src/customer/subscribe.ts

import type { Address } from "viem";

import type { CustomerClient } from "./CustomerClient";

import type { CustomerRecord } from "@stripe-for-web3/core";

import type { MerchantRecord } from "@stripe-for-web3/core";

import type { PlanRecord } from "@stripe-for-web3/core";

import type { SubscriptionMirrorResponse, SubscriptionRecord } from "@stripe-for-web3/core";

import { getCustomerKernel } from "@stripe-for-web3/core";

import { encodeBillingProtocolCall } from "@stripe-for-web3/core";

import { executeUserOperation } from "@stripe-for-web3/core";

import { waitForReceipt } from "@stripe-for-web3/core";

import { mirror } from "@stripe-for-web3/core";

import { getMerchantById } from "./getMerchantById";

import {
    getPlan,
} from "./getPlan";




////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface SubscribeParams {
  /**
   * Customer billing plan to subscribe to.
   */
  plan: PlanRecord;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface SubscribeResult {
  /**
   * Canonical merchant associated with the plan.
   */
  merchant: MerchantRecord;

  /**
   * Canonical customer.
   */
  customer: CustomerRecord;

  /**
   * Canonical subscription returned by the backend.
   */
  subscription: SubscriptionRecord;

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
// SUBSCRIBE
////////////////////////////////////////////////////////////

/**
 * Creates a new customer subscription.
 *
 * Workflow:
 *
 *  1. Validate SDK configuration.
 *  2. Validate the supplied PlanRecord.
 *  3. Resolve the connected customer Kernel.
 *  4. Verify that the Kernel belongs to the customer.
 *  5. Verify that the customer has enough token balance.
 *  6. Verify that an active subscription does not already exist.
 *  7. Resolve and validate the merchant.
 *  8. Approve the Billing Protocol to spend the
 *     customer's payment token when required.
 *  9. Encode subscribe(planId, ...).
 * 10. Execute the operation through the customer Kernel.
 * 11. Wait for the UserOperation receipt.
 * 12. Extract the newly-created subscription.
 * 13. Mirror the subscription to the backend.
 * 14. Return the canonical records.
 *
 * The customer Kernel is deliberately resolved from the
 * connected wallet/backend permission record rather than
 * creating a new Kernel for every subscription.
 */
export async function subscribe({
  client,
  planId,
}: {
  client: CustomerClient;
  planId: number;
}): Promise<SubscribeResult> {
  ////////////////////////////////////////////////////////////
  // CONFIGURATION
  ////////////////////////////////////////////////////////////

  if (!client.contractAddress) {
    throw new Error(
      "Billing Protocol contract address is not configured.",
    );
  }

  if (!client.apiUrl) {
    throw new Error(
      "Customer API URL is not configured.",
    );
  }

  const contractAddress = client.contractAddress;



  ////////////////////////////////////////////////////////////
  // VALIDATION
  ////////////////////////////////////////////////////////////

  const plan: PlanRecord = await getPlan({
    client,
    planId
  });

  if (
    !Number.isInteger(plan.planId) ||
    plan.planId <= 0
  ) {
    throw new Error("Invalid plan ID.");
  }

  if (
    !Number.isInteger(plan.merchantId) ||
    plan.merchantId <= 0
  ) {
    throw new Error("Invalid merchant ID.");
  }

  if (!plan.paymentToken) {
    throw new Error(
      "Billing plan payment token is missing.",
    );
  }

  if (BigInt(plan.amount) <= 0n) {
    throw new Error(
      "Billing plan amount must be greater than zero.",
    );
  }

  if (
    plan.status !== "ACTIVE"
  ) {
    throw new Error(
      "Billing plan is not active.",
    );
  }

  ////////////////////////////////////////////////////////////
  // CONNECTED WALLET
  ////////////////////////////////////////////////////////////

  const [ownerWallet] =
    await client.walletClient.getAddresses();

  if (!ownerWallet) {
    throw new Error(
      "No connected customer wallet was found.",
    );
  }

  ////////////////////////////////////////////////////////////
  // CUSTOMER KERNEL
  ////////////////////////////////////////////////////////////

  /**
   * The customer Kernel is reconstructed from the
   * backend's serialized permission account.
   *
   * This is the same Kernel that was created during
   * customer registration.
   */
  const {
    customer,
    kernelAccount,
    kernelClient,
    permission,
    permissionId,
  } = await getCustomerKernel({
    walletClient:
      client.walletClient,

    publicClient:
      client.publicClient,

    apiUrl:
      client.apiUrl,
  });

  ////////////////////////////////////////////////////////////
  // CUSTOMER VALIDATION
  ////////////////////////////////////////////////////////////

  if (!customer) {
    throw new Error(
      "Customer was not returned by the backend.",
    );
  }

  if (!customer.smartAccount) {
    throw new Error(
      "Customer Smart Account is missing.",
    );
  }

  if (!permissionId) {
    throw new Error(
      "Customer billing permission id is missing.",
    );
  }

  ////////////////////////////////////////////////////////////
  // KERNEL OWNERSHIP CHECK
  ////////////////////////////////////////////////////////////

  if (
    kernelAccount.address.toLowerCase() !==
    customer.smartAccount.toLowerCase()
  ) {
    throw new Error(
      "Recovered Kernel does not belong to the customer.",
    );
  }

  ////////////////////////////////////////////////////////////
  // CUSTOMER BALANCE
  ////////////////////////////////////////////////////////////

  /**
   * The recurring billing contract ultimately needs
   * access to the plan's payment token.
   *
   * Verify that the customer Kernel has enough balance
   * before asking the customer to sign the subscription.
   */
  const balance =
    await client.publicClient.readContract({
      address:
        plan.paymentToken as Address,

      abi: [
        {
          type: "function",
          name: "balanceOf",
          stateMutability: "view",
          inputs: [
            {
              name: "account",
              type: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
            },
          ],
        },
      ],

      functionName:
        "balanceOf",

      args: [
        customer.smartAccount,
      ],
    });

  console.log("BigInt(balance as bigint): ", BigInt(balance as bigint));
  console.log("BigInt(plan.amount): ", BigInt(plan.amount));
  console.log("plan.paymentToken : ", plan.paymentToken );

  if (
    BigInt(balance as bigint) <
    BigInt(plan.amount)
  ) {
    throw new Error(
      "Insufficient token balance for recurring billing.",
    );
  }

  ////////////////////////////////////////////////////////////
  // EXISTING SUBSCRIPTION CHECK
  ////////////////////////////////////////////////////////////

  const activeSubscription =
    await findActiveSubscription({
      client,

      subscriber:
        customer.smartAccount,

      planId:
        BigInt(plan.planId),
    });

  if (activeSubscription) {
    throw new Error(
      "You already have an active subscription to this plan.",
    );
  }

  ////////////////////////////////////////////////////////////
  // LOAD MERCHANT
  ////////////////////////////////////////////////////////////

  const merchant =
    await getMerchantById({
      client,

      merchantId:
        plan.merchantId,
    });

  if (!merchant) {
    throw new Error(
      "Merchant not found.",
    );
  }

  ////////////////////////////////////////////////////////////
  // MERCHANT VALIDATION
  ////////////////////////////////////////////////////////////

  if (
    merchant.status !== "ACTIVE"
  ) {
    throw new Error(
      "Merchant is inactive.",
    );
  }

  ////////////////////////////////////////////////////////////
  // TOKEN APPROVAL
  ////////////////////////////////////////////////////////////

  /**
   * IMPORTANT:
   *
   * The subscriber is the customer Kernel.
   *
   * Therefore the allowance required by the Billing
   * Protocol must ultimately belong to the customer
   * Smart Account.
   *
   * If the customer's tokens are held by the Kernel,
   * the approval must be executed through the Kernel.
   *
   * We therefore perform the approval as a Kernel
   * operation rather than approving from the connected
   * EOA.
   */
  await approveTokenIfNeeded({
    client,

    kernel: kernelAccount,

    kernelClient,

    token:
      plan.paymentToken,

    spender:
      contractAddress,

    amount:
      BigInt(plan.amount),
  });

  ////////////////////////////////////////////////////////////
  // ENCODE SUBSCRIBE
  ////////////////////////////////////////////////////////////

  /**
   * This must match the actual Web3BillingProtocol
   * subscribe() signature.
   *
   * The earlier frontend flow supplied:
   *
   *     planId
   *     smartAccount
   *     permissionId
   *
   * to subscribeToBillingPlan().
   *
   * Consequently the SDK encodes those same values.
   */
  const data =
    encodeBillingProtocolCall(
      "subscribe",
      [
        BigInt(plan.planId),

        customer.smartAccount,

        permissionId,
      ],
    );

  ////////////////////////////////////////////////////////////
  // EXECUTE USER OPERATION
  ////////////////////////////////////////////////////////////

  const userOperationHash =
    await executeUserOperation({
      kernel: kernelAccount,

      kernelAccount,

      kernelClient,

      contractAddress,

      data,
    });

  ////////////////////////////////////////////////////////////
  // WAIT FOR RECEIPT
  ////////////////////////////////////////////////////////////

  const receipt =
    await waitForReceipt({
      kernelClient,

      userOperationHash,
    });

  ////////////////////////////////////////////////////////////
  // VERIFY RECEIPT
  ////////////////////////////////////////////////////////////

  if (
    receipt?.status &&
    receipt.status !== "success"
  ) {
    throw new Error(
      "Subscription transaction failed.",
    );
  }

  ////////////////////////////////////////////////////////////
  // RESOLVE SUBSCRIPTION
  ////////////////////////////////////////////////////////////

  /**
   * The protocol creates the subscription on-chain.
   *
   * We retrieve the newly-created subscription by
   * inspecting the plan's subscriptions after the
   * UserOperation has settled.
   */
  const subscription =
    await findActiveSubscription({
      client,

      subscriber:
        customer.smartAccount,

      planId:
        BigInt(plan.planId),
    });

  if (!subscription) {
    throw new Error(
      "Subscription was created on-chain but could not be resolved.",
    );
  }

  ////////////////////////////////////////////////////////////
  // MIRROR BACKEND
  ////////////////////////////////////////////////////////////

  const mirrored =
    await mirror({
      apiUrl:
        client.apiUrl,

      endpoint:
        "/api/v1/subscriptions",

      body: {
        subscriptionId:
          Number(
            subscription.subscriptionId,
          ),

        customerId:
          customer.customerId,

        merchantId:
          plan.merchantId,

        planId:
          plan.planId,

        planBillingIntervalSeconds:
          plan.billingIntervalSeconds,

        smartAccount:
          customer.smartAccount,

        transactionHash:
          extractTransactionHash(receipt) ??
          userOperationHash,

        permissionId:
          permissionId,
      },
    }) as SubscriptionMirrorResponse;

  ////////////////////////////////////////////////////////////
  // NORMALIZE SUBSCRIPTION
  ////////////////////////////////////////////////////////////

  const normalizedSubscription =
    normalizeSubscription(
      mirrored.subscription ??
        mirrored ??
        subscription,
    );

  ////////////////////////////////////////////////////////////
  // TRANSACTION HASH
  ////////////////////////////////////////////////////////////

  const transactionHash =
    extractTransactionHash(
      receipt,
    );

  ////////////////////////////////////////////////////////////
  // RETURN
  ////////////////////////////////////////////////////////////

  return {
    merchant,

    customer,

    subscription:
      normalizedSubscription,

    userOperationHash,

    transactionHash,

    receipt,
  };
}

////////////////////////////////////////////////////////////
// ACTIVE SUBSCRIPTION LOOKUP
////////////////////////////////////////////////////////////

async function findActiveSubscription({
  client,
  subscriber,
  planId,
}: {
  client: CustomerClient;

  subscriber: Address;

  planId: bigint;
}): Promise<any | null> {
  ////////////////////////////////////////////////////////////
  // GET PLAN SUBSCRIPTIONS
  ////////////////////////////////////////////////////////////

  const subscriptionIds =
    await client.publicClient.readContract({
      address:
        client.contractAddress,

      abi:
        billingProtocolReadAbi,

      functionName:
        "getPlanSubscriptions",

      args: [
        planId,
      ],
    }) as bigint[];

  ////////////////////////////////////////////////////////////
  // SEARCH SUBSCRIPTIONS
  ////////////////////////////////////////////////////////////

  for (
    const subscriptionId
    of subscriptionIds
  ) {
    const subscription =
      await client.publicClient.readContract({
        address:
          client.contractAddress,

        abi:
          billingProtocolReadAbi,

        functionName:
          "getSubscription",

        args: [
          subscriptionId,
        ],
      }) as any;

    /**
     * The exact tuple/object shape depends on the ABI.
     *
     * We deliberately support both named tuple fields
     * and positional tuple fields here.
     */
    const subscriptionSubscriber =
      subscription?.subscriber ??
      subscription?.[1];

    const status =
      subscription?.status ??
      subscription?.[6];

    if (
      subscriptionSubscriber &&
      subscriptionSubscriber
        .toLowerCase() ===
        subscriber.toLowerCase() &&
      isActiveSubscriptionStatus(
        status,
      )
    ) {
      return normalizeOnChainSubscription(
        subscription,
        subscriptionId,
        planId,
      );
    }
  }

  return null;
}

////////////////////////////////////////////////////////////
// SUBSCRIPTION STATUS
////////////////////////////////////////////////////////////

function isActiveSubscriptionStatus(
  status: unknown,
): boolean {
  /**
   * Most protocol ABIs return enums as bigint.
   *
   * The SDK should not depend exclusively on the
   * enum's TypeScript representation.
   *
   * ACTIVE is assumed to be enum value 0.
   */
  if (
    typeof status === "bigint"
  ) {
    return status === 0n;
  }

  if (
    typeof status === "number"
  ) {
    return status === 0;
  }

  if (
    typeof status === "string"
  ) {
    return (
      status === "ACTIVE" ||
      status === "0"
    );
  }

  return false;
}

////////////////////////////////////////////////////////////
// ON-CHAIN SUBSCRIPTION NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeOnChainSubscription(
  input: any,
  subscriptionId: bigint,
  planId: bigint,
): any {
  return {
    subscriptionId:
      Number(
        input?.subscriptionId ??
          input?.[0] ??
          subscriptionId,
      ),

    planId:
      Number(
        input?.planId ??
          input?.[1] ??
          planId,
      ),

    customerId:
      Number(
        input?.customerId ??
          input?.[2] ??
          0,
      ),

    subscriber:
      input?.subscriber ??
      input?.[3],

    status:
      input?.status ??
      input?.[6] ??
      "ACTIVE",
  };
}

////////////////////////////////////////////////////////////
// SUBSCRIPTION NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeSubscription(
  input: any,
): SubscriptionRecord {
  console.log("shape of input received: ", input);
  return {
    subscriptionId:
      Number(
        input.subscriptionId ??
          input.subscription_id,
      ),

    customerId:
        input.customerId ??
          input.customer_id,

    merchantId:
      Number(
        input.merchantId ??
          input.merchant_id,
      ),

    planId:
      Number(
        input.planId ??
          input.plan_id,
      ),

    smartAccount:
      input.smartAccount ??
      input.smart_account,

    status:
      input.status,

    nextBillingTime:
      normalizeDate(
        input.nextBillingTime ??
          input.next_billing_time,
      ),

    lastChargedAt:
      input.lastChargedAt ??
      input.last_charged_at
        ? normalizeDate(
            input.lastChargedAt ??
              input.last_charged_at,
          )
        : undefined,

    cancelledAt:
      input.cancelledAt ??
      input.cancelled_at
        ? normalizeDate(
            input.cancelledAt ??
              input.cancelled_at,
          )
        : undefined,

    createdAt:
      normalizeNullableDate(
        input.createdAt ??
          input.created_at,
      ),

    updatedAt:
      normalizeNullableDate(
        input.updatedAt ??
          input.updated_at,
      ),

    transactionHash:
      input.transactionHash ??
      input.transaction_hash ??
      "0x",

    permissionId:
      input.permissionId ??
      input.permission_id ??
      "0x"
  } as SubscriptionRecord;
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

////////////////////////////////////////////////////////////
// TRANSACTION HASH
////////////////////////////////////////////////////////////

function extractTransactionHash(
  receipt: any,
): `0x${string}` | undefined {
  /**
   * ZeroDev versions can expose the underlying
   * transaction receipt differently.
   *
   * Never fabricate a transaction hash.
   */
  return (
    receipt?.receipt?.transactionHash ??
    receipt?.transactionHash
  ) as
    | `0x${string}`
    | undefined;
}

////////////////////////////////////////////////////////////
// ERC20 APPROVAL
////////////////////////////////////////////////////////////

const erc20ApprovalAbi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;

async function approveTokenIfNeeded({
  client,
  kernel,
  kernelClient,
  token,
  spender,
  amount,
}: {
  client: CustomerClient;

  kernel: any;

  kernelClient: any;

  token: Address;

  spender: Address;

  amount: bigint;
}) {
  ////////////////////////////////////////////////////////////
  // CURRENT ALLOWANCE
  ////////////////////////////////////////////////////////////

  const allowance =
    await client.publicClient.readContract({
      address:
        token,

      abi:
        erc20ApprovalAbi,

      functionName:
        "allowance",

      args: [
        kernel.address,
        spender,
      ],
    });

  ////////////////////////////////////////////////////////////
  // ALREADY APPROVED
  ////////////////////////////////////////////////////////////

  if (
    allowance >= amount
  ) {
    return;
  }

  ////////////////////////////////////////////////////////////
  // APPROVE THROUGH KERNEL
  ////////////////////////////////////////////////////////////

  const approvalData =
    await encodeErc20Approve(
      token,
      spender,
      amount,
    );

  const callData =
    await kernel.encodeCalls([
      {
        to:
          token,

        value:
          0n,

        data:
          approvalData,
      },
    ]);

  const approvalHash =
    await kernelClient.sendUserOperation({
      callData,
    });

  await kernelClient.waitForUserOperationReceipt({
    hash:
      approvalHash,
  });
}

////////////////////////////////////////////////////////////
// ERC20 APPROVE ENCODER
////////////////////////////////////////////////////////////

async function encodeErc20Approve(
  token: Address,
  spender: Address,
  amount: bigint,
): Promise<`0x${string}`> {
  /**
   * Kept local so subscribe.ts does not introduce
   * another SDK-level dependency merely for one ERC20
   * operation.
   */
  const { encodeFunctionData } =
    await import("viem");

  return encodeFunctionData({
    abi:
      erc20ApprovalAbi,

    functionName:
      "approve",

    args: [
      spender,
      amount,
    ],
  });
}

////////////////////////////////////////////////////////////
// BILLING PROTOCOL READ ABI
////////////////////////////////////////////////////////////

const billingProtocolReadAbi = [
  {
    type: "function",
    name: "getPlanSubscriptions",
    stateMutability: "view",
    inputs: [
      {
        name: "planId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
      },
    ],
  },

  {
    type: "function",
    name: "getSubscription",
    stateMutability: "view",
    inputs: [
      {
        name: "subscriptionId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "subscription",
        type: "tuple",
        components: [
          {
            name: "subscriptionId",
            type: "uint256",
          },
          {
            name: "planId",
            type: "uint256",
          },
          {
            name: "customerId",
            type: "uint256",
          },
          {
            name: "subscriber",
            type: "address",
          },
          {
            name: "nextBillingTime",
            type: "uint256",
          },
          {
            name: "lastChargedAt",
            type: "uint256",
          },
          {
            name: "status",
            type: "uint8",
          },
        ],
      },
    ],
  },
] as const;