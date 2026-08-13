////////////////////////////////////////////////////////////
// PAUSE
////////////////////////////////////////////////////////////

import {
    notify,
} from "../ui/notifications.js";


export async function pause({
    client,
    subscriptionId,
}) {

    notify(
        "Pausing subscription...",
        "info",
    );


    try {

        const result =
            await client.pauseSubscription(
                subscriptionId,
            );


        notify(
            "Subscription paused.",
            "success",
        );


        return result;

    } catch (error) {

        notify(
            error instanceof Error
                ? error.message
                : "Unable to pause subscription.",
            "error",
        );

        throw error;
    }
}