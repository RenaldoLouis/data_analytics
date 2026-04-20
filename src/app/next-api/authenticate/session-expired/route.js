import { NextResponse } from 'next/server';

export async function GET(request) {
    const referer = request.headers.get('referer');
    let locale = 'en';
    if (referer) {
        const match = referer.match(/\/(en|id)(?=\/|$)/);
        if (match) locale = match[1];
    }

    const response = NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    response.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });

    return response;
}
