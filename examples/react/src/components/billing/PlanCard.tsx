import {
    Button,
} from "../ui/Button";

import {
    Card,
} from "../ui/Card";

import {
    Badge,
} from "../ui/Badge";

import type {
    AcmePlan,
} from "../../data/mockMerchant";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface PlanCardProps {
    plan: AcmePlan;

    connected: boolean;

    loading: boolean;

    onSubscribe:
        (planId: number) => void;
}

////////////////////////////////////////////////////////////
// PLAN CARD
////////////////////////////////////////////////////////////

export function PlanCard({
    plan,

    connected,

    loading,

    onSubscribe,
}: PlanCardProps) {
    return (
        <Card
            className={
                plan.popular
                    ? "plan-card popular"
                    : "plan-card"
            }
        >
            {plan.popular && (
                <Badge>
                    Most popular
                </Badge>
            )}

            <h2>
                {plan.name}
            </h2>

            <p className="plan-description">
                {plan.description}
            </p>

            <div className="plan-price">
                {plan.price === 0
                    ? "Free"
                    : `$${plan.price}/month`}
            </div>

            <ul>
                {plan.features.map(
                    (feature) => (
                        <li
                            key={feature}
                        >
                            ✓ {feature}
                        </li>
                    ),
                )}
            </ul>

            {plan.price === 0 ? (
                <Button
                    disabled
                >
                    Included
                </Button>
            ) : (
                <Button
                    disabled={
                        !connected ||
                        loading
                    }
                    onClick={() =>
                        onSubscribe(
                            plan.id,
                        )
                    }
                >
                    {loading
                        ? "Processing..."
                        : connected
                            ? `Subscribe to ${plan.name}`
                            : "Connect wallet"}
                </Button>
            )}
        </Card>
    );
}