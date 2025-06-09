"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { setUserAuthToken } from "@/lib/authHelper";
import services from "@/services";

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

// Validation schema using zod
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

const LoginForm = () => {
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data) => {
        const formatted = moment().format("dddd, MMMM DD, YYYY [at] h:mm A");

        try {
            const res = await services.auth.login(data);

            if (res.status === 200) {
                toast("Login success", {
                    description: formatted,
                });

                setUserAuthToken(res.data.data);
                router.push("/dashboard");
            } else {
                const errData = await res.error?.data;
                form.setError("root", {
                    message: errData?.message || "Login failed. Please try again.",
                });
            }
        } catch (err) {
            form.setError("root", {
                message: err.message || "An unexpected error occurred.",
            });
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col space-y-6 w-full max-w-md px-6"
            >
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter your email address" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="Enter your password"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {form.formState.errors.root?.message && (
                    <p className="text-red-500 font-bold text-center">
                        {form.formState.errors.root.message}
                    </p>
                )}

                <Button type="submit" className="w-full">
                    Log In
                </Button>
            </form>
        </Form>
    );
};

export default LoginForm;
