// src/wallet/getBalance.ts

import type { WalletClient } from "./WalletClient";

import type { Address } from "viem";

import { erc20Abi, formatUnits, zeroAddress } from "viem";

export interface GetBalanceParams {
  client: WalletClient;

  token: Address;

  account?: Address;
}

export interface WalletBalance {
  token: Address;

  balance: bigint;

  decimals: number;

  symbol: string;

  formatted: string;
}

export async function getBalance({
  client,

  token,

  account,
}: GetBalanceParams): Promise<WalletBalance> {
  const owner = account ?? (await client.walletClient.getAddresses())[0];

  ////////////////////////////////////////////////////////////
  // Native Token
  ////////////////////////////////////////////////////////////

  if (token === zeroAddress) {
    const balance = await client.publicClient.getBalance({
      address: owner,
    });

    return {
      token,

      balance,

      decimals: 18,

      symbol: "ETH",

      formatted: formatUnits(balance, 18),
    };
  }

  ////////////////////////////////////////////////////////////
  // ERC20 Token
  ////////////////////////////////////////////////////////////

  const [balance, decimals, symbol] = await Promise.all([
    client.publicClient.readContract({
      address: token,

      abi: erc20Abi,

      functionName: "balanceOf",

      args: [owner],
    }),

    client.publicClient.readContract({
      address: token,

      abi: erc20Abi,

      functionName: "decimals",
    }),

    client.publicClient.readContract({
      address: token,

      abi: erc20Abi,

      functionName: "symbol",
    }),
  ]);

  return {
    token,

    balance,

    decimals,

    symbol,

    formatted: formatUnits(balance, decimals),
  };
}
