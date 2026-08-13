import type {
    ButtonHTMLAttributes,
} from "react";

////////////////////////////////////////////////////////////
// BUTTON
////////////////////////////////////////////////////////////

export function Button({
    children,

    className = "",

    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`app-button ${className}`}
        >
            {children}
        </button>
    );
}