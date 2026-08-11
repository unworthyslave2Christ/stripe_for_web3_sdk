// src/customer/createCustomer.ts

import type { Address } from "viem";

import type { CustomerApiResponse, CustomerRecord } from "../types/Customer";

import type { CustomerClient } from "./CustomerClient";

import {
    createCustomerKernel,
} from "../kernels/getCustomerKernel";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface CreateCustomerParams {

    /**
     * Merchant SDK customer client.
     */
    client: CustomerClient;

    /**
     * Customer display name.
     */
    displayName: string;

    /**
     * Customer email.
     */
    email: string;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface CreateCustomerResult {

    customer: CustomerRecord;

    customerId: number;

    smartAccount: Address;

    alreadyRegistered: boolean;

    sessionPrivateKey: `0x${string}`;

    serializedPermissionAccount: string;
}

////////////////////////////////////////////////////////////
// CREATE CUSTOMER
////////////////////////////////////////////////////////////

export async function createCustomer({
    client,
    displayName,
    email,
}: CreateCustomerParams): Promise<CreateCustomerResult> {

    ////////////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////////////

    if (!client.apiUrl) {

        throw new Error(
            "Customer API URL is not configured.",
        );
    }

    ////////////////////////////////////////////////////////////
    // CONNECTED WALLET
    ////////////////////////////////////////////////////////////

    const ownerWallet =
        client.walletClient
            .account?.address as Address;

    if (!ownerWallet) {

        throw new Error(
            "Unable to determine customer owner wallet.",
        );
    }

    console.log(
        "Customer owner wallet:",
        ownerWallet,
    );

    ////////////////////////////////////////////////////////////
    // CHECK EXISTING CUSTOMER
    ////////////////////////////////////////////////////////////

    try {

        const existingCustomer =
            await getCustomerByWallet(
                client.apiUrl,
                ownerWallet,
            );

        if (existingCustomer) {

            return {

                customer:
                    existingCustomer,

                customerId:
                    existingCustomer.customerId,

                smartAccount:
                    existingCustomer.smartAccount,

                alreadyRegistered:
                    true,

                /*
                 * Existing customers will eventually
                 * recover their encrypted session
                 * credentials rather than creating
                 * another Kernel.
                 *
                 * For the initial node implementation
                 * registration is the creation path.
                 */
                sessionPrivateKey:
                    "0x" as `0x${string}`,

                serializedPermissionAccount:
                    "",
            };
        }

    } catch (error) {

        /*
         * 404 means that the customer does not exist.
         *
         * Other API failures should not silently become
         * "customer not found".
         */

        if (
            error instanceof Error &&
            !error.message.includes(
                "CUSTOMER_NOT_FOUND",
            )
        ) {

            throw error;
        }
    }

    ////////////////////////////////////////////////////////////
    // CREATE CUSTOMER KERNEL
    ////////////////////////////////////////////////////////////

    const {

        smartAccount,

        sessionPrivateKey,

        serializedPermissionAccount,

    } =
        await createCustomerKernel({

            ownerWalletClient:
                client.walletClient,

            publicClient:
                client.publicClient,
        });

    ////////////////////////////////////////////////////////////
    // MIRROR CUSTOMER
    ////////////////////////////////////////////////////////////

    const response = await fetch(
        `${client.apiUrl}/api/v1/customers`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",

                Accept:
                    "application/json",
            },

            body: JSON.stringify({

                wallet:
                    ownerWallet,

                smartAccount,

                displayName,

                email,

                sessionPrivateKey,

                serializedPermissionAccount,

            }),
        },
    );

    
    const body =
        await response.json() as CustomerApiResponse;

    ////////////////////////////////////////////////////////////
    // API ERROR
    ////////////////////////////////////////////////////////////

    if (!response.ok) {

        throw new Error(
            body?.error ??
            "Unable to register customer.",
        );
    }

    ////////////////////////////////////////////////////////////
    // NORMALIZE
    ////////////////////////////////////////////////////////////

    const customer =
        normalizeCustomer(
            body.customer ??
            body,
        );

    ////////////////////////////////////////////////////////////
    // RESULT
    ////////////////////////////////////////////////////////////

    return {

        customer,

        customerId:
            customer.customerId,

        smartAccount:
            customer.smartAccount,

        alreadyRegistered:
            false,

        sessionPrivateKey,

        serializedPermissionAccount,
    };
}

////////////////////////////////////////////////////////////
// GET CUSTOMER BY WALLET
////////////////////////////////////////////////////////////

async function getCustomerByWallet(
    apiUrl: string,
    ownerWallet: Address,
): Promise<CustomerRecord> {

    // const baseUrl =
    //     apiUrl.replace(/\/+$/, "");

    const response =
        await fetch(
            `${apiUrl}/api/v1/customers/owner/${ownerWallet}`,
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

    if (response.status === 404) {

        throw new Error(
            "CUSTOMER_NOT_FOUND",
        );
    }

    const body =
        await response.json() as CustomerApiResponse;

    if (!response.ok) {

        throw new Error(
            body?.error ??
            "Unable to retrieve customer.",
        );
    }

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
            Number(
                input.customerId ??
                input.customer_id,
            ),

        ownerWallet:
            input.ownerWallet ??
            input.owner_wallet,

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

function normalizeDate(
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