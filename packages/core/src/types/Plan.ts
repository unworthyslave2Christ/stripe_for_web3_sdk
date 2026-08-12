export type PlanStatus =
    | "ACTIVE"
    | "PAUSED"
    | "ARCHIVED";

export type BillingPeriodNamed =
    | "FIVE_MINUTES"
    | "HOURLY"
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "YEARLY";

export type TrialPeriodNamed =
    | "NONE"
    | "FIVE_MINUTES"
    | "HOURLY"
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "YEARLY";


export interface PlanRecord {
    planId: number;

    merchantId: number;

    paymentToken: `0x${string}`;

    amount: bigint;

    billingIntervalSeconds: number;

    billingPeriodNamed?: BillingPeriodNamed;

    trialPeriod: number;

    trialPeriodNamed: TrialPeriodNamed;

    name: string;

    status: "ACTIVE" | "PAUSED" | "ARCHIVED";

    maxSubscribers: number;

    allowRenewal: boolean;

    metadataURI: string;

    createdAt: Date;

    updatedAt: Date;
}

export interface PlanApiRecord {
    planId: number;

    merchantId: number;

    paymentToken: `0x${string}`;

    amount: string;

    billingIntervalSeconds: number;

    billingPeriodNamed?: BillingPeriodNamed;

    trialPeriod: number;

    trialPeriodNamed: TrialPeriodNamed;

    name: string;

    status: PlanStatus;

    maxSubscribers: number;

    allowRenewal: boolean;

    metadataURI: string;

    createdAt: Date;

    updatedAt: Date;
}

export interface PlanApiResponse {
    success: boolean;

    plan: PlanApiRecord;

    userOperation?: {
        id?: string;
        hash?: `0x${string}`;
        status?: string;
    };

    error?: {
        code: string;
        message: string;
    };
}

export interface  PlanMirrorResponse {
    plan?: PlanRecord;
    plan_id?: number;
    merchant_id?: number;
    payment_token?: `0x${string}`;
    amount?: string;
    billing_interval_seconds?: number;
    billing_period_named?: BillingPeriodNamed;
    trial_period?: number;
    trial_period_named?: TrialPeriodNamed;
    max_subscribers?: number;
    allow_renewal?: boolean;
    metadata_uri?: string;
    name?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}