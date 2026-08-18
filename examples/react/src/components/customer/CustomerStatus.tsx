import type {
    Address,
} from "viem";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface CustomerStatusProps {
    status:
        | "disconnected"
        | "loading"
        | "ready"
        | "not-created"
        | "error";

    customerWallet:
        | any
        | null;

    address:
        | Address
        | undefined;
}

////////////////////////////////////////////////////////////
// COMPONENT
////////////////////////////////////////////////////////////

export function CustomerStatus({
    status,

    customerWallet,

    address,
}: CustomerStatusProps) {

    ////////////////////////////////////////////////////////////
    // DISCONNECTED
    ////////////////////////////////////////////////////////////

    if (
        status ===
        "disconnected"
    ) {
        return null;
    }

    ////////////////////////////////////////////////////////////
    // LOADING
    ////////////////////////////////////////////////////////////

    if (
        status ===
        "loading"
    ) {
        return (
            <section className="customer-status">
                <p className="customer-status-eyebrow">
                    STRIPE FOR WEB3
                </p>

                <h3>
                    Checking your smart account
                </h3>

                <p>
                    Looking for an existing
                    customer account...
                </p>
            </section>
        );
    }

    ////////////////////////////////////////////////////////////
    // ERROR
    ////////////////////////////////////////////////////////////

    if (
        status ===
        "error"
    ) {
        return (
            <section className="customer-status customer-status-error">
                <p className="customer-status-eyebrow">
                    STRIPE FOR WEB3
                </p>

                <h3>
                    Unable to check account
                </h3>

                <p>
                    We could not determine whether
                    a smart account exists for this wallet.
                </p>
            </section>
        );
    }

    ////////////////////////////////////////////////////////////
    // NOT CREATED
    ////////////////////////////////////////////////////////////

    if (
        status ===
        "not-created"
    ) {
        return (
            <section className="customer-status">
                <div className="customer-status-heading">
                    <div>
                        <p className="customer-status-eyebrow">
                            STRIPE FOR WEB3
                        </p>

                        <h3>
                            Smart account not created
                        </h3>
                    </div>

                    <span className="customer-status-badge">
                        Not created
                    </span>
                </div>

                <p>
                    Your smart account will be created
                    when you activate your first subscription.
                </p>

                {address && (
                    <code className="customer-wallet-address">
                        {address}
                    </code>
                )}
            </section>
        );
    }

    ////////////////////////////////////////////////////////////
    // READY
    ////////////////////////////////////////////////////////////

    return (
        <section className="customer-status customer-status-ready">

            <div className="customer-status-heading">

                <div>
                    <p className="customer-status-eyebrow">
                        STRIPE FOR WEB3
                    </p>

                    <h3>
                        Smart account ready
                    </h3>
                </div>

                <span className="customer-status-badge customer-status-badge-ready">
                    Ready
                </span>

            </div>

            <p>
                Your smart account is ready to
                manage decentralized subscriptions.
            </p>

            {customerWallet?.smartAccount && (
                <div className="customer-smart-account">

                    <span>
                        Smart account
                    </span>

                    <code>
                        {customerWallet.smartAccount}
                    </code>

                </div>
            )}

        </section>
    );
}