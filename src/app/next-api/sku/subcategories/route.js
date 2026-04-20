import { backendGet, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const categoryId = new URL(request.url).searchParams.get('categoryId')
    const path = categoryId ? `/sku/subcategories?categoryId=${categoryId}` : '/sku/subcategories'
    return proxy(async () => NextResponse.json(await backendGet(path)))
}
