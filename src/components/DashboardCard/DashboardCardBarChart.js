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
import { useMemo, useRef } from 'react';

import downloadIcon from "@/assets/logo/downloadIcon.svg";
import editIcon from "@/assets/logo/editIcon.svg";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis } from "recharts";

import { cn } from "@/lib/utils";
import NextImage from "next/image";

import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas-pro';


export default function DashboardCardBarChart({ chartData, className, stacked = false }) {
    const { xAxisKey, seriesKeys, chartConfig } = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { xAxisKey: null, seriesKeys: [], chartConfig: {} };
        }

        const allKeys = Object.keys(chartData[0]);
        const axisKey = allKeys[0]; // Assume the first key is the X-axis (dimension)
        const sKeys = allKeys.slice(1); // The rest are the series (measures)

        // Dynamically create a chartConfig for the legend and tooltips
        const config = sKeys.reduce((acc, key, index) => {
            acc[key] = {
                label: key.replace(/_Sum|_Count/g, ''), // Clean up the label
                color: `var(--chart-${index + 1})`, // Use theme colors
            };
            return acc;
        }, {});

        return { xAxisKey: axisKey, seriesKeys: sKeys, chartConfig: config };
    }, [chartData]);

    const barChartData = [
        { month: "January", desktop: 186, mobile: 80 },
        { month: "February", desktop: 305, mobile: 200 },
        { month: "March", desktop: 237, mobile: 120 },
        { month: "April", desktop: 73, mobile: 190 },
        { month: "May", desktop: 209, mobile: 130 },
        { month: "June", desktop: 214, mobile: 140 },
    ]

    const chartBarConfig = {
        desktop: {
            label: "Desktop",
            color: "var(--chart-2)",
        },
        mobile: {
            label: "Mobile",
            color: "var(--chart-2)",
        },
        label: {
            color: "var(--background)",
        },
    }

    const cardRef = useRef(null);

    const handleDownloadImage = async () => {
        const element = cardRef.current;
        if (!element) {
            return;
        }

        try {
            // The html2canvas library returns a promise that resolves with the canvas
            const canvas = await html2canvas(element, {
                // Options to improve image quality and handle external content
                useCORS: true, // For images from other domains
                scale: 2,      // Renders at a higher resolution
            });

            // Convert the canvas to a Blob (a file-like object)
            canvas.toBlob((blob) => {
                if (blob) {
                    // Use file-saver to trigger the download
                    saveAs(blob, 'chart-card.png');
                }
            });
        } catch (error) {
            console.error("Error capturing component: ", error);
        }
    };

    return (
        <Card ref={cardRef} className={cn("h-full flex flex-col", className)}>
            <CardHeader>
                <CardTitle>{stacked ? "Stacked Bar Chart" : "Bar Chart"}</CardTitle>
                <CardDescription>Dynamically Generated Chart</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ top: 20 }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey={xAxisKey}
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="line" />}
                            />
                            {seriesKeys.map((key) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={`var(--color-${key})`}
                                    radius={4}
                                    stackId={stacked ? "a" : undefined}
                                />
                            ))}
                            <ChartLegend content={<ChartLegendContent />} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing total visitors for the last 6 months
                </div>
                <div className="flex">
                    <NextImage src={downloadIcon} alt="Download icon" className="w-5 h-5 mr-3 cursor-pointer"
                        onClick={handleDownloadImage}
                    />
                    <NextImage src={editIcon} alt="Edit icon" className="w-5 h-5 cursor-pointer" />
                </div>
            </CardFooter>
        </Card>
    );
}
