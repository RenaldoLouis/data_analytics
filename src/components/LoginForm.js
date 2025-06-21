"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
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
import Image from "next/image";

// Schema
const loginSchema = z.object({
    email: z.string().min(1, "Enter username or registered email"),
    password: z.string().min(1, "Enter password"),
});

export default function LoginForm() {
    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data) => {
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (res.status === 200) {
                toast("Login success", {
                    description: moment().format("dddd, MMMM DD, YYYY [at] h:mm A"),
                });
                router.push("/dashboard");
            } else {
                form.setError("root", {
                    message: "Invalid credentials. Try again.",
                });
            }
        } catch (err) {
            form.setError("root", {
                message: err.message || "Unexpected error occurred.",
            });
        }
    };

    const handleClickFreeTrial = (e) => {
        e.preventDefault();   // stop the form from submitting
        router.push("/register");
    }

    const handleClickDemoVideo = (e) => {
        e.preventDefault();   // stop the form from submitting
        router.push("/requestdemo");
    }

    return (
        <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-center">Login</h2>
            <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                Enter your credentials to access your account
            </p>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email or Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter username or registered email" {...field} />
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
                                    <Input type="password" placeholder="Enter password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="text-right">
                        <a href="#" className="text-sm text-blue-600 hover:underline">
                            Forgot Password
                        </a>
                    </div>

                    {form.formState.errors.root?.message && (
                        <p className="text-red-500 font-semibold text-center">
                            {form.formState.errors.root.message}
                        </p>
                    )}

                    <Button type="submit" className="w-full bg-gray-500 text-white">
                        Login
                    </Button>

                    <div className="flex items-center gap-2 text-gray-400 text-sm my-4">
                        <div className="flex-grow border-t" />
                        <span>or</span>
                        <div className="flex-grow border-t" />
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" className="w-1/2 border-blue-600 text-blue-600 cursor-pointer" onClick={handleClickFreeTrial}>
                            Try Free Trial
                        </Button>
                        <Button type="button" variant="outline" className="w-1/2 border-blue-600 text-blue-600" onClick={handleClickDemoVideo}>
                            Request Free Demo Video
                        </Button>
                    </div>

                    <div className="pt-8 flex justify-center text-gray-500 text-sm">
                        <Image
                            src="/logo.svg"  // Can be a local image (in public folder) or external URL
                            alt="Description of image"
                            width={207}
                            height={28}
                        />
                    </div>
                </form>
            </Form>
        </div>
    );
}
