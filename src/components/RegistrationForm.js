"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react"; // 1. Import useState
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
import services from "@/services";
import { Check } from "lucide-react"; // 2. Import a check icon

const registrationSchema = z.object({
    // firstName: z.string().min(1, "Enter first name"),
    // lastName: z.string().min(1, "Enter last name"),
    // phone: z.string().min(8, "Enter valid phone number"),
    // email: z.string().email("Invalid email address"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address"),
    username: z.string().optional(),
    // username: z.string().min(3, "Username too short"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function RegistrationForm() {
    const router = useRouter();
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const form = useForm({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            username: "",
            password: "",
        },
    });

    const onSubmit = async (data) => {
        const tempData = {
            email: data.email,
            password: data.password,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
        };
        try {
            const res = await services.auth.register(tempData);

            if (res.status === 200) {
                setIsSuccessModalOpen(true);
                setTimeout(router.push("/login"), 500)
            }
            else {
                const errData = await res.error.data;
                form.setError("root", {
                    message: errData?.message || "Registration failed. Try again.",
                });
            }
        } catch (err) {
            form.setError("root", {
                message: err.message || "An unexpected error occurred.",
            });
        }
    };

    return (
        <div className="w-full max-w-md">
            <button onClick={() => router.replace("/login")} className="text-sm text-gray-500 mb-4 cursor-pointer">&larr; Back</button>
            <h2 className="text-2xl font-bold">Try Free Trial</h2>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                    <div className="flex gap-4 mb-6">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem className="w-1/2">
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter first name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem className="w-1/2">
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter last name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem
                                className="mb-6">
                                <FormLabel>Mobile Phone</FormLabel>
                                <FormControl>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 text-sm bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                                            +62
                                        </span>
                                        <Input
                                            {...field}
                                            placeholder="Enter mobile phone"
                                            className="rounded-l-none"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="mb-6">
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem
                                className="mb-6">
                                <FormLabel>Create username</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter username" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem
                                className="mb-12">
                                <FormLabel>Create Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Enter password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {form.formState.errors.root?.message && (
                        <p className="text-red-500 font-bold text-center">{form.formState.errors.root.message}</p>
                    )}

                    <Button type="submit" className="w-full bg-gray-500 text-white">
                        Submit Form
                    </Button>

                    <div className="pt-8 flex justify-center">
                        <Image src="/logo.svg" alt="Daya Cipta Tech" width={180} height={28} />
                    </div>
                </form>
            </Form>

            <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
                <DialogContent className="sm:max-w-md p-8 text-center">
                    <DialogHeader className="space-y-4 items-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-10 w-10 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">
                            Thank you for Signing Up!
                        </DialogTitle>
                        <DialogDescription>
                            We&apos;ll contact through your registered email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6">
                        <Button
                            onClick={() => router.push("/")} // Navigate to home or another page
                            className="w-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
                        >
                            Back to Home
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
