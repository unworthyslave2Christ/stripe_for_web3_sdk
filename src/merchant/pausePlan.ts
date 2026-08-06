// src/merchant/pausePlan.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanRecord } from "../types/Plan";

import { getMerchantKernel } from "../kernels/getMerchantKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

export interface PausePlanParams {
  client: MerchantClient;

  plan: PlanRecord;
}

export async function pausePlan({
  client,

  plan,
}: PausePlanParams) {
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
    "pausePlan",

    [BigInt(plan.planId)],
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

    endpoint: `/plans/${plan.planId}/pause`,

    body: {
      planId: plan.planId,

      status: "PAUSED",
    },
  });

  ////////////////////////////////////////////////////////////
  // Return
  ////////////////////////////////////////////////////////////

  return {
    plan: {
      ...plan,

      status: "PAUSED",
    },

    kernel,

    userOpHash,

    receipt,
  };
}
