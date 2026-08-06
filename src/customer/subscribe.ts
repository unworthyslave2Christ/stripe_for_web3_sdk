// src/customer/subscribe.ts

import type { CustomerClient } from "./CustomerClient";

import type { SubscriptionRecord } from "../types/Subscription";

import { getCustomerKernel } from "../kernels/getCustomerKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

export interface SubscribeParams {
  client: CustomerClient;

  subscription: SubscriptionRecord;
}

export async function subscribe({
  client,

  subscription,
}: SubscribeParams) {
  ////////////////////////////////////////////////////////////
  // Obtain Customer Kernel
  ////////////////////////////////////////////////////////////

  const {
    customer,

    kernel,

    kernelClient,

    permission,
  } = await getCustomerKernel({
    walletClient: client.walletClient,

    publicClient: client.publicClient,

    customerResolver: client.customerResolver,
  });

  ////////////////////////////////////////////////////////////
  // Encode Billing Protocol Call
  ////////////////////////////////////////////////////////////

  const data = encodeBillingProtocolCall(
    "subscribe",

    [BigInt(subscription.planId), permission.permissionId],
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

    endpoint: "/subscriptions",

    body: subscription,
  });

  ////////////////////////////////////////////////////////////
  // Return
  ////////////////////////////////////////////////////////////

  return {
    customer,

    subscription,

    kernel,

    permission,

    userOpHash,

    receipt,
  };
}
