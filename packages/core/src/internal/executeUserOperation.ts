import { encodeKernelCall } from "./encodeKernelCall";

import type { Address } from "viem";

export interface ExecuteUserOperationParams {
  kernel: any;

  kernelClient: any;

  kernelAccount?: any;

  contractAddress: Address;

  data: `0x${string}`;
}

export async function executeUserOperation({
  kernel,

  kernelClient,

  kernelAccount,

  contractAddress,

  data,
}: ExecuteUserOperationParams) {

  let callData: any;

  if (kernelAccount){
    callData = await encodeKernelCall(
      kernel,

      [
        {
          to: contractAddress,

          data,
        },
      ],

      kernelAccount
    );
  } else {
    callData = await encodeKernelCall(
      kernel,

      [
        {
          to: contractAddress,

          data,
        },
      ],
    );
  }
  

  const hash = await kernelClient.sendUserOperation({
    callData,
  });

  return hash;
}
