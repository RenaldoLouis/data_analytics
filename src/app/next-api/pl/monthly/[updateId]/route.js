import { backendDelete, backendGet, backendPut, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { updateId } = await params
    return proxy(async () => NextResponse.json(await backendGet(`/pl/${updateId}`)))
}

export async function PUT(request, { params }) {
    const { updateId } = await params
    const body = await request.json()
    return proxy(async () => NextResponse.json(await backendPut(`/pl/${updateId}`, body)))
}

export async function DELETE(request, { params }) {
    const { updateId } = await params
    return proxy(async () => NextResponse.json(await backendDelete(`/pl/${updateId}`)))
}
