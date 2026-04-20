import { proxy, publicPost } from '@/lib/backendClient'
import { NextResponse } from 'next/server'

const IS_PROD = process.env.NODE_ENV === 'production'

const cookieOpts = (maxAge) => ({
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge,
})

function parseUserAgent(ua = '') {
    let browser = 'Unknown', os = 'Unknown'

    if (/Edg\//.test(ua))                            browser = 'Edge'
    else if (/OPR\/|Opera/.test(ua))                 browser = 'Opera'
    else if (/Chrome\//.test(ua))                    browser = 'Chrome'
    else if (/Firefox\//.test(ua))                   browser = 'Firefox'
    else if (/Safari\//.test(ua))                    browser = 'Safari'

    if (/Windows NT/.test(ua))                       os = 'Windows'
    else if (/Mac OS X/.test(ua))                    os = 'macOS'
    else if (/Android/.test(ua))                     os = 'Android'
    else if (/iPhone|iPad/.test(ua))                 os = 'iOS'
    else if (/Linux/.test(ua))                       os = 'Linux'

    return `${browser} on ${os}`
}

export async function POST(request) {
    const body = await request.json()
    const deviceInfo = parseUserAgent(request.headers.get('user-agent') || '')

    return proxy(async () => {
        const data = await publicPost('/auth/login', { ...body, deviceInfo })
        const { accessToken, refreshToken } = data.data

        const response = NextResponse.json({ success: true })
        response.cookies.set('access_token', accessToken, cookieOpts(15 * 60))
        response.cookies.set('refresh_token', refreshToken, cookieOpts(7 * 24 * 60 * 60))

        return response
    })
}
