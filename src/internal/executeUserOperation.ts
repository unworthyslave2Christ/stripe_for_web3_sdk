import { encodeKernelCall } from "./encodeKernelCall";

import type { Address } from "viem";

export interface ExecuteUserOperationParams {
  kernel: any;

  kernelClient: any;

  contractAddress: Address;

  data: `0x${string}`;
}

export async function executeUserOperation({
  kernel,

  kernelClient,

  contractAddress,

  data,
}: ExecuteUserOperationParams) {
  const callData = await encodeKernelCall(
    kernel,

    [
      {
        to: contractAddress,

        data,
      },
    ],
  );

  const hash = await kernelClient.sendUserOperation({
    callData,
  });

  return hash;
}
