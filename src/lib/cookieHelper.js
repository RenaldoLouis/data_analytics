'use client';

import Cookies from 'js-cookie';

// Constants
const COOKIE_KEYS = {
    AUTH_TOKEN: 'token',
    USER_DETAILS: 'user_details',
};

// Auth Token (Client-side)
export function getUserAuthTokenCookie(ctxReq) {
    if (ctxReq) {
        const cookies = parse(ctxReq.headers.cookie || '');
        return cookies.token || null;
    }

    // Client-side (won’t work with HttpOnly!)
    if (typeof window !== 'undefined') {
        const match = document.cookie.match(/(^| )token=([^;]+)/);
        return match ? match[2] : null;
    }

    return null;
}
// export const setUserAuthTokenCookie = (token, options = {}) => {
//     Cookies.set(COOKIE_KEYS.AUTH_TOKEN, token, {
//         path: '/',
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'Lax',
//         ...options,
//     });
// };

export const removeUserAuthTokenCookie = () => Cookies.remove(COOKIE_KEYS.AUTH_TOKEN);
