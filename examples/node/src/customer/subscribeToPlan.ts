import { stripe } from "../config.js";

////////////////////////////////////////////////////////////
// SUBSCRIBE CUSTOMER TO PLAN
////////////////////////////////////////////////////////////

export async function subscribeToPlan(planId: number) {
  ////////////////////////////////////////////////////////////
  // PLAN
  ////////////////////////////////////////////////////////////

  const PLAN_ID = planId;

  console.log("Retrieving billing plan:", PLAN_ID);

  const plan = await stripe.merchant.getPlan(PLAN_ID);

  if (!plan) {
    throw new Error(`Plan ${PLAN_ID} was not found.`);
  }

  console.log("Plan retrieved:", plan);

  ////////////////////////////////////////////////////////////
  // SUBSCRIBE
  ////////////////////////////////////////////////////////////

  const result = await stripe.customer.subscribe({
    plan,
  });

  ////////////////////////////////////////////////////////////
  // MERCHANT
  ////////////////////////////////////////////////////////////

  console.log("Merchant:", result.merchant);

  console.log("Merchant ID:", result.merchant.merchantId);

  ////////////////////////////////////////////////////////////
  // CUSTOMER
  ////////////////////////////////////////////////////////////

  console.log("Customer:", result.customer);

  console.log("Customer ID:", result.customer.customerId);

  console.log("Customer Smart Account:", result.customer.smartAccount);

  ////////////////////////////////////////////////////////////
  // SUBSCRIPTION
  ////////////////////////////////////////////////////////////

  console.log("Subscription:", result.subscription);

  console.log("Subscription ID:", result.subscription.subscriptionId);

  console.log("Subscription Customer ID:", result.subscription.customerId);

  console.log("Subscription Merchant ID:", result.subscription.merchantId);

  console.log("Subscription Plan ID:", result.subscription.planId);

  console.log("Subscription Smart Account:", result.subscription.smartAccount);

  console.log("Subscription Permission ID:", result.subscription.permissionId);

  console.log("Subscription Status:", result.subscription.status);

  ////////////////////////////////////////////////////////////
  // USER OPERATION
  ////////////////////////////////////////////////////////////

  console.log("UserOperation Hash:", result.userOperationHash);

  ////////////////////////////////////////////////////////////
  // TRANSACTION
  ////////////////////////////////////////////////////////////

  console.log("Transaction Hash:", result.transactionHash);

  ////////////////////////////////////////////////////////////
  // RECEIPT
  ////////////////////////////////////////////////////////////

  console.log("Receipt:", result.receipt);

  ////////////////////////////////////////////////////////////
  // RETURN
  ////////////////////////////////////////////////////////////

  return {
    plan,

    merchant: result.merchant,
                
    customer: result.customer,

    subscription: result.subscription,

    userOperationHash: result.userOperationHash,

    transactionHash: result.transactionHash,

    receipt: result.receipt,
  };
}
