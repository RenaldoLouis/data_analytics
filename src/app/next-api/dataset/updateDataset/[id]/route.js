import { backendPut, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
    const { id } = await params
    const body = await request.json()
    return proxy(async () => NextResponse.json(await backendPut(`/dataset/dataset/${id}`, body)))
}
