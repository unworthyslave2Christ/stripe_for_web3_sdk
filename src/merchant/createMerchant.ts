// src/merchant/createMerchant.ts

import {
    decodeEventLog,
    encodeFunctionData,
    type Address,
    type PublicClient,
} from "viem";

import type { MerchantClient } from "./MerchantClient";
import type { MerchantApiResponse, MerchantRecord, MerchantStatus } from "../types/Merchant";

import protocolAbi from "../contracts/abi/Web3BillingProtocol.json";

import { createMerchantKernel } from "../kernels/getMerchantKernel";

import { mirror } from "../internal/mirror";

////////////////////////////////////////////////////////////
// PLATFORM CONFIGURATION
////////////////////////////////////////////////////////////

/**
 * Platform-controlled billing operator.
 *
 * This is NOT supplied by the merchant.
 *
 * Replace the value below with the deployed billing operator
 * address for the SDK/protocol deployment.
 */
export const PLATFORM_BILLING_OPERATOR: Address =
    "0x82818c00e96356753c146Fc3119b1077DeC0d405";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface CreateMerchantParams {
    client: MerchantClient;

    /**
     * Human-readable merchant/business name.
     */
    name: string;

    /**
     * Wallet receiving merchant payouts.
     */
    payoutWallet: Address;

    /**
     * Optional merchant metadata URI.
     */
    metadataURI?: string;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface CreateMerchantResult {
    /**
     * Canonical merchant record returned by the backend.
     */
    merchant: MerchantRecord;

    /**
     * On-chain merchant identifier.
     */
    merchantId: number;

    /**
     * Merchant Kernel smart account.
     */
    smartAccount: Address;

    /**
     * User operation used to approve the
     * platform billing operator.
     */
    userOperationHash?: `0x${string}`;

    /**
     * Transaction hash of the owner-wallet
     * merchant registration.
     */
    transactionHash?: `0x${string}`;

    /**
     * Whether the merchant already existed.
     */
    alreadyRegistered: boolean;
}

////////////////////////////////////////////////////////////
// CREATE MERCHANT
////////////////////////////////////////////////////////////

/**
 * Complete merchant registration workflow.
 *
 * New merchant:
 *
 * 1. Resolve connected owner wallet.
 * 2. Check backend mirror.
 * 3. Create merchant Kernel.
 * 4. Register merchant on-chain using owner wallet.
 * 5. Resolve merchant ID.
 * 6. Approve the platform billing operator using the Kernel.
 * 7. Mirror the canonical merchant to the backend.
 * 8. Return the backend MerchantRecord.
 *
 * Existing merchant:
 *
 * 1. Resolve backend merchant by owner wallet.
 * 2. Verify its smart account on-chain.
 * 3. Return the existing canonical MerchantRecord.
 *
 * The merchant never supplies the billing operator.
 */
export async function createMerchant({
    client,
    name,
    payoutWallet,
    metadataURI = "",
}: CreateMerchantParams): Promise<CreateMerchantResult> {

    ////////////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////////////

    if (!client.contractAddress) {
        throw new Error(
            "Billing Protocol contract address is not configured.",
        );
    }

    if (!client.apiUrl) {
        throw new Error(
            "Merchant API URL is not configured.",
        );
    }

    const contractAddress = client.contractAddress;

    ////////////////////////////////////////////////////////////
    // OWNER WALLET
    ////////////////////////////////////////////////////////////

    const [ownerWallet] =
        await client.walletClient.getAddresses();

    if (!ownerWallet) {
        throw new Error(
            "Unable to determine the connected owner wallet.",
        );
    }

    ////////////////////////////////////////////////////////////
    // CHECK BACKEND MIRROR
    ////////////////////////////////////////////////////////////

    const existingMerchant =
        await findMerchantByOwnerWallet(
            client.apiUrl,
            ownerWallet,
        );

    ////////////////////////////////////////////////////////////
    // EXISTING MERCHANT
    ////////////////////////////////////////////////////////////

    if (existingMerchant) {

        /*
         * The backend already knows about this merchant.
         *
         * Never create a second merchant simply because
         * register() was called again.
         */
        const existsOnChain =
            await merchantExistsOnChain({
                publicClient:
                    client.publicClient,

                contractAddress,

                smartAccount:
                    existingMerchant.smartAccount,
            });

        if (!existsOnChain) {
            throw new Error(
                "Merchant exists in the backend mirror but its smart account is not registered on-chain.",
            );
        }

        return {
            merchant:
                existingMerchant,

            merchantId:
                existingMerchant.merchantId,

            smartAccount:
                existingMerchant.smartAccount,

            alreadyRegistered:
                true,
        };
    }

    ////////////////////////////////////////////////////////////
    // CREATE NEW MERCHANT KERNEL
    ////////////////////////////////////////////////////////////

    /*
     * IMPORTANT:
     *
     * Do NOT call getMerchantKernel() here.
     *
     * getMerchantKernel() is specifically for an existing
     * merchant because it first resolves the merchant from
     * the backend.
     *
     * This is a NEW merchant.
     */
    const kernel =
        await createMerchantKernel({
            ownerWalletClient:
                client.walletClient,

            publicClient:
                client.publicClient,
        });

    const merchantSmartAccount =
        kernel.address;

    ////////////////////////////////////////////////////////////
    // REGISTER MERCHANT ON-CHAIN
    ////////////////////////////////////////////////////////////

    /*
     * This intentionally follows the original PoC:
     *
     * owner wallet
     *      |
     *      v
     * BillingProtocol.registerMerchant()
     *
     * The newly-created Kernel becomes the merchant's
     * smart account.
     */
    const registrationHash =
        await client.walletClient.writeContract({
            account:
                client.walletClient.account!,

            chain:
                client.walletClient.chain,

            address:
                contractAddress,

            abi:
                protocolAbi,

            functionName:
                "registerMerchant",

            args: [
                merchantSmartAccount,
                payoutWallet,
                name,
                metadataURI,
            ],
        });

    ////////////////////////////////////////////////////////////
    // WAIT FOR REGISTRATION
    ////////////////////////////////////////////////////////////

    const registrationReceipt =
        await client.publicClient.waitForTransactionReceipt({
            hash:
                registrationHash,
        });

    if (registrationReceipt.status !== "success") {
        throw new Error(
            "Merchant registration transaction failed.",
        );
    }

    ////////////////////////////////////////////////////////////
    // RESOLVE MERCHANT ID
    ////////////////////////////////////////////////////////////

    const merchantId =
        await resolveMerchantIdFromReceipt({
            publicClient:
                client.publicClient,

            contractAddress,

            receipt:
                registrationReceipt,

            smartAccount:
                merchantSmartAccount,
        });

    ////////////////////////////////////////////////////////////
    // APPROVE PLATFORM BILLING OPERATOR
    ////////////////////////////////////////////////////////////

    /*
     * The merchant does NOT provide this address.
     *
     * The SDK/platform controls the billing operator.
     *
     * The merchant Kernel signs this UserOperation.
     */
    const approvalData =
        encodeFunctionData({
            abi:
                protocolAbi,

            functionName:
                "approveBillingOperator",

            args: [
                BigInt(merchantId),
                PLATFORM_BILLING_OPERATOR,
            ],
        });

    ////////////////////////////////////////////////////////////
    // ENCODE KERNEL CALL
    ////////////////////////////////////////////////////////////

    const approvalCallData =
        await kernel.account.encodeCalls([
            {
                to:
                    contractAddress,

                value:
                    0n,

                data:
                    approvalData,
            },
        ]);

    ////////////////////////////////////////////////////////////
    // SEND USER OPERATION
    ////////////////////////////////////////////////////////////

    const approvalUserOperationHash =
        await kernel.client.sendUserOperation({
            callData:
                approvalCallData,
        });

    ////////////////////////////////////////////////////////////
    // WAIT FOR APPROVAL
    ////////////////////////////////////////////////////////////

    await kernel.client.waitForUserOperationReceipt({
        hash:
            approvalUserOperationHash,
    });

    ////////////////////////////////////////////////////////////
    // BACKEND CANONICAL MIRROR
    ////////////////////////////////////////////////////////////

    const merchant =
        await mirrorMerchant({
            apiUrl:
                client.apiUrl,

            merchantId,

            ownerWallet,

            smartAccount:
                merchantSmartAccount,

            payoutWallet,

            name,

            metadataURI,

            billingOperator:
                PLATFORM_BILLING_OPERATOR,

            registrationTransactionHash:
                registrationHash,

            approvalUserOperationHash,
        });

    ////////////////////////////////////////////////////////////
    // RETURN
    ////////////////////////////////////////////////////////////

    return {
        merchant,

        merchantId,

        smartAccount:
            merchantSmartAccount,

        userOperationHash:
            approvalUserOperationHash,

        transactionHash:
            registrationHash,

        alreadyRegistered:
            false,
    };
}

////////////////////////////////////////////////////////////
// BACKEND LOOKUP
////////////////////////////////////////////////////////////

async function findMerchantByOwnerWallet(
    apiUrl: string,
    ownerWallet: Address,
): Promise<MerchantRecord | null> {

    const response =
        await fetch(
            `${apiUrl}/api/v1/merchants/owner/${ownerWallet}`,
            {
                method:
                    "GET",

                headers: {
                    Accept:
                        "application/json",
                },
            },
        );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            "Unable to determine whether the merchant already exists.",
        );
    }

    const body =
        await response.json() as MerchantApiResponse;

    return normalizeMerchant(
        body.merchant ??
        body,
    );
}

