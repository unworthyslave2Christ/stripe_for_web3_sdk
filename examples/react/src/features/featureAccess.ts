////////////////////////////////////////////////////////////
// PLAN FEATURES
////////////////////////////////////////////////////////////

export type PlanTier =
    | "STARTER"
    | "PRO"
    | "ENTERPRISE";

export type Feature =
    | "BASIC_AUTOMATION"
    | "ANALYTICS"
    | "UNLIMITED_PROJECTS"
    | "TEAM_COLLABORATION"
    | "CUSTOM_WORKFLOWS"
    | "ADVANCED_ANALYTICS";

const planFeatures:
    Record<PlanTier, Feature[]> = {

    STARTER: [
        "BASIC_AUTOMATION",
    ],

    PRO: [
        "BASIC_AUTOMATION",
        "ANALYTICS",
        "UNLIMITED_PROJECTS",
        "TEAM_COLLABORATION",
    ],

    ENTERPRISE: [
        "BASIC_AUTOMATION",
        "ANALYTICS",
        "UNLIMITED_PROJECTS",
        "TEAM_COLLABORATION",
        "CUSTOM_WORKFLOWS",
        "ADVANCED_ANALYTICS",
    ],
};

////////////////////////////////////////////////////////////
// FEATURE ACCESS
////////////////////////////////////////////////////////////

export function hasFeature(
    plan: PlanTier,
    feature: Feature,
): boolean {
    return planFeatures[
        plan
    ].includes(feature);
}

////////////////////////////////////////////////////////////
// PLAN NAME
////////////////////////////////////////////////////////////

export function getPlanTier(
    planName: string | undefined,
): PlanTier {
    switch (
        planName?.toUpperCase()
    ) {
        case "ENTERPRISE":
            return "ENTERPRISE";

        case "PRO":
            return "PRO";

        default:
            return "STARTER";
    }
}