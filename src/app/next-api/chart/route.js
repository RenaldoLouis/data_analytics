import { backendGet, backendPost, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET() {
    return proxy(async () => NextResponse.json(await backendGet('/chart/')))
}

export async function POST(request) {
    const body = await request.json()
    return proxy(async () => NextResponse.json(await backendPost('/chart/data', body)))
}
