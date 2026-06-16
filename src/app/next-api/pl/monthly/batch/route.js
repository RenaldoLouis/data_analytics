import { backendPost, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

// Batch fetch full detail for many P/L records in one request.
export async function POST(request) {
    const body = await request.json()
    return proxy(async () => NextResponse.json(await backendPost('/pl/batch', body)))
}
