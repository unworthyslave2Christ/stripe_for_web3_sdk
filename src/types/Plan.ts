export type PlanStatus =
    | "ACTIVE"
    | "PAUSED"
    | "ARCHIVED";

export interface PlanRecord {

    planId: number;

    merchantId: number;

    paymentToken: `0x${string}`;

    amount: bigint;

    billingIntervalSeconds: bigint;

    trialPeriod: bigint;

    maxSubscribers: number;

    allowRenewal: boolean;

    metadataURI: string;

    name: string;

    status: PlanStatus;

    billingPeriodNamed: string;

    trialPeriodNamed: string;

    createdAt: number;

    updatedAt: number;

}