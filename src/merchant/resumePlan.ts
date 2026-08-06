// src/merchant/resumePlan.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanRecord } from "../types/Plan";

import { getMerchantKernel } from "../kernels/getMerchantKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

export interface ResumePlanParams {
  client: MerchantClient;

  plan: PlanRecord;
}

export async function resumePlan({
  client,

  plan,
}: ResumePlanParams) {
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
    "activatePlan",

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

    endpoint: `/plans/${plan.planId}/resume`,

    body: {
      planId: plan.planId,

      status: "ACTIVE",
    },
  });

  ////////////////////////////////////////////////////////////
  // Return
  ////////////////////////////////////////////////////////////

  return {
    plan: {
      ...plan,

      status: "ACTIVE",
    },

    kernel,

    userOpHash,

    receipt,
  };
}
