"use client"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";
import { useRef } from 'react';

import { TrendingUp } from "lucide-react";
import { CartesianGrid, XAxis } from "recharts";

import downloadIcon from "@/assets/logo/downloadIcon.svg";
import editIcon from "@/assets/logo/editIcon.svg";
import { cn } from "@/lib/utils"; // 1. Import the cn utility
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas-pro';
import Image from "next/image";
import { Area, AreaChart } from "recharts";

export default function DashboardCardAreaChart({ className }) {
    const chartData = [
        { month: "January", desktop: 186, mobile: 80 },
        { month: "February", desktop: 305, mobile: 200 },
        { month: "March", desktop: 237, mobile: 120 },
        { month: "April", desktop: 73, mobile: 190 },
        { month: "May", desktop: 209, mobile: 130 },
        { month: "June", desktop: 214, mobile: 140 },
    ]

    const chartConfig = {
        desktop: {
            label: "Desktop",
            color: "var(--chart-1)",
        },
        mobile: {
            label: "Mobile",
            color: "var(--chart-2)",
        },
    }

    const cardRef = useRef(null);

    const handleDownloadImage = async () => {
        const element = cardRef.current;
        if (!element) {
            return;
        }

        try {
            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
            });

            canvas.toBlob((blob) => {
                if (blob) {
                    saveAs(blob, 'chart-card.png');
                }
            });
        } catch (error) {
            console.error("Error capturing component: ", error);
        }
    };

    return (
        <Card ref={cardRef} className={cn("h-full", className)}>
            <CardHeader>
                <CardTitle>Area Chart - Legend</CardTitle>
                <CardDescription>
                    Showing total visitors for the last 6 months
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="mobile"
                            type="natural"
                            fill="var(--color-mobile)"
                            fillOpacity={0.4}
                            stroke="var(--color-mobile)"
                            stackId="a"
                        />
                        <Area
                            dataKey="desktop"
                            type="natural"
                            fill="var(--color-desktop)"
                            fillOpacity={0.4}
                            stroke="var(--color-desktop)"
                            stackId="a"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm justify-between">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 leading-none">
                            January - June 2024
                        </div>
                    </div>
                    <div className="flex">
                        <Image src={downloadIcon} alt="Measure icon" className="w-5 h-5 mr-3 cursor-pointer"
                            onClick={handleDownloadImage}

                        />
                        <Image src={editIcon} alt="Measure icon" className="w-5 h-5" />
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
