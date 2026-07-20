import { backendGet, backendPut, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET() {
    return proxy(async () => NextResponse.json(await backendGet('/pl/alert-config')))
}

export async function PUT(req) {
    const body = await req.json()
    return proxy(async () => NextResponse.json(await backendPut('/pl/alert-config', body)))
}
