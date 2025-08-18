"use client";

import {
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    XAxis
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

const CustomizedAxisTick = (props) => {
    const { x, y, payload } = props;
    const maxChars = 15; // Max characters to show before truncating

    // Get the label text from the data
    const label = payload.value;

    // Truncate the label if it's too long
    const truncatedLabel = label.length > maxChars
        ? `${label.slice(0, maxChars)}…`
        : label;

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" >
                {/* The visible, truncated label */}
                {truncatedLabel}
                {/* A tooltip that shows the full label on hover */}
                <title>{label}</title>
            </text>
        </g>
    );
};

export const BarChartComponent = ({ data, xAxisKey, seriesKeys, isGrouped = false }) => (
    <ResponsiveContainer width="100%" height="100%">
        {/* Add a height to the chart to give the rotated labels enough space */}
        <BarChart data={data} margin={{ bottom: 75 }}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey={xAxisKey}
                // Tell the axis to use our custom component for the ticks
                tick={<CustomizedAxisTick />}
                // Adjust interval to prevent labels from overlapping
                interval={0}
            // We can remove other props as our component now handles styling
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {seriesKeys.map((key, index) => (
                <Bar
                    key={key}
                    dataKey={key}
                    stackId={isGrouped ? undefined : "a"}
                    fill={COLORS[index % COLORS.length]}
                    radius={4}
                />
            ))}
        </BarChart>
    </ResponsiveContainer>
);

export const LineChartComponent = ({ data, xAxisKey, seriesKeys }) => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {seriesKeys.map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
            ))}
        </LineChart>
    </ResponsiveContainer>
);

export const AreaChartComponent = ({ data, xAxisKey, seriesKeys }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {seriesKeys.map((key, index) => (
                <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
            ))}
        </AreaChart>
    </ResponsiveContainer>
);

export const PieChartComponent = ({ data }) => (
    <>
        {/* Use a flex container to position the chart and legend */}
        < div className="flex h-full w-full items-center" >
            {/* Column 1: The Pie Chart */}
            < div className="h-full w-2/3" >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        {/* FIX: The default ChartLegend component has been removed from here */}
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={120}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div >

            {/* Column 2: The Custom, Scrollable Legend */}
            < div className="h-full w-1/3 p-4" >
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-2">
                        {data.map((entry, index) => (
                            <div key={`legend-${index}`} className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm text-muted-foreground truncate" title={entry.name}>
                                    {entry.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div >
        </div >
    </>
);
