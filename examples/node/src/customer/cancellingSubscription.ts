// BY GOD'S GRACE ALONE

import { stripe } from "../config.js";

export async function cancellingSubscription(subscriptionId: number) {
  const cancelSubscriptionResult =
    await stripe.customer.cancelSubscription(subscriptionId);

  return {
    cancelledSubscription: cancelSubscriptionResult.subscription,
  };
}
