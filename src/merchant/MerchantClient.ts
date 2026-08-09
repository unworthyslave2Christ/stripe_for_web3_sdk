// src/merchant/MerchantClient.ts

import type {
    Address,
    PublicClient,
    WalletClient,
} from "viem";

import type { MerchantRecord } from "../types/Merchant";
import type { PlanRecord } from "../types/Plan";

import {
    createMerchant,
    type CreateMerchantParams,
    type CreateMerchantResult,
} from "./createMerchant";

import { createPlan, CreatePlanParams } from "./createPlan";
import { updatePlan } from "./updatePlan";
import { pausePlan } from "./pausePlan";
import { resumePlan } from "./resumePlan";
import { archivePlan } from "./archivePlan";
import { getPlan } from "./getPlan";
import { getPlans } from "./getPlans";

export interface MerchantApiResponseMinimal{
    merchant?: MerchantRecord;
    error?: string;
}

////////////////////////////////////////////////////////////
// CONFIGURATION
////////////////////////////////////////////////////////////

export interface MerchantClientConfig {
    /**
     * Wallet used to authorize merchant operations.
     */
    walletClient: WalletClient;

    /**
     * Public blockchain client.
     */
    publicClient: PublicClient;

    /**
     * Billing Protocol contract.
     */
    contractAddress: Address;

    /**
     * Backend API used for canonical persistence/mirroring.
     */
    apiUrl?: string;
}

////////////////////////////////////////////////////////////
// REGISTRATION INPUT
////////////////////////////////////////////////////////////

export interface RegisterMerchantInput {
    /**
     * Human-readable merchant/business name.
     */
    name: string;

    /**
     * Wallet receiving merchant payouts.
     */
    payoutWallet: Address;

    /**
     * Optional metadata URI.
     */
    metadataURI?: string;
}

////////////////////////////////////////////////////////////
// CLIENT
////////////////////////////////////////////////////////////

export class MerchantClient {
    readonly walletClient: WalletClient;

    readonly publicClient: PublicClient;

    readonly contractAddress: Address;

    readonly apiUrl?: string;

    constructor(config: MerchantClientConfig) {
        this.walletClient = config.walletClient;

        this.publicClient = config.publicClient;

        this.contractAddress = config.contractAddress;

        this.apiUrl = config.apiUrl;
    }

    ////////////////////////////////////////////////////////////
    // MERCHANT REGISTRATION
    ////////////////////////////////////////////////////////////

    async register(
        input: RegisterMerchantInput,
    ): Promise<CreateMerchantResult> {
        return createMerchant({
            client: this,

            name: input.name,

            payoutWallet: input.payoutWallet,

            metadataURI:
                input.metadataURI ?? "",
        });
    }

    ////////////////////////////////////////////////////////////
    // MERCHANT
    ////////////////////////////////////////////////////////////

    async getById(
        merchantId: number,
    ): Promise<MerchantRecord> {
        if (!this.apiUrl) {
            throw new Error(
                "Merchant API URL is not configured.",
            );
        }

        const response = await fetch(
            `${this.apiUrl}/api/v1/merchants/${merchantId}`,
        );

        const body =
            await response.json() as MerchantApiResponseMinimal;

        if (!response.ok) {
            throw new Error(
                body.error ??
                `Unable to retrieve merchant ${merchantId}.`,
            );
        }

        if (!body.merchant) {
            throw new Error(
                `Merchant ${merchantId} was not returned by the API.`,
            );
        }

        return body.merchant;
    }

    ////////////////////////////////////////////////////////////
    // PLANS
    ////////////////////////////////////////////////////////////

    createPlan(
        params: Omit<CreatePlanParams, "client">,
    ) {
        return createPlan({
            client: this,

            ...params,
        });
    }

    updatePlan(
        originalPlan: PlanRecord,
        updatedPlan: PlanRecord,
    ) {
        return updatePlan({
            client: this,
            originalPlan,
            updatedPlan,
        });
    }

    pausePlan(plan: PlanRecord) {
        return pausePlan({
            client: this,

            plan,
        });
    }

    resumePlan(plan: PlanRecord) {
        return resumePlan({
            client: this,

            plan,
        });
    }

    archivePlan(plan: PlanRecord) {
        return archivePlan({
            client: this,

            plan,
        });
    }

    getPlan(planId: number) {
        return getPlan({
            client: this,

            planId,
        });
    }

    getPlans(merchantId: number) {
        return getPlans({
            client: this,

            merchantId,
        });
    }
}