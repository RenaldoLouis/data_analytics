import { backendGet, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const sp = new URL(request.url).searchParams
    const params = new URLSearchParams()
    for (const key of ['brandId', 'skuId', 'periodMonth', 'periodYear']) {
        if (sp.get(key)) params.set(key, sp.get(key))
    }
    return proxy(async () => NextResponse.json(await backendGet(`/pl/lookup/previous?${params}`)))
}
