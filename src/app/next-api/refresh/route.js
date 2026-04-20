import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const IS_PROD = process.env.NODE_ENV === 'production'

const cookieOpts = (maxAge) => ({
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge,
})

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
        return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    try {
        const res = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await res.json();

        if (!res.ok) {
            const response = NextResponse.json({ error: data.message ?? 'Refresh failed' }, { status: 401 });
            response.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
            response.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
            return response;
        }

        const { accessToken, refreshToken: newRefreshToken } = data.data;

        const response = NextResponse.json({ success: true });
        response.cookies.set('access_token', accessToken, cookieOpts(15 * 60));
        response.cookies.set('refresh_token', newRefreshToken, cookieOpts(7 * 24 * 60 * 60));

        return response;
    } catch {
        return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
    }
}
