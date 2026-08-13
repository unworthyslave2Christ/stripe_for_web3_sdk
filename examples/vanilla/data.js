////////////////////////////////////////////////////////////
// DEMO SAAS DATA
////////////////////////////////////////////////////////////

export const DEMO_FEATURES = [
    {
        id: "dashboard",
        name: "Customer Dashboard",
        description:
            "Access your SaaS workspace dashboard.",
    },

    {
        id: "basic-analytics",
        name: "Basic Analytics",
        description:
            "View basic usage and performance statistics.",
    },

    {
        id: "advanced-analytics",
        name: "Advanced Analytics",
        description:
            "Access detailed analytics and reporting.",
    },

    {
        id: "api-access",
        name: "API Access",
        description:
            "Integrate the platform with external applications.",
    },

    {
        id: "team-collaboration",
        name: "Team Collaboration",
        description:
            "Invite team members and collaborate.",
    },

    {
        id: "priority-support",
        name: "Priority Support",
        description:
            "Receive priority customer support.",
    },
];


////////////////////////////////////////////////////////////
// PLAN FEATURE MAP
////////////////////////////////////////////////////////////

export const PLAN_FEATURES = {
    Starter: [
        "dashboard",
        "basic-analytics",
    ],

    Professional: [
        "dashboard",
        "basic-analytics",
        "advanced-analytics",
        "api-access",
    ],

    Business: [
        "dashboard",
        "basic-analytics",
        "advanced-analytics",
        "api-access",
        "team-collaboration",
        "priority-support",
    ],
};


////////////////////////////////////////////////////////////
// DEMO PLAN FALLBACK
////////////////////////////////////////////////////////////
//
// These are used only when the backend does not yet
// expose plans to the example.
//

export const DEMO_PLANS = [
    {
        planId: 1,
        merchantId: 1,
        name: "Starter",
        description:
            "For individuals getting started.",
        amount: "5",
        billingIntervalSeconds:
            30 * 24 * 60 * 60,
    },

    {
        planId: 2,
        merchantId: 1,
        name: "Professional",
        description:
            "For serious Web3 applications.",
        amount: "15",
        billingIntervalSeconds:
            30 * 24 * 60 * 60,
    },

    {
        planId: 3,
        merchantId: 1,
        name: "Business",
        description:
            "For teams and production workloads.",
        amount: "40",
        billingIntervalSeconds:
            30 * 24 * 60 * 60,
    },
];