////////////////////////////////////////////////////////////
// NOTIFICATIONS
////////////////////////////////////////////////////////////

const notificationArea =
    document.getElementById(
        "notification-area",
    );


export function notify(
    message,
    type = "info",
) {

    const element =
        document.createElement("div");

    element.className =
        `notification ${type}`;

    element.textContent =
        message;

    notificationArea.appendChild(
        element,
    );

    setTimeout(() => {

        element.remove();

    }, 6000);
}


export function clearNotifications() {

    notificationArea.innerHTML = "";

}