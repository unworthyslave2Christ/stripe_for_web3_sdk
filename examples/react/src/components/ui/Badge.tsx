import type {
    HTMLAttributes,
} from "react";

////////////////////////////////////////////////////////////
// BADGE
////////////////////////////////////////////////////////////

export function Badge({
    children,

    className = "",

    ...props
}: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            {...props}
            className={`app-badge ${className}`}
        >
            {children}
        </span>
    );
}