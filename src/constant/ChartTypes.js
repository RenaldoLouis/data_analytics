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
    modus: 'Modus',
    min: 'Min',
    max: 'Max',
    round: 'Round',
}

export const FormulasList = [
    {
        name: "SUM",
        value: ChartAggregator.sum,
        tooltip: "sumTooltip"
    },
    {
        name: "AVERAGE",
        value: ChartAggregator.average,
        tooltip: "averageTooltip"
    },
    {
        name: "COUNT",
        value: ChartAggregator.count,
        tooltip: "countTooltip"
    },
    {
        name: "MEDIAN",
        value: ChartAggregator.median,
        tooltip: "medianTooltip"
    },
    {
        name: "MODUS",
        value: ChartAggregator.modus,
        tooltip: "modusTooltip"
    },
    {
        name: "MIN",
        value: ChartAggregator.min,
        tooltip: "minTooltip"
    },
    {
        name: "MAX",
        value: ChartAggregator.max,
        tooltip: "maxTooltip"
    },
    {
        name: "ROUND",
        value: ChartAggregator.round,
        tooltip: "roundTooltip"
    },
];