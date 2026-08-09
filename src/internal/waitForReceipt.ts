import type { PublicClient } from "viem";

export interface WaitForReceiptParams {
  kernelClient: any;

  userOperationHash: `0x${string}`;
}

export async function waitForReceipt({
  kernelClient,

  userOperationHash,
}: WaitForReceiptParams) {
  const userOpReceipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOperationHash,
  });

  return userOpReceipt.receipt;

  // return {
  //   receipt: userOpReceipt.receipt,

  //   userOperationReceipt: userOpReceipt,
  // };
}
