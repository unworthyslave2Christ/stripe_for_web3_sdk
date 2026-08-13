import {
    ConnectButton,
} from "@rainbow-me/rainbowkit";

////////////////////////////////////////////////////////////
// WALLET BUTTON
////////////////////////////////////////////////////////////

export function WalletButton() {
    return (
        <ConnectButton
            showBalance={true}
            chainStatus="icon"
        />
    );
}