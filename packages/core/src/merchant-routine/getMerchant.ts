// src/merchant/getMerchant.ts

import type { Address } from "viem";

import type { MerchantRecord } from "../types/Merchant";

////////////////////////////////////////////////////////////
// BACKEND RESPONSE
////////////////////////////////////////////////////////////

interface MerchantResponse {
  merchant?: unknown;

  error?: string;

  message?: string;
}

////////////////////////////////////////////////////////////
// NORMALIZATION HELPERS
////////////////////////////////////////////////////////////

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid merchant record: ${field} is missing.`);
  }

  return value;
}

function requireAddress(value: unknown, field: string): Address {
  const address = requireString(value, field);

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(
      `Invalid merchant record: ${field} is not a valid address.`,
    );
  }

  return address as Address;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid merchant record: ${field} is missing.`);
  }

  return value;
}

////////////////////////////////////////////////////////////
// NORMALIZE MERCHANT
////////////////////////////////////////////////////////////

/**
 * Converts the backend merchant representation into the
 * canonical SDK MerchantRecord.
 *
 * The backend may return either:
 *
 *     camelCase
 *
 * or the Supabase/database representation:
 *
 *     snake_case
 *
 * The SDK exposes camelCase only.
 */
export function normalizeMerchant(value: unknown): MerchantRecord {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid merchant response from backend.");
  }

  const raw = value as Record<string, unknown>;

  ////////////////////////////////////////////////////////////
  // MERCHANT ID
  ////////////////////////////////////////////////////////////

  const merchantId = requireNumber(
    raw.merchantId ?? raw.merchant_id,
    "merchantId",
  );

  ////////////////////////////////////////////////////////////
  // NAME (OR BUSINESS NAME)
  ////////////////////////////////////////////////////////////

  const name = requireString(raw.name, "name");

  ////////////////////////////////////////////////////////////
  // OWNER
  ////////////////////////////////////////////////////////////

  const owner = requireAddress(
    raw.owner ?? raw.ownerWallet ?? raw.owner_wallet,
    "owner",
  );

  ////////////////////////////////////////////////////////////
  // SMART ACCOUNT
  ////////////////////////////////////////////////////////////

  const smartAccount = requireAddress(
    raw.smartAccount ?? raw.smart_account,
    "smartAccount",
  );

  ////////////////////////////////////////////////////////////
  // PAYOUT WALLET
  ////////////////////////////////////////////////////////////

  const payoutWallet = requireAddress(
    raw.payoutWallet ?? raw.payout_wallet,
    "payoutWallet",
  );

  ////////////////////////////////////////////////////////////
  // BILLING OPERATOR
  ////////////////////////////////////////////////////////////

  const billingOperator = requireAddress(
    raw.billingOperator ?? raw.billing_operator,
    "billingOperator",
  );

  
  ////////////////////////////////////////////////////////////
  // METADATA URI
  ////////////////////////////////////////////////////////////

  const metadataURI =
    typeof (raw.metadataURI ?? raw.metadata_uri) === "string"
      ? String(raw.metadataURI ?? raw.metadata_uri)
      : "";

  ////////////////////////////////////////////////////////////
  // STATUS
  ////////////////////////////////////////////////////////////

  const status = raw.status;

  if (status !== "ACTIVE" && status !== "SUSPENDED") {
    throw new Error("Invalid merchant record: status is invalid.");
  }

  ////////////////////////////////////////////////////////////
  // CREATED AT
  ////////////////////////////////////////////////////////////

  let createdAt: Date;

  const rawCreatedAt = raw.createdAt ?? raw.created_at;

  if (typeof rawCreatedAt === "number") {
    createdAt = new Date(rawCreatedAt);
  } else if (typeof rawCreatedAt === "string") {
    const timestamp = Date.parse(rawCreatedAt);

    if (Number.isNaN(timestamp)) {
      throw new Error("Invalid merchant record: createdAt is invalid.");
    }

    createdAt = new Date(timestamp);
  } else {
    throw new Error("Invalid merchant record: createdAt is missing.");
  }



  let updatedAt: Date;

  const rawupdatedAt = raw.updatedAt ?? raw.created_at;

  if (typeof rawupdatedAt === "number") {
    updatedAt = new Date(rawupdatedAt);
  } else if (typeof rawupdatedAt === "string") {
    const timestamp = Date.parse(rawupdatedAt);

    if (Number.isNaN(timestamp)) {
      throw new Error("Invalid merchant record: updatedAt is invalid.");
    }

    updatedAt = new Date(timestamp);
  } else {
    throw new Error("Invalid merchant record: updatedAt is missing.");
  }

  ////////////////////////////////////////////////////////////
  // CANONICAL SDK RECORD
  ////////////////////////////////////////////////////////////

  
    return {
  
      merchantId: merchantId,

      smartAccount: smartAccount,
  
      ownerWallet: owner,
  
      payoutWallet: payoutWallet,
  
      name: name,

      metadataURI: metadataURI,
  
      billingOperator: billingOperator,

      status: status,
  
      createdAt: createdAt,
  
      updatedAt: updatedAt
  }
  

}

