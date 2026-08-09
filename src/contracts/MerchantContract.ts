// src/contracts/MerchantContract.ts

import type {
    Address,
    PublicClient,
} from "viem";

import protocolAbi from "./abi/Web3BillingProtocol.json";

////////////////////////////////////////////////////////////
// CONFIGURATION
////////////////////////////////////////////////////////////

export interface MerchantContractConfig {
    publicClient: PublicClient;

    contractAddress: Address;
}

////////////////////////////////////////////////////////////
// READ PARAMS
////////////////////////////////////////////////////////////

export interface MerchantExistsParams {
    publicClient: PublicClient;

    contractAddress: Address;

    smartAccount: Address;
}

export interface MerchantIdLookupParams {
    publicClient: PublicClient;

    contractAddress: Address;

    smartAccount: Address;
}

export interface GetMerchantParams {
    publicClient: PublicClient;

    contractAddress: Address;

    merchantId: bigint;
}

////////////////////////////////////////////////////////////
// MERCHANT EXISTS
////////////////////////////////////////////////////////////

export async function merchantExists({
    publicClient,
    contractAddress,
    smartAccount,
}: MerchantExistsParams): Promise<boolean> {

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
// MERCHANT ID BY SMART ACCOUNT
////////////////////////////////////////////////////////////

export async function getMerchantIdBySmartAccount({
    publicClient,
    contractAddress,
    smartAccount,
}: MerchantIdLookupParams): Promise<bigint> {

    const result =
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

    return result as bigint;
}

////////////////////////////////////////////////////////////
// GET MERCHANT
////////////////////////////////////////////////////////////

export async function getMerchant({
    publicClient,
    contractAddress,
    merchantId,
}: GetMerchantParams) {

    const result =
        await publicClient.readContract({
            address:
                contractAddress,

            abi:
                protocolAbi,

            functionName:
                "getMerchant",

            args: [
                merchantId,
            ],
        });

    return result;
}