import { backendDelete, backendGet, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || 10
    const page  = searchParams.get('page')  || 1
    return proxy(async () => NextResponse.json(await backendGet(`/dataset/contents/${id}?limit=${limit}&page=${page}`)))
}

export async function DELETE(request, { params }) {
    const { id } = await params
    return proxy(async () => NextResponse.json(await backendDelete(`/dataset/dataset/${id}`)))
}
