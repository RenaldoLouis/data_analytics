import { backendDelete, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
    const { aliasId } = await params
    return proxy(async () => NextResponse.json(await backendDelete(`/pl-skus/aliases/${aliasId}`)))
}
