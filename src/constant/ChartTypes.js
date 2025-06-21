"use client";

import {
    AreaChart as AreaChartIcon,
    BarChart2,
    LayoutGrid,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon
} from "lucide-react";

export const ChartTypes = [
    { icon: <BarChart2 />, label: "Bar" },
    { icon: <LineChartIcon />, label: "Line" },
    { icon: <AreaChartIcon />, label: "Area" },
    { icon: <PieChartIcon />, label: "Pie" },
    { icon: <LayoutGrid />, label: "Grid" },
];