////////////////////////////////////////////////////////////
// EXTRACT MERCHANT
////////////////////////////////////////////////////////////

function extractMerchant(value: unknown): MerchantRecord {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid merchant response from backend.");
  }

  const body = value as MerchantResponse;

  /*
   * Backend canonical response:
   *
   * {
   *     merchant: {...}
   * }
   *
   * Also accept the merchant object directly.
   */
  return normalizeMerchant(body.merchant ?? value);
}

////////////////////////////////////////////////////////////
// ERROR EXTRACTION
////////////////////////////////////////////////////////////

async function extractError(
  response: Response,
  fallback: string,
): Promise<Error> {
  try {
    const body = (await response.json()) as MerchantResponse;

    return new Error(body.error ?? body.message ?? fallback);
  } catch {
    return new Error(fallback);
  }
}

////////////////////////////////////////////////////////////
// GET MERCHANT BY OWNER WALLET
////////////////////////////////////////////////////////////

export async function getMerchantByOwnerWallet(
  ownerWallet: Address,
  apiUrl: string,
): Promise<MerchantRecord | null> {
    

  const response = await fetch(
    `${apiUrl}/api/v1/merchants/owner/${ownerWallet}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      cache: "no-store",
    },
  );

  ////////////////////////////////////////////////////////////
  // NOT FOUND
  ////////////////////////////////////////////////////////////

  if (response.status === 404) {
    return null;
  }

  ////////////////////////////////////////////////////////////
  // BACKEND ERROR
  ////////////////////////////////////////////////////////////

  if (!response.ok) {
    throw await extractError(
      response,
      "Unable to retrieve merchant by owner wallet.",
    );
  }

  ////////////////////////////////////////////////////////////
  // RESPONSE
  ////////////////////////////////////////////////////////////

  const body = await response.json();

  return extractMerchant(body);
}

////////////////////////////////////////////////////////////
// GET MERCHANT BY ID
////////////////////////////////////////////////////////////

export async function getMerchantById(
  merchantId: number,
  apiUrl: string,
): Promise<MerchantRecord> {
  const baseUrl = apiUrl.replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}/api/v1/merchants/${merchantId}`, {
    method: "GET",

    headers: {
      Accept: "application/json",
    },

    cache: "no-store",
  });

  ////////////////////////////////////////////////////////////
  // BACKEND ERROR
  ////////////////////////////////////////////////////////////

  if (!response.ok) {
    throw await extractError(
      response,
      `Unable to retrieve merchant ${merchantId}.`,
    );
  }

  ////////////////////////////////////////////////////////////
  // RESPONSE
  ////////////////////////////////////////////////////////////

  const body = await response.json();

  return extractMerchant(body);
}
