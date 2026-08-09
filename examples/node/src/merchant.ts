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

    ////////////////////////////////////////////////////////////
    // CREATE PLAN 1
    ////////////////////////////////////////////////////////////

    const basicPlan =
        await stripe.merchant.createPlan({

            name:
                "Basic Plan",

            paymentToken:
                process.env.PAYMENT_TOKEN as Address,

            amount:
                1000000n,

            billingPeriodNamed:
                "FIVE_MINUTES",

            trialPeriodNamed:
                "NONE",

            maxSubscribers:
                100,

            allowRenewal:
                true,

            metadataURI:
                "ipfs://test-basic-plan",

        });

    ////////////////////////////////////////////////////////////
    // PLAN 1 RESULT
    ////////////////////////////////////////////////////////////

    console.log(
        "Basic Plan:",
        basicPlan.plan,
    );

    console.log(
        "Basic Plan ID:",
        basicPlan.plan?.planId,
    );

    // console.log(
    //     "Basic Plan UserOperation Hash:",
    //     basicPlan.userOpHash,
    // );

    // console.log(
    //     "Basic Plan Transaction:",
    //     basicPlan.receipt?.transactionHash,
    // );

    ////////////////////////////////////////////////////////////
    // CREATE PLAN 2
    ////////////////////////////////////////////////////////////

    const premiumPlan =
        await stripe.merchant.createPlan({

            name:
                "Premium Plan",

            paymentToken:
                process.env.PAYMENT_TOKEN as Address,

            amount:
                5000000n,

            billingPeriodNamed:
                "FIVE_MINUTES",

            trialPeriodNamed:
                "NONE",

            maxSubscribers:
                50,

            allowRenewal:
                true,

            metadataURI:
                "ipfs://test-premium-plan",

        });

    ////////////////////////////////////////////////////////////
    // PLAN 2 RESULT
    ////////////////////////////////////////////////////////////

    console.log(
        "Premium Plan:",
        premiumPlan.plan,
    );

    console.log(
        "Premium Plan ID:",
        premiumPlan.plan?.planId,
    );

    // console.log(
    //     "Premium Plan UserOperation Hash:",
    //     premiumPlan.userOpHash,
    // );

    // console.log(
    //     "Premium Plan Transaction:",
    //     premiumPlan.receipt?.transactionHash,
    // );

    ////////////////////////////////////////////////////////////
    // FINAL RESULT
    ////////////////////////////////////////////////////////////

    return {
        merchant: result,

        plans: {
            basic: basicPlan,

            premium: premiumPlan,
        },
    };
}