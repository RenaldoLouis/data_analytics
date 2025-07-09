// src/app/not-found.js

import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function NotFound() {
    // 1. Read the httpOnly cookie on the server
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // 2. If the user is logged in, redirect them
    if (token) {
        redirect('/dashboard');
    }

    // 3. If the user is NOT logged in, show the 404 page
    // This part of the code will only be reached if the token is missing.
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-6xl font-bold">404</h1>
            <p className="text-2xl font-medium mt-4">Page Not Found</p>
            <p className="text-muted-foreground mt-2">
                The page you are looking for does not exist.
            </p>
            <Button asChild className="mt-6">
                <Link href="/">Go Back Home</Link>
            </Button>
        </div>
    );
}