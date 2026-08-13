import React from "react";

import ReactDOM from "react-dom/client";

import {
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";

import {
    WagmiProvider,
} from "wagmi";

import {
    RainbowKitProvider,
} from "@rainbow-me/rainbowkit";

import "@rainbow-me/rainbowkit/styles.css";

import { wagmiConfig } from "./lib/wagmi";

import App from "./app/App";

import "./index.css";

////////////////////////////////////////////////////////////
// QUERY CLIENT
////////////////////////////////////////////////////////////

const queryClient =
    new QueryClient();

////////////////////////////////////////////////////////////
// APPLICATION
////////////////////////////////////////////////////////////

ReactDOM.createRoot(
    document.getElementById("root")!,
).render(
    <React.StrictMode>
        <WagmiProvider
            config={wagmiConfig}
        >
            <QueryClientProvider
                client={queryClient}
            >
                <RainbowKitProvider>
                    <App />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>,
);