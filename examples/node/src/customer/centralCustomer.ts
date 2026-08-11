// node-example/src/customer/centralCustomer.ts

import {
    registerCustomer,
} from "./registerCustomer.js";

import {
    stripe,
} from "../config.js";

import type {
    Address,
} from "viem";

////////////////////////////////////////////////////////////
// CENTRAL CUSTOMER
////////////////////////////////////////////////////////////

export async function centralCustomer() {

    console.log(
        "========================================",
    );

    console.log(
        "Stripe for Web3 customer test",
    );

    console.log(
        "========================================",
    );

    ////////////////////////////////////////////////////////////
    // REGISTER CUSTOMER
    ////////////////////////////////////////////////////////////

    const {
        customer,
    } =
        await registerCustomer();

    console.log(
        "Customer registration completed.",
    );

    console.log(
        customer,
    );

    console.log(
        "Customer ID:",
        customer.customerId,
    );

    console.log(
        "Customer Smart Account:",
        customer.smartAccount,
    );

    ////////////////////////////////////////////////////////////
    // CONNECTED WALLET
    ////////////////////////////////////////////////////////////

    const ownerWallet =
        stripe.customer.walletClient
            .account?.address as
        | Address
        | undefined;

    if (!ownerWallet) {

        throw new Error(
            "Unable to determine customer wallet.",
        );

    }

    ////////////////////////////////////////////////////////////
    // GET CUSTOMER
    ////////////////////////////////////////////////////////////

    const returnedCustomer =
        await stripe.customer.getByWallet(
            ownerWallet,
        );

    console.log(
        "Returned Customer Record",
    );

    console.log(
        returnedCustomer,
    );

    ////////////////////////////////////////////////////////////
    // CUSTOMER DETAILS
    ////////////////////////////////////////////////////////////

    console.log(
        "Customer ID:",
        returnedCustomer.customerId,
    );

    console.log(
        "Customer Wallet:",
        returnedCustomer.ownerWallet,
    );

    console.log(
        "Customer Smart Account:",
        returnedCustomer.smartAccount,
    );

    console.log(
        "Customer Status:",
        returnedCustomer.status,
    );

    return {

        customer:
            returnedCustomer,

    };

}