// middleware.js
import { NextResponse } from 'next/server';

export async function middleware(req) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Optional: call your /auth/authenticate API to verify token
    const res = await fetch(`${process.env.BACKEND_URL}/auth/authenticate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

// Apply only to protected routes
export const config = {
    matcher: ['/dashboard', '/', '/admin'], // example protected routes
};
