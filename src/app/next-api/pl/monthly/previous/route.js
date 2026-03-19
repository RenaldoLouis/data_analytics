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
        const skuId = searchParams.get('skuId');
        const periodMonth = searchParams.get('periodMonth');
        const periodYear = searchParams.get('periodYear');

        const params = new URLSearchParams();
        if (brandId) params.set('brandId', brandId);
        if (skuId) params.set('skuId', skuId);
        if (periodMonth) params.set('periodMonth', periodMonth);
        if (periodYear) params.set('periodYear', periodYear);

        const backendRes = await axios.get(`${process.env.BACKEND_URL}/pl/lookup/previous?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        console.error('PL monthly previous GET proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}
