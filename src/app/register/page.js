import RegistrationForm from "@/components/RegistrationForm";

export default function RegisterPage() {
    return (
        <main className="flex h-screen items-center justify-center bg-[#f3f4f6]">
            <div className="flex w-[90%] max-w-6xl h-[85%] rounded-[2rem] overflow-hidden shadow-lg">
                {/* Left Side (Background Image) */}
                <div className="w-1/2 bg-[#071d34] flex items-center justify-center rounded-[2rem]">
                    <div className="w-full h-full bg-[url('/login.jpg')] bg-no-repeat bg-cover rounded-[2rem]" />
                </div>

                {/* Right Side (Form) */}
                <div className="w-1/2 bg-white flex items-center justify-center px-12 overflow-y-auto">
                    <RegistrationForm />
                </div>
            </div>
        </main>
    );
}
