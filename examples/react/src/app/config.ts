import type { Address } from "viem";

////////////////////////////////////////////////////////////
// APPLICATION CONFIGURATION
////////////////////////////////////////////////////////////

export const appConfig = {
    name:
        "AcmeFlow",

    description:
        "Intelligent workflow automation for modern teams.",

    apiUrl:
        import.meta.env.VITE_API_URL as string,

    billingContractAddress:
        import.meta.env
            .VITE_BILLING_CONTRACT_ADDRESS as Address,

    walletConnectProjectId:
        import.meta.env
            .VITE_WALLETCONNECT_PROJECT_ID as string,
};

////////////////////////////////////////////////////////////
// CONFIGURATION VALIDATION
////////////////////////////////////////////////////////////

export function validateAppConfig() {
    if (!appConfig.apiUrl) {
        throw new Error(
            "VITE_API_URL is not configured.",
        );
    }

    if (
        !appConfig.billingContractAddress
    ) {
        throw new Error(
            "VITE_BILLING_CONTRACT_ADDRESS is not configured.",
        );
    }

    if (
        !appConfig.walletConnectProjectId
    ) {
        throw new Error(
            "VITE_WALLETCONNECT_PROJECT_ID is not configured.",
        );
    }
}