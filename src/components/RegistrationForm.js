"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import services from "@/services";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from "lucide-react"; // Added icons
import LoadingScreen from "./ui/loadingScreen";
import PrivacyPolicyModal from "./PrivacyPolicyModal";

const registrationSchema = (t) => z.object({
    firstName: z.string().min(4, t("minimumFirstName")),
    lastName: z.string().min(4, t("minimumLastName")),
    phone: z.string().min(8, t("minimumPhone")),
    email: z.string().email(t("invalidEmail")),
    username: z.string().optional(),
    companyName: z.string().min(1, t("enterCompanyName") || "Company Name is required"),
    package: z.string().min(1, t("selectPackage") || "Please select a package"),
    password: z.string().min(6, t("minimumPassword")),
    confirmPassword: z.string().min(1, t("confirmPasswordRequired") || "Please confirm your password"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
        message: t("agreeToTermsRequired") || "You must agree to the Terms & Conditions",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordsDoNotMatch") || "Passwords do not match",
    path: ["confirmPassword"],
});

export default function RegistrationForm() {
    const t = useTranslations("registrationpage");
    const router = useRouter();

    // State to control the flow: "form" | "verification"
    const [registrationStep, setRegistrationStep] = useState("form");

    const [isLoading, setIsLoading] = useState(false);

    // State for toggling password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [pricingPlans, setPricingPlans] = useState(null);
    const [termsOpen, setTermsOpen] = useState(false);

    const form = useForm({
        resolver: zodResolver(registrationSchema(t)),
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            username: "",
            companyName: "",
            package: "",
            password: "",
            confirmPassword: "",
            agreeToTerms: false,
        },
    });

    const agreedToTerms = form.watch("agreeToTerms");

    useEffect(() => {
        const fetchPricingPlans = async () => {
            try {
                const res = await services.auth.pricingPlans();

                if (res?.success) {
                    const pricingPlan = res.data.pricingPlans.map((data) => (
                        { id: data.id, name: data.name }
                    ))
                    setPricingPlans(pricingPlan || []);
                }
            } catch (err) {
                console.error("Failed to fetch pricing plans:", err);
            }
        };
        fetchPricingPlans();
    }, []);

    const onSubmit = async (data) => {
        setIsLoading(true);
        const tempData = {
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            companyName: data.companyName,
            pricingPlan: data.package,
        };

        try {
            const res = await services.auth.register(tempData);

            if (res?.success) {
                // SUCCESS: Switch to verification view instead of modal
                setRegistrationStep("verification");
            }
            else {
                applyApiError(extractApiError(res));
            }
        } catch (err) {
            applyApiError(extractApiError(err));
        }
        setIsLoading(false);
    };

    // Pull the human-readable message out of the various shapes the API/axios can return.
    // services.auth.register resolves to { error: <axios response> } on failure, so the
    // real message lives at res.error.data.message.
    const extractApiError = (res) => {
        const data = res?.error?.data ?? res?.response?.data ?? res?.error ?? res?.data ?? res;
        let msg = data?.message ?? data?.error;
        if (msg && typeof msg === "object") {
            // Validation map e.g. { email: "Required", pricingPlan: "Invalid" }
            msg = Object.values(msg).flat().join(", ");
        }
        return typeof msg === "string" && msg.trim() ? msg.trim() : null;
    };

    // Localize known cases, surface the real message otherwise, and highlight the
    // relevant field when we can identify it.
    const applyApiError = (rawMessage) => {
        const lower = (rawMessage || "").toLowerCase();
        const isDuplicate = lower.includes("already registered") || lower.includes("already exist") || lower.includes("sudah terdaftar");

        const message = isDuplicate
            ? (t("accountAlreadyRegistered") || "This email is already registered. Try logging in instead.")
            : (rawMessage || t("registrationFailedRetry") || "Registration failed. Please try again.");

        if (isDuplicate) {
            form.setError("email", { message }, { shouldFocus: true });
        }
        form.setError("root", { message });
    };

    const handleResendEmail = async () => {
        setIsLoading(true);
        const email = form.getValues("email");
        try {
            await services.auth.resendVerification(email);
            toast.success(t("verifyEmailResent", { email }));
        } catch (error) {
            console.error(error);
            toast.error(t("verifyEmailResendFailed"));
        }
        setIsLoading(false);
    };

    const handleBackToForm = () => {
        setRegistrationStep("form");
    };

    return (
        <div className="h-full w-full max-w-md pt-2 pb-2">
            {isLoading && (
                <LoadingScreen />
            )}

            <PrivacyPolicyModal open={termsOpen} onOpenChange={setTermsOpen} />

            {/* --- STEP 1: REGISTRATION FORM --- */}
            {registrationStep === "form" && (
                <>
                    <button onClick={() => router.replace("/login")} className="text-sm text-gray-500 mb-4 pt-0 hover:text-gray-900 transition-colors flex items-center gap-1">
                        &larr; {t("back")}
                    </button>
                    <h2 className="text-2xl font-bold">{t("tryFree")}</h2>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-8">
                            {/* First Name & Last Name */}
                            <div className="flex flex-col lg:flex-row gap-5">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem className="w-full lg:flex-1">
                                            <FormLabel>{t("firstName")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("firstNamePlaceholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem className="w-full lg:flex-1">
                                            <FormLabel>{t("lastName")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("lastNamePlaceholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Phone */}
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("mobilePhone")}</FormLabel>
                                        <FormControl>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-3 text-sm bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                                                    +62
                                                </span>
                                                <Input
                                                    {...field}
                                                    placeholder={t("mobilePhonePlaceholder")}
                                                    className="rounded-l-none"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Email */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("email")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("emailPlaceholder")} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Username */}
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("createUsername")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("usernamePlaceholder")} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Company Name */}
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("companyName") || "Company Name"}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("companyNamePlaceholder") || "Enter your company name"} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Package Selection */}
                            <FormField
                                control={form.control}
                                name="package"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("package") || "Select Package"}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("selectPackagePlaceholder") || "Select a package"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {pricingPlans?.map((data) => (
                                                    <SelectItem key={data.id} value={data.id}>{data.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Password */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("createPassword")}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder={t("passwordPlaceholder")}
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Confirm Password */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("confirmPassword") || "Re-enter Password"}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder={t("confirmPasswordPlaceholder") || "Re-enter your password"}
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Agree to Terms & Conditions */}
                            <FormField
                                control={form.control}
                                name="agreeToTerms"
                                render={({ field }) => (
                                    <FormItem className="pt-2">
                                        <div className="flex items-start gap-2.5">
                                            <FormControl>
                                                <Checkbox
                                                    id="agreeToTerms"
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="mt-0.5"
                                                />
                                            </FormControl>
                                            <label htmlFor="agreeToTerms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                                                {t("agreePrefix") || "I agree to the"}{" "}
                                                <button
                                                    type="button"
                                                    onClick={() => setTermsOpen(true)}
                                                    className="text-blue-600 font-medium underline hover:text-blue-700"
                                                >
                                                    {t("termsAndConditions") || "Terms & Conditions"}
                                                </button>
                                            </label>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.formState.errors.root?.message && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                                >
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                    <span className="leading-snug">{form.formState.errors.root.message}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={!agreedToTerms}
                                className="w-full h-11 mt-1 bg-gray-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t("submitForm")}
                            </Button>

                            <div className="pt-6 flex justify-center">
                                <Image src="/logo.svg" alt="Sirius" width={120} height={28} />
                            </div>
                        </form>
                    </Form>
                </>
            )}

            {/* --- STEP 2: VERIFICATION MESSAGE --- */}
            {registrationStep === "verification" && (
                <div className="flex flex-col items-center text-center justify-center h-full animate-in fade-in duration-500">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 ring-8 ring-blue-50/40">
                        <Mail className="h-9 w-9 text-blue-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {t("verifyYourEmail") || "Verify your email"}
                    </h2>

                    <p className="text-gray-500 max-w-sm">
                        {t("verifyEmailDesc") || "We've sent a verification link to"}
                    </p>

                    {/* Email chip */}
                    <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2">
                        <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate text-sm font-semibold text-gray-900">
                            {form.getValues("email")}
                        </span>
                    </div>

                    <p className="mt-4 mb-8 max-w-sm text-xs leading-relaxed text-gray-400">
                        {t("verifyEmailHint") || "Click the link in the email to activate your account. Didn't get it? Check your spam folder."}
                    </p>

                    <div className="w-full max-w-sm space-y-3">
                        <Button
                            onClick={handleResendEmail}
                            className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            {t("resendVerification") || "Resend Verification Link"}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleBackToForm}
                            className="w-full h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("changeEmail") || "Change Email Address"}
                        </Button>
                    </div>

                    <div className="pt-12 flex justify-center">
                        <Image src="/logo.svg" alt="Sirius" width={120} height={22} />
                    </div>
                </div>
            )}
        </div>
    );
}