// src/StripeForWeb3.ts

import type {
    Address,
    Chain,
    PublicClient,
    WalletClient as ViemWalletClient,
} from "viem";

import { MerchantClient } from "./merchant";
// import { CustomerClient } from "./customer";
import { WalletClient } from "./wallet";

////////////////////////////////////////////////////////////
// CONFIGURATION
////////////////////////////////////////////////////////////

export interface StripeForWeb3Config {
    /**
     * Connected wallet used to authorize SDK operations.
     */
    walletClient: ViemWalletClient;

    /**
     * Public blockchain client used for reads and
     * transaction/user-operation confirmation.
     */
    publicClient: PublicClient;

    /**
     * Chain on which the Billing Protocol is deployed.
     */
    chain: Chain;

    /**
     * Web3BillingProtocol contract address.
     */
    contractAddress: Address;

    /**
     * Backend API used for canonical persistence/mirroring.
     *
     * Example:
     * https://api.example.com
     */
    apiUrl?: string;
}

////////////////////////////////////////////////////////////
// SDK
////////////////////////////////////////////////////////////

export class StripeForWeb3 {
    readonly merchant: MerchantClient;

    // readonly customer: CustomerClient;

    readonly wallet: WalletClient;

    readonly config: StripeForWeb3Config;

    constructor(config: StripeForWeb3Config) {
        this.config = config;

        ////////////////////////////////////////////////////////////
        // Merchant
        ////////////////////////////////////////////////////////////

        this.merchant = new MerchantClient({
            walletClient: config.walletClient,

            publicClient: config.publicClient,

            contractAddress: config.contractAddress,

            apiUrl: config.apiUrl!,
        });

        //////////////////////////////////////////////////////////
        // Customer
        //////////////////////////////////////////////////////////

        // this.customer = new CustomerClient({
        //     walletClient: config.walletClient,

        //     publicClient: config.publicClient,

        //     contractAddress: config.contractAddress,

        //     apiUrl: config.apiUrl,
        // });

        // ////////////////////////////////////////////////////////////
        // // Wallet
        // ////////////////////////////////////////////////////////////

        this.wallet = new WalletClient({
            walletClient: config.walletClient,

            publicClient: config.publicClient,

            chain: config.chain,

            contractAddress: config.contractAddress,

            apiUrl: config.apiUrl,
        });
    }
}