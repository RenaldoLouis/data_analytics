"use client";

import {
    ChartContainer
} from "@/components/ui/chart";
import { H3 } from "@/components/ui/typography";
import { ChartAggregator, FormulasList } from "@/constant/ChartTypes";
import { ItemTypes } from "@/constant/DragTypes";
import { useDashboardContext } from "@/context/dashboard-context";
import { cn } from "@/lib/utils";
import services from "@/services";
import { AreaChartIcon, ChartColumnBig, LineChartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from 'next/image';
import { useEffect, useMemo, useState } from "react";
import { useDrop } from 'react-dnd';
import { AreaChartComponent, BarChartComponent, LineChartComponent, PieChartComponent } from "./ChartComponent";

import siriuschart from "@/assets/Images/siriuschart.svg";
import siriuspiechart from "@/assets/Images/siriuspiechart.svg";
import stackedbarpiechart from "@/assets/Images/stackedbarpiechart.svg";
import ColumnIcon from "@/assets/logo/ColumnIcon.svg";
import FormulaIcon from "@/assets/logo/FormulaIcon.svg";
import RowIcon from "@/assets/logo/RowIcon.svg";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const DatasetsChartView = ({ chartData, datasetId }) => {
    const t = useTranslations("datasetpage");
    const { chartContainerRef, chartListType, setChartListType, selectedRow, selectedColumn, setSelectedColumn, setSelectedRow, setSelectedChartType, selectedChartType, setChartDrawData, chartDrawData } = useDashboardContext();

    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [selectedFormula, setSelectedFormula] = useState(ChartAggregator.sum)

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

    const handleClickFormula = (formulaType) => {
        setSelectedFormula(ChartAggregator[formulaType.toLowerCase()])
    }

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
                                updatedData.icon = <Image src={siriuschart} alt="Column icon" />
                                break;
                            case "StackedBar":
                                updatedData.icon = <Image src={stackedbarpiechart} alt="Column icon" />
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
                                updatedData.icon = <Image src={siriuspiechart} alt="Column icon" />
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
                        "selected_column": selectedColumn,
                        "chart_aggregator": selectedFormula
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
        } else {
            setChartDrawData([])
        }

    }, [selectedFormula, selectedChartType, selectedRow, selectedColumn])

    const [{ isOver: isOverColumn }, dropColumn] = useDrop({
        accept: [ItemTypes.DIMENSION, ItemTypes.MEASURE],
        drop: (item) => {
            setSelectedColumn((prev) => {
                // Check if an item with the same name already exists
                const alreadyExists = prev.some(existingItem => existingItem.name === item.name);

                // If it doesn't exist, add the new item
                if (!alreadyExists) {
                    return [...prev, { name: item.name, type: item.type }];
                }

                // Otherwise, return the array unchanged
                return prev;
            });
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const [{ isOver: isOverRow }, dropRow] = useDrop({
        accept: [ItemTypes.DIMENSION, ItemTypes.MEASURE],
        drop: (item) => {
            setSelectedRow((prev) => {
                // Check if an item with the same name already exists
                const alreadyExists = prev.some(existingItem => existingItem.name === item.name);

                // If it doesn't exist, add the new item
                if (!alreadyExists) {
                    return [...prev, { name: item.name, type: item.type }];
                }

                // Otherwise, return the array unchanged
                return prev;
            });
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    //TO DO: might be remove one day This is the working frontend Logic Before for testing only
    // const processedData = useMemo(() => {
    //     const dimensions = selectedColumn;
    //     const measuresOrSecondDimension = selectedRow;

    //     if (measuresOrSecondDimension.length === 0 || dimensions.length === 0) return [];

    //     const primaryDimension = dimensions[0];
    //     const secondItem = measuresOrSecondDimension[0];

    //     // SCENARIO 1: Dimension vs. Dimension (e.g., product_category vs. customer_region)
    //     // We will create a stacked chart by COUNTING records.
    //     if (primaryDimension.type === ItemTypes.DIMENSION && secondItem.type === ItemTypes.DIMENSION) {
    //         return transformForStackedChart(
    //             chartData,
    //             primaryDimension.name,
    //             secondItem
    //         );
    //     }

    //     // SCENARIO 2: Pie Chart (works as before)
    //     if (selectedChartType?.name === 'Pie') {
    //         return transformForPieChart(chartData, secondItem, primaryDimension);
    //     }

    //     // SCENARIO 3: Default Dimension vs. Measure (works as before)
    //     return transformChartData(chartData, selectedColumn, selectedRow);

    // }, [chartData, selectedRow, selectedColumn, selectedChartType]);

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
        <div className="w-full px-6 pb-4 overflow-x-auto">
            {/* Column & Row Settings */}
            <div className="border rounded-md overflow-hidden mb-4"> {/* overflow-hidden to make sure the edge rounded */}
                {/* --- FORMULA PART --- */}
                <div className="grid grid-cols-6 border-b-2 h-[52px]">
                    <div className="px-6 border-r-2 flex items-center gap-2">
                        <Image src={FormulaIcon} alt="Column icon" />
                        <div className="text-sm font-medium text-gray-600">
                            <span className="text-blue-600">{t("formula")}</span>
                        </div>
                    </div>

                    <div className="col-span-5 pt-1 flex items-center">
                        <TooltipProvider delayDuration={200}>
                            <div className="flex gap-2 p-2 rounded-md overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                                {FormulasList.map((formula) => (
                                    <Tooltip key={formula.name}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => handleClickFormula(formula.value)}
                                                className={cn(
                                                    "inline-flex items-center rounded-full px-4 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                                                    selectedFormula === formula.value
                                                        ? "bg-[#2168AB] text-white hover:bg-[#2c85d6]"
                                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-100 hover:text-blue-800"
                                                )}
                                            >
                                                {formula.name}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                        // className="bg-[#F2F2F2] text-gray-800 border border-gray-300"
                                        >
                                            <p>{t(formula.tooltip)}</p>

                                            <TooltipPrimitive.Arrow
                                            //  className="fill-[#F2F2F2]"
                                            />
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>
                    </div>
                </div>

                {/* --- COLUMNS PART --- */}
                <div className="grid grid-cols-6 border-b-2 h-[52px]">
                    <div className="px-6 border-r-2 flex items-center gap-2" style={{ backgroundColor: "#EAF3FB" }}>
                        <Image src={ColumnIcon} alt="Column icon" />
                        <div className="text-sm font-medium text-gray-600">
                            <span className="text-blue-600">{t("columns")}</span>
                        </div>
                    </div>

                    <div className="col-span-5 pt-1 flex items-center">
                        <div
                            ref={dropColumn}
                            className={cn(
                                "flex flex-wrap items-start gap-2 p-2 rounded-md w-full h-full overflow-y-auto scrollbar-thin",
                                isOverColumn ? "bg-blue-50 border border-blue-400" : "bg-white"
                            )}
                        >
                            {selectedColumn.map((item) => (
                                <span
                                    key={item.name}
                                    className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium"
                                >
                                    # {item.name}
                                    <button
                                        onClick={() => handleRemoveItem(item, 'column')}
                                        className="text-blue-500 hover:text-blue-800 cursor-pointer ml-2"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- ROWS PART --- */}
                <div className="grid grid-cols-6 h-[52px]">
                    <div className="px-6 border-r-2 flex items-center gap-2" style={{ backgroundColor: "#FFEFE5" }}>
                        <Image src={RowIcon} alt="Row icon" />
                        <div className="text-sm font-medium text-gray-600">
                            <span className="text-blue-600">{t("rows")}</span>
                        </div>
                    </div>

                    <div className="col-span-5 pt-1 flex items-center">
                        <div
                            ref={dropRow}
                            className={cn(
                                "flex flex-wrap items-start gap-2 p-2 rounded-md w-full h-full overflow-y-auto scrollbar-thin",
                                isOverRow ? "bg-orange-50 border border-orange-400" : "bg-white"
                            )}
                        >
                            {selectedRow.map((item) => (
                                <span
                                    key={item.name}
                                    className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium"
                                >
                                    # {item.name}
                                    <button
                                        onClick={() => handleRemoveItem(item, 'row')}
                                        className="cursor-pointer text-blue-500 hover:text-blue-800 ml-2"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-[12px] text-[16px]" style={{ color: "#727272" }}>
                Chart Options
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
                                "border rounded-md p-3 flex items-center justify-center w-[48px] h-[42px] transition cursor-pointer",
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
            <div className="bg-white rounded-md p-4 shadow-sm" ref={chartContainerRef}>
                <ChartContainer config={dynamicChartConfig} className="w-full flex items-center justify-center">
                    {renderSelectedChart()}
                </ChartContainer>
            </div>
        </div>
    );
};

export default DatasetsChartView;
