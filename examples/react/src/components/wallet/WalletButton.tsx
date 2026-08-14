// src/components/wallet/WalletButton.tsx

import {
    usePrivy,
} from "@privy-io/react-auth";

////////////////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////////////////

function shortenAddress(
    address?: string,
): string {

    if (!address) {
        return "Not connected";
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

////////////////////////////////////////////////////////////
// WALLET BUTTON
////////////////////////////////////////////////////////////

export function WalletButton() {

    const {
        ready,
        authenticated,
        user,
        login,
        logout,
    } = usePrivy();

    ////////////////////////////////////////////////////////////
    // LOADING
    ////////////////////////////////////////////////////////////

    if (!ready) {
        return (
            <div className="wallet-card wallet-loading">
                <div className="wallet-icon">
                    ◇
                </div>

                <div className="wallet-info">
                    <span className="wallet-label">
                        Wallet
                    </span>

                    <span className="wallet-status">
                        Connecting...
                    </span>
                </div>
            </div>
        );
    }

    ////////////////////////////////////////////////////////////
    // FIND WALLET ADDRESS
    ////////////////////////////////////////////////////////////

    const wallet = user?.wallet;

    const address =
        wallet?.address;

    ////////////////////////////////////////////////////////////
    // DISCONNECTED
    ////////////////////////////////////////////////////////////

    if (!authenticated) {
        return (
            <div className="wallet-card">

                <div className="wallet-icon">
                    ◇
                </div>

                <div className="wallet-info">

                    <span className="wallet-label">
                        Customer Wallet
                    </span>

                    <span className="wallet-status">
                        Connect your wallet to continue
                    </span>

                </div>

                <button
                    className="wallet-button wallet-connect"
                    onClick={login}
                >
                    Connect
                </button>

            </div>
        );
    }

    ////////////////////////////////////////////////////////////
    // CONNECTED
    ////////////////////////////////////////////////////////////

    return (
        <div className="wallet-card">

            <div className="wallet-icon wallet-icon-connected">
                ✓
            </div>

            <div className="wallet-info">

                <span className="wallet-label">
                    Customer Wallet
                </span>

                <span className="wallet-address">
                    {shortenAddress(address)}
                </span>

                <span className="wallet-status wallet-connected-status">
                    <span className="wallet-status-dot" />
                    Connected
                </span>

            </div>

            <button
                className="wallet-button wallet-disconnect"
                onClick={logout}
            >
                Disconnect
            </button>

        </div>
    );
}