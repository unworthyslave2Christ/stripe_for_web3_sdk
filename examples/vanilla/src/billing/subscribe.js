////////////////////////////////////////////////////////////
// SUBSCRIBE
////////////////////////////////////////////////////////////

import {
    notify,
} from "../ui/notifications.js";


export async function subscribe({
    client,
    plan,
}) {

    if (!client) {

        throw new Error(
            "Customer client is not configured.",
        );

    }


    if (!plan) {

        throw new Error(
            "A billing plan is required.",
        );

    }


    notify(
        `Subscribing to ${plan.name ?? "selected plan"}...`,
        "info",
    );


    try {

        const result =
            await client.subscribe({
                plan,
            });


        notify(
            "Subscription created successfully.",
            "success",
        );


        return result;

    } catch (error) {

        notify(
            error instanceof Error
                ? error.message
                : "Subscription failed.",
            "error",
        );

        throw error;
    }
}