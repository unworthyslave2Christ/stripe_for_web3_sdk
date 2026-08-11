import { centralCustomer } from "./customer/centralCustomer.js";
import { centralMerchant } from "./merchant/centralMerchant.js";


async function main(){
    // centralMerchant();
    centralCustomer();
}

main().catch((err) => {
    console.error(
        "Merchant test(s) failed",
        err
    );

    process.exit(1)
})

