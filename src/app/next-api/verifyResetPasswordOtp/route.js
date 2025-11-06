import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();

    const res = await fetch(`${process.env.BACKEND_URL}/auth/verifyResetPasswordOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
        const dataRes = data.data;

        const response = NextResponse.json({ success: true, data: dataRes });

        return response;
    }

    return NextResponse.json({ error: data.message }, { status: res.status });
}
