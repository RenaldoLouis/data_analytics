import { backendGet, backendPut, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { plSkuId } = await params
    return proxy(async () => NextResponse.json(await backendGet(`/pl-skus/${plSkuId}`)))
}

export async function PUT(request, { params }) {
    const { plSkuId } = await params
    const body = await request.json()
    return proxy(async () => NextResponse.json(await backendPut(`/pl-skus/${plSkuId}`, body)))
}
