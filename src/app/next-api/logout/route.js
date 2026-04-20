import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (refreshToken) {
        try {
            await fetch(`${process.env.BACKEND_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
        } catch {
            // Best-effort — still clear cookies even if backend call fails
        }
    }

    const response = NextResponse.json({ success: true, message: 'Logout successful' });

    response.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });

    return response;
}
