////////////////////////////////////////////////////////////
// VANILLA DEMO APPLICATION
////////////////////////////////////////////////////////////

import {
    createPublicClient,
    createWalletClient,
    custom,
} from "viem";

import {
    arbitrumSepolia,
} from "viem/chains";

import {
    CustomerClient,
} from "@stripe-for-web3/customer";


import {
    config,
} from "./config.js";

import {
    loadPlans,
} from "./billing/loadPlans.js";

import {
    subscribe,
} from "./billing/subscribe.js";

import {
    pause,
} from "./billing/pause.js";

import {
    resume,
} from "./billing/resume.js";

import {
    cancel,
} from "./billing/cancel.js";

import {
    loadDashboard,
} from "./app/loadDashboard.js";

import {
    getFeatureAccess,
} from "./app/featureAccess.js";

import {
    renderFeatures,
} from "./app/renderFeatures.js";

import {
    renderPlans,
} from "./ui/renderPlans.js";

import {
    renderSubscriptions,
} from "./ui/renderSubscriptions.js";

import {
    notify,
} from "./ui/notifications.js";


////////////////////////////////////////////////////////////
// DOM
////////////////////////////////////////////////////////////

const connectButton =
    document.getElementById(
        "connect-wallet",
    );

const customerPanel =
    document.getElementById(
        "customer-panel",
    );

const customerStatus =
    document.getElementById(
        "customer-status",
    );

const customerDetails =
    document.getElementById(
        "customer-details",
    );

const plansContainer =
    document.getElementById(
        "plans",
    );

const subscriptionsSection =
    document.getElementById(
        "subscriptions-section",
    );

const subscriptionsContainer =
    document.getElementById(
        "subscriptions",
    );

const featuresSection =
    document.getElementById(
        "features-section",
    );

const featuresContainer =
    document.getElementById(
        "features",
    );


////////////////////////////////////////////////////////////
// STATE
////////////////////////////////////////////////////////////

let walletClient;
let publicClient;
let customerClient;

let customer;
let plans = [];
let subscriptions = [];


////////////////////////////////////////////////////////////
// CONNECT WALLET
////////////////////////////////////////////////////////////

connectButton.addEventListener(
    "click",
    connectWallet,
);


async function connectWallet() {

    if (
        !window.ethereum
    ) {

        notify(
            "MetaMask or another injected wallet is required.",
            "error",
        );

        return;
    }


    try {

        walletClient =
            createWalletClient({
                chain:
                    arbitrumSepolia,

                transport:
                    custom(
                        window.ethereum,
                    ),
            });


        const [address] =
            await walletClient.requestAddresses();


        publicClient =
            createPublicClient({
                chain:
                    arbitrumSepolia,

                transport:
                    custom(
                        window.ethereum,
                    ),
            });


        customerClient =
            new CustomerClient({

                walletClient,

                publicClient,

                contractAddress:
                    config.contractAddress,

                apiUrl:
                    config.apiUrl,

            });


        await initializeCustomer(
            address,
        );


    } catch (error) {

        console.error(
            error,
        );


        notify(
            error instanceof Error
                ? error.message
                : "Wallet connection failed.",
            "error",
        );
    }
}


////////////////////////////////////////////////////////////
// INITIALIZE CUSTOMER
////////////////////////////////////////////////////////////

