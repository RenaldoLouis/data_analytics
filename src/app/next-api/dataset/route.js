// app/api/dataset/route.js
import axios from 'axios';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';


export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }

    const backendUrl = `${process.env.BACKEND_URL}/dataset`;

    try {
        const backendRes = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': request.headers.get('content-type'),
                'Authorization': `Bearer ${token}`,
            },
            body: request.body,
            duplex: 'half',
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });

    } catch (error) {
        console.error('Upload proxy error:', error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }

    try {
        const contentType = request.headers.get('content-type');

        const backendRes = await axios.get(
            `${process.env.BACKEND_URL}/dataset`,
            {
                headers: {
                    'Content-Type': contentType,
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

