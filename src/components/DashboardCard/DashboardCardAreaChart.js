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

import { TrendingUp } from "lucide-react";
import { CartesianGrid, XAxis } from "recharts";

import downloadIcon from "@/assets/logo/downloadIcon.svg";
import editIcon from "@/assets/logo/editIcon.svg";
import { cn } from "@/lib/utils";
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas-pro';
import Image from "next/image";
import NextImage from "next/image";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

// This component is now fully dynamic
export default function DashboardCardAreaChart({ className, chartData }) {

    // Dynamically calculate keys and chart config from the chartData prop
    const { xAxisKey, seriesKeys, chartConfig } = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { xAxisKey: null, seriesKeys: [], chartConfig: {} };
        }

        const allKeys = Object.keys(chartData[0]);
        const axisKey = allKeys[0]; // Assume first key is for the X-axis
        const sKeys = allKeys.slice(1); // The rest are the data series

        // Dynamically create a chartConfig for the legend and tooltips
        const config = sKeys.reduce((acc, key, index) => {
            acc[key] = {
                label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                color: `var(--chart-${index + 1})`,
            };
            return acc;
        }, {});

        return { xAxisKey: axisKey, seriesKeys: sKeys, chartConfig: config };
    }, [chartData]);

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
                    saveAs(blob, 'area-chart-card.png');
                }
            });
        } catch (error) {
            console.error("Error capturing component: ", error);
        }
    };

    return (
        <Card ref={cardRef} className={cn("h-full flex flex-col", className)}>
            <CardHeader>
                <CardTitle>Area Chart</CardTitle>
                <CardDescription>
                    Dynamically Generated Chart
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                left: 12,
                                right: 12,
                                top: 10,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey={xAxisKey}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="line" />}
                            />
                            {seriesKeys.map(key => (
                                <Area
                                    key={key}
                                    dataKey={key}
                                    type="natural"
                                    fill={`var(--color-${key})`}
                                    fillOpacity={0.4}
                                    stroke={`var(--color-${key})`}
                                    stackId="a"
                                />
                            ))}
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ResponsiveContainer>
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
                        <NextImage src={downloadIcon} alt="Download icon" className="w-5 h-5 mr-3 cursor-pointer"
                            onClick={handleDownloadImage}
                        />
                        <NextImage src={editIcon} alt="Edit icon" className="w-5 h-5 cursor-pointer" />
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
