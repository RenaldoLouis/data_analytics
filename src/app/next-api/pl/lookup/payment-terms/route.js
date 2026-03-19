import axios from 'axios';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }

    try {
        const backendRes = await axios.get(`${process.env.BACKEND_URL}/brands/lookup/payment-terms`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}
