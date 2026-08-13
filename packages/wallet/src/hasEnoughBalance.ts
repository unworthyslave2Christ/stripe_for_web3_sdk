// src/wallet/hasEnoughBalance.ts

import type { WalletClient } from "./WalletClient";

import type { Address } from "viem";

import { getBalance } from "./getBalance";

export interface HasEnoughBalanceParams {
  client: WalletClient;

  token: Address;

  requiredAmount: bigint;

  account?: Address;
}

export interface BalanceCheck {
  sufficient: boolean;

  balance: bigint;

  required: bigint;

  deficit: bigint;
}

export async function hasEnoughBalance({
  client,

  token,

  requiredAmount,

  account,
}: HasEnoughBalanceParams): Promise<BalanceCheck> {
  const { balance } = await getBalance({
    client,

    token,

    account,
  });

  const sufficient = balance >= requiredAmount;

  return {
    sufficient,

    balance,

    required: requiredAmount,

    deficit: sufficient ? 0n : requiredAmount - balance,
  };
}
