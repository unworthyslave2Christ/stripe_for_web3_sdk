////////////////////////////////////////////////////////////
// CANCEL
////////////////////////////////////////////////////////////

import {
    notify,
} from "../ui/notifications.js";


export async function cancel({
    client,
    subscriptionId,
}) {

    const confirmed =
        window.confirm(
            "Cancel this subscription?",
        );


    if (!confirmed) {
        return null;
    }


    notify(
        "Cancelling subscription...",
        "info",
    );


    try {

        const result =
            await client.cancelSubscription(
                subscriptionId,
            );


        notify(
            "Subscription cancelled.",
            "success",
        );


        return result;

    } catch (error) {

        notify(
            error instanceof Error
                ? error.message
                : "Unable to cancel subscription.",
            "error",
        );

        throw error;
    }
}