"use client";

import {
    AreaChart as AreaChartIcon,
    BarChart2,
    ChartColumnBig,
    ChartColumnStacked,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon
} from "lucide-react";

export const ChartTypes = [
    { icon: <BarChart2 />, name: "Bar" },
    { icon: <ChartColumnStacked />, name: "StackedBar" },
    { icon: <ChartColumnBig />, name: "Groupbar" },
    { icon: <LineChartIcon />, name: "Line" },
    { icon: <AreaChartIcon />, name: "Area" },
    { icon: <PieChartIcon />, name: "Pie" },
];

export const ChartAggregator = {
    sum: 'Sum',
    count: 'Count',
    average: 'Average',
    median: 'Median',
    modus: 'Modus'
}