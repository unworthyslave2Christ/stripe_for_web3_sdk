// src/types/Subscription.ts

////////////////////////////////////////////////////////////
// SUBSCRIPTION STATUS
////////////////////////////////////////////////////////////

export type SubscriptionStatus =
    | "ACTIVE"
    | "PAUSED"
    | "CANCELLED";


////////////////////////////////////////////////////////////
// CANONICAL SUBSCRIPTION RECORD
////////////////////////////////////////////////////////////

export interface SubscriptionRecord {

    /**
     * Canonical subscription identifier
     * assigned by the Web3BillingProtocol contract.
     */
    subscriptionId: number;

    /**
     * Canonical customer identifier.
     *
     * Stored as a string because customer identifiers
     * may also be represented as strings by backend APIs.
     */
    customerId: string;

    /**
     * Merchant that owns the subscription.
     */
    merchantId: number;

    /**
     * Billing plan used by the subscription.
     */
    planId: number;

    /**
     * Customer Kernel / smart account used
     * to execute subscription operations.
     */
    smartAccount: `0x${string}`;

    /**
     * Billing permission associated with the
     * customer's subscription.
     */
    permissionId: string;

    /**
     * Current subscription status.
     */
    status: SubscriptionStatus;

    /**
     * Unix timestamp at which the next billing
     * cycle is scheduled.
     */
    nextBillingTime: Date;

    /**
     * Unix timestamp of the most recent successful
     * billing operation.
     *
     * Null when the subscription has never been charged.
     */
    lastChargedAt: number | null | undefined | Date;

    /**
     * Unix timestamp at which the subscription
     * was cancelled.
     *
     * Null when the subscription has not been cancelled.
     */
    cancelledAt: number | null | undefined | Date;

    /**
     * Backend persistence timestamp.
     */
    createdAt: number | null | undefined | Date;

    /**
     * Transaction hash associated with the subscription
     * creation operation.
     */
    transactionHash: `0x${string}`;
}


////////////////////////////////////////////////////////////
// API SUBSCRIPTION RECORD
////////////////////////////////////////////////////////////

/**
 * Subscription representation returned by
 * the backend/API layer.
 *
 * This is intentionally kept separate from
 * SubscriptionRecord so API-specific representations
 * can evolve without changing the canonical SDK model.
 */
export interface SubscriptionApiRecord {

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

    transactionHash: `0x${string}`;
}


////////////////////////////////////////////////////////////
// API MUTATION RESPONSE
////////////////////////////////////////////////////////////

/**
 * Response returned by subscription mutation
 * operations such as:
 *
 * - subscribe
 * - pauseSubscription
 * - resumeSubscription
 * - cancelSubscription
 */
export interface SubscriptionApiResponse {

    success: boolean;

    subscription: SubscriptionApiRecord;

    userOperation?: {

        /**
         * Optional backend/user-operation identifier.
         */
        id?: string;

        /**
         * ERC-4337 UserOperation hash.
         */
        hash?: `0x${string}`;

        /**
         * Backend/bundler status.
         */
        status?: string;
    };

    error?: {

        code: string;

        message: string;
    };
}


////////////////////////////////////////////////////////////
// SUBSCRIPTION MIRROR RESPONSE
////////////////////////////////////////////////////////////

/**
 * Backend/Supabase representation of a subscription.
 *
 * The SDK normalization layer converts this snake_case
 * representation into SubscriptionRecord.
 *
 * The optional top-level `subscription` field allows
 * the backend to return either:
 *
 * {
 *     subscription: {...}
 * }
 *
 * or the subscription record directly.
 */
export interface SubscriptionMirrorResponse {

    subscription?: SubscriptionRecord;

    subscription_id?: number;

    customer_id?: string;

    merchant_id?: number;

    plan_id?: number;

    smart_account?: `0x${string}`;

    permission_id?: string;

    status?: string;

    next_billing_time?: number;

    last_charged_at?: number | null;

    cancelled_at?: number | null;

    created_at?: number;

    transaction_hash?: `0x${string}`;
}