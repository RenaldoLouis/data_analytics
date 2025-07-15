import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // Create a response object with a success message
        const response = NextResponse.json({
            message: "Logout successful",
            success: true,
        });

        // Set the 'token' cookie with an expiration date in the past
        // Setting maxAge to 0 tells the browser to expire it immediately.
        response.cookies.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // <-- The key to "deleting" the cookie
            path: '/',
        });

        return response;

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}