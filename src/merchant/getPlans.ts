// src/merchant/getPlans.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanRecord, PlanStatus } from "../types/Plan";

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

    billing_period_named: string;

    trial_period_named: string;

    created_at: string;

    updated_at: string;
}

export interface GetPlansParams {

    client: MerchantClient;

    merchantId: number;

}

export async function getPlans({

    client,

    merchantId,

}: GetPlansParams): Promise<PlanRecord[]> {

    const response = await fetch(

        `${client.apiUrl ?? ""}/merchants/${merchantId}/plans`,

        {

            method: "GET",

            headers: {

                "Content-Type": "application/json",

            },

            cache: "no-store",

        },

    );

    if (!response.ok) {

        throw new Error("Unable to retrieve billing plans.");

    }

    const data = await response.json() as PlanApiResponse[];

    return data.map((plan) => ({

        planId: plan.plan_id,

        merchantId: plan.merchant_id,

        paymentToken: plan.payment_token,

        amount: BigInt(plan.amount),

        billingIntervalSeconds: BigInt(plan.billing_interval_seconds),

        trialPeriod: BigInt(plan.trial_period),

        maxSubscribers: plan.max_subscribers,

        allowRenewal: plan.allow_renewal,

        metadataURI: plan.metadata_uri,

        name: plan.name,

        status: plan.status as PlanStatus,

        billingPeriodNamed: plan.billing_period_named,

        trialPeriodNamed: plan.trial_period_named,

        createdAt: Number(plan.created_at),

        updatedAt: Number(plan.updated_at),

    }));

}