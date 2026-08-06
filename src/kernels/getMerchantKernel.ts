import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";

import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";

import { getEntryPoint, KERNEL_V3_3 } from "@zerodev/sdk/constants";

import { walletClientToSmartAccountSigner } from "permissionless";

import {
  createPublicClient,
  http,
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";

import { arbitrumSepolia } from "viem/chains";

const chain = arbitrumSepolia;

const entryPoint = getEntryPoint("0.7");

const kernelVersion = KERNEL_V3_3;

const paymasterClient = createZeroDevPaymasterClient({
  chain,

  transport: http(process.env.PAYMASTER_RPC!),
});

export interface CreateMerchantKernelParams {
  ownerWalletClient: WalletClient;

  publicClient: PublicClient;
}

export interface MerchantKernel {
  merchant: any;

  kernel: {
    account: any;

    client: any;

    address: Address;
  };
}


export interface MerchantResolver {
  (ownerWallet: Address): Promise<any>;
}

export async function createMerchantKernel({
  ownerWalletClient,

  publicClient,
}: CreateMerchantKernelParams) {
  const signer = walletClientToSmartAccountSigner(ownerWalletClient as any);

  const validator = await signerToEcdsaValidator(
    publicClient,

    {
      signer: signer as any,

      entryPoint,

      kernelVersion,
    },
  );

  const account = await createKernelAccount(
    publicClient,

    {
      entryPoint,

      kernelVersion,

      plugins: {
        sudo: validator,
      },
    },
  );

  const client = createKernelAccountClient({
    account,

    chain,

    bundlerTransport: http(process.env.BUNDLER_RPC!),

    paymaster: {
      async getPaymasterData(userOperation) {
        return paymasterClient.sponsorUserOperation({
          userOperation,
        });
      },
    },
  });

  return {
    account,

    client,

    address: account.address,
  };
}

export interface GetMerchantKernelParams {
    walletClient: WalletClient;
    publicClient: PublicClient;
    merchantResolver: MerchantResolver;
}

export async function getMerchantKernel({
    walletClient,
    publicClient,
    merchantResolver,
}: GetMerchantKernelParams): Promise<MerchantKernel> {
  const [ownerWallet] = await walletClient.getAddresses();

  const merchant = await merchantResolver(ownerWallet);

  const kernel = await createMerchantKernel({
    ownerWalletClient: walletClient,

    publicClient,
  });

  if (kernel.address.toLowerCase() !== merchant.smart_account.toLowerCase()) {
    throw new Error("Connected wallet does not own this merchant.");
  }

  return {
    merchant,

    kernel,
  };
}
