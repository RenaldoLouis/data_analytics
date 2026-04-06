import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    try {
        const backendRes = await axios.get(`${process.env.BACKEND_URL}/auth/verify-email`, {
            params: { token },
        });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        console.error('Verify email GET proxy error:', error.message);
        const status = error.response?.status || 500;
        const data = error.response?.data || { message: 'Internal Server Error' };
        return NextResponse.json(data, { status });
    }
}
