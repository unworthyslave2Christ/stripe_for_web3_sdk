// src/pausePlan.ts

import { stripe } from "../config.js";

import { PlanRecord } from "@stripe-for-web3/sdk";

////////////////////////////////////////////////////////////
// UPDATE PLAN
////////////////////////////////////////////////////////////

export async function getPlan(
    planId: number,
) {

    ////////////////////////////////////////////////////////////
    // VALIDATION
    ////////////////////////////////////////////////////////////

    if (
        !Number.isInteger(planId) && planId >=0
    ) {
        throw new Error(
            "PlanId should be a non-negative integer.",
        );
    }

    
    ////////////////////////////////////////////////////////////
    // RESULT
    ////////////////////////////////////////////////////////////


    try{
        const getPlanResult = await stripe.merchant.getPlan(
        planId
        );

        return {
                plan:
                    getPlanResult,  
            };
    } catch (err){
        console.error(err);
        return {
            plan: {} as PlanRecord
        }
    }

    

    
}