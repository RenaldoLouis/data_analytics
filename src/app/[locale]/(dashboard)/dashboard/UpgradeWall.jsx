import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LockKeyhole, Rocket } from "lucide-react";

export default function UpgradeWall({ currentPlanName, onUpgrade, onClose, limit }) {
    return (
        <div className="flex flex-col h-full">
            <DialogHeader>
                <DialogTitle className="py-3">
                    <div className="px-6 p-3">
                        {/* Mengganti H3 dengan h3 + class Tailwind */}
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
                    {/* Mengganti H3 dengan h3 */}
                    <h3 className="text-xl font-semibold tracking-tight">
                        You've reached your limit
                    </h3>
                    {/* Mengganti P dengan p */}
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