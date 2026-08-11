import type { Address } from "viem";

import { stripe } from "../config.js";

////////////////////////////////////////////////////////////
// REGISTER CUSTOMER
////////////////////////////////////////////////////////////

export async function registerCustomer() {

    ////////////////////////////////////////////////////////////
    // CONNECTED WALLET
    ////////////////////////////////////////////////////////////

    const ownerWallet =
        stripe.customer.walletClient.account?.address as
        | Address
        | undefined;

    if (!ownerWallet) {

        throw new Error(
            "Unable to determine customer owner wallet.",
        );

    }

    console.log(
        "Customer owner wallet:",
        ownerWallet,
    );

    ////////////////////////////////////////////////////////////
    // REGISTER CUSTOMER
    ////////////////////////////////////////////////////////////

    const result =
        await stripe.customer.register({

            displayName:
                "Test Customer",

            email:
                "customer@example.com",

        });

    ////////////////////////////////////////////////////////////
    // CUSTOMER RESULT
    ////////////////////////////////////////////////////////////

    console.log(
        "Customer registration completed.",
    );

    console.log(
        "Customer:",
        result.customer,
    );

    console.log(
        "Customer ID:",
        result.customer?.customerId,
    );

    console.log(
        "Customer Smart Account:",
        result.customer?.smartAccount,
    );

    console.log(
        "Already Registered:",
        result.alreadyRegistered,
    );

    return {
        customer:
            result.customer,
    };
}