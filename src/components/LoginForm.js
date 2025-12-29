"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import LoadingScreen from "./ui/loadingScreen";
import { Small } from "./ui/typography";

// Schema
const loginSchema = (t) => z.object({
    email: z.string().min(1, t("emailPlaceholder")),
    password: z.string().min(1, t("passwordPlaceholder")),
});

const forgotEmailSchema = (t) => z.object({
    email: z.string().email({ message: t("invalidEmail") || "Invalid email address" }),
});

const forgotOTPSchema = (t) => z.object({
    otp: z.string().min(6, { message: t("otpMinLength") || "OTP must be 6 digits" }).max(6, { message: t("otpMinLength") || "OTP must be 6 digits" }),
});

const newPasswordSchema = (t) => z.object({
    password: z.string().min(8, { message: t("passwordMinLength") || "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: t("passwordsNoMatch") || "Passwords do not match",
    path: ["confirmPassword"],
});


const languages = [
    { code: 'en', name: 'English', flag: '/images/img_gb.svg' },
    { code: 'id', name: 'Bahasa', flag: '/images/img_id.svg' }
];


export default function LoginForm() {
    const t = useTranslations("loginpage");
    const locale = useLocale(); // Get current active language ('en' or 'id')
    const router = useRouter();
    const pathname = usePathname();

    const loginForm = useForm({
        resolver: zodResolver(loginSchema(t)),
        defaultValues: { email: "", password: "" },
    });

    const forgotEmailForm = useForm({
        resolver: zodResolver(forgotEmailSchema(t)),
        defaultValues: { email: "" },
    });

    const forgotOTPForm = useForm({
        resolver: zodResolver(forgotOTPSchema(t)),
        defaultValues: { otp: "" },
    });

    const newPasswordForm = useForm({
        resolver: zodResolver(newPasswordSchema(t)),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const [formView, setFormView] = useState('LOGIN'); // 'LOGIN', 'FORGOT_EMAIL', 'FORGOT_OTP', 'NEW_PASSWORD'
    const [resetEmail, setResetEmail] = useState('');
    const [resetOTP, setResetOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const onLoginSubmit = async (data) => {
        setIsLoading(true);
        try {
            const res = await fetch("/next-api/login", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (res.status === 200) {
                router.replace("/dashboard");
            } else {
                setIsLoading(false);
                loginForm.setError("root", { message: t("invalidCredentials") });
            }
        } catch (err) {
            setIsLoading(false);
            loginForm.setError("root", { message: err.message || "Unexpected error occurred." });
        }
    };

    const onForgotEmailSubmit = async (data) => {
        setIsLoading(true);
        try {
            const res = await fetch("/next-api/resetpasswordotp", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (res.status === 200) {
                setResetEmail(data.email);
                setFormView('FORGOT_OTP');
                setIsLoading(false);

            } else {
                const errData = await res.json();
                forgotEmailForm.setError("root", {
                    message: errData?.message || "Email not found. Try again.",
                });
                setIsLoading(false);
            }
        } catch (err) {
            forgotEmailForm.setError("root", {
                message: err.message || "An unexpected error occurred.",
            });
            setIsLoading(false);
        }
    };

    const onOTPSubmit = async (data) => {
        const dataToSend = { otp: data.otp, email: resetEmail }
        setIsLoading(true);
        try {
            const res = await fetch("/next-api/verifyResetPasswordOtp", {
                method: "POST",
                body: JSON.stringify(dataToSend),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (res.status === 200) {
                setResetOTP(data.otp)
                setFormView('NEW_PASSWORD'); // Pindah ke tampilan password baru
                setIsLoading(false);
            } else {
                const errData = await res.json();
                forgotOTPForm.setError("root", {
                    message: errData?.message || "Invalid OTP code. Try again.",
                });
                setIsLoading(false);
            }
        } catch (err) {
            forgotOTPForm.setError("root", {
                message: err.message || "An unexpected error occurred.",
            });
            setIsLoading(false);
        }
    };

    const onNewPasswordSubmit = async (data) => {
        const dataToSend = { otp: resetOTP, email: resetEmail, newPassword: data.password }
        setIsLoading(true);
        try {
            const res = await fetch("/next-api/resetPassword", {
                method: "POST",
                body: JSON.stringify(dataToSend),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (res.status === 200) {

                setFormView('LOGIN'); // Kembali ke login
                setResetEmail('');
                setIsLoading(false);
            } else {
                const errData = await res.json();
                newPasswordForm.setError("root", {
                    message: errData?.message || "Error setting password. Try again.",
                });
                setIsLoading(false);
            }
        } catch (err) {
            newPasswordForm.setError("root", {
                message: err.message || "An unexpected error occurred.",
            });
            setIsLoading(false);
        }
    };

    const handleClickFreeTrial = (e) => {
        e.preventDefault();   // stop the form from submitting
        router.replace("/register");
    }

    const handleClickDemoVideo = (e) => {
        e.preventDefault();   // stop the form from submitting
        router.replace("/requestdemo");
    }

    const BackToLoginButton = () => (
        <Button
            type="button"
            variant="link"
            className="w-full text-blue-600"
            onClick={() => {
                setFormView('LOGIN');
                // Reset semua form error jika ada
                forgotEmailForm.clearErrors();
                forgotOTPForm.clearErrors();
                newPasswordForm.clearErrors();
            }}
        >
            {t("backToLogin")}
        </Button>
    );

    const changeLanguage = (newLocale) => {
        if (newLocale === locale) return;

        // Replaces the current locale path segment (e.g., /en/login -> /id/login)
        const newPath = pathname.replace(/^\/(en|id)/, `/${newLocale}`);
        router.replace(newPath);
    };

    return (
        <div className="w-full max-w-md">
            <div className="flex w-full mb-6">
                <div className="flex items-center gap-2 text-sm">
                    <button
                        type="button"
                        onClick={() => changeLanguage('en')}
                        className={`cursor-pointer transition-colors ${locale === 'en'
                            ? 'font-bold text-gray-900'
                            : 'font-medium text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        EN
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        type="button"
                        onClick={() => changeLanguage('id')}
                        className={`cursor-pointer transition-colors ${locale === 'id'
                            ? 'font-bold text-gray-900'
                            : 'font-medium text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        ID
                    </button>
                </div>
            </div>
            {isLoading && (
                <LoadingScreen />
            )}
            {formView === 'LOGIN' && (
                <div className="mb-11">
                    <h2 className="text-2xl font-bold text-center">Login</h2>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        {t("subtitle")}
                    </p>
                </div>
            )}
            {formView === 'FORGOT_EMAIL' && (
                <div className="mb-11">
                    <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        {t("forgotPasswordSubtitle") || "Enter your email to receive a one-time password."}
                    </p>
                </div>
            )}
            {formView === 'FORGOT_OTP' && (
                <div className="mb-11">
                    <h2 className="text-2xl font-bold text-center">Enter OTP</h2>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        {t("otpSent", { email: resetEmail }) || `An OTP has been sent to ${resetEmail}`}
                    </p>
                </div>
            )}
            {formView === 'NEW_PASSWORD' && (
                <div className="mb-11">
                    <h2 className="text-2xl font-bold text-center">Create New Password</h2>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        {t("createNewPasswordSubtitle") || "Please create a new password for your account."}
                    </p>
                </div>
            )}

            {formView === 'LOGIN' && (
                <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5 mt-6">
                        <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="mb-11">
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("emailPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="mb-11">
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                // 1. Toggle type based on state
                                                type={showPassword ? "text" : "password"}
                                                placeholder={t("passwordPlaceholder")}
                                                {...field}
                                            />
                                            {/* 2. Toggle Button */}
                                            <button
                                                type="button" // Important: prevents form submission
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="text-left mb-11">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setFormView('FORGOT_EMAIL');
                                }}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {t("forgotPassword")}
                            </a>
                        </div>
                        {loginForm.formState.errors.root?.message && (
                            <p className="text-red-500 font-semibold text-center">
                                {loginForm.formState.errors.root.message}
                            </p>
                        )}
                        <Button type="submit" className="w-full bg-gray-500 text-white mb-0">
                            Login
                        </Button>
                        <div className="flex items-center gap-2 text-gray-400 text-sm my-11">
                            <div className="flex-grow border-t" />
                            <span>{t("or")}</span>
                            <div className="flex-grow border-t" />
                        </div>
                        <Small className="mb-4 font-normal">
                            Not have an account yet?
                        </Small>

                        <div className="flex gap-3">

                            <Button type="button" variant="outline" className="w-1/2 border-blue-600 text-blue-600 cursor-pointer" onClick={handleClickFreeTrial}>
                                {t("tryFreeTrial")}
                            </Button>
                            <Button type="button" variant="outline" className="w-1/2 border-blue-600 text-blue-600 cursor-pointer" onClick={handleClickDemoVideo}>
                                {t("requestFreeDemo")}
                            </Button>
                        </div>
                    </form>
                </Form>
            )
            }

            {
                formView === 'FORGOT_EMAIL' && (
                    <Form {...forgotEmailForm}>
                        <form onSubmit={forgotEmailForm.handleSubmit(onForgotEmailSubmit)} className="space-y-5 mt-6">
                            <FormField
                                control={forgotEmailForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="mb-11">
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("emailPlaceholder")} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {forgotEmailForm.formState.errors.root?.message && (
                                <p className="text-red-500 font-semibold text-center">
                                    {forgotEmailForm.formState.errors.root.message}
                                </p>
                            )}
                            <Button type="submit" className="w-full bg-blue-600 text-white">
                                {t("sendOTP")}
                            </Button>
                            <BackToLoginButton />
                        </form>
                    </Form>
                )
            }

            {
                formView === 'FORGOT_OTP' && (
                    <Form {...forgotOTPForm}>
                        <form onSubmit={forgotOTPForm.handleSubmit(onOTPSubmit)} className="space-y-5 mt-6">
                            <FormField
                                control={forgotOTPForm.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem className="mb-11">
                                        <FormLabel>OTP Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123456" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {forgotOTPForm.formState.errors.root?.message && (
                                <p className="text-red-500 font-semibold text-center">
                                    {forgotOTPForm.formState.errors.root.message}
                                </p>
                            )}
                            <Button type="submit" className="w-full bg-blue-600 text-white">
                                {t("verifyOTP")}
                            </Button>
                            <BackToLoginButton />
                        </form>
                    </Form>
                )
            }

            {
                formView === 'NEW_PASSWORD' && (
                    <Form {...newPasswordForm}>
                        <form onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)} className="space-y-5 mt-6">

                            {/* Field 1: New Password */}
                            <FormField
                                control={newPasswordForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="mb-11">
                                        <FormLabel>{t("newPassword")}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showNewPassword ? "text" : "password"}
                                                    placeholder="********"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Field 2: Confirm Password */}
                            <FormField
                                control={newPasswordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="mb-11">
                                        <FormLabel>{t("confirmNewPassword")}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="********"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {newPasswordForm.formState.errors.root?.message && (
                                <p className="text-red-500 font-semibold text-center">
                                    {newPasswordForm.formState.errors.root.message}
                                </p>
                            )}
                            <Button type="submit" className="w-full bg-blue-600 text-white">
                                {t("setNewPassword")}
                            </Button>
                            <BackToLoginButton />
                        </form>
                    </Form>
                )
            }
            <div className="pt-12 flex justify-center">
                <Image src="/logo.svg" alt="Sirius" width={120} height={22} />
            </div>
        </div >
    );
}
