"use client";

import { Button } from "@/components/ui/button";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { H3 } from "@/components/ui/typography";
import { ItemTypes } from "@/constant/DragTypes";
import { useDashboardContext } from "@/context/dashboard-context";
import { cn } from "@/lib/utils";
import {
    BarChart2,
    BarChartBig,
    LayoutGrid,
    PieChart,
    Rows3,
} from "lucide-react"; // icons used as chart options
import { useState } from "react";
import { useDrop } from 'react-dnd';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

// const chartData = [
//     { month: "January", desktop: 186, mobile: 80 },
//     { month: "February", desktop: 305, mobile: 200 },
//     { month: "March", desktop: 237, mobile: 120 },
//     { month: "April", desktop: 73, mobile: 190 },
//     { month: "May", desktop: 209, mobile: 130 },
//     { month: "June", desktop: 214, mobile: 140 },
// ];

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "#2563eb",
    },
    mobile: {
        label: "Mobile",
        color: "#60a5fa",
    },
};

const chartTypes = [
    { icon: <BarChart2 />, label: "Bar" },
    { icon: <BarChartBig />, label: "Stacked Bar" },
    { icon: <Rows3 />, label: "Horizontal" },
    { icon: <PieChart />, label: "Pie" },
    { icon: <LayoutGrid />, label: "Grid" },
];

function groupByAgeAndPayment(data) {
    const result = {};

    data.forEach(({ customer_age, payment_method }) => {
        if (!result[customer_age]) result[customer_age] = {};
        if (!result[customer_age][payment_method]) result[customer_age][payment_method] = 0;

        result[customer_age][payment_method] += 1;
    });

    // Convert to array of objects
    return Object.entries(result).map(([age, methods]) => ({
        customer_age: parseInt(age),
        ...methods,
    }));
}

const DatasetsChartView = ({ chartData }) => {
    const [isShowChart, setIsShowChart] = useState(true);
    const [selectedChartType, setSelectedChartType] = useState("Stacked Bar");
    const { selectedRow, selectedColumn, setSelectedColumn, setSelectedRow } = useDashboardContext();

    const [{ isOver: isOverColumn }, dropColumn] = useDrop({
        accept: [ItemTypes.DIMENSION, ItemTypes.MEASURE],
        drop: (item) => {
            setSelectedColumn((prev) => [...new Set([...prev, item.name])]);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const [{ isOver: isOverRow }, dropRow] = useDrop({
        accept: [ItemTypes.DIMENSION, ItemTypes.MEASURE],
        drop: (item) => {
            setSelectedRow((prev) => [...new Set([...prev, item.name])]);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const processedData = groupByAgeAndPayment(chartData);

    return (
        <div className="w-full p-6">
            {/* Column & Row Settings */}
            <div className="border rounded-md overflow-hidden mb-6 divide-y divide-gray-200">
                {/* Columns */}
                <div className="flex items-start bg-gray-50 px-4 py-3 gap-3">
                    <div className="w-28 flex items-center gap-2 text-sm font-medium text-gray-600">
                        ✏️ <span className="text-blue-600">Columns</span>
                    </div>
                    <div
                        ref={dropColumn}
                        className={cn(
                            "flex items-center gap-2 flex-wrap p-2 rounded-md min-h-[40px] min-w-52",
                            isOverColumn ? "bg-blue-50 border border-blue-400" : "bg-white"
                        )}
                    >
                        {selectedColumn.map((item) => (
                            <span
                                key={item}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium"
                            >
                                📅 {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Rows (with horizontal scroll) */}
                <div className="flex items-start px-4 py-3 gap-3">
                    <div className="w-28 flex items-center gap-2 text-sm font-medium text-gray-600">
                        ✏️ <span className="text-blue-600">Rows</span>
                    </div>
                    <div
                        ref={dropRow}
                        className={cn(
                            "flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 p-2 rounded-md min-h-[40px] min-w-52",
                            isOverRow ? "bg-orange-50 border border-orange-400" : "bg-white"
                        )}
                    >
                        {selectedRow.map((item) => (
                            <span
                                key={item}
                                className="inline-flex items-center gap-2 rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium whitespace-nowrap"
                            >
                                # {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>


            {/* Chart Type Picker */}
            <div className="mb-6 flex gap-4 overflow-x-auto">
                {chartTypes.map((type) => (
                    <button
                        key={type.label}
                        onClick={() => setSelectedChartType(type.label)}
                        className={cn(
                            "border rounded-md p-3 flex items-center justify-center w-24 h-20 transition",
                            selectedChartType === type.label
                                ? "border-blue-500 bg-blue-100"
                                : "border-gray-300 hover:bg-gray-100"
                        )}
                    >
                        {type.icon}
                    </button>
                ))}
            </div>

            {/* Chart View */}
            <div className="bg-white rounded-md p-4 shadow-sm">
                {isShowChart ? (
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        {/* <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                        </BarChart> */}
                        <BarChart data={processedData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="customer_age" tickLine={false} tickMargin={10} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            {['Bank Transfer', 'Credit Card', 'PayPal'].map((method) => (
                                <Bar key={method} dataKey={method} radius={4} />
                            ))}
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="text-center py-10">
                        <H3 className="text-xl font-bold mb-2">
                            You will be able to create chart after all validation are clear and normalized
                        </H3>
                        <Button variant="link" className="font-bold" style={{ color: "#2168AB" }}>
                            Edit Data Sets
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatasetsChartView;
