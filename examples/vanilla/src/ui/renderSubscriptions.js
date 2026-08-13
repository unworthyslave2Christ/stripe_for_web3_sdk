////////////////////////////////////////////////////////////
// RENDER SUBSCRIPTIONS
////////////////////////////////////////////////////////////

export function renderSubscriptions({
    subscriptions,
    container,
    onPause,
    onResume,
    onCancel,
}) {

    container.innerHTML = "";


    if (!subscriptions.length) {

        container.innerHTML = `
            <div class="empty-state">
                You do not have any subscriptions yet.
            </div>
        `;

        return;
    }


    for (const subscription of subscriptions) {

        const card =
            document.createElement("article");

        card.className =
            "subscription-card";


        const status =
            subscription.status ??
            "UNKNOWN";


        const nextBilling =
            subscription.nextBillingTime
                ? new Date(
                    subscription.nextBillingTime,
                ).toLocaleString()
                : "—";


        card.innerHTML = `

            <div class="subscription-header">

                <div>

                    <h3>
                        Plan #${subscription.planId}
                    </h3>

                    <small>
                        Subscription #${subscription.subscriptionId}
                    </small>

                </div>

                <span
                    class="status ${status.toLowerCase()}"
                >
                    ${status}
                </span>

            </div>


            <div class="subscription-meta">

                <div>
                    <span>Next billing</span>
                    <strong>
                        ${nextBilling}
                    </strong>
                </div>

                <div>
                    <span>Smart Account</span>
                    <strong class="address">
                        ${shortAddress(
                            subscription.smartAccount,
                        )}
                    </strong>
                </div>

            </div>


            <div class="subscription-actions">

                ${
                    status === "ACTIVE"
                        ? `
                            <button
                                class="button secondary pause"
                            >
                                Pause
                            </button>
                        `
                        : ""
                }

                ${
                    status === "PAUSED"
                        ? `
                            <button
                                class="button secondary resume"
                            >
                                Resume
                            </button>
                        `
                        : ""
                }

                ${
                    status !== "CANCELLED"
                        ? `
                            <button
                                class="button danger cancel"
                            >
                                Cancel
                            </button>
                        `
                        : ""
                }

            </div>
        `;


        const pause =
            card.querySelector(".pause");

        const resume =
            card.querySelector(".resume");

        const cancel =
            card.querySelector(".cancel");


        if (pause) {

            pause.addEventListener(
                "click",
                () => onPause(subscription),
            );

        }


        if (resume) {

            resume.addEventListener(
                "click",
                () => onResume(subscription),
            );

        }


        if (cancel) {

            cancel.addEventListener(
                "click",
                () => onCancel(subscription),
            );

        }


        container.appendChild(card);
    }
}


function shortAddress(address) {

    if (!address) {
        return "—";
    }

    return `${address.slice(
        0,
        6,
    )}...${address.slice(-4)}`;
}