// src/updatePlan.ts

import { stripe } from "../config.js";

import { PlanRecord } from "@stripe-for-web3/sdk";

////////////////////////////////////////////////////////////
// UPDATE PLAN
////////////////////////////////////////////////////////////

export async function updatePlan(
  originalPlan: PlanRecord,
  updatedPlan: PlanRecord,
) {
  ////////////////////////////////////////////////////////////
  // VALIDATION
  ////////////////////////////////////////////////////////////

  if (originalPlan.planId !== updatedPlan.planId) {
    throw new Error("Original and updated plans must have the same planId.");
  }

  if (originalPlan.merchantId !== updatedPlan.merchantId) {
    throw new Error(
      "Original and updated plans must belong to the same merchant.",
    );
  }

  const updatedPlanResult = await stripe.merchant.updatePlan(
    originalPlan,
    updatedPlan,
  );

  ////////////////////////////////////////////////////////////
  // RESULT
  ////////////////////////////////////////////////////////////

  return {
    updatedPlan: updatedPlanResult,
  };
}
