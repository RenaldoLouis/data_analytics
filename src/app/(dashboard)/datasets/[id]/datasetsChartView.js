"use client";

import {
    ChartContainer
} from "@/components/ui/chart";
import { H3 } from "@/components/ui/typography";
import { ItemTypes } from "@/constant/DragTypes";
import { useDashboardContext } from "@/context/dashboard-context";
import { transformChartData, transformForPieChart, transformForStackedChart } from "@/lib/transformChartData";
import { cn } from "@/lib/utils";
import services from "@/services";
import { AreaChartIcon, BarChart, BarChart2, ChartColumnBig, LineChartIcon, PieChartIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDrop } from 'react-dnd';
import { AreaChartComponent, BarChartComponent, LineChartComponent, PieChartComponent } from "./ChartComponent";


const DatasetsChartView = ({ chartData, datasetId }) => {
    const { chartListType, setChartListType, selectedRow, selectedColumn, setSelectedColumn, setSelectedRow, setSelectedChartType, selectedChartType, setChartDrawData, chartDrawData } = useDashboardContext();

    const [isLoadingChart, setIsLoadingChart] = useState(false);

    const renderSelectedChart = () => {
        const hasData = chartDrawData && chartDrawData.length > 0;
        if (isLoadingChart) {
            return (
                <div className="justify-items-center w-full h-full content-center">
                    <div className="justify-items-center w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )
        }
        if (!hasData) return (
            <div className="text-center py-20">
                <H3 className="text-lg font-medium text-gray-600">
                    Drag and drop fields to build a chart.
                </H3>
            </div>
        );

        switch (selectedChartType?.name) {
            case 'Bar':
                return <BarChartComponent data={chartDrawData} xAxisKey={xAxisKey} seriesKeys={seriesKeys} />;
            case 'StackedBar':
                return <BarChartComponent data={chartDrawData} xAxisKey={xAxisKey} seriesKeys={seriesKeys} />;
            case 'Groupbar':
                return <BarChartComponent data={chartDrawData} xAxisKey={xAxisKey} seriesKeys={seriesKeys} isGrouped={true} />;
            case 'Line':
                return <LineChartComponent data={chartDrawData} xAxisKey={xAxisKey} seriesKeys={seriesKeys} />;
            case 'Area':
                return <AreaChartComponent data={chartDrawData} xAxisKey={xAxisKey} seriesKeys={seriesKeys} />;
            case 'Pie':
                // Pie chart has specific requirements
                if (selectedRow.length > 1) {
                    return <p className="text-center p-4">Pie charts can only visualize one measure at a time.</p>
                }
                return <PieChartComponent data={chartDrawData} />;
            default:
                return <p>Select a chart type.</p>;
        }
    };

    useEffect(() => {
        const fetchChartType = async () => {
            try {
                const res = await services.chart.getChart()
                if (res?.success) {
                    const modifiedList = res.data.map((eachData) => {
                        const updatedData = { ...eachData };

                        updatedData.name = updatedData.name.replace(/\s+/g, '');

                        switch (updatedData.name) {
                            case "Bar":
                                updatedData.icon = <BarChart2 />;
                                break;
                            case "StackedBar":
                                updatedData.icon = <BarChart />;
                                break;
                            case "Groupbar":
                                updatedData.icon = <ChartColumnBig />;
                                break;
                            case "Line":
                                updatedData.icon = <LineChartIcon />;
                                break;
                            case "Area":
                                updatedData.icon = <AreaChartIcon />;
                                break;
                            case "Pie":
                                updatedData.icon = <PieChartIcon />;
                                break;
                            default:
                                updatedData.icon = null;
                                break;
                        }
                        return updatedData;
                    });

                    setChartListType(modifiedList)
                }
            } catch (e) {
                console.error(e)
            }
        }

        fetchChartType();
    }, [selectedChartType, datasetId])

    useEffect(() => {
        if (selectedChartType && selectedColumn.length > 0 && selectedRow.length > 0) {
            setIsLoadingChart(true)
            const fetchChartData = async () => {
                try {
                    const tempObj = {
                        "chart_id": selectedChartType?.id,
                        "dataset_id": datasetId,
                        "selected_row": selectedRow,
                        "selected_column": selectedColumn
                    }

                    const res = await services.chart.getChartData(tempObj)
                    setChartDrawData(res.data)
                    setIsLoadingChart(false)
                } catch (e) {
                    setIsLoadingChart(false)
                    console.error("Fetch Chart Data Fail", e)
                }
            }

            fetchChartData();
        }
    }, [selectedChartType, selectedRow, selectedColumn])

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

    //TO DO: might be remove one day This is the working frontend Logic Before for testing only
    const processedData = useMemo(() => {
        const dimensions = selectedColumn;
        const measuresOrSecondDimension = selectedRow;

        if (measuresOrSecondDimension.length === 0 || dimensions.length === 0) return [];

        const primaryDimension = dimensions[0];
        const secondItem = measuresOrSecondDimension[0];

        // SCENARIO 1: Dimension vs. Dimension (e.g., product_category vs. customer_region)
        // We will create a stacked chart by COUNTING records.
        if (primaryDimension.type === ItemTypes.DIMENSION && secondItem.type === ItemTypes.DIMENSION) {
            return transformForStackedChart(
                chartData,
                primaryDimension.name,
                secondItem
            );
        }

        // SCENARIO 2: Pie Chart (works as before)
        if (selectedChartType?.name === 'Pie') {
            return transformForPieChart(chartData, secondItem, primaryDimension);
        }

        // SCENARIO 3: Default Dimension vs. Measure (works as before)
        return transformChartData(chartData, selectedColumn, selectedRow);

    }, [chartData, selectedRow, selectedColumn, selectedChartType]);

    // --- DYNAMIC KEYS FOR CHARTS ---
    const xAxisKey = selectedColumn[0]?.name;
    const seriesKeys = useMemo(() => {
        if (!chartDrawData || chartDrawData.length === 0) return [];
        return Object.keys(chartDrawData[0]).filter(key => key !== xAxisKey);
    }, [chartDrawData, xAxisKey]);

    // Create a dynamic chart config for the legend and tooltips
    const dynamicChartConfig = useMemo(() => {
        if (chartDrawData) {
            if (selectedChartType?.name === 'Pie') {
                return chartDrawData?.reduce((acc, entry) => {
                    acc[entry.name] = { label: entry.name };
                    return acc;
                }, {});
            }
            return seriesKeys.reduce((acc, key) => {
                acc[key] = { label: key.replace(/_Sum|_Count/g, '') };
                return acc;
            }, {});
        }
    }, [seriesKeys, chartDrawData, selectedChartType]);

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
                {chartListType.map((type) => {
                    let isDisabled = false

                    if (type.name === "Groupbar") {
                        if (selectedRow[0]?.type === "measure") {
                            isDisabled = true
                        }
                    }
                    if (type.name === "Pie") {
                        if (selectedRow[0]?.type === "dimension") {
                            isDisabled = true
                        }
                    }

                    if (type.name === "Bar") {
                        if ((selectedRow[0]?.type === "dimension" && selectedColumn[0]?.type === "dimension")) {
                            isDisabled = true
                        }
                    }
                    if (type.name === "StackedBar") {
                        if (!(selectedRow[0]?.type === "dimension" && selectedColumn[0]?.type === "dimension")) {
                            isDisabled = true
                        }
                    }

                    return (
                        <button
                            key={type.name}
                            onClick={() => setSelectedChartType(type)}
                            disabled={isDisabled}
                            className={cn(
                                "border rounded-md p-3 flex items-center justify-center w-24 h-20 transition cursor-pointer",
                                selectedChartType?.name === type.name
                                    ? "border-blue-500 bg-blue-100"
                                    : "border-gray-300 hover:bg-gray-100",
                                "disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
                            )}
                        >
                            {type.icon}
                        </button>
                    )
                })}
            </div>

            {/* Chart View */}
            <div className="bg-white rounded-md p-4 shadow-sm">
                <ChartContainer config={dynamicChartConfig} className="min-h-[400px] w-full flex items-center justify-center">
                    {renderSelectedChart()}
                </ChartContainer>
            </div>
        </div>
    );
};

export default DatasetsChartView;
