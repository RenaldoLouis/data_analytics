import { backendGet, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const name = new URL(request.url).searchParams.get('name') || ''
    return proxy(async () => NextResponse.json(await backendGet(`/dataset/search?dataset=${name}`)))
}
