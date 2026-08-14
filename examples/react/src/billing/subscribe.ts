import type {
    PublicClient,
    WalletClient,
} from "viem";

import {
    createCustomerSDK,
} from "./sdk";

import {
    loadCustomer,
} from "../customer/loadCustomer";

////////////////////////////////////////////////////////////
// INPUT
////////////////////////////////////////////////////////////

export interface SubscribeToPlanParams {

    walletClient:
        WalletClient;

    publicClient:
        PublicClient;

    planId:
        number;
}

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export type SubscribeToPlanResult =
    | {
          status: "customer-required";
      }
    | {
          status: "subscribed";

          subscription:
              any;
      };

////////////////////////////////////////////////////////////
// SUBSCRIBE
////////////////////////////////////////////////////////////

export async function subscribeToPlan({
    walletClient,

    publicClient,

    planId,
}: SubscribeToPlanParams): Promise<SubscribeToPlanResult> {

    ////////////////////////////////////////////////////////////
    // CUSTOMER SDK
    ////////////////////////////////////////////////////////////

    const client =
        createCustomerSDK({
            walletClient,

            publicClient,
        });

    ////////////////////////////////////////////////////////////
    // WALLET ADDRESS
    ////////////////////////////////////////////////////////////

    const address =
        walletClient.account?.address;

    if (!address) {
        throw new Error(
            "Connected wallet account is unavailable.",
        );
    }

    ////////////////////////////////////////////////////////////
    // RESOLVE CUSTOMER
    ////////////////////////////////////////////////////////////

    const customer =
        await loadCustomer(
            client,

            address,
        );

    ////////////////////////////////////////////////////////////
    // CUSTOMER DOES NOT EXIST
    ////////////////////////////////////////////////////////////

    if (
        customer.status ===
        "not-created"
    ) {
        return {
            status:
                "customer-required",
        };
    }

    ////////////////////////////////////////////////////////////
    // SUBSCRIBE
    ////////////////////////////////////////////////////////////

    const subscription =
        await client.subscribe(
            planId,
        );

    return {
        status:
            "subscribed",

        subscription,
    };
}