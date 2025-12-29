import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/admin'];
const publicRoutes = ['/login', '/register'];

const i18n = createIntlMiddleware({
    locales: ['en', 'id'],
    defaultLocale: 'en'
});

export function middleware(req) {
    const url = req.nextUrl;
    const pathname = url.pathname;
    const locale = pathname.match(/^\/(en|id)(?=\/|$)/)?.[1] ?? 'en';
    const pathNoLocale = pathname.replace(/^\/(en|id)(?=\/|$)/, '') || '/';

    // Check purely for cookie existence (fast)
    const token = req.cookies.get('token')?.value;

    const startsWith = (base) => pathNoLocale === base || pathNoLocale.startsWith(`${base}/`);
    const isPublic = publicRoutes.some(startsWith);
    const isProtected = protectedRoutes.some(startsWith);
    const isLocaleRoot = pathNoLocale === '/';

    // 1. If User has token AND tries to access Public Page (Login) -> Go to Dashboard
    if (isPublic && token) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }

    // 2. If User has NO token AND tries to access Protected Page -> Go to Login
    if (!token && (isProtected || isLocaleRoot)) {
        return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    // 3. Otherwise, perform standard localization
    return i18n(req);
}

export const config = {
    // exclude real API routes
    matcher: ['/((?!next-api|_next/static|_next/image|.*\\..*|_vercel).*)']
};
