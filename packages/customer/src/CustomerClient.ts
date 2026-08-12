// src/customer/CustomerClient.ts

import type { Address, PublicClient, WalletClient } from "viem";

import type { CustomerRecord } from "@stripe-for-web3/core";

import type { SubscriptionRecord } from "@stripe-for-web3/core";

import {
  createCustomer,
  type CreateCustomerParams,
  type CreateCustomerResult,
} from "./createCustomer";

import { subscribe, type SubscribeParams } from "./subscribe";

import { pauseSubscription } from "./pauseSubscription";
import { resumeSubscription } from "./resumeSubscription";
import { cancelSubscription } from "./cancelSubscription";

import { getSubscription } from "./getSubscription";
import { getSubscriptions } from "./getSubscriptions";

import { getCustomerByWallet } from "./getCustomerByWallet";

////////////////////////////////////////////////////////////
// API RESPONSE
////////////////////////////////////////////////////////////

export interface CustomerApiResponseMinimal {
  customer?: CustomerRecord;

  error?: string;
}

////////////////////////////////////////////////////////////
// CONFIGURATION
////////////////////////////////////////////////////////////

export interface CustomerClientConfig {
  /**
   * Wallet used to identify and authorize
   * the customer.
   */
  walletClient: WalletClient;

  /**
   * Public blockchain client.
   */
  publicClient: PublicClient;

  /**
   * Billing Protocol contract.
   */
  contractAddress: Address;

  /**
   * Backend API used for canonical
   * customer/subscription persistence.
   */
  apiUrl: string;
}

////////////////////////////////////////////////////////////
// REGISTRATION INPUT
////////////////////////////////////////////////////////////

export interface RegisterCustomerInput {
  /**
   * Human-readable customer name.
   */
  displayName: string;

  /**
   * Customer email.
   */
  email: string;
}

////////////////////////////////////////////////////////////
// CLIENT
////////////////////////////////////////////////////////////

export class CustomerClient {
  readonly walletClient: WalletClient;

  readonly publicClient: PublicClient;

  readonly contractAddress: Address;

  readonly apiUrl: string;

  constructor(config: CustomerClientConfig) {
    this.walletClient = config.walletClient;

    this.publicClient = config.publicClient;

    this.contractAddress = config.contractAddress;

    this.apiUrl = config.apiUrl;
  }

  ////////////////////////////////////////////////////////////
  // CUSTOMER REGISTRATION
  ////////////////////////////////////////////////////////////

  async register(input: RegisterCustomerInput): Promise<CreateCustomerResult> {
    return createCustomer({
      client: this,

      displayName: input.displayName,

      email: input.email,
    });
  }

  ////////////////////////////////////////////////////////////
  // CUSTOMER
  ////////////////////////////////////////////////////////////

  async getByWallet(
        ownerWallet: Address,
  ): Promise<CustomerRecord> {

      return getCustomerByWallet({

          client: this,

          ownerWallet,
      });
  }
    
  
  async getById(customerId: number): Promise<CustomerRecord> {
    if (!this.apiUrl) {
      throw new Error("Customer API URL is not configured.");
    }

    const response = await fetch(
      `${this.apiUrl}/api/v1/customers/${customerId}`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
        },

        cache: "no-store",
      },
    );

    const body = (await response.json()) as CustomerApiResponseMinimal;

    if (!response.ok) {
      throw new Error(
        body.error ?? `Unable to retrieve customer ${customerId}.`,
      );
    }

    if (!body.customer) {
      throw new Error(`Customer ${customerId} was not returned by the API.`);
    }

    return body.customer;
  }

  ////////////////////////////////////////////////////////////
  // SUBSCRIPTIONS
  ////////////////////////////////////////////////////////////

  subscribe(params: Omit<SubscribeParams, "client">) {
    return subscribe({
      client: this,

      ...params,
    });
  }

  pauseSubscription(subscriptionId: number) {
    return pauseSubscription({
      client: this,

      subscriptionId
    });
  }

  resumeSubscription(subscriptionId: number) {
    return resumeSubscription({
      client: this,

      subscriptionId,
    });
  }

  cancelSubscription(subscriptionId: number) {
    return cancelSubscription({
      client: this,

      subscriptionId,
    });
  }

  ////////////////////////////////////////////////////////////
  // SUBSCRIPTION READS
  ////////////////////////////////////////////////////////////

  getSubscription(subscriptionId: number) {
    return getSubscription({
      client: this,

      subscriptionId,
    });
  }

  getSubscriptions(customerId: string) {
    return getSubscriptions({
      client: this,

      customerId,
    });
  }
}
