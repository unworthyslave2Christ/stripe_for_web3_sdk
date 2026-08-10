// src/pausePlan.ts

import { stripe } from "./config.js";

import { PlanRecord } from "@stripe-for-web3/sdk";

////////////////////////////////////////////////////////////
// UPDATE PLAN
////////////////////////////////////////////////////////////

export async function getPlans(
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
        const getPlanResults = await stripe.merchant.getPlans(
        merchantId
        );

        return {
                plans:
                    getPlanResults,  
            };
    } catch (err){
        console.error(err);
        return {
            plans: {} as PlanRecord[]
        }
    }

    

    
}