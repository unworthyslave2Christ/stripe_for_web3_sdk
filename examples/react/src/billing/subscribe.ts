import {
    createCustomerSDK,
} from "./sdk";

import type {
    PublicClient,
    WalletClient,
} from "viem";

////////////////////////////////////////////////////////////
// SUBSCRIBE
////////////////////////////////////////////////////////////

export async function subscribeToPlan({
    walletClient,

    publicClient,

    planId,
}: {
    walletClient: WalletClient;

    publicClient: PublicClient;

    planId: number;
}) {
    const customer =
        createCustomerSDK({
            walletClient,

            publicClient,
        });

    const plan = customer.getPlan()

    return customer.subscribe({
        planId,
    });
}