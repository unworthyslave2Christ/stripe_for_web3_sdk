// src/types/Merchant.ts

import type { Address } from "viem";

////////////////////////////////////////////////////////////
// MERCHANT STATUS
////////////////////////////////////////////////////////////

export type MerchantStatus =
    | "ACTIVE"
    | "SUSPENDED";

////////////////////////////////////////////////////////////
// CANONICAL MERCHANT RECORD
////////////////////////////////////////////////////////////

export interface MerchantRecord {

    /**
     * Canonical merchant identifier assigned
     * by the Web3BillingProtocol contract.
     */
    merchantId: number;

    /**
     * Merchant Kernel / smart account.
     */
    smartAccount: Address;

    /**
     * Wallet that owns the merchant.
     */
    ownerWallet: Address;

    /**
     * Wallet receiving merchant payouts.
     */
    payoutWallet: Address;

    /**
     * Merchant/business name.
     *
     * Mirrors merchants.name.
     */
    name: string;

    /**
     * URI containing optional merchant metadata.
     */
    metadataURI: string;

    /**
     * Billing operator authorized for this merchant.
     */
    billingOperator: Address;

    /**
     * Canonical persisted merchant status.
     */
    status: MerchantStatus;

    /**
     * Backend persistence timestamp.
     *
     * Normalized by the SDK from Supabase's
     * timestamp representation.
     */
    createdAt: Date;

    /**
     * Last backend modification timestamp.
     */
    updatedAt: Date;
}

export interface MerchantApiResponse {
    merchant?: unknown;
    merchant_id?: number;
    merchantId?: number;

    owner_wallet?: Address;
    ownerWallet?: Address;

    payout_wallet?: Address;
    payoutWallet?: Address;

    smart_account?: Address;
    smartAccount?: Address;

    name?: string;
    business_name?: string;
    businessName?: string;

    metadata_uri?: string;
    metadataURI?: string;

    billing_operator?: Address;
    billingOperator?: Address;

    status?: string;

    created_at?: string | number | Date;
    createdAt?: string | number | Date;

    error?: string;
}