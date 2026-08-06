// src/customer/pauseSubscription.ts

import type { CustomerClient } from "./CustomerClient";

import type { SubscriptionRecord } from "../types/Subscription";

import { getCustomerKernel } from "../kernels/getCustomerKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

export interface PauseSubscriptionParams {
  client: CustomerClient;

  subscription: SubscriptionRecord;
}

export async function pauseSubscription({
  client,

  subscription,
}: PauseSubscriptionParams) {
  ////////////////////////////////////////////////////////////
  // Obtain Customer Kernel
  ////////////////////////////////////////////////////////////

  const {
    customer,

    kernel,

    kernelClient,
  } = await getCustomerKernel({
    walletClient: client.walletClient,

    publicClient: client.publicClient,

    customerResolver: client.customerResolver,
  });

  ////////////////////////////////////////////////////////////
  // Encode Billing Protocol Call
  ////////////////////////////////////////////////////////////

  const data = encodeBillingProtocolCall(
    "pauseSubscription",

    [BigInt(subscription.subscriptionId)],
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

    endpoint: `/subscriptions/${subscription.subscriptionId}/pause`,

    body: {
      subscriptionId: subscription.subscriptionId,

      status: "PAUSED",
    },
  });

  ////////////////////////////////////////////////////////////
  // Return
  ////////////////////////////////////////////////////////////

  return {
    customer,

    subscription: {
      ...subscription,

      status: "PAUSED",
    },

    kernel,

    userOpHash,

    receipt,
  };
}
