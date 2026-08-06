// src/wallet/WalletClient.ts

import type {
  Address,
  PublicClient,
  WalletClient as ViemWalletClient,
} from "viem";

import { approve } from "./approve";

import { getBalance } from "./getBalance";

import { hasEnoughBalance } from "./hasEnoughBalance";

import type {
    Chain,
} from "viem";

export interface WalletClientConfig {

    walletClient: ViemWalletClient;

    publicClient: PublicClient;

    chain: Chain;

    contractAddress?: Address;

    apiUrl?: string;

}

export class WalletClient {
  readonly walletClient: ViemWalletClient;

  readonly publicClient: PublicClient;

  readonly chain: Chain;

  readonly contractAddress?: Address;

  readonly apiUrl?: string;

  constructor(config: WalletClientConfig) {
    this.walletClient = config.walletClient;

    this.publicClient = config.publicClient;

    this.chain = config.chain;

    this.contractAddress = config.contractAddress;

    this.apiUrl = config.apiUrl;
  }

  ////////////////////////////////////////////////////////////
  // BALANCE
  ////////////////////////////////////////////////////////////

  getBalance(token: Address) {
    return getBalance({
      client: this,

      token,
    });
  }

  ////////////////////////////////////////////////////////////
  // APPROVALS
  ////////////////////////////////////////////////////////////

  approve(
    token: Address,

    spender: Address,

    amount: bigint,
  ) {
    return approve({
      client: this,

      token,

      spender,

      amount,
    });
  }

  ////////////////////////////////////////////////////////////
  // BALANCE CHECK
  ////////////////////////////////////////////////////////////

  hasEnoughBalance(
    token: Address,

    requiredAmount: bigint,
  ) {
    return hasEnoughBalance({
      client: this,

      token,

      requiredAmount,
    });
  }
}
