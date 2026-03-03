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
        const categoryId = searchParams.get('categoryId');
        const url = categoryId
            ? `${process.env.BACKEND_URL}/sku/subcategories?categoryId=${categoryId}`
            : `${process.env.BACKEND_URL}/sku/subcategories`;

        const backendRes = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        console.error('SKU subcategories GET proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}
