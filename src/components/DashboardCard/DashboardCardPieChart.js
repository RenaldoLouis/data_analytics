"use-client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
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
            {/* The ChartContainer now wraps the entire flex layout */}
            <ChartContainer
                config={chartConfig}
                className="h-full w-full"
            >
                {/* Use a flex container to position the chart and legend */}
                <div className="flex h-full w-full items-center">
                    {/* Column 1: The Pie Chart */}
                    <div className="h-full w-2/3">
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
                                {/* The default legend is removed */}
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Column 2: The Custom, Scrollable Legend */}
                    <div className="h-full w-1/3 p-4">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col gap-2">
                                {processedData.map((entry, index) => (
                                    <div key={`legend-${index}`} className="flex items-center gap-2">
                                        <span
                                            className="h-3 w-3 flex-shrink-0 rounded-full"
                                            style={{ backgroundColor: entry.fill }}
                                        />
                                        <span className="text-sm text-muted-foreground truncate" title={entry[nameKey]}>
                                            {entry[nameKey]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </ChartContainer>
        </GenericDashboardCardChart>
    );
}
