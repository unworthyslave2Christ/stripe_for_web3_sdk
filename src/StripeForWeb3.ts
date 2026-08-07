// src/StripeForWeb3.ts

import type {
  Address,
  Chain,
  PublicClient,
  WalletClient as ViemWalletClient,
} from "viem";

import { MerchantClient } from "./merchant";

import { CustomerClient } from "./customer";

import { WalletClient } from "./wallet";

import type { MerchantResolver } from "./kernels/getMerchantKernel";

import type { CustomerResolver } from "./kernels/getCustomerKernel";

export interface StripeForWeb3Config {
  walletClient: ViemWalletClient;

  publicClient: PublicClient;

  chain: Chain;

  contractAddress: Address;

  apiUrl?: string;

  merchantResolver: MerchantResolver;

  customerResolver: CustomerResolver;
}

export class StripeForWeb3 {
  readonly merchant: MerchantClient;

  readonly customer: CustomerClient;

  readonly wallet: WalletClient;

  readonly config: StripeForWeb3Config;

  constructor(config: StripeForWeb3Config) {
    this.config = config;

    /////////////////////////////////////////////////////////
    // Merchant
    /////////////////////////////////////////////////////////

    this.merchant = new MerchantClient({
      walletClient: config.walletClient,

      publicClient: config.publicClient,

      contractAddress: config.contractAddress,

      apiUrl: config.apiUrl,

      merchantResolver: config.merchantResolver,
    });

    /////////////////////////////////////////////////////////
    // Customer
    /////////////////////////////////////////////////////////

    this.customer = new CustomerClient({
      walletClient: config.walletClient,

      publicClient: config.publicClient,

      contractAddress: config.contractAddress,

      apiUrl: config.apiUrl,

      customerResolver: config.customerResolver,
    });

    /////////////////////////////////////////////////////////
    // Wallet
    /////////////////////////////////////////////////////////

    this.wallet = new WalletClient({
      walletClient: config.walletClient,

      publicClient: config.publicClient,

      chain: config.chain,

      contractAddress: config.contractAddress,

      apiUrl: config.apiUrl,
    });
  }
}


// I think this redesign is the right direction. The SDK should become protocol-centric, not application-centric. It should know about wallets, public clients, chains, and the Billing Contract—nothing about your database, API, merchants, or customers.