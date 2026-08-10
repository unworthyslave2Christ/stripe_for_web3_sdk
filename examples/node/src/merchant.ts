import { Address } from "viem";

import {
    stripe,
} from "./config.js";

////////////////////////////////////////////////////////////
// MERCHANT TEST
////////////////////////////////////////////////////////////

export async function registerMerchant() {

    ////////////////////////////////////////////////////////////
    // CONNECTED WALLET
    ////////////////////////////////////////////////////////////

    const ownerWallet =
        stripe.merchant.walletClient
            .account?.address as Address;

    if (!ownerWallet) {
        throw new Error(
            "Unable to determine merchant owner wallet.",
        );
    }

    console.log(
        "Merchant owner wallet:",
        ownerWallet,
    );

    ////////////////////////////////////////////////////////////
    // REGISTER MERCHANT
    ////////////////////////////////////////////////////////////

    const result =
        await stripe.merchant.register({

            name:
                "Test Merchant",

            payoutWallet:
                ownerWallet,

            metadataURI:
                "ipfs://test-merchant",

        });

    ////////////////////////////////////////////////////////////
    // MERCHANT RESULT
    ////////////////////////////////////////////////////////////

    console.log(
        "Merchant registered:",
        result.merchant,
    );

    console.log(
        "Merchant ID:",
        result.merchantId,
    );

    console.log(
        "Merchant Smart Account:",
        result.smartAccount,
    );

    console.log(
        "UserOperation Hash:",
        result.userOperationHash,
    );

    console.log(
        "Transaction Hash:",
        result.transactionHash,
    );

    return {
        merchant: result
    };
}