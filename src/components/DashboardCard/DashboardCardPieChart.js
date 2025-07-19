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
import { useRef } from 'react';

import downloadIcon from "@/assets/logo/downloadIcon.svg";
import editIcon from "@/assets/logo/editIcon.svg";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import { Cell, Pie, PieChart } from "recharts";

import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas-pro';

// 1. Accept `className` and `chartData` as props for dynamic use
export default function DashboardCardPieChart({ className, chartData: initialData }) {
    // 2. Use passed-in data, or fallback to mock data
    const chartData = initialData || [
        { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
        { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
        { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
        { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
        { browser: "other", visitors: 90, fill: "var(--color-other)" },
    ];

    // 3. Define a chartConfig specific to the pie chart data
    const chartConfig = {
        visitors: {
            label: "Visitors",
        },
        chrome: {
            label: "Chrome",
            color: "var(--chart-1)",
        },
        safari: {
            label: "Safari",
            color: "var(--chart-2)",
        },
        firefox: {
            label: "Firefox",
            color: "var(--chart-3)",
        },
        edge: {
            label: "Edge",
            color: "var(--chart-4)",
        },
        other: {
            label: "Other",
            color: "var(--chart-5)",
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
                    saveAs(blob, 'pie-chart-card.png');
                }
            });
        } catch (error) {
            console.error("Error capturing component: ", error);
        }
    };

    return (
        <Card ref={cardRef} className={cn("h-full", className)}>
            <CardHeader>
                <CardTitle>Pie Chart - Donut</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[300px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="visitors"
                            nameKey="browser"
                            innerRadius={60} // This creates the "donut" hole
                            strokeWidth={5}
                        >
                            {/* This maps the `fill` color from the data to each slice */}
                            {chartData.map((entry) => (
                                <Cell key={entry.browser} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartLegend
                            content={<ChartLegendContent nameKey="browser" />}
                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing total visitors for the last 6 months
                </div>
                <div className="flex self-end">
                    <Image
                        src={downloadIcon}
                        alt="Download chart"
                        className="w-5 h-5 mr-3 cursor-pointer"
                        onClick={handleDownloadImage}
                    />
                    <Image src={editIcon} alt="Edit chart" className="w-5 h-5 cursor-pointer" />
                </div>
            </CardFooter>
        </Card>
    );
}

