import { proxy, publicPost } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const body = await request.json()
    return proxy(async () => NextResponse.json(await publicPost('/auth/verifyResetPasswordOtp', body)))
}
