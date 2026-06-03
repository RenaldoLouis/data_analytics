import { backendGet, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    return proxy(async () => NextResponse.json(await backendGet('/pl-skus/search', { params: { q } })))
}
