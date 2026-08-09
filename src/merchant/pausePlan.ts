// src/merchant/pausePlan.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanMirrorResponse, PlanRecord } from "../types/Plan";

import { getMerchantKernel } from "../kernels/getMerchantKernel";

import { encodeBillingProtocolCall } from "../contracts/encode";

import { executeUserOperation } from "../internal/executeUserOperation";

import { waitForReceipt } from "../internal/waitForReceipt";

import { mirror } from "../internal/mirror";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface PausePlanParams {
    /**
     * Merchant SDK client.
     *
     * Contains the connected wallet, public client,
     * Billing Protocol address and API URL.
     */
    client: MerchantClient;

    /**
     * Canonical plan to pause.
     */
    plan: PlanRecord;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface PausePlanResult {
    /**
     * Canonical plan returned by the backend.
     */
    plan: PlanRecord;

    /**
     * Kernel UserOperation hash.
     */
    userOperationHash: `0x${string}`;

    /**
     * Underlying transaction hash, when available.
     */
    transactionHash?: `0x${string}`;

    /**
     * UserOperation receipt.
     */
    receipt: any;
}

////////////////////////////////////////////////////////////
// PAUSE PLAN
////////////////////////////////////////////////////////////

/**
 * Pauses an existing billing plan.
 *
 * Workflow:
 *
 * 1. Resolve the connected merchant.
 * 2. Resolve the merchant Kernel.
 * 3. Encode pausePlan(planId).
 * 4. Execute the operation through the merchant Kernel.
 * 5. Wait for the UserOperation receipt.
 * 6. Mirror the paused status to the backend.
 * 7. Return the canonical PlanRecord.
 *
 * MerchantResolver is deliberately not used.
 */
export async function pausePlan({
    client,
    plan,
}: PausePlanParams): Promise<PausePlanResult> {

    ////////////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////////////

    if (!client.contractAddress) {
        throw new Error(
            "Billing Protocol contract address is not configured.",
        );
    }

    if (!client.apiUrl) {
        throw new Error(
            "Merchant API URL is not configured.",
        );
    }

    const contractAddress =
        client.contractAddress;

    ////////////////////////////////////////////////////////////
    // RESOLVE MERCHANT + KERNEL
    ////////////////////////////////////////////////////////////

    /*
     * The merchant already exists.
     *
     * getMerchantKernel() resolves the merchant from the
     * connected owner wallet and reconstructs its Kernel.
     *
     * No MerchantResolver is required.
     */
    const {
        merchant,
        kernel,
    } = await getMerchantKernel({
        walletClient:
            client.walletClient,

        publicClient:
            client.publicClient,
    });

    ////////////////////////////////////////////////////////////
    // SAFETY CHECK
    ////////////////////////////////////////////////////////////

    /*
     * Ensure that the Kernel reconstructed from the connected
     * wallet corresponds to the merchant stored by the backend.
     */
    if (
        kernel.address.toLowerCase() !==
        merchant.smartAccount.toLowerCase()
    ) {
        throw new Error(
            "Connected wallet does not own the merchant Kernel.",
        );
    }

    ////////////////////////////////////////////////////////////
    // VALIDATION
    ////////////////////////////////////////////////////////////

    if (
        !Number.isInteger(plan.planId) ||
        plan.planId <= 0
    ) {
        throw new Error(
            "Invalid plan ID.",
        );
    }

    ////////////////////////////////////////////////////////////
    // ENCODE pausePlan()
    ////////////////////////////////////////////////////////////

    const data =
        encodeBillingProtocolCall(
            "pausePlan",
            [
                BigInt(plan.planId),
            ],
        );

    ////////////////////////////////////////////////////////////
    // EXECUTE USER OPERATION
    ////////////////////////////////////////////////////////////

    const userOperationHash =
        await executeUserOperation({
            kernel,

            kernelClient:
                kernel.client,

            contractAddress,

            data,
        });

    ////////////////////////////////////////////////////////////
    // WAIT FOR RECEIPT
    ////////////////////////////////////////////////////////////

    const receipt =
        await waitForReceipt({
            kernelClient:
                kernel.client,

            userOperationHash,
        });

    ////////////////////////////////////////////////////////////
    // VERIFY RECEIPT
    ////////////////////////////////////////////////////////////

    if (
        receipt?.status &&
        receipt.status !== "success"
    ) {
        throw new Error(
            "Plan pause transaction failed.",
        );
    }

    ////////////////////////////////////////////////////////////
    // MIRROR BACKEND
    ////////////////////////////////////////////////////////////

    const mirrored =
        await mirror({
            apiUrl:
                client.apiUrl,

            endpoint:
                `/api/v1/plans/${plan.planId}/pause`,

            body: {
                planId:
                    plan.planId,

                merchantId:
                    merchant.merchantId,

                status:
                    "PAUSED",
            },
        }) as PlanMirrorResponse;

    ////////////////////////////////////////////////////////////
    // NORMALIZE PLAN
    ////////////////////////////////////////////////////////////

    const pausedPlan =
        normalizePlan(
            mirrored.plan ??
            mirrored ??
            {
                ...plan,
                status: "PAUSED",
            },
        );

    ////////////////////////////////////////////////////////////
    // TRANSACTION HASH
    ////////////////////////////////////////////////////////////

    const transactionHash =
        extractTransactionHash(
            receipt,
        );

    ////////////////////////////////////////////////////////////
    // RETURN
    ////////////////////////////////////////////////////////////

    return {
        plan:
            pausedPlan,

        userOperationHash,

        transactionHash,

        receipt,
    };
}

////////////////////////////////////////////////////////////
// NORMALIZATION
////////////////////////////////////////////////////////////

function normalizePlan(
    input: any,
): PlanRecord {

    return {
        planId:
            Number(
                input.planId ??
                input.plan_id,
            ),

        merchantId:
            Number(
                input.merchantId ??
                input.merchant_id,
            ),

        paymentToken:
            input.paymentToken ??
            input.payment_token,

        amount:
            BigInt(
                input.amount,
            ),

        billingIntervalSeconds:
            Number(
                input.billingIntervalSeconds ??
                input.billing_interval_seconds,
            ),

        billingPeriodNamed:
            input.billingPeriodNamed ??
            input.billing_period_named,

        trialPeriod:
            Number(
                input.trialPeriod ??
                input.trial_period ??
                0,
            ),

        trialPeriodNamed:
            input.trialPeriodNamed ??
            input.trial_period_named ??
            "NONE",

        name:
            input.name,

        status:
            input.status ??
            "PAUSED",

        maxSubscribers:
            Number(
                input.maxSubscribers ??
                input.max_subscribers ??
                0,
            ),

        allowRenewal:
            input.allowRenewal ??
            input.allow_renewal ??
            true,

        metadataURI:
            input.metadataURI ??
            input.metadata_uri ??
            "",

        createdAt:
            normalizeDate(
                input.createdAt ??
                input.created_at,
            ),

        updatedAt:
            normalizeDate(
                input.updatedAt ??
                input.updated_at,
            ),
    };
}

////////////////////////////////////////////////////////////
// DATE NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeDate(
    value: unknown,
): Date {

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === "string") {
        return new Date(value);
    }

    if (typeof value === "number") {
        return new Date(value);
    }

    return new Date();
}

////////////////////////////////////////////////////////////
// TRANSACTION HASH
////////////////////////////////////////////////////////////

function extractTransactionHash(
    receipt: any,
): `0x${string}` | undefined {

    /*
     * ZeroDev versions can expose the underlying
     * transaction receipt differently.
     *
     * Never fabricate a transaction hash.
     */
    const hash =
        receipt?.receipt?.transactionHash ??
        receipt?.transactionHash;

    return hash as
        | `0x${string}`
        | undefined;
}