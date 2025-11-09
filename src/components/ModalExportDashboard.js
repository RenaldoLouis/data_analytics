"use client";

import Checklist from "@/assets/logo/checklist.svg";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { saveAs } from 'file-saver';
import html2canvas from "html2canvas-pro";
import jsPDF from 'jspdf';
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from 'next/image';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const ModalExportDashboard = (props) => {
    const { layoutRef, isChartAdded } = props

    const t = useTranslations("dashboardpage");
    const [previewUrl, setPreviewUrl] = useState("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [canvasElement, setCanvasElement] = useState(null);

    const form = useForm({
        defaultValues: {
            format: "png",
            margin: "a4",
        },
    });

    const generatePreview = async () => {
        const element = layoutRef.current;
        if (!element) return;

        setIsPreviewLoading(true);
        try {
            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
            });
            setCanvasElement(canvas);
            setPreviewUrl(canvas.toDataURL('image/png'));
        } catch (error) {
            console.error("Error generating preview:", error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleDownload = (data) => {
        if (!canvasElement) {
            toast.error("Image data is not ready yet. Please generate a preview first.");
            return;
        }

        const fileName = `dashboard-layout.${data.format}`;

        // --- PDF Generation Logic ---
        if (data.format === 'pdf') {
            const imgData = canvasElement.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller PDF size
            const pdf = new jsPDF({
                orientation: 'landscape', // or 'portrait'
                unit: 'px',
                format: data.margin === 'none' ? [canvasElement.width, canvasElement.height] : data.margin,
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Fit the image to the page size while maintaining aspect ratio
            const canvasAspectRatio = canvasElement.width / canvasElement.height;
            const pageAspectRatio = pdfWidth / pdfHeight;

            let imgWidth, imgHeight;

            if (canvasAspectRatio > pageAspectRatio) {
                imgWidth = pdfWidth;
                imgHeight = pdfWidth / canvasAspectRatio;
            } else {
                imgHeight = pdfHeight;
                imgWidth = pdfHeight * canvasAspectRatio;
            }

            // Center the image on the page
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
            pdf.save(fileName);

            // --- Image Generation Logic (PNG/JPEG) ---
        } else {
            canvasElement.toBlob((blob) => {
                saveAs(blob, fileName);
            }, `image/${data.format}`);
        }

        toast(t("downloadSuccess"), {
            unstyled: true,
            icon: <Image src={Checklist} alt="Measure icon" />,
            classNames: {
                toast: "flex items-center w-fit max-w-md p-3 pl-4 bg-emerald-50 border border-emerald-200 rounded-lg gap-2",
                title: "text-emerald-900 font-medium",
            },
        });
    };

    return (
        <Dialog onOpenChange={(isOpen) => {
            if (isOpen) {
                generatePreview();
            } else {
                setPreviewUrl("");
                setCanvasElement(null); // Clear canvas to save memory
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline"
                    disabled={!isChartAdded}
                >
                    <Download className="mr-2 h-4 w-4" />
                    {t("download")}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-4xl p-0 md:min-h-[500px]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleDownload)}>
                        <DialogHeader className="p-6 pb-4">
                            <DialogTitle className="text-2xl font-bold text-left">
                                {t("downloadVisual")}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="border-t" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-5">
                            <div className="flex flex-col gap-4">
                                <FormField
                                    control={form.control}
                                    name="format"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("fileFormat")}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger id="format" className="w-full">
                                                        <SelectValue placeholder="Select format" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="png">PNG</SelectItem>
                                                    <SelectItem value="jpeg">JPEG</SelectItem>
                                                    <SelectItem value="pdf">PDF</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="margin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("marginSettings")}</FormLabel>
                                            <Select onValuechange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger id="margin" className="w-full">
                                                        <SelectValue placeholder="Select margin" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="letter">Letter</SelectItem>
                                                    <SelectItem value="a4">A4</SelectItem>
                                                    <SelectItem value="none">No Margin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-3">
                                <FormLabel>{t("preview")}</FormLabel>
                                <div className="flex items-center justify-center rounded-lg border bg-slate-100 p-4 min-h-[300px] w-full">
                                    {isPreviewLoading ? (
                                        <div className="text-sm text-muted-foreground">Generating Preview...</div>
                                    ) : previewUrl ? (
                                        <div className="bg-white p-2 shadow-lg rounded-sm w-full max-w-[250px]">
                                            <img
                                                src={previewUrl}
                                                alt="Live preview of the dashboard layout"
                                                className="w-full h-auto"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">Preview will appear here.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="w-full sm:flex-1">
                                    {t("cancel")}
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className="w-full sm:flex-1"
                                disabled={!isChartAdded}
                            >
                                {t("download")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};