import { archivePlan } from "./archivePlan.js";
import { createPlan } from "./createPlan.js";
import { getMerchantById } from "./getMerchantById.js";
import { getPlan } from "./getPlan.js";
import { getPlans } from "./getPlans.js";
import {
    registerMerchant,
} from "./merchant.js";
import { pausePlan } from "./pausePlan.js";
import { resumePlan } from "./resumePlan.js";
import { updatePlan } from "./updatePlan.js";
import { PlanApiRecord, PlanRecord, type UpdatePlanResult } from "@stripe-for-web3/sdk";

export async function centralMerchant() {

    console.log(
        "========================================",
    );

    console.log(
        "Stripe for Web3 merchant test",
    );

    console.log(
        "========================================",
    );

    const {merchant} =
        await registerMerchant();

    console.log(
        "Merchant registration completed.",
    );

    console.log(
        merchant
    );


    const {plans} =
        await createPlan();      // Commenting out the plan creation step

    const premiumPlan = plans.premium.plan;

    console.log("Plan creation was successful.");

    console.log(
        plans
    );

    const updatedPremiumPlan = {
            ...premiumPlan,

            name:
                "Premium Plus",

            amount:
                7500000n,
        };

     const {updatedPlan}= await updatePlan(
        plans.premium.plan, 
        updatedPremiumPlan
    )

    console.log(
        "Updated Premium:",
        updatedPlan.plan,
    );

    /// Pausing a plan

    const { pausedPlan }= await pausePlan(
        updatedPlan.plan
    )

    console.log(
        "Paused Premium Plan:",
        pausedPlan,
    );

    // Resuming paused plan

    const {resumedPlan} = await resumePlan(
        pausedPlan.plan
    );

    console.log(
        "Resumed paused premium plan:",
        resumedPlan
    );

    // Archive the resumed paused plan

    const {archivedPlan} = await archivePlan(
        resumedPlan.plan
    );

    console.log(
        "Archived resumed paused premium plan:",
        archivedPlan
    );

    // Getting a unique plan

    const {plan: getPlanResult}  = await getPlan(
        resumedPlan.plan.planId
    );

    console.log(
        "Plan name",
       getPlanResult.name
    );

    const MERCHANT_ID = 1;

    // Getting a unique merchant
    const {merchant: returnedMerchantRecord}  = await getMerchantById(
        MERCHANT_ID
    );

    console.log(
        "Returned Merchant Record",
       returnedMerchantRecord
    );


    // Getting  plans for merchant 1
    const {plans: getPlansResults}  = await getPlans(
        MERCHANT_ID
    );

    getPlansResults.forEach(p => {
        console.log("Plan id: ", p.planId);
    })
    
}

