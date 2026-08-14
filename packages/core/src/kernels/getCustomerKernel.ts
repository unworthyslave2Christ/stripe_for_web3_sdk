// src/kernels/createCustomerKernel.ts

import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";

import { getEntryPoint, KERNEL_V3_3 } from "@zerodev/sdk/constants";

import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";

import { walletClientToSmartAccountSigner } from "permissionless";

import { http, type Address, type PublicClient, type WalletClient } from "viem";

import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

import { toECDSASigner } from "@zerodev/permissions/signers";

import {
  deserializePermissionAccount,
  serializePermissionAccount,
  toInitConfig,
  toPermissionValidator,
} from "@zerodev/permissions";

import { toSudoPolicy } from "@zerodev/permissions/policies";

import { arbitrumSepolia } from "viem/chains";

import type { CustomerRecord } from "../types/Customer";

////////////////////////////////////////////////////////////
// CONFIGURATION
////////////////////////////////////////////////////////////

const chain = arbitrumSepolia;

const entryPoint = getEntryPoint("0.7");

const kernelVersion = KERNEL_V3_3;

////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////

export interface CreateCustomerKernelParams {
  /**
   * Wallet used to establish ownership of the
   * customer Kernel.
   */
  ownerWalletClient: WalletClient;

  /**
   * Public blockchain client.
   */
  publicClient: PublicClient;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface CustomerKernelRegistration {
  /**
   * Customer Kernel / smart account.
   */
  smartAccount: Address;

  /**
   * Random session private key generated for
   * permission-based Kernel access.
   */
  sessionPrivateKey: `0x${string}`;

  /**
   * Serialized ZeroDev permission account.
   */
  serializedPermissionAccount: string;
}

////////////////////////////////////////////////////////////
// CREATE CUSTOMER KERNEL
////////////////////////////////////////////////////////////

/**
 * Creates a new customer Kernel.
 *
 * Workflow:
 *
 * 1. Convert the connected owner wallet into a
 *    SmartAccountSigner.
 *
 * 2. Create the owner's ECDSA validator.
 *
 * 3. Generate a random session private key.
 *
 * 4. Create the session signer.
 *
 * 5. Create the permission validator.
 *
 * 6. Create the Kernel using the owner validator
 *    as the sudo validator.
 *
 * 7. Attach the permission validator through
 *    the Kernel initialization configuration.
 *
 * 8. Serialize the permission account so it can
 *    later be recovered.
 *
 * The owner wallet remains the ultimate owner of
 * the customer Kernel.
 */
export async function createCustomerKernel({
  ownerWalletClient,
  publicClient,
}: CreateCustomerKernelParams): Promise<CustomerKernelRegistration> {
  ////////////////////////////////////////////////////////////
  // OWNER SIGNER
  ////////////////////////////////////////////////////////////

  const ownerSigner = walletClientToSmartAccountSigner(
    ownerWalletClient as any,
  );

  ////////////////////////////////////////////////////////////
  // OWNER VALIDATOR
  ////////////////////////////////////////////////////////////

  const ownerValidator = await signerToEcdsaValidator(publicClient, {
    signer: ownerSigner as any,

    entryPoint,

    kernelVersion,
  });

  ////////////////////////////////////////////////////////////
  // SESSION KEY
  ////////////////////////////////////////////////////////////

  /*
   * Generate ONE random session private key.
   *
   * This key is not the customer's owner wallet.
   *
   * It is used by the permission account for
   * subsequent Kernel operations.
   */
  const sessionPrivateKey = generatePrivateKey();

  const sessionAccount = privateKeyToAccount(sessionPrivateKey);

  ////////////////////////////////////////////////////////////
  // SESSION SIGNER
  ////////////////////////////////////////////////////////////

  const sessionSigner = await toECDSASigner({
    signer: sessionAccount,
  });

  ////////////////////////////////////////////////////////////
  // PERMISSION VALIDATOR
  ////////////////////////////////////////////////////////////

  const permissionValidator = await toPermissionValidator(publicClient, {
    signer: sessionSigner,

    entryPoint,

    kernelVersion,

    policies: [toSudoPolicy({})],
  });

  ////////////////////////////////////////////////////////////
  // CREATE KERNEL
  ////////////////////////////////////////////////////////////

  const kernel = await createKernelAccount(publicClient, {
    entryPoint,

    kernelVersion,

    plugins: {
      sudo: ownerValidator,
    },

    initConfig: await toInitConfig(permissionValidator),
  });

  ////////////////////////////////////////////////////////////
  // SERIALIZE PERMISSION ACCOUNT
  ////////////////////////////////////////////////////////////

  const serializedPermissionAccount = await serializePermissionAccount(
    kernel,

    undefined,

    undefined,

    undefined,

    permissionValidator,
  );

  ////////////////////////////////////////////////////////////
  // RESULT
  ////////////////////////////////////////////////////////////

  return {
    smartAccount: kernel.address,

    sessionPrivateKey,

    serializedPermissionAccount,
  };
}

////////////////////////////////////////////////////////////
// GET CUSTOMER KERNEL
////////////////////////////////////////////////////////////

export interface GetCustomerKernelParams {
  /**
   * Connected customer owner wallet.
   */
  walletClient: WalletClient;

