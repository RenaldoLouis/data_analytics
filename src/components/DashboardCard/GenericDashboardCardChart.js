"use client";

import downloadIcon from "@/assets/logo/downloadIcon.svg";
import editIcon from "@/assets/logo/editIcon.svg";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import services from "@/services";
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas-pro';
import { Trash2, TrendingUp } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useRef } from 'react';
import { toast } from "sonner";

export default function GenericDashboardCardChart({ title, description, chartInfo, refetch, className, children }) {
    const router = useRouter();

    const cardRef = useRef(null);

    const handleDownloadImage = async () => {
        const element = cardRef.current;
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
            canvas.toBlob((blob) => {
                if (blob) {
                    saveAs(blob, `${title.replace(/\s+/g, '-')}.png`);
                }
            });
        } catch (error) {
            console.error("Error capturing component: ", error);
        }
    };

    const handleDeleteChartFromDashboard = async () => {
        if (!chartInfo?.id) return;
        try {
            const res = await services.dashboard.deleteDashboardChart(chartInfo.id);
            if (res.success) {
                refetch();
                toast("Chart removed successfully");
            } else {
                throw new Error("Failed to remove chart");
            }
        } catch (e) {
            toast.error(e.message);
        }
    };

    const handleClickEditChart = () => {
        router.replace(`/datasets/${chartInfo.dataset_id}`)
    }

    return (
        <Card ref={cardRef} className={cn("h-full flex flex-col", className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description || chartInfo?.name}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {children} {/* The specific chart will be rendered here */}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing total visitors for the last 6 months
                </div>
                <div className="flex self-end mt-auto pt-2">
                    <NextImage onClick={handleDownloadImage} src={downloadIcon} alt="Download icon" className="w-5 h-5 mr-3 cursor-pointer" />
                    <NextImage onClick={handleClickEditChart} src={editIcon} alt="Edit icon" className="w-5 h-5 cursor-pointer" />
                    <Trash2 onClick={handleDeleteChartFromDashboard} className="w-5 h-5 ml-3 text-red-500 cursor-pointer" />
                </div>
            </CardFooter>
        </Card>
    );
}