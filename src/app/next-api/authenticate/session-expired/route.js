import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
    // 1. Delete the token cookie
    const cookieStore = await cookies();
    cookieStore.delete("token");

    // 2. Get the locale to redirect correctly (default to 'en')
    // We try to parse it from the referer or default to 'en'
    const referer = request.headers.get("referer");
    let locale = "en";
    if (referer) {
        const match = referer.match(/\/(en|id)\//);
        if (match) locale = match[1];
    }

    // 3. Redirect back to login
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
}