import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();

    const res = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
        const token = data.data;

        const response = NextResponse.json({ success: true, data: token }); // include token if needed

        response.cookies.set('token', token, {
            httpOnly: true,
            // secure: process.env.REACT_APP_ENV === 'production',
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
            path: '/',
        });

        return response;
    }

    return NextResponse.json({ error: data.message }, { status: res.status });
}
