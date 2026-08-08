// import {
//   createKernelAccountClient,
//   createZeroDevPaymasterClient,
// } from "@zerodev/sdk";

// import { privateKeyToAccount } from "viem/accounts";

// import { http, type Address, type PublicClient, type WalletClient } from "viem";

// import { arbitrumSepolia } from "viem/chains";
// import { deserializePermissionAccount } from "@zerodev/permissions";
// import { getEntryPoint, KERNEL_V3_3 } from "@zerodev/sdk/constants";

// import { toECDSASigner } from "@zerodev/permissions/signers";

// const chain = arbitrumSepolia;

// const entryPoint = getEntryPoint("0.7");

// const kernelVersion = KERNEL_V3_3;

// const paymasterClient = createZeroDevPaymasterClient({
//   chain,

//   transport: http(process.env.PAYMASTER_RPC!),
// });

// export interface CustomerKernel {
//   customer: any;

//   kernel: any;

//   kernelClient: any;

//   permissionId: bigint;

//   permission: any;
// }

// export interface CustomerResolverResult {
//   customer: any;

//   serializedPermissionAccount: string;

//   sessionPrivateKey: Address;

//   permissionId: bigint;

//   permission: any;
// }

// export type CustomerResolver = (
//   wallet: Address,
// ) => Promise<CustomerResolverResult>;

// export interface GetCustomerKernelParams {
//   walletClient: WalletClient;

//   publicClient: PublicClient;

//   // customerResolver: CustomerResolver;
// }

// export async function getCustomerKernel({
//   walletClient,

//   publicClient,

//   // customerResolver,
// }: GetCustomerKernelParams): Promise<CustomerKernel> {
//   const [wallet] = await walletClient.getAddresses();

//   let {
//     customer,

//     serializedPermissionAccount,

//     sessionPrivateKey,

//     permissionId,

//     permission,
//   } = await customerResolver(wallet);

//   customer = {
//     ...customer,

//     smartAccount: customer.smart_account,
//   };

//   const signer = await toECDSASigner({
//     signer: privateKeyToAccount(sessionPrivateKey),
//   });

//   const kernel = await deserializePermissionAccount(
//     publicClient,

//     entryPoint,

//     kernelVersion,

//     serializedPermissionAccount,

//     signer,
//   );

//   if (kernel.address.toLowerCase() !== customer.smartAccount.toLowerCase()) {
//     throw new Error("Kernel verification failed.");
//   }

//   const kernelClient = createKernelAccountClient({
//     account: kernel,

//     chain,

//     bundlerTransport: http(process.env.BUNDLER_RPC!),

//     paymaster: {
//       async getPaymasterData(userOperation) {
//         return paymasterClient.sponsorUserOperation({
//           userOperation,
//         });
//       },
//     },
//   });

//   return {
//     customer,

//     kernel,

//     kernelClient,

//     permissionId,

//     permission,
//   };
// }
