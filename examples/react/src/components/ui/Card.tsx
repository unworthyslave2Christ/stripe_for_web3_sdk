import type {
    HTMLAttributes,
} from "react";

////////////////////////////////////////////////////////////
// CARD
////////////////////////////////////////////////////////////

export function Card({
    children,

    className = "",

    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={`app-card ${className}`}
        >
            {children}
        </div>
    );
}