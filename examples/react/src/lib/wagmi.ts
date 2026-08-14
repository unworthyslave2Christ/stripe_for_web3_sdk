// import {
//     getDefaultConfig,
// } from "@rainbow-me/rainbowkit";

// import {
//     arbitrumSepolia,
// } from "wagmi/chains";

// ////////////////////////////////////////////////////////////
// // WALLET CONFIGURATION
// ////////////////////////////////////////////////////////////

// export const wagmiConfig =
//     getDefaultConfig({
//         appName:
//             "AcmeFlow",

//         projectId:
//             import.meta.env
//                 .VITE_WALLETCONNECT_PROJECT_ID,

//         chains: [
//             arbitrumSepolia,
//         ],

//         ssr: false,
//     });


import { createConfig } from "@privy-io/wagmi";

import { arbitrumSepolia } from "viem/chains";
import { http } from "wagmi";

export const wagmiConfig = createConfig({
    chains: [
        arbitrumSepolia,
    ],

    transports: {
        [arbitrumSepolia.id]:
            http(),
    },
});