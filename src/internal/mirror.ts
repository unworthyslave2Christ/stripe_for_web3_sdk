export interface MirrorRequest<T = unknown> {
    apiUrl?: string;

    endpoint: string;

    body: T;

    method?: string;
}
export async function mirror<T>({
    apiUrl,

    endpoint,

    body,

    method
}: MirrorRequest<T>) {
    const response = await fetch(
        `${apiUrl ?? ""}${endpoint}`,
        {
            method: method ?? "POST",

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