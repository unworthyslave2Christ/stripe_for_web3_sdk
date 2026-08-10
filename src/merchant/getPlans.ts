// src/merchant/getPlans.ts

import type { MerchantClient } from "./MerchantClient";

import type {
    PlanRecord,
    PlanStatus,
    BillingPeriodNamed,
    TrialPeriodNamed,
} from "../types/Plan";

import { GetPlanApiResponse } from "./getPlan";

////////////////////////////////////////////////////////////
// API RESPONSE
////////////////////////////////////////////////////////////





interface PlansApiResponse {
    plans: GetPlanApiResponse[];
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
    input: GetPlanApiResponse,
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

function isGetPlanApiResponse(
    value: unknown,
): value is GetPlanApiResponse {
    return (
        typeof value === "object" &&
        value !== null &&
        "plan_id" in value &&
        "merchant_id" in value &&
        "payment_token" in value &&
        "amount" in value
    );
}

function isGetPlanApiResponseArray(
    value: unknown,
): value is GetPlanApiResponse[] {
    return (
        Array.isArray(value) &&
        value.every(isGetPlanApiResponse)
    );
}

function isPlansApiResponse(
    value: unknown,
): value is PlansApiResponse {
    return (
        typeof value === "object" &&
        value !== null &&
        "plans" in value &&
        isGetPlanApiResponseArray(
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
        `${client.apiUrl}/plans?merchantId=${merchantId}`,
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

    let data: GetPlanApiResponse[];

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

    if (isGetPlanApiResponseArray(body)) {
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

    return data.map(normalizePlan) as PlanRecord[];
}