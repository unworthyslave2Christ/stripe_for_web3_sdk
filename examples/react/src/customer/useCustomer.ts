import {
    useEffect,
    useState,
} from "react";

import {
    useAccount,
    usePublicClient,
    useWalletClient,
} from "wagmi";

import type {
    Address,
} from "viem";

import {
    createCustomerSDK,
} from "../billing/sdk";

import {
    loadCustomer,
    type CustomerLoadResult,
} from "./loadCustomer";

////////////////////////////////////////////////////////////
// RESULT
////////////////////////////////////////////////////////////

interface CustomerState {
    status:
        | "disconnected"
        | "loading"
        | "ready"
        | "not-created"
        | "error";

    customerWallet:
        | CustomerLoadResult extends infer T
            ? T extends {
                  status: "ready";
                  customerWallet: infer C;
              }
                ? C
                : never
            : never
        | null;

    error:
        | string
        | null;
}

////////////////////////////////////////////////////////////
// HOOK
////////////////////////////////////////////////////////////

export function useCustomer() {

    const {
        address,
        isConnected,
    } =
        useAccount();

    const {
        data: walletClient,
    } =
        useWalletClient();

    const publicClient =
        usePublicClient();

    const [
        state,
        setState,
    ] =
        useState<CustomerState>({
            status:
                "disconnected",

            customerWallet:
                null,

            error:
                null,
        });

    ////////////////////////////////////////////////////////////
    // LOAD CUSTOMER
    ////////////////////////////////////////////////////////////

    useEffect(() => {

        let cancelled =
            false;

        async function load() {

            ////////////////////////////////////////////////////
            // WALLET NOT CONNECTED
            ////////////////////////////////////////////////////

            if (
                !isConnected ||
                !address ||
                !walletClient ||
                !publicClient
            ) {
                setState({
                    status:
                        "disconnected",

                    customerWallet:
                        null,

                    error:
                        null,
                });

                return;
            }

            ////////////////////////////////////////////////////
            // LOADING
            ////////////////////////////////////////////////////

            setState({
                status:
                    "loading",

                customerWallet:
                    null,

                error:
                    null,
            });

            try {

                //////////////////////////////////////////////////
                // CREATE SDK
                //////////////////////////////////////////////////

                const client =
                    createCustomerSDK({
                        walletClient,

                        publicClient,
                    });

                //////////////////////////////////////////////////
                // LOAD CUSTOMER
                //////////////////////////////////////////////////

                const result =
                    await loadCustomer(
                        client,

                        address as Address,
                    );

                if (cancelled) {
                    return;
                }

                //////////////////////////////////////////////////
                // CUSTOMER EXISTS
                //////////////////////////////////////////////////

                if (
                    result.status ===
                    "ready"
                ) {
                    setState({
                        status:
                            "ready",

                        customerWallet:
                            result.customerWallet,

                        error:
                            null,
                    });

                    return;
                }

                //////////////////////////////////////////////////
                // CUSTOMER DOES NOT EXIST
                //////////////////////////////////////////////////

                setState({
                    status:
                        "not-created",

                    customerWallet:
                        null,

                    error:
                        null,
                });

            } catch (error) {

                if (cancelled) {
                    return;
                }

                setState({
                    status:
                        "error",

                    customerWallet:
                        null,

                    error:
                        error instanceof Error
                            ? error.message
                            : "Unable to load customer.",
                });
            }
        }

        load();

        return () => {
            cancelled = true;
        };

    }, [
        address,
        isConnected,
        walletClient,
        publicClient,
    ]);

    return {
        ...state,

        address,

        walletClient,

        publicClient,
    };
}