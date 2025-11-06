"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import LoadingScreen from "./ui/loadingScreen";

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
    { code: 'id', name: 'Bahasa', flag: '/images/img_id.svg' },
    // { code: 'th', name: 'ภาษาไทย', flag: '/images/img_th.svg' },
    // { code: 'vn', name: 'Tiếng Việt', flag: '/images/img_vn.svg' },
    // { code: 'ko', name: '한국어', flag: '/images/img_kr.svg' },
    // { code: 'ja', name: '日本語', flag: '/images/img_jp.svg' }
];


export default function LoginForm() {
    const t = useTranslations("loginpage")
    const router = useRouter();

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

    const dropdownRef = useRef(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState({
        code: 'en',
        name: 'English',
        flag: '/images/img_gb.svg'
    });

    const [formView, setFormView] = useState('LOGIN'); // 'LOGIN', 'FORGOT_EMAIL', 'FORGOT_OTP', 'NEW_PASSWORD'
    const [resetEmail, setResetEmail] = useState('');
    const [resetOTP, setResetOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Function to get current language from URL
    const getCurrentLanguageFromURL = () => {
        const path = window.location.pathname;
        const langCode = path.match(/^\/(en|id)/)?.[1];

        if (langCode) {
            return languages.find(lang => lang.code === langCode) || languages[0];
        }

        // If no language code in URL, default to English
        return languages[0];
    };


    // Set isClient to true after component mounts to avoid hydration errors
    useEffect(() => {
        setIsClient(true);
        // Update selected language after client-side hydration
        setSelectedLanguage(getCurrentLanguageFromURL());
    }, []);

    // Update selected language when URL changes (for browser back/forward navigation)
    useEffect(() => {
        if (!isClient) return;

        const handlePopState = () => {
            setSelectedLanguage(getCurrentLanguageFromURL());
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isClient]);

    const selectLanguage = (language) => {
        // Update state immediately for instant UI feedback
        setSelectedLanguage(language);
        setIsDropdownOpen(false);

        // Get current path without language prefix and preserve query params
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const currentHash = window.location.hash;

        // Remove language prefix to get the base path
        const basePath = currentPath.replace(/^\/(en|id)/, '') || '/';

        // Direct redirect based on language code - all languages have prefixes
        let redirectUrl;
        switch (language.code) {
            case 'en':
                redirectUrl = '/en' + (basePath === '/' ? '' : basePath);
                break;
            case 'id':
                redirectUrl = '/id' + (basePath === '/' ? '' : basePath);
                break;
        }

        // Add search params and hash back
        const finalUrl = redirectUrl + currentSearch + currentHash;

        // Only redirect if URL is different
        if (finalUrl !== (currentPath + currentSearch + currentHash)) {
            window.location.href = finalUrl;
        }
    };

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
        console.log("dataToSend", dataToSend)
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
        console.log('data', data)
        const dataToSend = { otp: resetOTP, email: resetEmail, newPassword: data.password }
        console.log("dataToSend", dataToSend)
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

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

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

    return (
        <div className="w-full max-w-md">
            {isLoading && (
                <LoadingScreen />
            )}
            {formView === 'LOGIN' && (
                <>
                    <h2 className="text-2xl font-bold text-center">Login</h2>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        {t("subtitle")}
                    </p>
                </>
            )}
            {formView === 'FORGOT_EMAIL' && (
                <>
                    <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        {t("forgotPasswordSubtitle") || "Enter your email to receive a one-time password."}
                    </p>
                </>
            )}
            {formView === 'FORGOT_OTP' && (
                <>
                    <h2 className="text-2xl font-bold text-center">Enter OTP</h2>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        {t("otpSent", { email: resetEmail }) || `An OTP has been sent to ${resetEmail}`}
                    </p>
                </>
            )}
            {formView === 'NEW_PASSWORD' && (
                <>
                    <h2 className="text-2xl font-bold text-center">Create New Password</h2>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        {t("createNewPasswordSubtitle") || "Please create a new password for your account."}
                    </p>
                </>
            )}

            <div className="relative" ref={dropdownRef}>
                <div
                    onClick={toggleDropdown}
                    className="flex justify-center items-center gap-[6px] sm:gap-[12px] cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <div className="flex justify-center items-center gap-[4px] sm:gap-[8px]">
                        <Image
                            src={selectedLanguage.flag}
                            alt={`${selectedLanguage.name} Flag`}
                            width={28}
                            height={28}
                            className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] md:w-[28px] md:h-[28px] rounded-full border border-gray-200"
                        />
                        <span className="text-sm font-tiktok font-medium leading-[14px] sm:leading-[16px] md:leading-[18px] text-center text-global-6">
                            {selectedLanguage.name}
                        </span>
                    </div>
                    <Image
                        src="/images/img_arrow_down.svg"
                        alt="Dropdown Arrow"
                        width={24}
                        height={24}
                        className={`w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] md:w-[24px] md:h-[24px] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                            }`}
                    />
                </div>

                {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[200px] sm:w-[255px] bg-white rounded-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.16)] p-2 sm:p-3 z-50 animate-slideDown origin-top">
                        <div className="flex flex-col gap-1">
                            {languages.map((language) => (
                                <div
                                    key={language.code}
                                    onClick={() => selectLanguage(language)}
                                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-[#DCDCDC] cursor-pointer transition-colors duration-200"
                                >
                                    <Image
                                        src={language.flag}
                                        alt={`${language.name} Flag`}
                                        width={28}
                                        height={28}
                                        className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-gray-200 flex-shrink-0"
                                    />
                                    <span className="text-sm sm:text-base font-medium font-tiktok text-black leading-[18px] sm:leading-[22px] flex-1">
                                        {language.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {formView === 'LOGIN' && (
                <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5 mt-6">
                        <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
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
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder={t("passwordPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="text-right">
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
                        <Button type="submit" className="w-full bg-gray-500 text-white">
                            Login
                        </Button>
                        <div className="flex items-center gap-2 text-gray-400 text-sm my-4">
                            <div className="flex-grow border-t" />
                            <span>{t("or")}</span>
                            <div className="flex-grow border-t" />
                        </div>
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
            )}

            {formView === 'FORGOT_EMAIL' && (
                <Form {...forgotEmailForm}>
                    <form onSubmit={forgotEmailForm.handleSubmit(onForgotEmailSubmit)} className="space-y-5 mt-6">
                        <FormField
                            control={forgotEmailForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
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
            )}

            {formView === 'FORGOT_OTP' && (
                <Form {...forgotOTPForm}>
                    <form onSubmit={forgotOTPForm.handleSubmit(onOTPSubmit)} className="space-y-5 mt-6">
                        <FormField
                            control={forgotOTPForm.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem>
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
            )}

            {formView === 'NEW_PASSWORD' && (
                <Form {...newPasswordForm}>
                    <form onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)} className="space-y-5 mt-6">
                        <FormField
                            control={newPasswordForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("newPassword")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="********" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={newPasswordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("confirmNewPassword")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="********" {...field} />
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
            )}
        </div>
    );
}
