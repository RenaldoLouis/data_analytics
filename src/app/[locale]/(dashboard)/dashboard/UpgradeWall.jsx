import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Loader2, LockKeyhole, Rocket } from "lucide-react";

export default function UpgradeWall({ currentPlanName, onUpgrade, onClose, limit, status = 'idle' }) {

    // --- TAMPILAN 1: LOADING STATE (SEDANG PROSES) ---
    if (status === 'loading') {
        return (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
                <DialogHeader>
                    <DialogTitle className="py-3">
                        <div className="px-6 p-3">
                            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Processing</h3>
                        </div>
                        <Separator />
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-medium">Sending your upgrade request...</p>
                </div>
            </div>
        );
    }

    // --- TAMPILAN 2: SUCCESS STATE (BERHASIL) ---
    if (status === 'success') {
        return (
            <div className="flex flex-col h-full animate-in fade-in zoom-in duration-300">
                <DialogHeader>
                    <DialogTitle className="py-3">
                        <div className="px-6 p-3">
                            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-green-600">Request Sent!</h3>
                        </div>
                        <Separator />
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="bg-green-100 p-4 rounded-full">
                        <CheckCircle2 className="w-16 h-16 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold tracking-tight">Thank you for your interest!</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Our team has received your request to upgrade to the <strong>Essentials</strong> plan. We will contact you shortly to finalize the setup.
                        </p>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-gray-50/50 place-content-between">
                    <DialogClose asChild>
                        {/* Tombol ini akan menutup modal dan memanggil onClose */}
                        <Button onClick={onClose} className="w-full sm:flex-1 bg-gray-900 text-white hover:bg-gray-800">
                            Close & Continue
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </div>
        );
    }

    // --- TAMPILAN 3: DEFAULT STATE (LIMIT REACHED) ---
    return (
        <div className="flex flex-col h-full">
            <DialogHeader>
                <DialogTitle className="py-3">
                    <div className="px-6 p-3">
                        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                            Limit Reached
                        </h3>
                    </div>
                    <Separator />
                </DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="bg-orange-50 p-4 rounded-full">
                    <LockKeyhole className="w-12 h-12 text-orange-500" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight">
                        You've reached your limit
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        You are currently on the <span className="font-semibold text-gray-900">{currentPlanName}</span> plan, which allows up to <span className="font-semibold text-gray-900">{limit} datasets</span>.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-sm w-full text-left flex gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg h-fit">
                        <Rocket className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900">Upgrade to Essentials</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Get unlimited datasets and priority support.
                            <span className="font-bold block mt-1">First 21 days free!</span>
                        </p>
                    </div>
                </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-gray-50/50 place-content-between">
                <DialogClose asChild>
                    <Button variant="ghost" onClick={onClose} className="text-gray-500">
                        Maybe Later
                    </Button>
                </DialogClose>
                <Button onClick={onUpgrade} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    Upgrade Now <Rocket className="w-4 h-4" />
                </Button>
            </DialogFooter>
        </div>
    );
}