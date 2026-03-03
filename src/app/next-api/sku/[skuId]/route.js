import axios from 'axios';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }

    try {
        const { skuId } = await params;
        const backendRes = await axios.get(`${process.env.BACKEND_URL}/sku/${skuId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        console.error('SKU GET by ID proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}

export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ success: false, message: 'Unauthorized - no token' }, { status: 401 });
    }

    try {
        const { skuId } = await params;
        const body = await request.json();
        const backendRes = await axios.put(`${process.env.BACKEND_URL}/sku/${skuId}`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return NextResponse.json({ success: true, data: backendRes.data }, { status: backendRes.status });
    } catch (error) {
        console.error('SKU PUT proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status });
    }
}

export async function DELETE(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ success: false, message: 'Unauthorized - no token' }, { status: 401 });
    }

    try {
        const { skuId } = await params;
        const backendRes = await axios.delete(`${process.env.BACKEND_URL}/sku/${skuId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json({ success: true }, { status: backendRes.status });
    } catch (error) {
        console.error('SKU DELETE proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status });
    }
}
