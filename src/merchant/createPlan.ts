// src/merchant/createPlan.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanRecord } from "../types/Plan";

import { getMerchantKernel } from "../kernels/getMerchantKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { encodeKernelCall } from "../internal/encodeKernelCall";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

export interface CreatePlanParams {
  client: MerchantClient;

  plan: PlanRecord;
}

export async function createPlan({
  client,

  plan,
}: CreatePlanParams) {
  ////////////////////////////////////////////////////////////
  // Obtain Merchant Kernel
  ////////////////////////////////////////////////////////////

  const { kernel } = await getMerchantKernel({
    walletClient: client.walletClient,

    publicClient: client.publicClient,

    merchantResolver: client.merchantResolver,
  });

  const kernelClient = kernel.client;

  ////////////////////////////////////////////////////////////
  // Encode Billing Protocol Call
  ////////////////////////////////////////////////////////////

  const data = encodeBillingProtocolCall(
    "createPlan",

    [
      plan.paymentToken,

      BigInt(plan.amount),

      BigInt(plan.billingIntervalSeconds),

      BigInt(plan.trialPeriod),

      plan.maxSubscribers,

      plan.allowRenewal,

      plan.metadataURI,

      plan.name,
    ],
  );

  ////////////////////////////////////////////////////////////
  // Encode Kernel Call
  ////////////////////////////////////////////////////////////

  const callData = await encodeKernelCall(
    kernel,

    [
      {
        to: client.contractAddress!,

        value: 0n,

        data,
      },
    ],
  );

  ////////////////////////////////////////////////////////////
  // Execute User Operation
  ////////////////////////////////////////////////////////////

  const userOpHash = await executeUserOperation({
    kernel,

    kernelClient,

    contractAddress: client.contractAddress!,

    data,
  });

  ////////////////////////////////////////////////////////////
  // Wait For Receipt
  ////////////////////////////////////////////////////////////

  const receipt = await waitForReceipt({
    kernelClient,

    userOperationHash: userOpHash,
  });

  ////////////////////////////////////////////////////////////
  // Mirror Backend
  ////////////////////////////////////////////////////////////

  await mirror({
    apiUrl: client.apiUrl,

    endpoint: "/plans",

    body: plan,
  });

  ////////////////////////////////////////////////////////////
  // Return
  ////////////////////////////////////////////////////////////

  return {
    plan,

    kernel,

    userOpHash,

    receipt,
  };
}
