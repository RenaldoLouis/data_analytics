// middleware.js
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/', '/admin'];

export async function middleware(req) {
    const pathname = req.nextUrl.pathname;

    // 1. Check if the path is a protected route
    const isProtectedRoute = protectedRoutes.some((route) =>
        // Handle root route ('/') separately and other routes with startsWith
        pathname === route || (route !== '/' && pathname.startsWith(route))
    );

    if (isProtectedRoute) {
        // 2. Run your authentication logic ONLY for protected routes
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // Optional: Verify the token with your backend
        try {
            const res = await fetch(`${process.env.BACKEND_URL}/auth/authenticate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                // If token is invalid, redirect to login
                return NextResponse.redirect(new URL('/login', req.url));
            }
        } catch (error) {
            console.error('Authentication fetch failed:', error);
            // If the auth service is down, you might want to redirect to login or an error page
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    const handleI18nRouting = createIntlMiddleware({
        locales: ['en', 'id'],
        defaultLocale: 'en'
    });

    const response = handleI18nRouting(req);

    return response;
}

// Apply only to protected routes
export const config = {
    matcher: [
        // Skip all paths that should not be internationalized. This includes
        // files with extensions (e.g. .svg) and all paths starting with /next-api, /_next,
        // or /_vercel.
        '/((?!next-api|_next/static|_next/image|.*\\..*|_vercel).*)',
        // Optional: Only run on root (/) URL
        '/'
    ]
};