// src/customer/CustomerClient.ts

import type { PublicClient, WalletClient } from "viem";

import type { SubscriptionRecord } from "../types/Subscription";

import type { CustomerResolver } from "../kernels/getCustomerKernel";

import { subscribe } from "./subscribe";

import { pauseSubscription } from "./pauseSubscription";

import { resumeSubscription } from "./resumeSubscription";

import { cancelSubscription } from "./cancelSubscription";

import { getSubscription } from "./getSubscription";

import { getSubscriptions } from "./getSubscriptions";

export interface CustomerClientConfig {
  walletClient: WalletClient;

  publicClient: PublicClient;

  customerResolver: CustomerResolver;

  contractAddress?: `0x${string}`;

  apiUrl?: string;
}

export class CustomerClient {
  readonly walletClient: WalletClient;

  readonly publicClient: PublicClient;

  readonly customerResolver: CustomerResolver;

  readonly contractAddress?: `0x${string}`;

  readonly apiUrl?: string;

  constructor(config: CustomerClientConfig) {
    this.walletClient = config.walletClient;

    this.publicClient = config.publicClient;

    this.customerResolver = config.customerResolver;

    this.contractAddress = config.contractAddress;

    this.apiUrl = config.apiUrl;
  }

  ////////////////////////////////////////////////////////////
  // SUBSCRIPTIONS
  ////////////////////////////////////////////////////////////

  subscribe(subscription: SubscriptionRecord) {
    return subscribe({
      client: this,

      subscription,
    });
  }

  pauseSubscription(subscription: SubscriptionRecord) {
    return pauseSubscription({
      client: this,

      subscription,
    });
  }

  resumeSubscription(subscription: SubscriptionRecord) {
    return resumeSubscription({
      client: this,

      subscription,
    });
  }

  cancelSubscription(subscription: SubscriptionRecord) {
    return cancelSubscription({
      client: this,

      subscription,
    });
  }

  getSubscription(subscriptionId: number) {
    return getSubscription({
      client: this,

      subscriptionId,
    });
  }

  getSubscriptions(customerId: number) {
    return getSubscriptions({
      client: this,

      customerId: customerId.toString(),
    });
  }
}
