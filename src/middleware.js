import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/admin'];
const publicRoutes = ['/login', '/register'];

const i18n = createIntlMiddleware({
    locales: ['en', 'id'],
    defaultLocale: 'en'
});

export async function middleware(req) {
    const url = req.nextUrl;
    const pathname = url.pathname; // /, /en, /en/login, /en/dashboard
    const locale = pathname.match(/^\/(en|id)(?=\/|$)/)?.[1] ?? 'en';
    const pathNoLocale = pathname.replace(/^\/(en|id)(?=\/|$)/, '') || '/';
    const token = req.cookies.get('token')?.value;

    const startsWith = (base) => pathNoLocale === base || pathNoLocale.startsWith(`${base}/`);
    const isPublic = publicRoutes.some(startsWith);
    const isProtected = protectedRoutes.some(startsWith);
    const isLocaleRoot = pathNoLocale === '/';

    // 1) Public pages: never auth-check; if logged in, bounce to dashboard.
    if (isPublic) {
        if (token) {
            // If the user is logged in and on a public page, send them to the dashboard.
            return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
        }
        // Otherwise, if they are not logged in on a public page, just let them be.
        return i18n(req);
    }

    // 2) Protected (or locale root) with no token -> go to login
    if (!token && (isProtected || isLocaleRoot)) {
        return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    // 3) Verify token only on protected/root and only if we have one
    if (token && (isProtected || isLocaleRoot)) {
        try {
            const res = await fetch(`${process.env.BACKEND_URL}/auth/authenticate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                // IMPORTANT: delete the token so /login doesn't bounce back to /dashboard
                const resp = NextResponse.redirect(new URL(`/${locale}/login`, req.url));
                resp.cookies.delete('token'); // same path/domain as you set it
                return resp;
            }
        } catch {
            const resp = NextResponse.redirect(new URL(`/${locale}/login`, req.url));
            resp.cookies.delete('token');
            return resp;
        }
    }

    // 4) Default: locale handling
    return i18n(req);
}

export const config = {
    // exclude real API routes
    matcher: ['/((?!next-api|_next/static|_next/image|.*\\..*|_vercel).*)']
};
