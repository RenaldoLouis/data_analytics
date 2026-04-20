import { backendGet, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { layoutNumber } = await params
    return proxy(async () => NextResponse.json(await backendGet(`/dashboard/records/${layoutNumber}`)))
}
