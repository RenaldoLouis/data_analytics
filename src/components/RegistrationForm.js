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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import services from "@/services";
import { ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from "lucide-react"; // Added icons
import LoadingScreen from "./ui/loadingScreen";

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
        },
    });

    useEffect(() => {
        const fetchPricingPlans = async () => {
            try {
                const res = await services.auth.pricingPlans();

                if (res.status === 200 || res.success) {
                    const pricingPlan = res.data.data.pricingPlans.map((data) => (
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

    console.log("pricingPlans", pricingPlans)

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

            if (res.status === 200) {
                // SUCCESS: Switch to verification view instead of modal
                setRegistrationStep("verification");
            }
            else {
                const errData = await res.error.data;

                let errorMessage = "Registration failed. Try again.";

                // Safely handle different error formats
                if (errData?.message) {
                    if (typeof errData.message === 'string') {
                        errorMessage = errData.message;
                    } else if (typeof errData.message === 'object') {
                        // If message is an object (validation errors), flatten it to a string
                        // e.g. { lastName: "Required", pricingPlan: "Invalid" }
                        errorMessage = Object.values(errData.message).flat().join(", ");
                    }
                }

                form.setError("root", {
                    message: errorMessage,
                });
            }
        } catch (err) {
            setIsLoading(false);
            form.setError("root", {
                message: err.message || "An unexpected error occurred.",
            });
        }
        setIsLoading(false);
    };

    const handleResendEmail = async () => {
        setIsLoading(true);
        const email = form.getValues("email");
        try {
            // Placeholder for your resend service
            await services.auth.resendVerification(email);

            toast(t(`Verification email resent to ${email}`));
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const handleBackToForm = () => {
        setRegistrationStep("form");
    };

    return (
        <div className="h-full w-full max-w-md py-8">
            {isLoading && (
                <LoadingScreen />
            )}

            {/* --- STEP 1: REGISTRATION FORM --- */}
            {registrationStep === "form" && (
                <>
                    <button onClick={() => router.replace("/login")} className="text-sm text-gray-500 mb-4 pt-6 lg:pt-0 hover:text-gray-900 transition-colors flex items-center gap-1">
                        &larr; {t("back")}
                    </button>
                    <h2 className="text-2xl font-bold">{t("tryFree")}</h2>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                            {/* First Name & Last Name */}
                            <div className="lg:flex gap-4 mb-3 lg:mb-6">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem className="w-full lg:w-1/2 mb-3 lg:mb-0">
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
                                        <FormItem className="w-full lg:w-1/2 ">
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
                                    <FormItem className="mb-3 lg:mb-6">
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
                                    <FormItem className="mb-3 lg:mb-6">
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
                                    <FormItem className="mb-3 lg:mb-6">
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
                                    <FormItem className="mb-3 lg:mb-6">
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
                                    <FormItem className="mb-3 lg:mb-6">
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
                                    <FormItem className="mb-3 lg:mb-6">
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
                                    <FormItem className="mb-12">
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

                            {form.formState.errors.root?.message && (
                                <p className="text-red-500 font-bold text-center">{form.formState.errors.root.message}</p>
                            )}

                            <Button type="submit" className="w-full bg-gray-500 text-white">
                                {t("submitForm")}
                            </Button>

                            <div className="pt-3 lg:pt-8 flex justify-center pb-6">
                                <Image src="/logo.svg" alt="Daya Cipta Tech" width={180} height={28} />
                            </div>
                        </form>
                    </Form>
                </>
            )}

            {/* --- STEP 2: VERIFICATION MESSAGE --- */}
            {registrationStep === "verification" && (
                <div className="flex flex-col items-center text-center justify-center h-full animate-in fade-in duration-500">
                    <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Mail className="h-10 w-10 text-blue-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {t("verifyYourEmail") || "Verify your email"}
                    </h2>

                    <p className="text-gray-500 mb-8 max-w-sm">
                        {t("verifyEmailDesc", { email: form.getValues("email") }) ||
                            `Thank you for registering! We have sent a verification link to ${form.getValues("email")}. Please check your inbox.`}
                    </p>

                    <div className="w-full space-y-3">
                        <Button
                            onClick={handleResendEmail}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            {t("resendVerification") || "Resend Verification Link"}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleBackToForm}
                            className="w-full border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("changeEmail") || "Change Email Address"}
                        </Button>
                    </div>

                    <div className="pt-12 flex justify-center">
                        <Image src="/logo.svg" alt="Daya Cipta Tech" width={140} height={22} className="opacity-50" />
                    </div>
                </div>
            )}
        </div>
    );
}