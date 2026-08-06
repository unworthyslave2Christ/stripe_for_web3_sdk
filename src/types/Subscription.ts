export type SubscriptionStatus =
    | "ACTIVE"
    | "PAUSED"
    | "CANCELLED";

export interface SubscriptionRecord {

    subscriptionId: number;

    customerId: string;

    merchantId: number;

    planId: number;

    smartAccount: `0x${string}`;

    permissionId: string;

    status: SubscriptionStatus;

    nextBillingTime: number;

    lastChargedAt: number | null;

    cancelledAt: number | null;

    createdAt: number;

}