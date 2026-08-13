import {
    Card,
} from "../components/ui/Card";

import {
    Badge,
} from "../components/ui/Badge";

import {
    WalletButton,
} from "../components/wallet/WalletButton";

import {
    getPlanTier,

    hasFeature,
} from "../features/featureAccess";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface DashboardPageProps {
    subscription:
        | any
        | null;
}

////////////////////////////////////////////////////////////
// DASHBOARD
////////////////////////////////////////////////////////////

export function DashboardPage({
    subscription,
}: DashboardPageProps) {
    const plan =
        getPlanTier(
            subscription?.planName ??
            "PRO",
        );

    const analytics =
        hasFeature(
            plan,
            "ANALYTICS",
        );

    const unlimitedProjects =
        hasFeature(
            plan,
            "UNLIMITED_PROJECTS",
        );

    return (
        <main className="dashboard">
            <header className="dashboard-header">
                <div>
                    <p className="eyebrow">
                        ACMEFLOW
                    </p>

                    <h1>
                        Dashboard
                    </h1>
                </div>

                <WalletButton />
            </header>

            <section className="dashboard-grid">
                <Card>
                    <p>
                        Current plan
                    </p>

                    <h2>
                        {plan}
                    </h2>

                    <Badge>
                        {subscription?.status ??
                            "ACTIVE"}
                    </Badge>
                </Card>

                <Card>
                    <p>
                        Projects
                    </p>

                    <h2>
                        {unlimitedProjects
                            ? "Unlimited"
                            : "3"}
                    </h2>
                </Card>

                <Card>
                    <p>
                        Analytics
                    </p>

                    {analytics ? (
                        <>
                            <h2>
                                Enabled
                            </h2>

                            <p>
                                Advanced analytics
                                are available on
                                your current plan.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2>
                                Locked
                            </h2>

                            <p>
                                Upgrade to Pro to
                                unlock analytics.
                            </p>
                        </>
                    )}
                </Card>
            </section>
        </main>
    );
}