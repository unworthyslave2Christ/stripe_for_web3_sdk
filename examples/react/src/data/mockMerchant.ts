////////////////////////////////////////////////////////////
// ACMEFLOW PLANS
////////////////////////////////////////////////////////////

export interface AcmePlan {
    id: number;

    name: string;

    description: string;

    price: number;

    interval: "MONTHLY";

    features: string[];

    popular?: boolean;
}

////////////////////////////////////////////////////////////
// MERCHANT
////////////////////////////////////////////////////////////

export const mockMerchant = {
    id: 1,

    name:
        "AcmeFlow",

    description:
        "Intelligent workflow automation for modern teams.",

    plans: [
        {
            id: 1,

            name:
                "Starter",

            description:
                "Everything you need to get started.",

            price:
                0,

            interval:
                "MONTHLY" as const,

            features: [
                "3 projects",
                "Basic workflow automation",
                "Community support",
            ],
        },

        {
            id: 2,

            name:
                "Pro",

            description:
                "For growing teams that need more.",

            price:
                19,

            interval:
                "MONTHLY" as const,

            popular:
                true,

            features: [
                "Unlimited projects",
                "Advanced automation",
                "Analytics",
                "Team collaboration",
                "Priority support",
            ],
        },

        {
            id: 3,

            name:
                "Enterprise",

            description:
                "Advanced capabilities for organizations.",

            price:
                99,

            interval:
                "MONTHLY" as const,

            features: [
                "Everything in Pro",
                "Advanced analytics",
                "Unlimited team members",
                "Custom workflows",
                "Enterprise support",
            ],
        },
    ] satisfies AcmePlan[],
};