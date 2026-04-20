// Client-side axios instance for calling /next-api/* routes.
// Automatically refreshes access_token on 401 and retries the original request.
import axios from 'axios'

let refreshPromise = null

const client = axios.create({
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config
        if (error.response?.status !== 401 || original._retried) {
            return Promise.reject(error)
        }

        // Singleton: prevent multiple concurrent refresh calls
        if (!refreshPromise) {
            refreshPromise = client
                .post('/next-api/refresh')
                .then(() => true)
                .catch(() => false)
                .finally(() => { refreshPromise = null })
        }

        const refreshed = await refreshPromise
        if (!refreshed) {
            window.location.href = `/login?ref=${encodeURIComponent(window.location.pathname)}`
            return Promise.reject(error)
        }

        original._retried = true
        return client(original)
    }
)

export default client

// Named export for backward-compat with services/index.js
export async function apiClient(path, { method = 'GET', body, form = false } = {}) {
    const config = { method, url: path }
    if (body) config.data = body
    if (form && body instanceof FormData) {
        // Let axios set Content-Type with multipart boundary automatically
        delete config.headers?.['Content-Type']
    }
    const res = await client(config)
    return res.data
}
