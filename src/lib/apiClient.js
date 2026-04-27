// Client-side axios instance for calling /next-api/* routes.
// Automatically refreshes access_token on 401 and retries the original request.
// Uses navigator.locks to coordinate refresh across multiple tabs (Supabase pattern):
// only one tab calls /refresh at a time; others wait and reuse the result.
import axios from 'axios'

const LOCK_NAME = 'token_refresh'
const RESULT_KEY = 'token_refresh_result'

async function refreshWithLock() {
    // navigator.locks is supported in all modern browsers (Chrome 69+, Firefox 96+, Safari 15.4+)
    if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request(LOCK_NAME, async () => {
            // Another tab may have already refreshed while we waited for the lock.
            // Check the broadcast result before making another network call.
            const recent = sessionStorage.getItem(RESULT_KEY)
            if (recent) {
                const { ok, ts } = JSON.parse(recent)
                // If a successful refresh happened within the last 10s, reuse it.
                if (ok && Date.now() - ts < 10_000) return true
            }

            try {
                await axios.post('/next-api/refresh', null, { withCredentials: true })
                sessionStorage.setItem(RESULT_KEY, JSON.stringify({ ok: true, ts: Date.now() }))
                return true
            } catch {
                sessionStorage.removeItem(RESULT_KEY)
                return false
            }
        })
    }

    // Fallback for environments without navigator.locks (SSR, old browsers)
    try {
        await axios.post('/next-api/refresh', null, { withCredentials: true })
        return true
    } catch {
        return false
    }
}

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

        const refreshed = await refreshWithLock()
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