  /**
   * Public blockchain client.
   */
  publicClient: PublicClient;

  /**
   * Backend API URL.
   */
  apiUrl: string;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export interface CustomerKernelResult {
  /**
   * Canonical customer record.
   */
  customer: CustomerRecord;

  /**
   * Reconstructed Kernel account.
   */
  kernelAccount: any;

  /**
   * Kernel Account Client used to submit
   * customer UserOperations.
   */
  kernelClient: any;

  /**
   * Permission identifier returned by the backend.
   */
  permissionId?: `0x${string}`;

  /**
   * Permission metadata returned by the backend.
   */
  permission?: unknown;
}

////////////////////////////////////////////////////////////
// GET CUSTOMER KERNEL
////////////////////////////////////////////////////////////

/**
 * Recovers an existing customer Kernel.
 *
 * Workflow:
 *
 * 1. Resolve the connected wallet.
 *
 * 2. Ask the backend for the customer's canonical
 *    Kernel/permission information.
 *
 * 3. Recover the session signer from the returned
 *    session private key.
 *
 * 4. Deserialize the permission account.
 *
 * 5. Verify that the reconstructed Kernel address
 *    matches CustomerRecord.smartAccount.
 *
 * 6. Construct the Kernel Account Client.
 *
 * The backend is responsible for returning the
 * customer's persisted Kernel information.
 */

////////////////////////////////////////////////////////////
// GET CUSTOMER KERNEL
////////////////////////////////////////////////////////////

export interface GetCustomerKernelResponse {
  customer: {
    customer_id: number;

    owner_wallet: `0x${string}`;

    smart_account: `0x${string}`;

    display_name: string;

    email: string;

    status: string;

    created_at: string;

    updated_at: string;
  };

  kernelAddress: `0x${string}`;

  serializedPermissionAccount: string;

  sessionPrivateKey: `0x${string}`;

  permissionId?: `0x${string}`;

  permission?: unknown;
}

export async function getCustomerKernel({
  walletClient,
  publicClient,
  apiUrl,
}: GetCustomerKernelParams): Promise<CustomerKernelResult> {
  ////////////////////////////////////////////////////////////
  // CONFIGURATION
  ////////////////////////////////////////////////////////////

  if (!apiUrl) {
    throw new Error("Customer API URL is not configured.");
  }

  ////////////////////////////////////////////////////////////
  // CONNECTED WALLET
  ////////////////////////////////////////////////////////////

  const [ownerWallet] = await walletClient.getAddresses();

  if (!ownerWallet) {
    throw new Error("Unable to determine connected customer wallet.");
  }

  ////////////////////////////////////////////////////////////
  // REQUEST CUSTOMER KERNEL
  ////////////////////////////////////////////////////////////

  const response = await fetch(`${apiUrl}/api/v1/customers/kernel`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Accept: "application/json",
    },

    body: JSON.stringify({
      wallet: ownerWallet,
    }),

    cache: "no-store",
  });

  ////////////////////////////////////////////////////////////
  // RESPONSE ERROR
  ////////////////////////////////////////////////////////////

  if (!response.ok) {
    // let message = "Unable to load customer smart account.";
    let message = "Customer should first register a smart account.";

    try {
      const errorBody: unknown = await response.json();

      if (typeof errorBody === "object" && errorBody !== null) {
        const body = errorBody as {
          error?: unknown;
          message?: unknown;
        };

        if (typeof body.error === "string") {
          message = body.error;
        } else if (typeof body.message === "string") {
          message = body.message;
        }
      }
    } catch {
      // Preserve default error message.
    }

    throw new Error(message);
  }

  ////////////////////////////////////////////////////////////
  // RESPONSE
  ////////////////////////////////////////////////////////////

  const body = (await response.json()) as GetCustomerKernelResponse;

