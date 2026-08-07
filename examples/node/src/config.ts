import "dotenv/config";

import { createPublicClient, createWalletClient, http } from "viem";

import { privateKeyToAccount } from "viem/accounts";

import { arbitrumSepolia } from "viem/chains";

import { StripeForWeb3 } from "@stripe-for-web3/sdk";

const account = privateKeyToAccount(
    process.env.PRIVATE_KEY as `0x${string}`,
);

export const publicClient = createPublicClient({

    chain: arbitrumSepolia,

    transport: http(process.env.RPC_URL),

});

export const walletClient = createWalletClient({

    account,

    chain: arbitrumSepolia,

    transport: http(process.env.RPC_URL),

});

export const stripe = new StripeForWeb3({

    walletClient,

    publicClient,

    chain: arbitrumSepolia,

    contractAddress:
        process.env.BILLING_CONTRACT as `0x${string}`,

    apiUrl: process.env.API_URL,

    merchantResolver: async () => {

        throw new Error("Implement merchantResolver.");

    },

    customerResolver: async () => {

        throw new Error("Implement customerResolver.");

    },

});