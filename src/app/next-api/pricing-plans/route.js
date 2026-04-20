import { proxy, publicGet } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET() {
    return proxy(async () => NextResponse.json(await publicGet('/pricing-plans')))
}
