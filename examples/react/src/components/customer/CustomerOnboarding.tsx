import {
    useState,
} from "react";

import {
    Card,
} from "../ui/Card";

import {
    Button,
} from "../ui/Button";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface CustomerOnboardingProps {
    onCreateCustomer:
        () => Promise<void>;
}

////////////////////////////////////////////////////////////
// CUSTOMER ONBOARDING
////////////////////////////////////////////////////////////

export function CustomerOnboarding({
    onCreateCustomer,
}: CustomerOnboardingProps) {

    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

    ////////////////////////////////////////////////////////////
    // CREATE CUSTOMER
    ////////////////////////////////////////////////////////////

    async function handleCreateCustomer() {

        setError(null);

        setCreating(true);

        try {

            await onCreateCustomer();

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to create customer account.",
            );

        } finally {

            setCreating(false);
        }
    }

    ////////////////////////////////////////////////////////////
    // RENDER
    ////////////////////////////////////////////////////////////

    return (
        <main className="onboarding-page">

            <section className="onboarding-card">

                <Card>

                    <div className="onboarding-content">

                        <p className="eyebrow">
                            ACMEFLOW
                        </p>

                        <h1>
                            Create your account
                        </h1>

                        <p>
                            Your wallet is connected,
                            but you do not yet have an
                            ACMEFLOW customer account.
                        </p>

                        <p>
                            Create your customer account
                            to subscribe to ACMEFLOW plans
                            and access the services included
                            with your subscription.
                        </p>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={
                                handleCreateCustomer
                            }
                            disabled={creating}
                        >
                            {creating
                                ? "Creating account..."
                                : "Create customer account"}
                        </Button>

                    </div>

                </Card>

            </section>

        </main>
    );
}