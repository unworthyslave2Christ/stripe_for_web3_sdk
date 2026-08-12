// BY GOD'S GRACE ALONE

import { stripe } from "../config.js";

export async function pausingSubscription(subscriptionId: number) {
  const pauseSubscriptionResult =
    await stripe.customer.pauseSubscription(subscriptionId);

  return {
    pausedSubscription: pauseSubscriptionResult.subscription,
  };
}
