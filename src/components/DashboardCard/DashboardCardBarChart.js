"use client";

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis } from "recharts";
import GenericDashboardCardChart from "./GenericDashboardCardChart";

export default function DashboardCardBarChart({ chartData, chartInfo, refetch, className, stacked = false }) {
    const { xAxisKey, seriesKeys, chartConfig } = useMemo(() => {
        if (!chartData || chartData.length === 0) return { xAxisKey: null, seriesKeys: [], chartConfig: {} };
        const allKeys = Object.keys(chartData[0]);
        const axisKey = allKeys[0];
        const sKeys = allKeys.slice(1);
        const config = sKeys.reduce((acc, key, index) => ({
            ...acc,
            [key]: { label: key.replace(/_Sum|_Count/g, ''), color: `var(--chart-${index + 1})` }
        }), {});
        return { xAxisKey: axisKey, seriesKeys: sKeys, chartConfig: config };
    }, [chartData]);

    return (
        <GenericDashboardCardChart
            title={stacked ? "Stacked Bar Chart" : "Bar Chart"}
            chartInfo={chartInfo}
            refetch={refetch}
            className={className}
        >
            <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey={xAxisKey} tickLine={false} tickMargin={10} axisLine={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        {seriesKeys.map((key) => (
                            <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} stackId={stacked ? "a" : undefined} />
                        ))}
                        <ChartLegend content={<ChartLegendContent />} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </GenericDashboardCardChart>
    );
}