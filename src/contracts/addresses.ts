import type { Address } from "viem";

export interface StripeForWeb3Addresses {
    billingProtocol: Address;
}

export const defaultAddresses: StripeForWeb3Addresses = {
    billingProtocol:
        process.env.BILLING_PROTOCOL_ADDRESS as Address,
};