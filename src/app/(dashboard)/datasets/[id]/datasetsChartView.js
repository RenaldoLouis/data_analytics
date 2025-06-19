"use client";

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


const renderChart = () => {
    switch (selectedChartType) {
        case 'Bar':
        case 'Stacked Bar':
        case 'Horizontal': // You'll need to adjust the BarChart component for horizontal
            return (
                <BarChart data={processedData} /* ... your dynamic props ... */ >
                    {/* ... */}
                </BarChart>
            );
        case 'Pie':
            // You would need a different data transformation for Pie charts
            // and would render <PieChart> from recharts here.
            return <p>Pie Chart coming soon!</p>;
        case 'Grid':
            // This would likely be your <DataTable> component
            return <p>Grid view coming soon!</p>;
        default:
            return <p>Select a chart type.</p>;
    }
}

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

function transformChartData(rawData, selectedRow, selectedColumn) {
    if (selectedRow.length === 0 || selectedColumn.length === 0) return [];

    // Access the name and type from the selectedRow object
    const rowField = selectedRow[0].name; // The field name its Metrics / Values (e.g., 'Customer Age', 'Quantity')
    const rowType = selectedRow[0].type; // The type (e.g., ItemTypes.DIMENSION, ItemTypes.MEASURE)
    const colKey = selectedColumn[0].name; // The field name for the column (always a dimension/grouping)

    const grouped = {};
    // Determine aggregation type based on the ItemType of the field in 'Rows'
    const isSumming = rowType === ItemTypes.MEASURE; // True if it's a measure, false if it's a dimension

    rawData.forEach((item) => {
        const xAxisDimensionValue = item[colKey];
        const measureValue = item[rowField]; // Use rowField here

        if (!grouped[xAxisDimensionValue]) {
            grouped[xAxisDimensionValue] = 0; // Initialize for both sum and count
        }

        if (isSumming) {
            // Aggregate by summing for MEASURES
            grouped[xAxisDimensionValue] += Number(measureValue) || 0;
        } else {
            // Aggregate by counting for DIMENSIONS (when they are in the 'Rows' slot)
            grouped[xAxisDimensionValue] += 1;
        }
    });

    const aggregatedKeySuffix = isSumming ? '_Sum' : '_Count';
    const finalAggregatedKey = rowField + aggregatedKeySuffix; // Use rowField here

    return Object.entries(grouped).map(([xAxisValue, aggregatedValue]) => ({
        [colKey]: xAxisValue,
        [finalAggregatedKey]: aggregatedValue,
    }));
}

const DatasetsChartView = ({ chartData }) => {
    const [isShowChart, setIsShowChart] = useState(true);
    const [selectedChartType, setSelectedChartType] = useState("Stacked Bar");
    const { selectedRow, selectedColumn, setSelectedColumn, setSelectedRow } = useDashboardContext();

    const [{ isOver: isOverColumn }, dropColumn] = useDrop({
        accept: [ItemTypes.DIMENSION, ItemTypes.MEASURE],
        drop: (item) => {
            setSelectedColumn((prev) => [...new Set([...prev, { name: item.name, type: item.type }])]);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const [{ isOver: isOverRow }, dropRow] = useDrop({
        accept: [ItemTypes.DIMENSION, ItemTypes.MEASURE],
        drop: (item) => {
            setSelectedRow((prev) => [...new Set([...prev, { name: item.name, type: item.type }])]);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const processedData = transformChartData(chartData, selectedRow, selectedColumn);

    // seriesKeys will now represent the summed measure, e.g., ['Quantity_Sum']
    const seriesKeys = processedData.length > 0
        ? Object.keys(processedData[0]).filter(key => key !== selectedColumn[0].name)
        : [];

    const dynamicChartConfig = seriesKeys.reduce((config, key) => {
        let label = key;
        if (key.endsWith('_Sum')) {
            label = key.replace('_Sum', ' (Sum)');
        } else if (key.endsWith('_Count')) {
            label = key.replace('_Count', ' (Count)');
        }

        config[key] = {
            label: key.replace('_Sum', ''), // Clean up label for legend/tooltip
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        };
        return config;
    }, {});


    console.log("processedData", processedData)

    const handleRemoveItem = (item, type) => {
        if (type === 'column') {
            setSelectedColumn((prev) => prev.filter(i => i !== item));
        } else {
            // When removing from rows, filter by item.name
            setSelectedRow((prev) => prev.filter(i => i.name !== item.name));
        }
    };

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
                                key={item.name}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium"
                            >
                                📅 {item.name}
                                <button
                                    onClick={() => handleRemoveItem(item, 'column')}
                                    className="text-blue-500 hover:text-blue-800"
                                >
                                    &times;
                                </button>
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
                                key={item.name} // Use item.name as key
                                className="inline-flex items-center gap-2 rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium whitespace-nowrap"
                            >
                                # {item.name} {/* Display item.name */}
                                <button
                                    onClick={() => handleRemoveItem(item, 'row')}
                                    className="text-blue-500 hover:text-blue-800"
                                >
                                    &times;
                                </button>
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
                    <ChartContainer config={dynamicChartConfig} className="min-h-[300px] w-full">
                        <BarChart data={processedData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey={selectedColumn[0]?.name} // X-axis is now the dimension from `selectedColumn` (e.g., 'Storage Location')
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />

                            {seriesKeys.map((key) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={`var(--color-${key})`} // Uses the color from dynamic config
                                    radius={4}
                                />
                            ))}
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="text-center py-20">
                        <H3 className="text-lg font-medium text-gray-600">
                            Drag and drop fields into 'Rows' and 'Columns' to build a chart.
                        </H3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatasetsChartView;
