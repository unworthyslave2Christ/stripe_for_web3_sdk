////////////////////////////////////////////////////////////
// RENDER FEATURES
////////////////////////////////////////////////////////////

export function renderFeatures({
    features,
    container,
}) {

    container.innerHTML = "";


    for (const feature of features) {

        const element =
            document.createElement("div");

        element.className =
            `feature ${
                feature.enabled
                    ? "enabled"
                    : "locked"
            }`;


        element.innerHTML = `

            <div class="feature-icon">

                ${
                    feature.enabled
                        ? "✓"
                        : "🔒"
                }

            </div>

            <div>

                <strong>
                    ${escapeHtml(
                        feature.name,
                    )}
                </strong>

                <p>
                    ${escapeHtml(
                        feature.description,
                    )}
                </p>

            </div>

        `;


        container.appendChild(
            element,
        );
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