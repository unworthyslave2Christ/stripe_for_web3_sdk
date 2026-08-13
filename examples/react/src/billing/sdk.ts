import type {
    PublicClient,
    WalletClient,
} from "viem";

import {
    CustomerClient,
} from "@stripe-for-web3/customer";

import {
    appConfig,
} from "../app/config";

////////////////////////////////////////////////////////////
// CUSTOMER SDK
////////////////////////////////////////////////////////////

export function createCustomerSDK({
    walletClient,

    publicClient,
}: {
    walletClient: WalletClient;

    publicClient: PublicClient;
}) {
    return new CustomerClient({
        walletClient,

        publicClient,

        contractAddress:
            appConfig.billingContractAddress,

        apiUrl:
            appConfig.apiUrl,
    });
}