////////////////////////////////////////////////////////////
// ON-CHAIN EXISTENCE
////////////////////////////////////////////////////////////

async function merchantExistsOnChain({
    publicClient,
    contractAddress,
    smartAccount,
}: {
    publicClient: PublicClient;
    contractAddress: Address;
    smartAccount: Address;
}): Promise<boolean> {

    const result =
        await publicClient.readContract({
            address:
                contractAddress,

            abi:
                protocolAbi,

            functionName:
                "merchantExists",

            args: [
                smartAccount,
            ],
        });

    return result as boolean;
}

////////////////////////////////////////////////////////////
// MERCHANT ID
////////////////////////////////////////////////////////////

async function resolveMerchantIdFromReceipt({
    publicClient,
    contractAddress,
    receipt,
    smartAccount,
}: {
    publicClient: PublicClient;

    contractAddress: Address;

    receipt: {
        blockNumber: bigint;
    };

    smartAccount: Address;
}): Promise<number> {

    ////////////////////////////////////////////////////////////
    // MERCHANT CREATED EVENT
    ////////////////////////////////////////////////////////////

    const events =
        await publicClient.getContractEvents({
            address:
                contractAddress,

            abi:
                protocolAbi,

            eventName:
                "MerchantCreated",

            fromBlock:
                receipt.blockNumber,

            toBlock:
                receipt.blockNumber,
        });

    if (events.length > 0) {

        const decoded = decodeEventLog({
            abi: protocolAbi,
            data: events[events.length - 1].data,
            topics: events[events.length - 1].topics,
            eventName: "MerchantCreated",
        });

        const args = decoded.args as unknown as {
                merchantId: bigint;
            };

        if (
            args?.merchantId !== undefined
        ) {
            return Number(
                args.merchantId,
            );
        }
    }

    ////////////////////////////////////////////////////////////
    // FALLBACK
    ////////////////////////////////////////////////////////////

    const merchantId =
        await publicClient.readContract({
            address:
                contractAddress,

            abi:
                protocolAbi,

            functionName:
                "merchantBySmartAccount",

            args: [
                smartAccount,
            ],
        });

    return Number(
        merchantId as bigint,
    );
}

