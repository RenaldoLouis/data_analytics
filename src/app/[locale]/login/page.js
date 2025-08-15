'use client';

import LoginForm from "@/components/LoginForm";
import { useIsMobile } from "@/hooks/use-mobile"

export default function LoginPage() {
    const isMobile = useIsMobile();

    return (
        <main className="flex h-screen items-center justify-center bg-[#f3f4f6]"> {/* Light gray bg */}
            <div className="flex w-full lg:w-[90%] lg:max-w-6xl h-full lg:h-[85%] lg:rounded-[2rem] overflow-hidden shadow-lg">
                {/* Left Side */}
                {!isMobile && (
                    <div className="w-1/2 bg-[#071d34] flex items-center justify-center rounded-[2rem]">
                        <div className="w-full h-full bg-[url('/login.jpg')] bg-no-repeat bg-cover rounded-[2rem]" />
                    </div>
                )}

                {/* Right Side (Login Form) */}
                <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-8 lg:px-12">
                    <LoginForm />
                </div>
            </div>
        </main>

    );
}
