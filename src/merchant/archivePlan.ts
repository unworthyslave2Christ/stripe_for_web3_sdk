// src/merchant/archivePlan.ts

import type { MerchantClient } from "./MerchantClient";

import type { PlanRecord } from "../types/Plan";

import {
    getMerchantKernel,
} from "../kernels/getMerchantKernel";

import {
    encodeBillingProtocolCall,
} from "../contracts/encode";

import {
    executeUserOperation,
} from "../internal/executeUserOperation";

import {
    waitForReceipt,
} from "../internal/waitForReceipt";

import {
    mirror,
} from "../internal/mirror";

export interface ArchivePlanParams {

    client: MerchantClient;

    plan: PlanRecord;

}

export async function archivePlan({

    client,

    plan,

}: ArchivePlanParams) {

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

        "archivePlan",

        [

            BigInt(plan.planId),

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

        endpoint: `/plans/${plan.planId}/archive`,

        body: {

            planId: plan.planId,

            status: "ARCHIVED",

        },

    });

    ////////////////////////////////////////////////////////////
    // Return
    ////////////////////////////////////////////////////////////

    return {

        plan: {

            ...plan,

            status: "ARCHIVED",

        },

        kernel,

        userOpHash,

        receipt,

    };

}