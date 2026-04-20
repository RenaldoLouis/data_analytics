import { backendPost, proxy } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

export async function POST() {
    return proxy(async () => {
        const data = await backendPost('/auth/authenticate', {})
        return NextResponse.json(data)
    })
}
