import type { Address } from "viem";

export interface StripeForWeb3Addresses {
    billingProtocol: Address;
}

export const defaultAddresses: StripeForWeb3Addresses = {
    billingProtocol:
        "https://rpc.zerodev.app/api/v3/a26a0058-c9c3-4c35-a01c-f5f76aae4d33/chain/421614" as Address,
};