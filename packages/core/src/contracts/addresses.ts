// packages/core/src/contracts/addresses.ts

import type { Address } from "viem";

////////////////////////////////////////////////////////////
// BILLING PROTOCOL ADDRESSES
////////////////////////////////////////////////////////////

export interface BillingProtocolAddresses {
    billingProtocol: Address;
}

////////////////////////////////////////////////////////////
// DEFAULT ADDRESSES
////////////////////////////////////////////////////////////

export const DEFAULT_ADDRESSES: BillingProtocolAddresses = {
    billingProtocol:
        "0x942da4e4f27F231EB32bA0Dc728f53F04F70b1C9" as Address,
};

////////////////////////////////////////////////////////////
// ADDRESS RESOLVER
////////////////////////////////////////////////////////////

export function getBillingProtocolAddress(
    addresses?: Partial<BillingProtocolAddresses>,
): Address {
    return (
        addresses?.billingProtocol ??
        DEFAULT_ADDRESSES.billingProtocol
    );
}