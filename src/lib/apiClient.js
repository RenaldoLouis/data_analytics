// lib/apiClient.js

export async function apiClient(path, { method = 'GET', body, headers = {}, form = false } = {}) {
    try {
        const options = {
            method,
            headers: {
                ...headers,
            },
            credentials: 'include', // include cookies (like token)
        };

        if (form) {
            options.body = body; // raw FormData
            // Do NOT set content-type for FormData
        } else if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const res = await fetch(path, options);

        if (res.status === 401) {
            // Optional: toast before redirect
            // toast.error("Session expired. Please log in again.");
            window.location.href = `/login?ref=${window.location.pathname}`;
            return;
        }

        const data = await res.json();
        // if (!res.ok) {
        //     throw new Error(data.message || 'Unexpected error');
        // }

        return data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
