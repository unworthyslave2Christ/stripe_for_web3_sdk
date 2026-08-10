// src/pausePlan.ts

import { MerchantRecord } from "@stripe-for-web3/sdk";
import { stripe } from "./config.js";

////////////////////////////////////////////////////////////
// UPDATE PLAN
////////////////////////////////////////////////////////////

export async function getMerchantById(
    merchantId: number,
) {

    ////////////////////////////////////////////////////////////
    // VALIDATION
    ////////////////////////////////////////////////////////////

    if (
        !Number.isInteger(merchantId) && merchantId >=0
    ) {
        throw new Error(
            "MerchantId should be a non-negative integer.",
        );
    }

    
    ////////////////////////////////////////////////////////////
    // RESULT
    ////////////////////////////////////////////////////////////


    try{
        const merchant = await stripe.merchant.getById(
        merchantId
        );

        return {
                merchant: merchant  
            };
    } catch (err){
        console.error(err);
         return {
                merchant: {} as MerchantRecord
            };
    }
    
}