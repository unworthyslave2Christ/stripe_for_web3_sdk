import {
    useState,
} from "react";

import {
    useAccount,

    usePublicClient,

    useWalletClient,
} from "wagmi";

import {
    PlanGrid,
} from "../components/billing/PlanGrid";

import {
    WalletButton,
} from "../components/wallet/WalletButton";

import {
    mockMerchant,
} from "../data/mockMerchant";

import {
    subscribeToPlan,
} from "../billing/subscribe";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface PricingPageProps {
    onSubscribed:
        (subscription: unknown) => void;
}

////////////////////////////////////////////////////////////
// PRICING PAGE
////////////////////////////////////////////////////////////

export function PricingPage({
    onSubscribed,
}: PricingPageProps) {
    const {
        isConnected,
    } = useAccount();

    const {
        data: walletClient,
    } = useWalletClient();

    const publicClient =
        usePublicClient();

    const [
        loadingPlanId,

        setLoadingPlanId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        error,

        setError,
    ] =
        useState<string | null>(
            null,
        );

    async function handleSubscribe(
        planId: number,
    ) {
        setError(null);

        if (!walletClient) {
            setError(
                "Please connect your wallet first.",
            );

            return;
        }

        if (!publicClient) {
            setError(
                "Blockchain client is unavailable.",
            );

            return;
        }

        try {
            setLoadingPlanId(
                planId,
            );

            const result =
                await subscribeToPlan({
                    walletClient,

                    publicClient,

                    planId,
                });

            onSubscribed(
                result,
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Subscription failed.",
            );
        } finally {
            setLoadingPlanId(
                null,
            );
        }
    }

    return (
        <main className="pricing-page">
            <header className="hero">
                <div>
                    <p className="eyebrow">
                        ACMEFLOW
                    </p>

                    <h1>
                        Automate your team's work.
                    </h1>

                    <p>
                        Powerful workflow automation
                        without the blockchain headache.
                    </p>
                </div>

                <WalletButton />
            </header>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <section>
                <h2>
                    Choose your plan
                </h2>

                <PlanGrid
                    plans={
                        mockMerchant.plans
                    }
                    connected={
                        isConnected
                    }
                    loadingPlanId={
                        loadingPlanId
                    }
                    onSubscribe={
                        handleSubscribe
                    }
                />
            </section>
        </main>
    );
}