import { backendGet, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const sp = new URL(request.url).searchParams
    const params = new URLSearchParams()
    if (sp.get('periodYear')) params.set('periodYear', sp.get('periodYear'))
    return proxy(async () => NextResponse.json(await backendGet(`/pl/lookup/taken-months?${params}`)))
}
