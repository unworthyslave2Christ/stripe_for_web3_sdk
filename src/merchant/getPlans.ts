// src/merchant/getPlans.ts

import type { MerchantClient } from "./MerchantClient";

import type {
    PlanRecord,
    PlanStatus,
    BillingPeriodNamed,
    TrialPeriodNamed,
} from "../types/Plan";

////////////////////////////////////////////////////////////
// API RESPONSE
////////////////////////////////////////////////////////////

interface PlanApiResponse {
    plan_id: number;

    merchant_id: number;

    payment_token: `0x${string}`;

    amount: string;

    billing_interval_seconds: number;

    trial_period: number;

    max_subscribers: number;

    allow_renewal: boolean;

    metadata_uri: string;

    name: string;

    status: string;

    billing_period_named?: string;

    trial_period_named?: string;

    created_at: string;

    updated_at: string;
}

interface PlansApiResponse {
    plans: PlanApiResponse[];
}

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface GetPlansParams {
    /**
     * Merchant SDK client.
     *
     * Only the API URL is required for this operation.
     */
    client: MerchantClient;

    /**
     * Merchant whose plans should be retrieved.
     */
    merchantId: number;
}

////////////////////////////////////////////////////////////
// DATE NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeDate(value: unknown): Date {
    if (value instanceof Date) {
        return value;
    }

    if (typeof value === "string") {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    if (typeof value === "number") {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    throw new Error(
        "Invalid plan timestamp returned by the backend.",
    );
}

////////////////////////////////////////////////////////////
// PLAN NORMALIZATION
////////////////////////////////////////////////////////////

function normalizePlan(
    input: PlanApiResponse,
): PlanRecord {
    return {
        planId: Number(input.plan_id),

        merchantId: Number(input.merchant_id),

        paymentToken: input.payment_token,

        amount: BigInt(input.amount),

        billingIntervalSeconds:
            Number(
                input.billing_interval_seconds,
            ),

        billingPeriodNamed:
            input.billing_period_named as
                | BillingPeriodNamed
                | undefined,

        trialPeriod:
            Number(input.trial_period),

        trialPeriodNamed:
            (
                input.trial_period_named ??
                "NONE"
            ) as TrialPeriodNamed,

        maxSubscribers:
            Number(input.max_subscribers),

        allowRenewal:
            Boolean(input.allow_renewal),

        metadataURI:
            input.metadata_uri ?? "",

        name: input.name,

        status:
            input.status as PlanStatus,

        createdAt:
            normalizeDate(
                input.created_at,
            ),

        updatedAt:
            normalizeDate(
                input.updated_at,
            ),
    };
}

////////////////////////////////////////////////////////////
// RESPONSE TYPE GUARDS
////////////////////////////////////////////////////////////

function isPlanApiResponse(
    value: unknown,
): value is PlanApiResponse {
    return (
        typeof value === "object" &&
        value !== null &&
        "plan_id" in value &&
        "merchant_id" in value &&
        "payment_token" in value &&
        "amount" in value
    );
}

function isPlanApiResponseArray(
    value: unknown,
): value is PlanApiResponse[] {
    return (
        Array.isArray(value) &&
        value.every(isPlanApiResponse)
    );
}

function isPlansApiResponse(
    value: unknown,
): value is PlansApiResponse {
    return (
        typeof value === "object" &&
        value !== null &&
        "plans" in value &&
        isPlanApiResponseArray(
            value.plans,
        )
    );
}

////////////////////////////////////////////////////////////
// GET PLANS
////////////////////////////////////////////////////////////

/**
 * Retrieves all billing plans belonging to a merchant.
 *
 * This is a backend-read operation.
 *
 * No wallet client, public client, Kernel,
 * or MerchantResolver is required.
 *
 * The SDK normalizes the backend representation
 * into canonical PlanRecord objects.
 */
export async function getPlans({
    client,
    merchantId,
}: GetPlansParams): Promise<PlanRecord[]> {

    ////////////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////////////

    if (!client.apiUrl) {
        throw new Error(
            "Merchant API URL is not configured.",
        );
    }

    ////////////////////////////////////////////////////////////
    // REQUEST
    ////////////////////////////////////////////////////////////

    const response = await fetch(
        `${client.apiUrl}/merchants/${merchantId}/plans`,
        {
            method: "GET",

            headers: {
                Accept: "application/json",
            },

            cache: "no-store",
        },
    );

    ////////////////////////////////////////////////////////////
    // RESPONSE BODY
    ////////////////////////////////////////////////////////////

    const body: unknown =
        await response.json();

    ////////////////////////////////////////////////////////////
    // ERROR
    ////////////////////////////////////////////////////////////

    if (!response.ok) {
        if (
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "string"
        ) {
            throw new Error(body.error);
        }

        throw new Error(
            "Unable to retrieve billing plans.",
        );
    }

    ////////////////////////////////////////////////////////////
    // NORMALIZE RESPONSE SHAPE
    ////////////////////////////////////////////////////////////

    let data: PlanApiResponse[];

    /*
     * Supported backend response:
     *
     * [
     *     { ... },
     *     { ... }
     * ]
     *
     * OR:
     *
     * {
     *     plans: [
     *         { ... },
     *         { ... }
     *     ]
     * }
     */

    if (isPlanApiResponseArray(body)) {
        data = body;
    } else if (isPlansApiResponse(body)) {
        data = body.plans;
    } else {
        throw new Error(
            "Invalid billing plans response from the backend.",
        );
    }

    ////////////////////////////////////////////////////////////
    // NORMALIZE
    ////////////////////////////////////////////////////////////

    return data.map(normalizePlan);
}