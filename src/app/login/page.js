import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
    return (
        <main className="flex h-screen items-center justify-center bg-[#f3f4f6]"> {/* Light gray bg */}
            <div className="flex w-[90%] max-w-6xl h-[85%] rounded-[2rem] overflow-hidden shadow-lg">
                {/* Left Side */}
                <div className="w-1/2 bg-[#071d34] flex items-center justify-center rounded-[2rem]">
                    <div className="w-full h-full bg-[url('/login.jpg')] bg-no-repeat bg-cover rounded-[2rem]" />
                </div>

                {/* Right Side (Login Form) */}
                <div className="w-1/2 bg-white flex items-center justify-center px-12">
                    <LoginForm />
                </div>
            </div>
        </main>

    );
}
