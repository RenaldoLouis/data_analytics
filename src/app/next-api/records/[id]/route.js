import { backendGet, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { id } = await params
    return proxy(async () => NextResponse.json(await backendGet(`/chart/records/${id}`)))
}
