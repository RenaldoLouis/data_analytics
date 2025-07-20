"use-client";

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
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import NextImage from "next/image";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas-pro';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

// This component is now fully dynamic
export default function DashboardCardPieChart({ className, chartData }) {

    // Dynamically process the incoming data to add colors and determine keys
    const { processedData, nameKey, dataKey, chartConfig } = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { processedData: [], nameKey: null, dataKey: null, chartConfig: {} };
        }

        // Assume the first key is the name/label and the second is the value
        const nKey = Object.keys(chartData[0])[0];
        const dKey = Object.keys(chartData[0])[1];

        // Dynamically create chartConfig and add fill colors to the data
        const config = {};
        const dataWithColors = chartData.map((entry, index) => {
            const name = entry[nKey];
            const color = COLORS[index % COLORS.length];
            config[name] = {
                label: name,
                color: color,
            };
            return {
                ...entry,
                fill: color, // Add fill property for the <Cell> component
            };
        });

        return {
            processedData: dataWithColors,
            nameKey: nKey,
            dataKey: dKey,
            chartConfig: config,
        };
    }, [chartData]);

    const cardRef = useRef(null);

    const handleDownloadImage = async () => {
        const element = cardRef.current;
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
            canvas.toBlob((blob) => {
                if (blob) {
                    saveAs(blob, 'pie-chart-card.png');
                }
            });
        } catch (error) {
            console.error("Error capturing component: ", error);
        }
    };

    return (
        <Card ref={cardRef} className={cn("h-full flex flex-col", className)}>
            <CardHeader>
                <CardTitle>Pie Chart - Donut</CardTitle>
                <CardDescription>Dynamically Generated Chart</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[300px]"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={processedData}
                                dataKey={dataKey} // Use dynamic data key
                                nameKey={nameKey}   // Use dynamic name key
                                innerRadius={60}
                                strokeWidth={5}
                            >
                                {processedData.map((entry) => (
                                    <Cell key={`cell-${entry[nameKey]}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartLegend
                                content={<ChartLegendContent nameKey={nameKey} />}
                                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                            />
                        </PieChart>
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
                <div className="flex self-end mt-auto pt-2">
                    <NextImage
                        src={downloadIcon}
                        alt="Download chart"
                        className="w-5 h-5 mr-3 cursor-pointer"
                        onClick={handleDownloadImage}
                    />
                    <NextImage src={editIcon} alt="Edit chart" className="w-5 h-5 cursor-pointer" />
                </div>
            </CardFooter>
        </Card>
    );
}
