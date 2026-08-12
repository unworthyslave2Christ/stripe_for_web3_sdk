// BY GOD'S GRACE ALONE

import { stripe } from "../config.js";

export async function resumingSubscription(subscriptionId: number) {
  const resumeSubscriptionResult =
    await stripe.customer.resumeSubscription(subscriptionId);

  return {
    resumedSubscription: resumeSubscriptionResult.subscription,
  };
}
