"use client";

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import GenericDashboardCardChart from './GenericDashboardCardChart';

export default function DashboardCardAreaChart({ chartData, chartInfo, refetch, className }) {
    // This component's unique logic is its useMemo and its specific chart JSX
    const { xAxisKey, seriesKeys, chartConfig } = useMemo(() => {
        // ... same key calculation logic as the Bar Chart ...
        if (!chartData || chartData.length === 0) return { xAxisKey: null, seriesKeys: [], chartConfig: {} };
        const allKeys = Object.keys(chartData[0]);
        const axisKey = allKeys[0];
        const sKeys = allKeys.slice(1);
        const config = sKeys.reduce((acc, key, index) => ({
            ...acc,
            [key]: { label: key.replace(/_/g, ' '), color: `var(--chart-${index + 1})` }
        }), {});
        return { xAxisKey: axisKey, seriesKeys: sKeys, chartConfig: config };
    }, [chartData]);

    return (
        // It renders the generic card and passes its unique chart content as children
        <GenericDashboardCardChart
            title="Area Chart"
            chartInfo={chartInfo}
            refetch={refetch}
            className={className}
        >
            <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        {seriesKeys.map(key => (
                            <Area key={key} dataKey={key} type="natural" fill={`var(--color-${key})`} fillOpacity={0.4} stroke={`var(--color-${key})`} stackId="a" />
                        ))}
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
        </GenericDashboardCardChart>
    );
}
