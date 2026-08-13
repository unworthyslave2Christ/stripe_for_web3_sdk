import {
    getDefaultConfig,
} from "@rainbow-me/rainbowkit";

import {
    arbitrumSepolia,
} from "wagmi/chains";

////////////////////////////////////////////////////////////
// WALLET CONFIGURATION
////////////////////////////////////////////////////////////

export const wagmiConfig =
    getDefaultConfig({
        appName:
            "AcmeFlow",

        projectId:
            import.meta.env
                .VITE_WALLETCONNECT_PROJECT_ID,

        chains: [
            arbitrumSepolia,
        ],

        ssr: false,
    });