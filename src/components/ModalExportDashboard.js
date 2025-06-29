"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";

export const ModalExportDashboard = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-4xl p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-2xl font-bold text-left">
                        Export Visualization
                    </DialogTitle>
                </DialogHeader>
                <div className="border-t" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">

                    <div className="flex flex-col gap-8">
                        <div className="grid gap-3">
                            <Label htmlFor="format">File Format</Label>
                            <Select defaultValue="pdf">
                                <SelectTrigger id="format" className="w-full">
                                    <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="png">PNG</SelectItem>
                                    <SelectItem value="jpeg">JPEG</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="margin">Margin Settings</Label>
                            <Select defaultValue="letter">
                                <SelectTrigger id="margin" className="w-full">
                                    <SelectValue placeholder="Select margin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="letter">Letter</SelectItem>
                                    <SelectItem value="a4">A4</SelectItem>
                                    <SelectItem value="none">No Margin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <Label>Preview</Label>
                        <div className="flex items-center justify-center rounded-lg border bg-slate-100 p-4 min-h-[300px] w-full">
                            <div className="bg-white p-2 shadow-lg rounded-sm w-full max-w-[250px]">
                                <img
                                    src="https://placehold.co/250x350/f0f0f0/666?text=Chart+Preview"
                                    alt="Preview of the visualization to be exported"
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 border-t p-6 sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        className="w-full sm:w-auto bg-slate-800 text-white hover:bg-slate-700"
                        variant="outline"
                        onClick={() =>
                            toast("Image has been downloaded.", {
                                unstyled: true,
                                icon: <CheckCircle2 className="text-blue-600" />,
                                classNames: {
                                    toast:
                                        "flex items-center w-full p-3 pl-4 bg-emerald-50 border border-emerald-200 rounded-full gap-2",
                                    title: "text-emerald-900 font-medium",
                                },
                            })
                        }
                    >
                        Show Toast
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
