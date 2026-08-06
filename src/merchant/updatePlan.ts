// src/merchant/updateupdatedPlan.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanRecord } from "../types/Plan";

import { getMerchantKernel } from "../kernels/getMerchantKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { encodeKernelCall } from "../internal/encodeKernelCall";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

export interface UpdatePlanParams {

    client: MerchantClient;

    originalPlan: PlanRecord;

    updatedPlan: PlanRecord;

}

export async function updatePlan({

    client,

    originalPlan,

    updatedPlan,

}: UpdatePlanParams) {
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
  // Encode Billing Protocol Calls
  ////////////////////////////////////////////////////////////

  const calls = [
    encodeBillingProtocolCall("updatePlanAmount", [
      BigInt(updatedPlan.planId),
      BigInt(updatedPlan.amount),
    ]),

    encodeBillingProtocolCall("updatePlanName", [
      BigInt(updatedPlan.planId),
      updatedPlan.name,
    ]),

    encodeBillingProtocolCall("updatePlanInterval", [
      BigInt(updatedPlan.planId),
      BigInt(updatedPlan.billingIntervalSeconds),
    ]),

    encodeBillingProtocolCall("updatePlanPaymentToken", [
      BigInt(updatedPlan.planId),
      updatedPlan.paymentToken,
    ]),

    encodeBillingProtocolCall("updateTrialPeriod", [
      BigInt(updatedPlan.planId),
      BigInt(updatedPlan.trialPeriod),
    ]),

    encodeBillingProtocolCall("updateMaxSubscribers", [
      BigInt(updatedPlan.planId),
      updatedPlan.maxSubscribers,
    ]),

    encodeBillingProtocolCall("setAutoRenewal", [
      BigInt(updatedPlan.planId),
      updatedPlan.allowRenewal,
    ]),
  ];

  ////////////////////////////////////////////////////////////
  // Encode Kernel Call
  ////////////////////////////////////////////////////////////

  const callData = await encodeKernelCall(
    kernel,

    calls.map((data) => ({
      to: client.contractAddress!,

      value: 0n,

      data,
    })),
  );

  ////////////////////////////////////////////////////////////
  // Execute User Operation
  ////////////////////////////////////////////////////////////

  const userOpHash = await executeUserOperation({
    kernel,

    kernelClient,

    contractAddress: client.contractAddress!,

    data: callData,
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

    body: updatedPlan,
  });

  ////////////////////////////////////////////////////////////
  // Return
  ////////////////////////////////////////////////////////////

  return {
    plan: updatedPlan,

    kernel,

    userOpHash,

    receipt,
  };
}
