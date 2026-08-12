// src/customer/resumeSubscription.ts

import type { CustomerClient } from "./CustomerClient";

import type { SubscriptionRecord } from "../types/Subscription";

import { getSubscription } from "./getSubscription";

import { getCustomerKernel } from "../kernels/getCustomerKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface ResumeSubscriptionParams {
  /**
   * Customer SDK client.
   */
  client: CustomerClient;

  /**
   * Canonical subscription identifier.
   */
  subscriptionId: number;
}

////////////////////////////////////////////////////////////
// RESUME SUBSCRIPTION
////////////////////////////////////////////////////////////

export async function resumeSubscription({
  client,
  subscriptionId,
}: ResumeSubscriptionParams) {
  ////////////////////////////////////////////////////////////
  // CONFIGURATION
  ////////////////////////////////////////////////////////////

  if (!client.contractAddress) {
    throw new Error("Billing Protocol contract address is not configured.");
  }

  if (!client.apiUrl) {
    throw new Error("Customer API URL is not configured.");
  }

  ////////////////////////////////////////////////////////////
  // VALIDATE SUBSCRIPTION ID
  ////////////////////////////////////////////////////////////

  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
    throw new Error("Invalid subscription ID.");
  }

  ////////////////////////////////////////////////////////////
  // RESOLVE CANONICAL SUBSCRIPTION
  ////////////////////////////////////////////////////////////

  const subscription: SubscriptionRecord = await getSubscription({
    client,
    subscriptionId,
  });

  ////////////////////////////////////////////////////////////
  // CURRENT STATE
  ////////////////////////////////////////////////////////////

  if (subscription.status === "ACTIVE") {
    throw new Error(
      `Subscription ${subscription.subscriptionId} is already active.`,
    );
  }

  if (subscription.status === "CANCELLED") {
    throw new Error(
      `Subscription ${subscription.subscriptionId} is cancelled and cannot be resumed.`,
    );
  }

  if (subscription.status !== "PAUSED") {
    throw new Error(
      `Subscription ${subscription.subscriptionId} cannot be resumed from status ${subscription.status}.`,
    );
  }

  ////////////////////////////////////////////////////////////
  // CUSTOMER KERNEL
  ////////////////////////////////////////////////////////////

  const { customer, kernelAccount, kernelClient } = await getCustomerKernel({
    walletClient: client.walletClient,

    publicClient: client.publicClient,

    apiUrl: client.apiUrl,
  });

  ////////////////////////////////////////////////////////////
  // VERIFY CUSTOMER
  ////////////////////////////////////////////////////////////

  console.log(
    "customer.customerId.toString(): ",
    customer.customerId.toString(),
  );

  console.log(
    "subscription.customerId.toString(): ",
    subscription.customerId.toString(),
  );

  if (customer.customerId.toString() !== subscription.customerId.toString()) {
    throw new Error("Subscription does not belong to the current customer.");
  }

  ////////////////////////////////////////////////////////////
  // VERIFY CUSTOMER KERNEL
  ////////////////////////////////////////////////////////////

  if (
    kernelAccount.address.toLowerCase() !== customer.smartAccount.toLowerCase()
  ) {
    throw new Error("Customer Kernel verification failed.");
  }

  ////////////////////////////////////////////////////////////
  // VERIFY SUBSCRIPTION SMART ACCOUNT
  ////////////////////////////////////////////////////////////

  if (
    kernelAccount.address.toLowerCase() !==
    subscription.smartAccount.toLowerCase()
  ) {
    throw new Error(
      "Subscription smart account does not match the customer Kernel.",
    );
  }

  ////////////////////////////////////////////////////////////
  // ENCODE BILLING PROTOCOL CALL
  ////////////////////////////////////////////////////////////

  const data = encodeBillingProtocolCall("resumeSubscription", [
    BigInt(subscription.subscriptionId),
  ]);

  ////////////////////////////////////////////////////////////
  // EXECUTE USER OPERATION
  ////////////////////////////////////////////////////////////

  const userOperationHash = await executeUserOperation({
    kernel: kernelAccount,

    kernelAccount,

    kernelClient,

    contractAddress: client.contractAddress,

    data,
  });

  ////////////////////////////////////////////////////////////
  // WAIT FOR RECEIPT
  ////////////////////////////////////////////////////////////

  const receipt = await waitForReceipt({
    kernelClient,

    userOperationHash,
  });

  ////////////////////////////////////////////////////////////
  // VERIFY RECEIPT
  ////////////////////////////////////////////////////////////

  if (receipt?.status && receipt.status !== "success") {
    throw new Error("Resume subscription transaction failed.");
  }

  ////////////////////////////////////////////////////////////
  // MIRROR BACKEND STATE
  ////////////////////////////////////////////////////////////

  const mirrored = await mirror({
    apiUrl: client.apiUrl,

    endpoint: `/api/v1/subscriptions/${subscription.subscriptionId}/resume`,

    body: {
      subscriptionId: subscription.subscriptionId,

      customerId: customer.customerId,

      status: "ACTIVE",
    },
  });

  ////////////////////////////////////////////////////////////
  // UPDATED SUBSCRIPTION
  ////////////////////////////////////////////////////////////

  const updatedSubscription: SubscriptionRecord = {
    ...subscription,

    status: "ACTIVE",
  };

  ////////////////////////////////////////////////////////////
  // RETURN
  ////////////////////////////////////////////////////////////

  return {
    customer,

    subscription: updatedSubscription,

    kernelAccount,

    userOperationHash,

    receipt,

    mirrored,
  };
}
