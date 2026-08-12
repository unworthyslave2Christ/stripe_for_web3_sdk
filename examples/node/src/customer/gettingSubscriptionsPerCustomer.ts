// BY GOD'S GRACE ALONE

import { stripe } from "../config.js";

export async function gettingSubscriptionsPerCustomer(customerId: string) {
  const subscriptions =
    await stripe.customer.getSubscriptions(customerId);

  return {
    allCustomerSubscriptions: subscriptions,
  };
}
