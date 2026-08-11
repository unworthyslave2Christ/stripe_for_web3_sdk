// src/types/Customer.ts

import type { Address } from "viem";

////////////////////////////////////////////////////////////
// CUSTOMER STATUS
////////////////////////////////////////////////////////////

export type CustomerStatus =
    | "ACTIVE"
    | "SUSPENDED";

////////////////////////////////////////////////////////////
// CANONICAL CUSTOMER RECORD
////////////////////////////////////////////////////////////

export interface CustomerRecord {

    /**
     * Canonical customer identifier assigned
     * by the backend.
     */
    customerId: string;

    /**
     * Wallet that owns the customer account.
     */
    ownerWallet: Address;

    /**
     * Customer Kernel / smart account.
     *
     * This is the reusable smart account through
     * which the customer interacts with merchant
     * services.
     */
    smartAccount: Address;

    /**
     * Customer's human-readable display name.
     */
    displayName: string;

    /**
     * Customer email address.
     */
    email: string;

    /**
     * Canonical persisted customer status.
     */
    status: CustomerStatus;

    /**
     * Backend persistence timestamp.
     *
     * Normalized by the SDK from the backend's
     * timestamp representation.
     */
    createdAt: Date;

    /**
     * Last backend modification timestamp.
     */
    updatedAt: Date;
}

////////////////////////////////////////////////////////////
// CUSTOMER API RESPONSE
////////////////////////////////////////////////////////////

/**
 * Backend representation of a customer.
 *
 * The API may return either snake_case database
 * fields or camelCase fields depending on the
 * endpoint.
 *
 * Customer normalization converts this response
 * into the canonical CustomerRecord.
 */
export interface CustomerApiResponse {

    /**
     * Canonical customer object when the API wraps
     * the response in { customer: ... }.
     */
    customer?: unknown;

    ////////////////////////////////////////////////////////////
    // IDENTIFIER
    ////////////////////////////////////////////////////////////

    customer_id?: string;

    customerId?: string;

    ////////////////////////////////////////////////////////////
    // OWNER WALLET
    ////////////////////////////////////////////////////////////

    owner_wallet?: Address;

    ownerWallet?: Address;

    ////////////////////////////////////////////////////////////
    // SMART ACCOUNT
    ////////////////////////////////////////////////////////////

    smart_account?: Address;

    smartAccount?: Address;

    ////////////////////////////////////////////////////////////
    // DISPLAY NAME
    ////////////////////////////////////////////////////////////

    display_name?: string;

    displayName?: string;

    ////////////////////////////////////////////////////////////
    // EMAIL
    ////////////////////////////////////////////////////////////

    email?: string;

    ////////////////////////////////////////////////////////////
    // STATUS
    ////////////////////////////////////////////////////////////

    status?: string;

    ////////////////////////////////////////////////////////////
    // CREATED TIMESTAMP
    ////////////////////////////////////////////////////////////

    created_at?: string | number | Date;

    createdAt?: string | number | Date;

    ////////////////////////////////////////////////////////////
    // UPDATED TIMESTAMP
    ////////////////////////////////////////////////////////////

    updated_at?: string | number | Date;

    updatedAt?: string | number | Date;

    ////////////////////////////////////////////////////////////
    // ERROR
    ////////////////////////////////////////////////////////////

    error?: string;
}