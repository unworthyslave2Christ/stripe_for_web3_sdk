// src/kernels/getMerchantKernel.ts

import {
    signerToEcdsaValidator,
} from "@zerodev/ecdsa-validator";

import {
    createKernelAccount,
    createKernelAccountClient,
    createZeroDevPaymasterClient,
} from "@zerodev/sdk";

import {
    getEntryPoint,
    KERNEL_V3_3,
} from "@zerodev/sdk/constants";

import {
    walletClientToSmartAccountSigner,
} from "permissionless";

import type {
    Address,
    PublicClient,
    WalletClient,
} from "viem";

import {
    http,
} from "viem";

import {
    arbitrumSepolia,
} from "viem/chains";

import type {
    MerchantRecord,
} from "../types/Merchant";

import {
    getMerchantByOwnerWallet,
} from "../merchant/getMerchant";

////////////////////////////////////////////////////////////
// CONFIGURATION
////////////////////////////////////////////////////////////

const chain =
    arbitrumSepolia;

const entryPoint =
    getEntryPoint("0.7");

const kernelVersion =
    KERNEL_V3_3;

////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////

export type KernelAccount =
    Awaited<
        ReturnType<typeof createKernelAccount>
    >;

export type KernelClient =
    Awaited<
        ReturnType<typeof createKernelAccountClient>
    >;

export interface KernelContext {

    /**
     * ZeroDev Kernel account.
     */
    account: KernelAccount;

    /**
     * ZeroDev Kernel account client.
     */
    client: KernelClient;

    /**
     * Deterministic Kernel smart-account address.
     */
    address: Address;
}

export interface CreateMerchantKernelParams {

    /**
     * Connected merchant-owner wallet.
     */
    ownerWalletClient: WalletClient;

    /**
     * Public blockchain client.
     */
    publicClient: PublicClient;
}

export interface GetMerchantKernelParams {
    /**
     * Connected merchant-owner wallet.
     */
    walletClient: WalletClient;

    /**
     * Public blockchain client.
     */
    publicClient: PublicClient;

    /**
     * Merchant backend API URL.
     */
    apiUrl: string;
}

export interface MerchantKernelResult {

    /**
     * Canonical merchant record from the backend.
     */
    merchant: MerchantRecord;

    /**
     * Kernel belonging to the merchant.
     */
    kernel: KernelContext;
}

////////////////////////////////////////////////////////////
// PAYMASTER
////////////////////////////////////////////////////////////

function createPaymasterClient() {

    const rpc ="https://rpc.zerodev.app/api/v3/a26a0058-c9c3-4c35-a01c-f5f76aae4d33/chain/421614";

    if (!rpc) {

        throw new Error(
            "PAYMASTER_RPC is not configured.",
        );
    }

    return createZeroDevPaymasterClient({

        chain,

        transport:
            http(rpc),

    });
}

////////////////////////////////////////////////////////////
// CREATE MERCHANT KERNEL
////////////////////////////////////////////////////////////

/**
 * Creates the deterministic Kernel belonging to the
 * connected merchant-owner wallet.
 *
 * This function does NOT query the backend and does NOT
 * require an existing merchant.
 *
 * It is therefore used during new merchant registration.
 */
export async function createMerchantKernel({
    ownerWalletClient,
    publicClient
}: CreateMerchantKernelParams): Promise<KernelContext> {

    ////////////////////////////////////////////////////////////
    // SMART ACCOUNT SIGNER
    ////////////////////////////////////////////////////////////

    const signer =
        walletClientToSmartAccountSigner(
            ownerWalletClient as any,
        );

    ////////////////////////////////////////////////////////////
    // ECDSA VALIDATOR
    ////////////////////////////////////////////////////////////

  
    const validator =
        await signerToEcdsaValidator(
            publicClient,
            {
                signer: signer as any,

                entryPoint,

                kernelVersion,
            },
        );

    ////////////////////////////////////////////////////////////
    // KERNEL ACCOUNT
    ////////////////////////////////////////////////////////////

    const account =
        await createKernelAccount(
            publicClient,
            {
                entryPoint,

                kernelVersion,

                plugins: {
                    sudo: validator,
                },
            },
        );

    ////////////////////////////////////////////////////////////
    // PAYMASTER
    ////////////////////////////////////////////////////////////

    const paymasterClient =
        createPaymasterClient();

    ////////////////////////////////////////////////////////////
    // KERNEL CLIENT
    ////////////////////////////////////////////////////////////

    const client =
        createKernelAccountClient({

            account,

            chain,

            bundlerTransport:
                http(
                    "https://rpc.zerodev.app/api/v3/a26a0058-c9c3-4c35-a01c-f5f76aae4d33/chain/421614",
                ),

            paymaster: {

                async getPaymasterData(
                    userOperation,
                ) {

                    return paymasterClient
                        .sponsorUserOperation({
                            userOperation,
                        });
                },
            },
        });

    ////////////////////////////////////////////////////////////
    // RESULT
    ////////////////////////////////////////////////////////////

    return {

        account,

        client,

        address:
            account.address,

    };
}

////////////////////////////////////////////////////////////
// GET EXISTING MERCHANT KERNEL
////////////////////////////////////////////////////////////

/**
 * Resolves the Kernel belonging to an EXISTING merchant.
 *
 * Workflow:
 *
 * 1. Determine connected owner wallet.
 * 2. Retrieve merchant from backend.
 * 3. Recreate the deterministic Kernel.
 * 4. Compare the derived Kernel address with the
 *    canonical merchant smart-account address.
 *
 * This function must NOT be used to create a new merchant.
 */
export async function getMerchantKernel( params : GetMerchantKernelParams): Promise<MerchantKernelResult> {

    ////////////////////////////////////////////////////////////
    // OWNER WALLET
    ////////////////////////////////////////////////////////////

    const [
        ownerWallet,
    ] =
        await params.walletClient.getAddresses();

    if (!ownerWallet) {

        throw new Error(
            "Unable to determine the connected owner wallet.",
        );
    }

    ////////////////////////////////////////////////////////////
    // BACKEND MERCHANT
    ////////////////////////////////////////////////////////////

    const merchant =
        await getMerchantByOwnerWallet(
            ownerWallet,
            params.apiUrl!
        );

    if (!merchant) {

        throw new Error(
            "No merchant is registered for the connected wallet.",
        );
    }

    ////////////////////////////////////////////////////////////
    // RECREATE DETERMINISTIC KERNEL
    ////////////////////////////////////////////////////////////

    const kernel =
        await createMerchantKernel({
            ownerWalletClient:
                params.walletClient,

            publicClient: params.publicClient,

        });

    ////////////////////////////////////////////////////////////
    // VERIFY OWNERSHIP
    ////////////////////////////////////////////////////////////

    if (
        kernel.address.toLowerCase() !==
        merchant.smartAccount.toLowerCase()
    ) {

        throw new Error(
            "Connected wallet does not own this merchant Kernel.",
        );
    }

    ////////////////////////////////////////////////////////////
    // RESULT
    ////////////////////////////////////////////////////////////

    return {

        merchant,

        kernel,

    };
}