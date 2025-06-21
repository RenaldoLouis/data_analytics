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
    AreaChart as AreaChartIcon,
    BarChart2,
    LayoutGrid,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDrop } from 'react-dnd';
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

const BarChartComponent = ({ data, xAxisKey, seriesKeys }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {seriesKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={4} />
            ))}
        </BarChart>
    </ResponsiveContainer>
);

const LineChartComponent = ({ data, xAxisKey, seriesKeys }) => (
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

const AreaChartComponent = ({ data, xAxisKey, seriesKeys }) => (
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

const PieChartComponent = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={120}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
        </PieChart>
    </ResponsiveContainer>
);

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
    { icon: <LineChartIcon />, label: "Line" },
    { icon: <AreaChartIcon />, label: "Area" },
    { icon: <PieChartIcon />, label: "Pie" },
    { icon: <LayoutGrid />, label: "Grid" },
];

function transformForPieChart(rawData, dimension, measure) {
    if (!dimension || !measure) return [];

    const dimensionKey = dimension.name;
    const measureKey = measure.name;
    const isSumming = measure.type === ItemTypes.MEASURE;

    const grouped = {};

    rawData.forEach((item) => {
        const dimensionValue = item[dimensionKey];
        if (!dimensionValue) return;

        if (!grouped[dimensionValue]) {
            grouped[dimensionValue] = 0;
        }

        if (isSumming) {
            grouped[dimensionValue] += Number(item[measureKey]) || 0;
        } else {
            // If the measure is a dimension, we count it.
            grouped[dimensionValue] += 1;
        }
    });

    return Object.entries(grouped).map(([name, value]) => ({
        name,
        value,
    }));
}

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
    const [selectedChartType, setSelectedChartType] = useState("Bar");
    const { selectedRow, selectedColumn, setSelectedColumn, setSelectedRow } = useDashboardContext();

    const renderSelectedChart = () => {
        const hasData = processedData && processedData.length > 0;
        if (!hasData) return (
            <div className="text-center py-20">
                <H3 className="text-lg font-medium text-gray-600">
                    Drag and drop fields to build a chart.
                </H3>
            </div>
        );

        switch (selectedChartType) {
            case 'Bar':
                return <BarChartComponent data={processedData} xAxisKey={xAxisKey} seriesKeys={seriesKeys} />;
            case 'Line':
                return <LineChartComponent data={processedData} xAxisKey={xAxisKey} seriesKeys={seriesKeys} />;
            case 'Area':
                return <AreaChartComponent data={processedData} xAxisKey={xAxisKey} seriesKeys={seriesKeys} />;
            case 'Pie':
                // Pie chart has specific requirements
                if (selectedRow.length > 1) {
                    return <p className="text-center p-4">Pie charts can only visualize one measure at a time.</p>
                }
                return <PieChartComponent data={processedData} />;
            default:
                return <p>Select a chart type.</p>;
        }
    };

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

    const processedData = useMemo(() => {
        const dimension = selectedColumn[0]; // For grouping (e.g., product_category)
        const measure = selectedRow[0];     // For aggregating (e.g., quantity)

        if (!dimension || !measure) return [];

        if (selectedChartType === 'Pie') {
            return transformForPieChart(chartData, dimension, measure);
        }

        // Bar, Line, and Area charts use the same data structure
        return transformChartData(chartData, selectedRow, selectedColumn);

    }, [chartData, selectedRow, selectedColumn, selectedChartType]);

    // --- DYNAMIC KEYS FOR CHARTS ---
    const xAxisKey = selectedColumn[0]?.name;
    const seriesKeys = (processedData[0] && selectedChartType !== 'Pie')
        ? Object.keys(processedData[0]).filter(key => key !== xAxisKey)
        : [];

    // Create a dynamic chart config for the legend and tooltips
    const dynamicChartConfig = useMemo(() => {
        if (selectedChartType === 'Pie') {
            return processedData.reduce((acc, entry) => {
                acc[entry.name] = { label: entry.name };
                return acc;
            }, {});
        }
        return seriesKeys.reduce((acc, key) => {
            acc[key] = { label: key.replace(/_Sum|_Count/g, '') };
            return acc;
        }, {});
    }, [seriesKeys, processedData, selectedChartType]);

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
                    <ChartContainer config={dynamicChartConfig} className="min-h-[400px] w-full flex items-center justify-center">
                        {renderSelectedChart()}
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
