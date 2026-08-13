////////////////////////////////////////////////////////////
// LOAD PLANS
////////////////////////////////////////////////////////////

import {
    DEMO_PLANS,
} from "../../data.js";

import {
    notify,
} from "../ui/notifications.js";


export async function loadPlans({
    client,
    merchantId,
}) {

    try {

        const response =
            await fetch(
                `${client.apiUrl}/api/v1/merchants/${merchantId}/plans`,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json",
                    },

                    cache:
                        "no-store",
                },
            );


        if (!response.ok) {

            throw new Error(
                "Unable to retrieve billing plans.",
            );

        }


        const body =
            await response.json();


        const plans =
            body.plans ??
            body;


        if (
            Array.isArray(plans) &&
            plans.length
        ) {

            return plans;

        }


        return DEMO_PLANS;

    } catch (error) {

        console.warn(
            "Using local demo plans:",
            error,
        );


        notify(
            "Backend plans were unavailable. Using demo plans.",
            "info",
        );


        return DEMO_PLANS;
    }
}