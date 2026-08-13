////////////////////////////////////////////////////////////
// FEATURE ACCESS
////////////////////////////////////////////////////////////

import {
    DEMO_FEATURES,
    PLAN_FEATURES,
} from "../../data.js";


export function getFeatureAccess(
    subscriptions,
    plans,
) {

    const activePlanNames =
        new Set();


    for (const subscription of subscriptions) {

        if (
            subscription.status !== "ACTIVE"
        ) {
            continue;
        }


        const plan =
            plans.find(
                item =>
                    Number(item.planId) ===
                    Number(subscription.planId),
            );


        if (plan?.name) {

            activePlanNames.add(
                plan.name,
            );

        }
    }


    const enabledFeatures =
        new Set();


    for (const planName of activePlanNames) {

        const features =
            PLAN_FEATURES[planName] ?? [];


        for (const feature of features) {

            enabledFeatures.add(
                feature,
            );

        }
    }


    return DEMO_FEATURES.map(
        feature => ({

            ...feature,

            enabled:
                enabledFeatures.has(
                    feature.id,
                ),

        }),
    );
}