import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();

    try {
        const backendRes = await axios.post(`${process.env.BACKEND_URL}/auth/register`, body, {
            headers: { 'Content-Type': 'application/json' },
        });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        console.error('Register POST proxy error:', error.message);
        const status = error.response?.status || 500;
        const data = error.response?.data || { message: 'Internal Server Error' };
        return NextResponse.json(data, { status });
    }
}
