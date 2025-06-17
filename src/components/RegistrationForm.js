"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import services from "@/services";

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
        }
        try {
            const res = await services.auth.register(tempData);

            if (res.status === 200) {
                toast("Register success", {
                    description: moment().format("dddd, MMMM DD, YYYY [at] h:mm A"),
                });
                router.push("/login");
            } else {
                const errData = await res.json();
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
            <button onClick={() => router.back()} className="text-sm text-gray-500 mb-4">&larr; Back</button>
            <h2 className="text-2xl font-bold">Try Free Trial</h2>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                    <div className="flex gap-4">
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
                            <FormItem>
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
                            <FormItem>
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
                            <FormItem>
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
                            <FormItem>
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
        </div>
    );
}
