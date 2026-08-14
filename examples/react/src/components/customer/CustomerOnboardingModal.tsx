import {
    type FormEvent,

    useState,
} from "react";

import type {
    CustomerClient,
} from "@stripe-for-web3/customer";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface CustomerOnboardingModalProps {
    client: CustomerClient;

    open: boolean;

    onCreated:
        (
            result: unknown,
        ) => void;

    onClose:
        () => void;
}

////////////////////////////////////////////////////////////
// MODAL
////////////////////////////////////////////////////////////

export function CustomerOnboardingModal({
    client,

    open,

    onCreated,

    onClose,
}: CustomerOnboardingModalProps) {

    const [
        displayName,

        setDisplayName,
    ] =
        useState("");

    const [
        email,

        setEmail,
    ] =
        useState("");

    const [
        loading,

        setLoading,
    ] =
        useState(false);

    const [
        error,

        setError,
    ] =
        useState<string | null>(
            null,
        );

    if (!open) {
        return null;
    }

    ////////////////////////////////////////////////////////////
    // SUBMIT
    ////////////////////////////////////////////////////////////

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(null);

        if (!displayName.trim()) {
            setError(
                "Please enter your name.",
            );

            return;
        }

        if (!email.trim()) {
            setError(
                "Please enter your email address.",
            );

            return;
        }

        try {
            setLoading(true);

            ////////////////////////////////////////////////////
            // CUSTOMER REGISTRATION
            ////////////////////////////////////////////////////

            const result =
                await client.register({
                    displayName:
                        displayName.trim(),

                    email:
                        email.trim(),
                });

            ////////////////////////////////////////////////////
            // RETURN CUSTOMER TO PRICING PAGE
            ////////////////////////////////////////////////////

            onCreated(result);

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to create your customer account.",
            );

        } finally {
            setLoading(false);
        }
    }

    ////////////////////////////////////////////////////////////
    // RENDER
    ////////////////////////////////////////////////////////////

    return (
        <div
            className="modal-backdrop"
            role="presentation"
        >
            <div
                className="customer-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="customer-onboarding-title"
            >

                <div className="customer-modal-header">

                    <p className="eyebrow">
                        ACMEFLOW
                    </p>

                    <h2
                        id="customer-onboarding-title"
                    >
                        Create your customer account
                    </h2>

                    <p>
                        Your account is required before
                        you can activate a subscription.
                    </p>

                </div>

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="form-field">

                        <label htmlFor="displayName">
                            Name
                        </label>

                        <input
                            id="displayName"
                            value={
                                displayName
                            }
                            onChange={
                                (event) =>
                                    setDisplayName(
                                        event.target.value,
                                    )
                            }
                            placeholder="Your name"
                            autoComplete="name"
                            disabled={
                                loading
                            }
                        />

                    </div>

                    <div className="form-field">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={
                                email
                            }
                            onChange={
                                (event) =>
                                    setEmail(
                                        event.target.value,
                                    )
                            }
                            placeholder="you@example.com"
                            autoComplete="email"
                            disabled={
                                loading
                            }
                        />

                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="customer-modal-actions">

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                loading
                            }
                            className="secondary-button"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className="primary-button"
                        >
                            {loading
                                ? "Creating account..."
                                : "Create customer account"}
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}