////////////////////////////////////////////////////////////
// LOAD DASHBOARD
////////////////////////////////////////////////////////////

export async function loadDashboard({
    client,
    customerId,
}) {

    if (!customerId) {

        return {
            subscriptions: [],
        };

    }


    const subscriptions =
        await client.getSubscriptions(
            customerId,
        );


    return {
        subscriptions,
    };
}