import {
    useState,
} from "react";

import {
    PricingPage,
} from "../pages/PricingPage";

import {
    DashboardPage,
} from "../pages/DashboardPage";

////////////////////////////////////////////////////////////
// APPLICATION
////////////////////////////////////////////////////////////

export default function App() {
    const [
        subscription,

        setSubscription,
    ] =
        useState<any | null>(
            null,
        );

    ////////////////////////////////////////////////////////////
    // DASHBOARD STATE
    ////////////////////////////////////////////////////////////

    if (subscription) {
        return (
            <DashboardPage
                subscription={
                    subscription
                }
            />
        );
    }

    ////////////////////////////////////////////////////////////
    // PRICING
    ////////////////////////////////////////////////////////////

    return (
        <PricingPage
            onSubscribed={
                setSubscription
            }
        />
    );
}