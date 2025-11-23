"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Check, Eye, EyeOff } from "lucide-react"; // Added Eye icons
import LoadingScreen from "./ui/loadingScreen";

const registrationSchema = (t) => z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email(t("invalidEmail")),
    username: z.string().optional(),
    companyName: z.string().min(1, t("enterCompanyName") || "Company Name is required"), // New Field
    package: z.string().min(1, t("selectPackage") || "Please select a package"), // New Field
    password: z.string().min(6, t("minimumPassword")),
    confirmPassword: z.string().min(1, t("confirmPasswordRequired") || "Please confirm your password"), // New Field
}).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordsDoNotMatch") || "Passwords do not match",
    path: ["confirmPassword"],
});

export default function RegistrationForm() {
    const t = useTranslations("registrationpage");
    const router = useRouter();
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // State for toggling password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const onSubmit = async (data) => {
        setIsLoading(true);
        // Construct payload
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
                setIsSuccessModalOpen(true);
            }
            else {
                const errData = await res.error.data;
                form.setError("root", {
                    message: errData?.message || "Registration failed. Try again.",
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

    return (
        <div className="h-full w-full max-w-md py-8">
            {isLoading && (
                <LoadingScreen />
            )}
            <button onClick={() => router.replace("/login")} className="text-sm text-gray-500 mb-4 pt-6 lg:pt-0">&larr; {t("back")}</button>
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

                    {/* Company Name (New Field) */}
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

                    {/* Package Selection (New Field) */}
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
                                        <SelectItem value="freemium">Freemium</SelectItem>
                                        <SelectItem value="essential">Essential</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Password with Toggle */}
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

                    {/* Confirm Password with Toggle */}
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

            <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
                <DialogContent className="sm:max-w-md p-8 text-center" preventClose={true} showCloseButton={false}>
                    <DialogHeader className="space-y-4 items-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-10 w-10 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-center">
                            {t("confirmationTitle")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("confirmationSubtitle")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6">
                        <Button
                            onClick={() => router.push("/login")}
                            className="w-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
                        >
                            {t("backToHome")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}