"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import services from "@/services";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function VerificationForm() {
    const t = useTranslations("verification"); // Ensure you have translations or fallback
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    // States: 'idle' | 'loading' | 'success' | 'error'
    const [status, setStatus] = useState("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // Prevent double-firing in React 18 Strict Mode
    const processedToken = useRef(null);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMessage("No verification token found.");
            return;
        }

        if (processedToken.current === token) return;
        processedToken.current = token;

        const verifyEmail = async () => {
            setStatus("loading");
            try {
                const res = await services.auth.verifyEmail(token);

                if (res.status === 200) {
                    setStatus("success");
                    // Auto redirect after 3 seconds
                    setTimeout(() => {
                        router.push("/login");
                    }, 3000);
                } else {
                    setStatus("error");
                    setErrorMessage(res.error?.message || "Verification failed. Token might be expired.");
                }
            } catch (error) {
                setStatus("error");
                setErrorMessage(error.message || "An unexpected error occurred.");
            }
        };

        verifyEmail();
    }, [token, router]);

    const handleGoToLogin = () => {
        router.push("/login");
    };

    return (
        <div className="flex flex-col items-center justify-center text-center w-full max-w-md p-6 animate-in fade-in zoom-in duration-500">

            {/* --- LOADING STATE --- */}
            {status === "loading" && (
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">Verifying your email...</h2>
                        <p className="text-gray-500">Please wait while we validate your secure token.</p>
                    </div>
                </div>
            )}

            {/* --- SUCCESS STATE --- */}
            {status === "success" && (
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                        <p className="text-gray-500">
                            Thank you for verifying your email address. Your account is now active.
                        </p>
                        <p className="text-sm text-gray-400 pt-2">
                            Redirecting to login in a few seconds...
                        </p>
                    </div>
                    <Button
                        onClick={handleGoToLogin}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Go to Login Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* --- ERROR STATE --- */}
            {status === "error" && (
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            {errorMessage || "The link is invalid or has expired."}
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Button
                            onClick={handleGoToLogin}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        >
                            Back to Login
                        </Button>
                        {/* Optional: Add a 'Resend Link' button logic here if needed */}
                    </div>
                </div>
            )}
        </div>
    );
}