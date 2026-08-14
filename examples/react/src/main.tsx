import React from "react";
import ReactDOM from "react-dom/client";

import {
    PrivyProvider,
} from "@privy-io/react-auth";

import {
    WagmiProvider,
} from "@privy-io/wagmi";

import {
    QueryClientProvider,
} from "@tanstack/react-query";

import { App } from "./app/App";

import { privyConfig } from "./lib/privy";
import { wagmiConfig } from "./lib/wagmi";
import { queryClient } from "./lib/queryClient";

import "./index.css";

ReactDOM.createRoot(
    document.getElementById("root")!,
).render(
    <React.StrictMode>

        <PrivyProvider
            appId={
                import.meta.env
                    .VITE_PRIVY_APP_ID
            }
            config={privyConfig}
        >

            <QueryClientProvider
                client={queryClient}
            >

                <WagmiProvider
                    config={wagmiConfig}
                >

                    <App />

                </WagmiProvider>

            </QueryClientProvider>

        </PrivyProvider>

    </React.StrictMode>,
);