import { backendGet, backendPost, getToken, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export const config = { api: { bodyParser: false } }

export async function POST(request) {
    return proxy(async () => {
        const token = await getToken()
        const contentType = request.headers.get('content-type')
        const buffer = Buffer.from(await request.arrayBuffer())
        const data = await backendPost('/dataset', buffer, {
            headers: { 'Content-Type': contentType, Authorization: `Bearer ${token}` },
        })
        return NextResponse.json(data)
    })
}

export async function GET() {
    return proxy(async () => NextResponse.json(await backendGet('/dataset')))
}
