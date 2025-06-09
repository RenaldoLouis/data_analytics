"use client"
import { setUserAuthToken } from '@/lib/authHelper';
import services from '@/services';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const LoginForm = () => {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleEmailChange = e => setEmail(e.target.value);
    const handlePasswordChange = e => setPassword(e.target.value);
    const clearInputs = () => {
        setEmail("");
        setPassword("");
        setError("");
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        const now = moment();
        const formatted = now.format('dddd, MMMM DD, YYYY [at] h:mm A');

        const payload = {
            email,
            password
        };

        try {
            const res = await services.auth.login(payload);

            if (res.status === 200) {
                toast("Register success", {
                    description: formatted,
                });
                clearInputs();
                setUserAuthToken(res.data.data)
                router.push('/dashboard');
            } else {
                const data = await res.error.data; // assuming API returns JSON with error message
                setError(data?.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col space-y-12 w-full px-32"
        >
            <input
                type="text"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                className="border-b border-b-gray-200 hover:border-b-gray-500"
            />
            <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                className="border-b border-b-gray-200 hover:border-b-gray-500"
            />
            <button
                type="submit"
                className="border rounded-lg px-6 py-2 bg-gray-100 hover:bg-gray-200 duration-300 uppercase text-sm"
            >
                Log in
            </button>
            {error &&
                <p className="text-red-500 font-bold text-center">
                    {error}
                </p>
            }
        </form>
    )
}

export default LoginForm;