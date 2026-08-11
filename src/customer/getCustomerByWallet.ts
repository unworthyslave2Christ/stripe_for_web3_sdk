// src/customer/getCustomerByWallet.ts

import type { Address } from "viem";

import type { CustomerRecord } from "../types/Customer";

import type { CustomerClient } from "./CustomerClient";

////////////////////////////////////////////////////////////
// API RESPONSE
////////////////////////////////////////////////////////////

import { CustomerApiResponse } from "../types/Customer";

////////////////////////////////////////////////////////////
// PARAMETERS
////////////////////////////////////////////////////////////

export interface GetCustomerByWalletParams {
    client: CustomerClient;

    ownerWallet: Address;
}

////////////////////////////////////////////////////////////
// GET CUSTOMER BY WALLET
////////////////////////////////////////////////////////////

export async function getCustomerByWallet({
    client,
    ownerWallet,
}: GetCustomerByWalletParams): Promise<CustomerRecord> {

    ////////////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////////////

    if (!client.apiUrl) {
        throw new Error(
            "Customer API URL is not configured.",
        );
    }

    ////////////////////////////////////////////////////////////
    // REQUEST
    ////////////////////////////////////////////////////////////

    const response =
        await fetch(
            `${client.apiUrl}/api/v1/customers/owner/${ownerWallet}`,
            {
                method: "GET",

                headers: {
                    Accept:
                        "application/json",
                },

                cache:
                    "no-store",
            },
        );

    ////////////////////////////////////////////////////////////
    // NOT FOUND
    ////////////////////////////////////////////////////////////

    if (response.status === 404) {
        throw new Error(
            "CUSTOMER_NOT_FOUND",
        );
    }

    ////////////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////////////

    const body =
        await response.json() as CustomerApiResponse;

    ////////////////////////////////////////////////////////////
    // API ERROR
    ////////////////////////////////////////////////////////////

    if (!response.ok) {
        throw new Error(
            body.error ??
            "Unable to retrieve customer.",
        );
    }

    ////////////////////////////////////////////////////////////
    // NORMALIZE
    ////////////////////////////////////////////////////////////

    return normalizeCustomer(
        body.customer ??
        body,
    );
}

////////////////////////////////////////////////////////////
// NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeCustomer(
    input: any,
): CustomerRecord {

    return {

        customerId:
                input.customerId ??
                input.customer_id,
            

        ownerWallet:
            input.ownerWallet ??
            input.owner_wallet ??
            input.wallet_address,

        smartAccount:
            input.smartAccount ??
            input.smart_account,

        displayName:
            input.displayName ??
            input.display_name,

        email:
            input.email,

        status:
            input.status ??
            "ACTIVE",

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
// DATE
////////////////////////////////////////////////////////////

export function normalizeDate(
    value: unknown,
): Date {

    if (value instanceof Date) {
        return value;
    }

    const date =
        new Date(
            value as string | number,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        throw new Error(
            "Invalid customer timestamp.",
        );
    }

    return date;
}