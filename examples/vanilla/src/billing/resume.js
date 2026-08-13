////////////////////////////////////////////////////////////
// RESUME
////////////////////////////////////////////////////////////

import {
    notify,
} from "../ui/notifications.js";


export async function resume({
    client,
    subscriptionId,
}) {

    notify(
        "Resuming subscription...",
        "info",
    );


    try {

        const result =
            await client.resumeSubscription(
                subscriptionId,
            );


        notify(
            "Subscription resumed.",
            "success",
        );


        return result;

    } catch (error) {

        notify(
            error instanceof Error
                ? error.message
                : "Unable to resume subscription.",
            "error",
        );

        throw error;
    }
}