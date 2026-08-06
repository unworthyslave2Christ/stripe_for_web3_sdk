// src/merchant/createMerchant.ts

import type { MerchantClient } from "./MerchantClient";

import type { MerchantRecord } from "../types/Merchant";

import {
    getMerchantKernel,
} from "../kernels/getMerchantKernel";

import {
    encodeBillingProtocolCall,
} from "../contracts/encode";

import {
    encodeKernelCall,
} from "../internal/encodeKernelCall";

import {
    executeUserOperation,
} from "../internal/executeUserOperation";

import {
    waitForReceipt,
} from "../internal/waitForReceipt";

import {
    mirror,
} from "../internal/mirror";

export interface CreateMerchantParams {

    client: MerchantClient;

    merchant: MerchantRecord;

}

export async function createMerchant({

    client,

    merchant,

}: CreateMerchantParams) {

    ////////////////////////////////////////////////////////////
    // Obtain Merchant Kernel
    ////////////////////////////////////////////////////////////

    const {

        kernel,

    } = await getMerchantKernel({
        walletClient: client.walletClient,
        publicClient: client.publicClient,
        merchantResolver: client.merchantResolver,

    });

    const kernelClient = kernel.client;

    ////////////////////////////////////////////////////////////
    // Encode Billing Protocol Call
    ////////////////////////////////////////////////////////////

    const data = encodeBillingProtocolCall(

        "createMerchant",

        [

            merchant.name,

            merchant.metadataURI,

        ],

    );

    ////////////////////////////////////////////////////////////
    // Encode Kernel Call
    ////////////////////////////////////////////////////////////

    const callData = await encodeKernelCall(
        kernel,
        [
            {
                to: client.contractAddress!,
                value: 0n,
                data,
            },
        ],
    );

    ////////////////////////////////////////////////////////////
    // Execute User Operation
    ////////////////////////////////////////////////////////////

    const userOpHash = await executeUserOperation({
            kernel,
            kernelClient,
            contractAddress: client.contractAddress!,
            data,
        });

    ////////////////////////////////////////////////////////////
    // Wait For Receipt
    ////////////////////////////////////////////////////////////

    const receipt = await waitForReceipt({

        kernelClient,

        userOperationHash: userOpHash,

    });

    ////////////////////////////////////////////////////////////
    // Mirror Backend
    ////////////////////////////////////////////////////////////

    await mirror({

        apiUrl: client.apiUrl,

        endpoint: "/merchants",

        body: merchant,

    });

    ////////////////////////////////////////////////////////////
    // Return
    ////////////////////////////////////////////////////////////

    return {

        merchant,

        kernel,

        userOpHash,

        receipt,

    };

}