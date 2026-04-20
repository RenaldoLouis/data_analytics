// Server-side axios wrapper for Next.js route handlers → backend calls
import axios from 'axios'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const backend = axios.create({
    baseURL: process.env.BACKEND_URL,
    headers: { 'Content-Type': 'application/json' },
})

// Throws if access_token cookie is missing (caught by proxy())
export async function getToken() {
    const store = await cookies()
    const token = store.get('access_token')?.value
    if (!token) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
    return token
}

const authHeader = (token) => ({ Authorization: `Bearer ${token}` })

// Wrap any async fn: converts thrown errors → NextResponse JSON
export async function proxy(fn) {
    try {
        return await fn()
    } catch (err) {
        const status = err.statusCode ?? err.response?.status ?? 500
        const message = err.response?.data?.message ?? err.message ?? 'Internal Server Error'
        return NextResponse.json({ message }, { status })
    }
}

// ── Authenticated helpers ────────────────────────────────────────────────────

export async function backendGet(path, config = {}) {
    const token = await getToken()
    const { data } = await backend.get(path, { ...config, headers: { ...authHeader(token), ...config.headers } })
    return data
}

export async function backendPost(path, body, config = {}) {
    const token = await getToken()
    const { data } = await backend.post(path, body, { ...config, headers: { ...authHeader(token), ...config.headers } })
    return data
}

export async function backendPut(path, body, config = {}) {
    const token = await getToken()
    const { data } = await backend.put(path, body, { ...config, headers: { ...authHeader(token), ...config.headers } })
    return data
}

export async function backendDelete(path, config = {}) {
    const token = await getToken()
    const { data } = await backend.delete(path, { ...config, headers: { ...authHeader(token), ...config.headers } })
    return data
}

// ── Public (no auth) helpers ─────────────────────────────────────────────────

export async function publicGet(path, config = {}) {
    const { data } = await backend.get(path, config)
    return data
}

export async function publicPost(path, body, config = {}) {
    const { data } = await backend.post(path, body, config)
    return data
}
