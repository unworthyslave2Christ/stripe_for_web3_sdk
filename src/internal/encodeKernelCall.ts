import type { Address } from "viem";

export interface KernelCall {
  to: Address;

  value?: bigint;

  data: `0x${string}`;
}

export async function encodeKernelCall(
  kernel: any,

  calls: KernelCall[],
  
  kernelAccount?: any,

) {
  if(kernelAccount){
    return kernelAccount.encodeCalls(
      calls.map((call) => ({
        to: call.to,

        value: call.value ?? 0n,

        data: call.data,
      })),
    );
  }

  return kernel.account.encodeCalls(
    calls.map((call) => ({
      to: call.to,

      value: call.value ?? 0n,

      data: call.data,
    })),
  );
}