  ////////////////////////////////////////////////////////////
  // CUSTOMER
  ////////////////////////////////////////////////////////////

  /*
   * The backend should preferably return the
   * canonical customer object.
   *
   * For compatibility with the existing frontend
   * endpoint, normalize the snake_case response here.
   */
  const customer = normalizeCustomer(body.customer);

  ////////////////////////////////////////////////////////////
  // SESSION PRIVATE KEY
  ////////////////////////////////////////////////////////////

  const sessionPrivateKey = body.sessionPrivateKey;

  if (!sessionPrivateKey) {
    throw new Error("Customer session private key was not returned.");
  }

  ////////////////////////////////////////////////////////////
  // SERIALIZED PERMISSION ACCOUNT
  ////////////////////////////////////////////////////////////

  const serializedPermissionAccount = body.serializedPermissionAccount;

  if (!serializedPermissionAccount) {
    throw new Error("Serialized customer permission account was not returned.");
  }

  ////////////////////////////////////////////////////////////
  // SESSION SIGNER
  ////////////////////////////////////////////////////////////

  const sessionAccount = privateKeyToAccount(sessionPrivateKey);

  const sessionSigner = await toECDSASigner({
    signer: sessionAccount,
  });

  ////////////////////////////////////////////////////////////
  // DESERIALIZE PERMISSION ACCOUNT
  ////////////////////////////////////////////////////////////

  const kernel = await deserializePermissionAccount(
    publicClient,

    entryPoint,

    kernelVersion,

    serializedPermissionAccount,

    sessionSigner,
  );

  ////////////////////////////////////////////////////////////
  // VERIFY CUSTOMER KERNEL
  ////////////////////////////////////////////////////////////

  if (kernel.address.toLowerCase() !== customer.smartAccount.toLowerCase()) {
    throw new Error("Customer Kernel verification failed.");
  }

  ////////////////////////////////////////////////////////////
  // PAYMASTER
  ////////////////////////////////////////////////////////////

  const paymasterRpc =
    process.env.PAYMASTER_RPC ?? process.env.NEXT_PUBLIC_PAYMASTER_RPC;

  if (!paymasterRpc) {
    throw new Error("Paymaster RPC is not configured.");
  }

  const paymasterClient = createZeroDevPaymasterClient({
    chain,

    transport: http(paymasterRpc),
  });

  ////////////////////////////////////////////////////////////
  // BUNDLER
  ////////////////////////////////////////////////////////////

  const bundlerRpc =
    process.env.BUNDLER_RPC ?? process.env.NEXT_PUBLIC_BUNDLER_RPC;

  if (!bundlerRpc) {
    throw new Error("Bundler RPC is not configured.");
  }

  ////////////////////////////////////////////////////////////
  // KERNEL CLIENT
  ////////////////////////////////////////////////////////////

  const kernelClient = createKernelAccountClient({
    account: kernel,

    chain,

    bundlerTransport: http(bundlerRpc),

    paymaster: {
      getPaymasterData(userOperation) {
        return paymasterClient.sponsorUserOperation({
          userOperation,
        });
      },
    },
  });

  ////////////////////////////////////////////////////////////
  // RESULT
  ////////////////////////////////////////////////////////////

  return {
    customer,

    kernelAccount: kernel,

    kernelClient,

    permissionId: body.permissionId,

    permission: body.permission,
  };
}

////////////////////////////////////////////////////////////
// CUSTOMER NORMALIZATION
////////////////////////////////////////////////////////////

/**
 * Converts the backend representation of a customer
 * into the canonical SDK CustomerRecord.
 *
 * This allows the SDK to consume either snake_case
 * database responses or camelCase API responses.
 */
function normalizeCustomer(input: any): CustomerRecord {
  if (!input) {
    throw new Error("Customer record was not returned.");
  }

  return {
    customerId: input.customerId ?? input.customer_id,

    ownerWallet: input.ownerWallet ?? input.owner_wallet,

    smartAccount: input.smartAccount ?? input.smart_account,

    displayName: input.displayName ?? input.display_name ?? "",

    email: input.email ?? "",

    status: input.status ?? "ACTIVE",

    createdAt: normalizeDate(input.createdAt ?? input.created_at),

    updatedAt: normalizeDate(input.updatedAt ?? input.updated_at),
  };
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

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid customer timestamp: ${value}`);
    }

    return date;
  }

  if (typeof value === "number") {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid customer timestamp: ${value}`);
    }

    return date;
  }

  throw new Error("Customer timestamp is missing or invalid.");
}
