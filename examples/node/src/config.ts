import "dotenv/config";

import {
    createPublicClient,
    createWalletClient,
    http,
} from "viem";

import {
    privateKeyToAccount,
    generatePrivateKey
} from "viem/accounts";

import {
    arbitrumSepolia,
} from "viem/chains";

import {
    StripeForWeb3,
} from "@stripe-for-web3/sdk";

////////////////////////////////////////////////////////////
// ENVIRONMENT
////////////////////////////////////////////////////////////

const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
const rpcUrl =
    process.env.RPC_URL;

const billingContract =
    process.env.BILLING_CONTRACT as `0x${string}`;

const apiUrl =
    process.env.API_URL;

if (!privateKey) {
    throw new Error(
        "PRIVATE_KEY is not configured.",
    );
}

if (!rpcUrl) {
    throw new Error(
        "RPC_URL is not configured.",
    );
}

if (!billingContract) {
    throw new Error(
        "BILLING_CONTRACT is not configured.",
    );
}

if (!apiUrl) {
    throw new Error(
        "API_URL is not configured.",
    );
}

////////////////////////////////////////////////////////////
// ACCOUNT
////////////////////////////////////////////////////////////

export const account =
    privateKeyToAccount(
        privateKey,
    );

////////////////////////////////////////////////////////////
// PUBLIC CLIENT
////////////////////////////////////////////////////////////

export const publicClient =
    createPublicClient({
        chain:
            arbitrumSepolia,

        transport:
            http(rpcUrl),
    });

////////////////////////////////////////////////////////////
// WALLET CLIENT
////////////////////////////////////////////////////////////

export const walletClient =
    createWalletClient({
        account,

        chain:
            arbitrumSepolia,

        transport:
            http(rpcUrl),
    });

////////////////////////////////////////////////////////////
// STRIPE FOR WEB3
////////////////////////////////////////////////////////////

export const stripe =
    new StripeForWeb3({
        walletClient,

        publicClient,

        chain:
            arbitrumSepolia,

        contractAddress:
            billingContract,

        apiUrl,
    });