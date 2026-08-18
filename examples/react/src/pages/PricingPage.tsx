import {
    useState,
} from "react";

import {
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
    CustomerOnboardingModal,
} from "../components/customer/CustomerOnboardingModal";

import {
    CustomerAccountCard,
} from "../components/customer/CustomerAccountCard";

import {
    createCustomerSDK,
} from "../billing/sdk";

import {
    mockMerchant,
} from "../data/mockMerchant";

import {
    subscribeToPlan,
} from "../billing/subscribe";

import {
    usePrivy,
} from "@privy-io/react-auth";
import { useCustomer } from "../customer/useCustomer";
import { CustomerStatus } from "../components/customer/CustomerStatus";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface PricingPageProps {
    onSubscribed:
        (
            subscription:
                unknown,
        ) => void;
}

////////////////////////////////////////////////////////////
// PRICING PAGE
////////////////////////////////////////////////////////////

export function PricingPage({
    onSubscribed,
}: PricingPageProps) {

    const customerSmartAccountStatus =
    useCustomer();

    const {
        ready,

        authenticated,
    } = usePrivy();

    const isConnected =
        ready &&
        authenticated;

    const {
        data: walletClient,
    } =
        useWalletClient();

    const publicClient =
        usePublicClient();

    ////////////////////////////////////////////////////////////
    // STATE
    ////////////////////////////////////////////////////////////

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

    const [
        onboardingOpen,

        setOnboardingOpen,
    ] =
        useState(false);

    const [
        customer,

        setCustomer,
    ] =
        useState<any | null>(
            null,
        );

    const [
        pendingPlanId,

        setPendingPlanId,
    ] =
        useState<number | null>(
            null,
        );

    ////////////////////////////////////////////////////////////
    // CUSTOMER SDK
    ////////////////////////////////////////////////////////////

    const customerSDK =
        walletClient &&
        publicClient
            ? createCustomerSDK({
                  walletClient,

                  publicClient,
              })
            : null;

    ////////////////////////////////////////////////////////////
    // SUBSCRIBE
    ////////////////////////////////////////////////////////////

    async function handleSubscribe(
        planId: number,
    ) {

        setError(null);

        ////////////////////////////////////////////////////////
        // WALLET
        ////////////////////////////////////////////////////////

        if (!walletClient) {

            setError(
                "Please connect your wallet first.",
            );

            return;
        }

        ////////////////////////////////////////////////////////
        // PUBLIC CLIENT
        ////////////////////////////////////////////////////////

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

            ////////////////////////////////////////////////////
            // ATTEMPT SUBSCRIPTION
            ////////////////////////////////////////////////////

            const result =
                await subscribeToPlan({
                    walletClient,

                    publicClient,

                    planId,
                });

            ////////////////////////////////////////////////////
            // CUSTOMER DOES NOT EXIST
            ////////////////////////////////////////////////////

            if (
                result.status ===
                "customer-required"
            ) {

                setPendingPlanId(
                    planId,
                );

                setOnboardingOpen(
                    true,
                );

                return;
            }

            ////////////////////////////////////////////////////
            // SUBSCRIPTION CREATED
            ////////////////////////////////////////////////////

            onSubscribed(
                result.subscription,
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

    ////////////////////////////////////////////////////////////
    // CUSTOMER CREATED
    ////////////////////////////////////////////////////////////

    function handleCustomerCreated(
        result: any,
    ) {

        ////////////////////////////////////////////////////////
        // CUSTOMER RESULT
        ////////////////////////////////////////////////////////

        const createdCustomer =
            result?.customer ??
            result;

        setCustomer(
            createdCustomer,
        );

        setOnboardingOpen(
            false,
        );

        ////////////////////////////////////////////////////////
        // IMPORTANT:
        //
        // Do NOT automatically subscribe here.
        //
        // The customer should see that their account was
        // successfully created and deliberately click
        // Subscribe again.
        ////////////////////////////////////////////////////////

        setPendingPlanId(
            null,
        );

        setError(null);
    }

    ////////////////////////////////////////////////////////////
    // NOT CONNECTED
    ////////////////////////////////////////////////////////////

    if (!isConnected) {

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


            </main>
        );
    }

    ////////////////////////////////////////////////////////////
    // RENDER
    ////////////////////////////////////////////////////////////

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
            {customerSmartAccountStatus &&    
                <CustomerStatus
                    status={
                        customerSmartAccountStatus.status
                    }

                    customerWallet={
                        customerSmartAccountStatus.customerWallet
                    }

                    address={
                        customerSmartAccountStatus.address
                    }
                />
            }

            {customer && (
                <section className="customer-ready-section">

                    <CustomerAccountCard
                        customer={
                            customer
                        }
                    />

                    <div className="customer-ready-message">

                        <strong>
                            Your account is ready.
                        </strong>

                        <span>
                            Choose a plan below to activate
                            your ACMEFLOW subscription.
                        </span>

                    </div>

                </section>
            )}

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

            {customerSDK && (
                <CustomerOnboardingModal
                    client={
                        customerSDK
                    }

                    open={
                        onboardingOpen
                    }

                    onCreated={
                        handleCustomerCreated
                    }

                    onClose={() => {

                        setOnboardingOpen(
                            false,
                        );

                        setPendingPlanId(
                            null,
                        );

                        setLoadingPlanId(
                            null,
                        );
                    }}
                />
            )}

        </main>
    );
}