////////////////////////////////////////////////////////////
// BACKEND MIRROR
////////////////////////////////////////////////////////////

async function mirrorMerchant({
    apiUrl,
    merchantId,
    ownerWallet,
    smartAccount,
    payoutWallet,
    name,
    metadataURI,
    billingOperator,
    registrationTransactionHash,
    approvalUserOperationHash,
}: {
    apiUrl: string;

    merchantId: number;

    ownerWallet: Address;

    smartAccount: Address;

    payoutWallet: Address;

    name: string;

    metadataURI: string;

    billingOperator: Address;

    registrationTransactionHash:
        `0x${string}`;

    approvalUserOperationHash:
        `0x${string}`;
}): Promise<MerchantRecord> {

    const result =
        await mirror({
            apiUrl,

            endpoint:
                "/api/v1/merchants",

            body: {
                merchantId,

                ownerWallet,

                smartAccount,

                payoutWallet,

                name,

                metadataURI,

                billingOperator,

                registrationTransactionHash,

                approvalUserOperationHash,
            },
        });

    const response =
        result as MerchantApiResponse;

    return normalizeMerchant(
        response.merchant ??
        response,
    );
}

////////////////////////////////////////////////////////////
// NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeMerchant(
    input: any,
): MerchantRecord {

    const createdAt =
        input.createdAt ??
        input.created_at;

    const updatedAt =
        input.updatedAt ??
        input.updated_at;

    return {
        merchantId:
            Number(
                input.merchantId ??
                input.merchant_id,
            ),

        ownerWallet:
            input.ownerWallet ??
            input.owner_wallet,

        payoutWallet:
            input.payoutWallet ??
            input.payout_wallet,

        smartAccount:
            input.smartAccount ??
            input.smart_account,

        name:
            input.name,

        metadataURI:
            input.metadataURI ??
            input.metadata_uri ??
            "",

        billingOperator:
            input.billingOperator ??
            input.billing_operator ??
            PLATFORM_BILLING_OPERATOR,

        status:
            input.status ??
            "ACTIVE",

        createdAt:createdAt
            ? new Date(createdAt)
            : new Date(),

        updatedAt:updatedAt
            ? new Date(updatedAt)
            : new Date(),
    };
}