async function initializeCustomer(
    ownerWallet,
) {

    customerPanel.classList.remove(
        "hidden",
    );


    customerStatus.textContent =
        "Connected";


    customerStatus.className =
        "status active";


    customerDetails.innerHTML = `

        <div>

            <span>
                Owner Wallet
            </span>

            <strong class="address">
                ${shortAddress(
                    ownerWallet,
                )}
            </strong>

        </div>

    `;


    connectButton.textContent =
        shortAddress(
            ownerWallet,
        );


    ////////////////////////////////////////////////////////
    // REGISTER CUSTOMER
    ////////////////////////////////////////////////////////

    try {

        const result =
            await customerClient.register({

                displayName:
                    "Vanilla SaaS Customer",

                email:
                    "customer@example.com",

            });


        customer =
            result.customer;


    } catch (error) {

        console.error(
            "Customer registration failed:",
            error,
        );


        notify(
            error instanceof Error
                ? error.message
                : "Unable to register customer.",
            "error",
        );

        return;
    }


    ////////////////////////////////////////////////////////
    // LOAD PLANS
    ////////////////////////////////////////////////////////

    plans =
        await loadPlans({

            client:
                customerClient,

            merchantId:
                config.merchantId,

        });


    renderPlans({

        plans,

        container:
            plansContainer,

        onSubscribe:
            handleSubscribe,

    });


    ////////////////////////////////////////////////////////
    // LOAD DASHBOARD
    ////////////////////////////////////////////////////////

    await refreshDashboard();
}


////////////////////////////////////////////////////////////
// SUBSCRIBE
////////////////////////////////////////////////////////////

async function handleSubscribe(
    plan,
) {

    try {

        await subscribe({

            client:
                customerClient,

            plan,

        });


        await refreshDashboard();

    } catch {

        // Notification already displayed.
    }
}


////////////////////////////////////////////////////////////
// DASHBOARD REFRESH
////////////////////////////////////////////////////////////

async function refreshDashboard() {

    if (!customer) {
        return;
    }


    try {

        const dashboard =
            await loadDashboard({

                client:
                    customerClient,

                customerId:
                    customer.customerId,

            });


        subscriptions =
            dashboard.subscriptions;


        renderSubscriptions();


        renderFeatureAccess();


    } catch (error) {

        console.error(
            error,
        );


        notify(
            error instanceof Error
                ? error.message
                : "Unable to load dashboard.",
            "error",
        );
    }
}


////////////////////////////////////////////////////////////
// SUBSCRIPTIONS
////////////////////////////////////////////////////////////

function renderSubscriptions() {

    subscriptionsSection.classList.remove(
        "hidden",
    );


    import("./ui/renderSubscriptions.js")
        .then(
            ({
                renderSubscriptions:
                    render,
            }) => {

                render({

                    subscriptions,

                    container:
                        subscriptionsContainer,

                    onPause:
                        handlePause,

                    onResume:
                        handleResume,

                    onCancel:
                        handleCancel,

                });

            },
        );
}


////////////////////////////////////////////////////////////
// PAUSE
////////////////////////////////////////////////////////////

async function handlePause(
    subscription,
) {

    try {

        await pause({

            client:
                customerClient,

            subscriptionId:
                subscription.subscriptionId,

        });


        await refreshDashboard();

    } catch {

        // Notification already handled.
    }
}


////////////////////////////////////////////////////////////
// RESUME
////////////////////////////////////////////////////////////

async function handleResume(
    subscription,
) {

    try {

        await resume({

            client:
                customerClient,

            subscriptionId:
                subscription.subscriptionId,

        });


        await refreshDashboard();

    } catch {

        // Notification already handled.
    }
}


////////////////////////////////////////////////////////////
// CANCEL
////////////////////////////////////////////////////////////

async function handleCancel(
    subscription,
) {

    try {

        await cancel({

            client:
                customerClient,

            subscriptionId:
                subscription.subscriptionId,

        });


        await refreshDashboard();

    } catch {

        // Notification already handled.
    }
}


////////////////////////////////////////////////////////////
// FEATURE ACCESS
////////////////////////////////////////////////////////////

function renderFeatureAccess() {

    featuresSection.classList.remove(
        "hidden",
    );


    const features =
        getFeatureAccess(
            subscriptions,
            plans,
        );


    renderFeatures({

        features,

        container:
            featuresContainer,

    });
}


////////////////////////////////////////////////////////////
// UTILITIES
////////////////////////////////////////////////////////////

function shortAddress(
    address,
) {

    if (!address) {
        return "—";
    }


    return `${address.slice(
        0,
        6,
    )}...${address.slice(-4)}`;
}