import axios from 'axios';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const periodYear = searchParams.get('periodYear');

        const params = new URLSearchParams();
        if (brandId) params.set('brandId', brandId);
        if (periodYear) params.set('periodYear', periodYear);

        const backendRes = await axios.get(`${process.env.BACKEND_URL}/pl/lookup/taken-months?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        console.error('PL taken-months GET proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}
