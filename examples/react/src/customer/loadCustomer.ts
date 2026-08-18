import type {
    CustomerClient,
} from "@stripe-for-web3/customer";

import type {
    Address,
} from "viem";

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

export type CustomerLoadResult =
    | {
          status: "ready";

          customerWallet: Awaited<
              ReturnType<
                  CustomerClient["getByWallet"]
              >
          >;
      }
    | {
          status: "not-created";
      };

////////////////////////////////////////////////////////////
// LOAD CUSTOMER
////////////////////////////////////////////////////////////

export async function loadCustomer(
    client: CustomerClient,
    address: Address,
): Promise<CustomerLoadResult> {

    ////////////////////////////////////////////////////////////
    // LOOK UP CUSTOMER BY CONNECTED WALLET
    ////////////////////////////////////////////////////////////

    const customerWallet =
        await client.getByWallet(
            address,
        );

    ////////////////////////////////////////////////////////////
    // CUSTOMER DOES NOT YET HAVE AN ACCOUNT
    ////////////////////////////////////////////////////////////

    if (!customerWallet) {

        return {
            status: "not-created",
        };
    }

    ////////////////////////////////////////////////////////////
    // CUSTOMER EXISTS
    ////////////////////////////////////////////////////////////

    return {
        status: "ready",

        customerWallet,
    };
}


