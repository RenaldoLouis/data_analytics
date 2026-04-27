import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const protectedRoutes = ['/admin'];
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

    // User is considered authenticated if they have either token.
    // The refresh flow handles issuing a new access_token when it's expired.
    const hasSession =
        !!req.cookies.get('access_token')?.value ||
        !!req.cookies.get('refresh_token')?.value;

    const startsWith = (base) => pathNoLocale === base || pathNoLocale.startsWith(`${base}/`);
    const isPublic = publicRoutes.some(startsWith);
    const isProtected = protectedRoutes.some(startsWith);
    const isLocaleRoot = pathNoLocale === '/';
    const isDashboard = startsWith('/dashboard');

    if (isDashboard) {
        return NextResponse.redirect(new URL(`/${locale}/pricingCalculator/sku`, req.url));
    }

    if (hasSession && (isPublic || isLocaleRoot)) {
        return NextResponse.redirect(new URL(`/${locale}/pricingCalculator/sku`, req.url));
    }

    if (!hasSession && (isProtected || isLocaleRoot)) {
        return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    return i18n(req);
}

export const config = {
    matcher: ['/((?!next-api|_next/static|_next/image|.*\\..*|_vercel).*)']
};
