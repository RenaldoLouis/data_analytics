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

export const FormulasList = [
    {
        name: "SUM",
        value: ChartAggregator.sum,
        tooltip: "Menjumlahkan total dari semua nilai numerik yang dipilih."
    },
    {
        name: "AVERAGE",
        value: ChartAggregator.average,
        tooltip: "Menghitung rata-rata dari nilai numerik yang dipilih."
    },
    {
        name: "COUNT",
        value: ChartAggregator.count,
        tooltip: "Menghitung jumlah item atau baris dalam kolom yang dipilih."
    },
];