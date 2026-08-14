import {
    Card,
} from "../ui/Card";

import {
    Badge,
} from "../ui/Badge";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface CustomerAccountCardProps {
    customer: any;
}

////////////////////////////////////////////////////////////
// CUSTOMER ACCOUNT
////////////////////////////////////////////////////////////

export function CustomerAccountCard({
    customer,
}: CustomerAccountCardProps) {

    const smartAccount =
        customer?.smartAccount;

    const customerId =
        customer?.customerId;

    return (
        <Card>

            <div className="customer-account-card">

                <div>

                    <p className="eyebrow">
                        CUSTOMER ACCOUNT
                    </p>

                    <h3>
                        Your ACMEFLOW account is ready
                    </h3>

                    <p>
                        Your customer profile and Smart
                        Account have been created successfully.
                    </p>

                </div>

                <Badge>
                    READY
                </Badge>

            </div>

            {customerId && (
                <div className="account-detail">

                    <span>
                        Customer ID
                    </span>

                    <code>
                        {customerId.toString()}
                    </code>

                </div>
            )}

            {smartAccount && (
                <div className="account-detail">

                    <span>
                        Smart Account
                    </span>

                    <code>
                        {smartAccount}
                    </code>

                </div>
            )}

            <p className="account-hint">
                Your Smart Account is the account ACMEFLOW
                will use for subscription billing.
            </p>

        </Card>
    );
}