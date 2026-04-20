import { backendDelete, backendGet, backendPut, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { plId } = await params
    return proxy(async () => NextResponse.json(await backendGet(`/brands/${plId}`)))
}

export async function PUT(request, { params }) {
    const { plId } = await params
    const body = await request.json()
    return proxy(async () => NextResponse.json(await backendPut(`/brands/${plId}`, body)))
}

export async function DELETE(request, { params }) {
    const { plId } = await params
    return proxy(async () => NextResponse.json(await backendDelete(`/brands/${plId}`)))
}
