import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const backendRes = await axios.get(`${process.env.BACKEND_URL}/pricing-plans`);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        console.error('Pricing plans GET proxy error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal Server Error';
        return NextResponse.json({ message }, { status });
    }
}
