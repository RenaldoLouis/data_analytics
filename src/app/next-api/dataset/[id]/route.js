import axios from 'axios';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
    const { params } = context;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || 10;
    const page = searchParams.get('page') || 1;

    try {
        const backendRes = await axios.get(
            `${process.env.BACKEND_URL}/dataset/contents/${id}?limit=${limit}&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return NextResponse.json(backendRes.data, { status: backendRes.status });

    } catch (error) {
        console.error('GET /dataset/:id proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}

export async function DELETE(request, context) {
    const { params } = context;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }
    const { id } = await params;

    try {
        const backendRes = await axios.delete(
            `${process.env.BACKEND_URL}/dataset/dataset/${id}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return NextResponse.json(backendRes.data, { status: backendRes.status });

    } catch (error) {
        console.error('Dataset GET proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}

