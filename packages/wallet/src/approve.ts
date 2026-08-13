// src/wallet/approve.ts

import type { WalletClient } from "./WalletClient";

import type { Address } from "viem";

import { encodeFunctionData, erc20Abi } from "viem";

export interface ApproveParams {
  client: WalletClient;

  token: Address;

  spender: Address;

  amount: bigint;
}

export interface ApprovalResult {
  hash: `0x${string}`;

  receipt: Awaited<
    ReturnType<WalletClient["publicClient"]["waitForTransactionReceipt"]>
  >;
}

export async function approve({
  client,

  token,

  spender,

  amount,
}: ApproveParams): Promise<ApprovalResult> {
  ////////////////////////////////////////////////////////////
  // Owner Wallet
  ////////////////////////////////////////////////////////////

  const [owner] = await client.walletClient.getAddresses();

  ////////////////////////////////////////////////////////////
  // Encode approve()
  ////////////////////////////////////////////////////////////

  const data = encodeFunctionData({
    abi: erc20Abi,

    functionName: "approve",

    args: [spender, amount],
  });

  ////////////////////////////////////////////////////////////
  // Send Transaction
  ////////////////////////////////////////////////////////////

  const hash = await client.walletClient.sendTransaction({

        account: owner,

        chain: client.chain,

        to: token,

        data,

    });

  ////////////////////////////////////////////////////////////
  // Wait for Receipt
  ////////////////////////////////////////////////////////////

  const receipt = await client.publicClient.waitForTransactionReceipt({
    hash,
  });

  ////////////////////////////////////////////////////////////
  // Return
  ////////////////////////////////////////////////////////////

  return {
    hash,

    receipt,
  };
}
