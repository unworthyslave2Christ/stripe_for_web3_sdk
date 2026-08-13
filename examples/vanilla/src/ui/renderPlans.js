////////////////////////////////////////////////////////////
// RENDER PLANS
////////////////////////////////////////////////////////////

export function renderPlans({
    plans,
    container,
    onSubscribe,
}) {

    container.innerHTML = "";

    if (!plans.length) {

        container.innerHTML = `
            <div class="empty-state">
                No billing plans are currently available.
            </div>
        `;

        return;
    }


    for (const plan of plans) {

        const card =
            document.createElement("article");

        card.className =
            "plan-card";


        const amount =
            plan.amount ??
            plan.price ??
            "—";


        const name =
            plan.name ??
            plan.displayName ??
            `Plan ${plan.planId}`;


        const description =
            plan.description ??
            "Subscription plan";


        card.innerHTML = `

            <div class="plan-header">

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <span class="plan-id">
                    #${escapeHtml(
                        String(plan.planId),
                    )}
                </span>

            </div>

            <p class="plan-description">
                ${escapeHtml(description)}
            </p>

            <div class="plan-price">

                <strong>
                    ${escapeHtml(
                        String(amount),
                    )}
                </strong>

                <span>
                    / billing cycle
                </span>

            </div>

            <button
                class="button primary plan-subscribe"
            >
                Subscribe
            </button>
        `;


        const button =
            card.querySelector(
                ".plan-subscribe",
            );


        button.addEventListener(
            "click",
            () => onSubscribe(plan),
        );


        container.appendChild(card);
    }
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}