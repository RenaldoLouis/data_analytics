"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDashboardContext } from "@/context/dashboard-context";
import services from "@/services";
import isEmpty from 'lodash/isEmpty';
import { AreaChartIcon, BarChart, BarChart2, ChartColumnBig, LineChartIcon, PieChartIcon, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import LoadingScreen from "../ui/loadingScreen";

const ChartSelectItem = ({ value, label, chartImageUrl }) => {
    return (
        <Label
            htmlFor={value}
            className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-blue-50"
        >
            <RadioGroupItem value={value} id={value} />
            <div className="flex h-14 w-24 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 p-1">
                <img
                    src={chartImageUrl}
                    alt={label}
                    className="h-full w-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/96x56/e2e8f0/e2e8f0?text=Img'; }}
                />
            </div>
            <span className="font-medium">{label}</span>
        </Label>
    );
};

// A reusable component for the item in the "Added" list
const ChartItemDisabled = ({ label, chartImageUrl }) => {
    const t = useTranslations("dashboardpage");
    return (
        <div className="flex items-center gap-4 rounded-lg border bg-slate-50 p-4">
            <div className="flex h-14 w-24 flex-shrink-0 items-center justify-center rounded-md bg-white p-1 ring-1 ring-inset ring-slate-200">
                <img
                    src={chartImageUrl || 'https://placehold.co/96x56/e2e8f0/e2e8f0?text=Img'}
                    alt={label || 'https://placehold.co/96x56/e2e8f0/e2e8f0?text=Img'}
                    className="h-full w-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/96x56/e2e8f0/e2e8f0?text=Img'; }}
                />
            </div>
            <span className="font-medium text-gray-400">{label || t("noAvailableChart")}</span>
        </div>
    );
};


// Main Component
export const DashboardCard = ({ refetch, className = "", cardIndex, setListOfChart, listOfChart }) => {
    const { setIsFetchDataSetLists, isFetchDataSetLists, chartListType, setChartListType, setIsDialogOpenAddNewDataSet, dataSetsList, selectedLayout, setSelectedLayout } = useDashboardContext();
    const t = useTranslations("dashboardpage");
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        defaultValues: {
            selectedChartId: "chart-1",
        },
    });

    useEffect(() => {
        const fetchChartType = async () => {
            setIsLoading(true);
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
                    setIsLoading(false);
                }
            } catch (e) {
                setIsLoading(false);
                console.error(e)
            }
        }

        fetchChartType();
    }, [])

    const availableChartsData = useMemo(() => {
        // 1. Get the IDs of all charts that are currently displayed in the layout.
        // We filter out the null/empty slots to get a clean list of active chart IDs.
        const idsOnCurrentDashboard = listOfChart
            .filter(chart => chart !== null)
            .map(chart => chart.id); // Assumes chart.id is the unique chart_record_id

        // 2. Filter the master dataset list to find charts that are "available".
        const createdCharts = dataSetsList.filter(dataset => {
            // Condition 1: The dataset must have been configured as a chart.
            const hasChartContent = dataset.chart_content != null && !isEmpty(dataset.chart_content);

            // Condition 2: The chart must NOT already be on the current dashboard.
            // This is the "reverse" logic you were looking for.
            const isNotOnThisDashboard = !idsOnCurrentDashboard.includes(dataset.dashboard_records?.[0]?.id);

            return hasChartContent && isNotOnThisDashboard;
        });

        // 2. Map over the filtered list to create the new structure.
        const availableCharts = createdCharts.map(chart => {
            // Find the corresponding chart type information (e.g., "Bar", "Pie")
            // using the chart_id from the dataset.
            const chartTypeInfo = chartListType.find(type => type.id === chart.chart_id);
            const chartTypeName = chartTypeInfo ? chartTypeInfo.name : 'Chart';

            // Create a descriptive name for the chart.
            const displayName = `${chart.name}`;

            // Create a placeholder image URL.
            const imageUrl = `https://placehold.co/96x56/a0c4ff/ffffff?text=${chartTypeName}`;

            // Return the new object in the desired format.
            return {
                id: chart.chart_record_id, // Use the unique ID for the chart instance
                dataset_id: chart.id, // Use the unique ID for the chart instance
                name: displayName,
                imageUrl: imageUrl,
            };
        });

        return availableCharts;
    }, [dataSetsList, listOfChart])

    const onSubmit = async (data) => {

        const selectedDatasetID = availableChartsData.filter((eachData) => eachData.id === data.selectedChartId)
        try {
            const numberString = selectedLayout.replace(/\D/g, '');
            const layoutNumber = parseInt(numberString, 10);
            const tempObj = {
                "dashboard_layout": layoutNumber,
                "order": cardIndex + 1,
                "dataset_id": selectedDatasetID[0].dataset_id
            }
            const res = await services.dashboard.postSaveDashboardRecord(tempObj)
            if (res.success) {
                refetch()
                setIsFetchDataSetLists(!isFetchDataSetLists)
                toast("Save Success")
            } else {
                throw new Error("Save chart to dashboard failed");
            }
        } catch (e) {
            console.error("An error occurred:", e.message);
            toast.error("Failed to save chart", {
                description: e.message
            });
        }

    };

    const addedCharts = useMemo(() => {
        // 1. Filter the datasets to find items that have been added to a dashboard.
        const targetId = listOfChart?.[0]?.id;

        const chartsOnDashboard = dataSetsList.filter(dataset => {
            // Condition 1: The dataset must have dashboard records.
            const hasRecords = dataset.dashboard_records && dataset.dashboard_records.length > 0;

            // If it doesn't have records, it can't be an "added" chart.
            if (!hasRecords) {
                return false;
            }

            // Condition 2: Check if any record in `dashboard_records` has an ID
            // that matches the target ID from the first chart slot.
            const hasMatchingRecord = dataset.dashboard_records.some(
                record => record.id === targetId
            );

            // The dataset will only be included if both conditions are met.
            return hasMatchingRecord;
        });

        // 2. Map over the filtered list to create the structure for the UI.
        const formattedCharts = chartsOnDashboard.map(chart => {
            // Find the corresponding chart type information
            const chartTypeInfo = chartListType.find(type => type.id === chart.chart_id);
            const chartTypeName = chartTypeInfo ? chartTypeInfo.name : 'Chart';

            // Create a descriptive name for the chart.
            const displayName = `${chart.name}`;

            // Create a placeholder image URL.
            const imageUrl = `https://placehold.co/96x56/e2e8f0/666?text=${chartTypeName}`;

            // Return the new object in the desired format.
            return {
                id: chart.chart_record_id, // Use the unique ID for the chart instance
                name: displayName,
                imageUrl: imageUrl,
            };
        });

        return formattedCharts;
    }, [dataSetsList, chartListType, listOfChart]);

    return (
        <>
            {isLoading && (
                <LoadingScreen />
            )}
            <Dialog>
                <DialogTrigger asChild>
                    <div className={`cursor-pointer flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed bg-card shadow-sm ${className}`}>
                        <button className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                            <Plus size={16} />
                            {t("addChart")}
                        </button>
                    </div>
                </DialogTrigger>

                <DialogContent className="p-0 min-h-[600px] md:min-h-[500px]">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogHeader className="p-6">
                                <DialogTitle className="text-xl font-bold text-left">
                                    {t("chooseChart")}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="border-t"></div>

                            <div className="grid gap-4 p-5">
                                <FormField
                                    control={form.control}
                                    name="selectedChartId"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <h3 className="font-semibold">{t("available")}</h3>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="grid gap-3"
                                                >
                                                    {availableChartsData.length > 0
                                                        ? availableChartsData.map((chart) => (
                                                            <ChartSelectItem
                                                                key={chart.id}
                                                                value={chart.id}
                                                                label={chart.name}
                                                                chartImageUrl={chart.imageUrl}
                                                            />
                                                        ))
                                                        : <ChartItemDisabled />}
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-3 pb-13">
                                    <h3 className="font-semibold">{t("added")}</h3>
                                    {addedCharts.length > 0
                                        ? addedCharts.map((chart) => (
                                            <ChartItemDisabled
                                                key={chart.id}
                                                label={chart.name}
                                                chartImageUrl={chart.imageUrl}
                                            />
                                        ))
                                        : <ChartItemDisabled />
                                    }
                                </div>
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" className="w-full sm:flex-1">{t("cancel")}</Button>
                                </DialogClose>
                                <Button type="submit" className="w-full sm:flex-1">{t("add")}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
};
