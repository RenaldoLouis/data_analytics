// app/api/dataset/route.js
import axios from 'axios';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - no token' }, { status: 401 });
    }

    try {
        const contentType = request.headers.get('content-type');
        const arrayBuffer = await request.arrayBuffer(); // read the body fully
        const buffer = Buffer.from(arrayBuffer);         // convert to Node.js Buffer

        const backendRes = await axios.post(
            `${process.env.BACKEND_URL}/dataset`,
            buffer,
            {
                headers: {
                    'Content-Type': contentType,
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return NextResponse.json(backendRes.data, { status: backendRes.status });

    } catch (error) {
        console.error('Upload proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}
