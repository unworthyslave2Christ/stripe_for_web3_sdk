import {
    PlanCard,
} from "./PlanCard";

import type {
    AcmePlan,
} from "../../data/mockMerchant";

////////////////////////////////////////////////////////////
// PROPS
////////////////////////////////////////////////////////////

interface PlanGridProps {
    plans: AcmePlan[];

    connected: boolean;

    loadingPlanId:
        number | null;

    onSubscribe:
        (planId: number) => void;
}

////////////////////////////////////////////////////////////
// PLAN GRID
////////////////////////////////////////////////////////////

export function PlanGrid({
    plans,

    connected,

    loadingPlanId,

    onSubscribe,
}: PlanGridProps) {
    return (
        <div className="plan-grid">
            {plans.map(
                (plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        connected={
                            connected
                        }
                        loading={
                            loadingPlanId ===
                            plan.id
                        }
                        onSubscribe={
                            onSubscribe
                        }
                    />
                ),
            )}
        </div>
    );
}