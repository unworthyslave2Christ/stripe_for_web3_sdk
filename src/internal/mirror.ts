export interface MirrorRequest<T = unknown> {
    apiUrl?: string;

    endpoint: string;

    body: T;
}
export async function mirror<T>({
    apiUrl,

    endpoint,

    body,
}: MirrorRequest<T>) {
    const response = await fetch(
        `${apiUrl ?? ""}${endpoint}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
        },
    );

    if (!response.ok) {
        throw new Error(`Mirror failed: ${endpoint}`);
    }

    return response.json();
}