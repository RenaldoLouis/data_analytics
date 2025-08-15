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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDashboardContext } from "@/context/dashboard-context";
import services from "@/services";
import isEmpty from 'lodash/isEmpty';
import { AreaChartIcon, BarChart, BarChart2, ChartColumnBig, LineChartIcon, PieChartIcon, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
const AddedChartItem = ({ label, chartImageUrl }) => {
    return (
        <div className="flex items-center gap-4 rounded-lg border bg-slate-50 p-4">
            <div className="flex h-14 w-24 flex-shrink-0 items-center justify-center rounded-md bg-white p-1 ring-1 ring-inset ring-slate-200">
                <img
                    src={chartImageUrl}
                    alt={label}
                    className="h-full w-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/96x56/e2e8f0/e2e8f0?text=Img'; }}
                />
            </div>
            <span className="font-medium">{label}</span>
        </div>
    );
};


// Main Component
export const DashboardCard = ({ refetch, className = "", cardIndex, setListOfChart, listOfChart }) => {
    const { setIsFetchDataSetLists, isFetchDataSetLists, chartListType, setChartListType, setIsDialogOpenAddNewDataSet, dataSetsList, selectedLayout, setSelectedLayout } = useDashboardContext();
    const t = useTranslations("dashboardpage");

    const form = useForm({
        defaultValues: {
            selectedChartId: "chart-1",
        },
    });

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
    }, [])

    const availableChartsData = useMemo(() => {
        // 1. Filter the datasets to only include those that have been saved as a chart.
        //    We can check if `chart_content` is not null.
        const createdCharts = dataSetsList.filter(dataset => dataset.chart_content !== null && !isEmpty(dataset.chart_content) && dataset.dashboard_records.length <= 0);

        // 2. Map over the filtered list to create the new structure.
        const availableCharts = createdCharts.map(chart => {
            // Find the corresponding chart type information (e.g., "Bar", "Pie")
            // using the chart_id from the dataset.
            const chartTypeInfo = chartListType.find(type => type.id === chart.chart_id);
            const chartTypeName = chartTypeInfo ? chartTypeInfo.name : 'Chart';

            // Create a descriptive name for the chart.
            const displayName = `${chart.sheet_name}`;

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
        const chartsOnDashboard = dataSetsList.filter(dataset =>
            dataset.dashboard_records && dataset.dashboard_records.length > 0
        );

        // 2. Map over the filtered list to create the structure for the UI.
        const formattedCharts = chartsOnDashboard.map(chart => {
            // Find the corresponding chart type information
            const chartTypeInfo = chartListType.find(type => type.id === chart.chart_id);
            const chartTypeName = chartTypeInfo ? chartTypeInfo.name : 'Chart';

            // Create a descriptive name for the chart.
            const displayName = `${chart.sheet_name}`;

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
            <Dialog>
                <DialogTrigger asChild>
                    <div className={`cursor-pointer flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed bg-card shadow-sm ${className}`}>
                        <button className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                            <Plus size={16} />
                            {t("addChart")}
                        </button>
                    </div>
                </DialogTrigger>

                <DialogContent className="sm:max-w-2xl p-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogHeader className="p-6 pb-4">
                                <DialogTitle className="text-xl font-bold text-left">
                                    {t("chooseChart")}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="border-t"></div>

                            <div className="grid gap-8 p-6">
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
                                                    {availableChartsData.map((chart) => (
                                                        <ChartSelectItem
                                                            key={chart.id}
                                                            value={chart.id}
                                                            label={chart.name}
                                                            chartImageUrl={chart.imageUrl}
                                                        />
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-3">
                                    <h3 className="font-semibold">{t("added")}</h3>
                                    {addedCharts.map((chart) => (
                                        <AddedChartItem
                                            key={chart.id}
                                            label={chart.name}
                                            chartImageUrl={chart.imageUrl}
                                        />
                                    ))}
                                </div>
                            </div>

                            <DialogFooter className="bg-slate-50 p-6 sm:justify-end">
                                <DialogClose asChild>
                                    <Button variant="outline" className="w-full sm:w-auto cursor-pointer">{t("cancel")}</Button>
                                </DialogClose>
                                <Button type="submit" className="w-full sm:w-auto cursor-pointer">{t("add")}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
};
