import { proxy, publicGet } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const token = new URL(request.url).searchParams.get('token')
    return proxy(async () => NextResponse.json(await publicGet('/auth/verify-email', { params: { token } })))
}
