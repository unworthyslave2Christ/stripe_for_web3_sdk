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
import { subscribeToPlan } from "./subscribeToPlan.js";
import { pausingSubscription } from "./pausingSubscription.js";
import { resumingSubscription } from "./resumingSubscription.js";
import { cancellingSubscription } from "./cancellingSubscription.js";
import { gettingSubscriptionsPerCustomer } from "./gettingSubscriptionsPerCustomer.js";



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
    
    const PLAN_ID = 63;

    // Subscribing
    const result = await subscribeToPlan(PLAN_ID);

    // Pausing subscription
    const {pausedSubscription }= await pausingSubscription(
        result.subscription.subscriptionId
    )

    console.log("pausedSubscription: ", pausedSubscription);

    // Resuming paused subscription
    const {resumedSubscription} = await resumingSubscription(
        result.subscription.subscriptionId
    );

    console.log("resumedSubscription: ", resumedSubscription);

    const {cancelledSubscription} = await cancellingSubscription(
        result.subscription.subscriptionId
    );

    console.log("cancelledSubscription: ", cancelledSubscription);

    const {allCustomerSubscriptions} = await gettingSubscriptionsPerCustomer(
        cancelledSubscription.customerId
    );

    console.log("allCustomerSubscriptions length: ", allCustomerSubscriptions.length);


    // Subscribing to same Plan, having cancelled the plan
    subscribeToPlan(PLAN_ID);

    return {

        customer:
            returnedCustomer,
    };

}