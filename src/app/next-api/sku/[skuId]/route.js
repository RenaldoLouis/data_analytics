import { backendDelete, backendGet, backendPut, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { skuId } = await params
    return proxy(async () => NextResponse.json(await backendGet(`/sku/${skuId}`)))
}

export async function PUT(request, { params }) {
    const { skuId } = await params
    const body = await request.json()
    return proxy(async () => NextResponse.json(await backendPut(`/sku/${skuId}`, body)))
}

export async function DELETE(request, { params }) {
    const { skuId } = await params
    return proxy(async () => NextResponse.json(await backendDelete(`/sku/${skuId}`)))
}
