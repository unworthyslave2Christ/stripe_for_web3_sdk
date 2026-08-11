// src/customer/getMerchantById.ts

import type { Address } from "viem";

import type { CustomerClient } from "./CustomerClient";

import type {
  MerchantRecord,
  MerchantStatus,
} from "../types/Merchant";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface GetMerchantByIdParams {
  /**
   * Customer SDK client.
   *
   * The customer only requires the backend API
   * for this read operation.
   */
  client: CustomerClient;

  /**
   * Merchant identifier associated with
   * the customer's billing plan.
   */
  merchantId: number;
}

////////////////////////////////////////////////////////////
// API RESPONSE
////////////////////////////////////////////////////////////

export interface GetMerchantByIdApiResponse {
  merchant_id: number;

  smart_account: Address;

  owner_wallet: Address;

  payout_wallet: Address;

  name: string;

  metadata_uri: string;

  billing_operator: Address;

  status: string;

  created_at: string | number | Date;

  updated_at: string | number | Date;
}

////////////////////////////////////////////////////////////
// GET MERCHANT BY ID
////////////////////////////////////////////////////////////

/**
 * Retrieves a merchant by ID.
 *
 * This operation belongs to the customer-facing SDK
 * because customers need to resolve the merchant associated
 * with a billing plan before performing subscription
 * operations.
 *
 * It is deliberately read-only.
 *
 * It does NOT:
 *
 *  - use walletClient
 *  - use publicClient
 *  - resolve a merchant Kernel
 *  - authenticate as the merchant
 *  - perform merchant operations
 *
 * The backend remains the canonical persistence layer
 * for MerchantRecord.
 */
export async function getMerchantById({
  client,
  merchantId,
}: GetMerchantByIdParams): Promise<MerchantRecord> {
  ////////////////////////////////////////////////////////////
  // CONFIGURATION
  ////////////////////////////////////////////////////////////

  if (!client.apiUrl) {
    throw new Error(
      "Customer API URL is not configured.",
    );
  }

  ////////////////////////////////////////////////////////////
  // VALIDATION
  ////////////////////////////////////////////////////////////

  if (
    !Number.isInteger(merchantId) ||
    merchantId <= 0
  ) {
    throw new Error(
      "Invalid merchant ID.",
    );
  }

  ////////////////////////////////////////////////////////////
  // REQUEST
  ////////////////////////////////////////////////////////////

  const response = await fetch(
    `${client.apiUrl}/api/v1/merchants/${merchantId}`,
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
  // PARSE RESPONSE
  ////////////////////////////////////////////////////////////

  const body =
    (await response.json()) as
      | {
          merchant?: GetMerchantByIdApiResponse;

          error?: string;
        }
      | GetMerchantByIdApiResponse;

  ////////////////////////////////////////////////////////////
  // RESPONSE VALIDATION
  ////////////////////////////////////////////////////////////

  if (!response.ok) {
    const error =
      "error" in body
        ? body.error
        : undefined;

    if (
      response.status === 404
    ) {
      throw new Error(
        `Merchant ${merchantId} was not found.`,
      );
    }

    throw new Error(
      error ??
        `Unable to retrieve merchant ${merchantId}.`,
    );
  }

  ////////////////////////////////////////////////////////////
  // EXTRACT MERCHANT
  ////////////////////////////////////////////////////////////

  const data =
    "merchant" in body &&
    body.merchant
      ? body.merchant
      : body;

  ////////////////////////////////////////////////////////////
  // NORMALIZE
  ////////////////////////////////////////////////////////////

  return normalizeMerchant(
    data as GetMerchantByIdApiResponse,
  );
}

////////////////////////////////////////////////////////////
// NORMALIZATION
////////////////////////////////////////////////////////////

/**
 * Converts the backend/Supabase representation into
 * the canonical SDK MerchantRecord representation.
 *
 * Backend:
 *
 *     merchant_id
 *     smart_account
 *     owner_wallet
 *     payout_wallet
 *     metadata_uri
 *     billing_operator
 *     created_at
 *     updated_at
 *
 * SDK:
 *
 *     merchantId
 *     smartAccount
 *     ownerWallet
 *     payoutWallet
 *     metadataURI
 *     billingOperator
 *     createdAt
 *     updatedAt
 */
function normalizeMerchant(
  input: GetMerchantByIdApiResponse,
): MerchantRecord {
  return {
    merchantId:
      Number(
        input.merchant_id,
      ),

    smartAccount:
      input.smart_account,

    ownerWallet:
      input.owner_wallet,

    payoutWallet:
      input.payout_wallet,

    name:
      input.name,

    metadataURI:
      input.metadata_uri ?? "",

    billingOperator:
      input.billing_operator,

    status:
      input.status as MerchantStatus,

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
// DATE NORMALIZATION
////////////////////////////////////////////////////////////

function normalizeDate(
  value: unknown,
): Date {
  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        `Invalid merchant timestamp: ${value}`,
      );
    }

    return date;
  }

  throw new Error(
    "Merchant timestamp is missing or invalid.",
  );
}