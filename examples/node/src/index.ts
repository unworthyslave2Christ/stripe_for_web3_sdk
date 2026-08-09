import {
    registerMerchant,
} from "./merchant.js";

async function main() {

    console.log(
        "========================================",
    );

    console.log(
        "Stripe for Web3 merchant test",
    );

    console.log(
        "========================================",
    );

    const merchant =
        await registerMerchant();

    console.log(
        "Merchant registration completed.",
    );

    console.log(
        merchant,
    );
}

main().catch((error) => {

    console.error(
        "Merchant test failed:",
        error,
    );

    process.exit(1);
});