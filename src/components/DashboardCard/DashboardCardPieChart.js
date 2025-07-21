"use-client";

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import GenericDashboardCardChart from "./GenericDashboardCardChart";

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export default function DashboardCardPieChart({ chartData, chartInfo, refetch, className }) {

    const { processedData, nameKey, dataKey, chartConfig } = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { processedData: [], nameKey: null, dataKey: null, chartConfig: {} };
        }

        const nKey = Object.keys(chartData[0])[0];
        const dKey = Object.keys(chartData[0])[1];

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
                fill: color,
            };
        });

        return {
            processedData: dataWithColors,
            nameKey: nKey,
            dataKey: dKey,
            chartConfig: config,
        };
    }, [chartData]);

    return (
        <GenericDashboardCardChart
            title="Pie Chart"
            chartInfo={chartInfo}
            refetch={refetch}
            className={className}
        >
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
                            dataKey={dataKey}
                            nameKey={nameKey}
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
        </GenericDashboardCardChart>
    );
}