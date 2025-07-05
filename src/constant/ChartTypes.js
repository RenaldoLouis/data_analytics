"use client";

import {
    AreaChart as AreaChartIcon,
    BarChart2,
    ChartColumnBig,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon
} from "lucide-react";

export const ChartTypes = [
    { icon: <BarChart2 />, label: "Bar" },
    { icon: <ChartColumnBig />, label: "Groupbar" },
    { icon: <LineChartIcon />, label: "Line" },
    { icon: <AreaChartIcon />, label: "Area" },
    { icon: <PieChartIcon />, label: "Pie" },
];