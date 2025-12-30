'use client';

import LoginForm from "@/components/LoginForm";
import { useIsMobile } from "@/hooks/use-mobile";

export default function LoginPage() {
    const isMobile = useIsMobile();

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f3f4f6] py-8">
            <div className="flex w-full lg:w-[90%] lg:max-w-6xl min-h-[600px] lg:h-[85vh] lg:max-h-[900px] lg:rounded-[2rem] overflow-hidden shadow-lg">
                {!isMobile && (
                    <div className="w-1/2 bg-white flex items-center justify-center rounded-[2rem]">
                        <div className="w-full h-full bg-[url('/login.jpg')] bg-no-repeat bg-cover " />
                    </div>
                )}

                {/* Scrollable container with padding */}
                <div className="w-full lg:w-1/2 bg-white overflow-y-auto">
                    <div className="flex items-center justify-center min-h-full px-8 lg:px-12 py-8">
                        <LoginForm />
                    </div>
                </div>
            </div>
        </main>

    );
}
