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
import _ from 'lodash';
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";

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
export const DashboardCard = ({ className = "", cardIndex, setListOfChart, listOfChart }) => {
    const form = useForm({
        defaultValues: {
            selectedChartId: "chart-1",
        },
    });

    const onSubmit = (data) => {
        console.log("data", data)

        let clonedData = _.cloneDeep(listOfChart);
        const tempObj = {
            chartType: "areaChart",
            data: [
                [
                    { month: "January", desktop: 186, mobile: 80 },
                    { month: "February", desktop: 305, mobile: 200 },
                    { month: "March", desktop: 237, mobile: 120 },
                    { month: "April", desktop: 73, mobile: 190 },
                    { month: "May", desktop: 209, mobile: 130 },
                    { month: "June", desktop: 214, mobile: 140 },
                ],
                [
                    { month: "January", desktop: 186, mobile: 80 },
                    { month: "February", desktop: 305, mobile: 200 },
                    { month: "March", desktop: 237, mobile: 120 },
                    { month: "April", desktop: 73, mobile: 190 },
                    { month: "May", desktop: 209, mobile: 130 },
                    { month: "June", desktop: 214, mobile: 140 },
                ],
                [
                    { month: "January", desktop: 186, mobile: 80 },
                    { month: "February", desktop: 305, mobile: 200 },
                    { month: "March", desktop: 237, mobile: 120 },
                    { month: "April", desktop: 73, mobile: 190 },
                    { month: "May", desktop: 209, mobile: 130 },
                    { month: "June", desktop: 214, mobile: 140 },
                ],
                [
                    { month: "January", desktop: 186, mobile: 80 },
                    { month: "February", desktop: 305, mobile: 200 },
                    { month: "March", desktop: 237, mobile: 120 },
                    { month: "April", desktop: 73, mobile: 190 },
                    { month: "May", desktop: 209, mobile: 130 },
                    { month: "June", desktop: 214, mobile: 140 },
                ],
                [
                    { month: "January", desktop: 186, mobile: 80 },
                    { month: "February", desktop: 305, mobile: 200 },
                    { month: "March", desktop: 237, mobile: 120 },
                    { month: "April", desktop: 73, mobile: 190 },
                    { month: "May", desktop: 209, mobile: 130 },
                    { month: "June", desktop: 214, mobile: 140 },
                ],
                [
                    { month: "January", desktop: 186, mobile: 80 },
                    { month: "February", desktop: 305, mobile: 200 },
                    { month: "March", desktop: 237, mobile: 120 },
                    { month: "April", desktop: 73, mobile: 190 },
                    { month: "May", desktop: 209, mobile: 130 },
                    { month: "June", desktop: 214, mobile: 140 },
                ],
                [
                    { month: "January", desktop: 186, mobile: 80 },
                    { month: "February", desktop: 305, mobile: 200 },
                    { month: "March", desktop: 237, mobile: 120 },
                    { month: "April", desktop: 73, mobile: 190 },
                    { month: "May", desktop: 209, mobile: 130 },
                    { month: "June", desktop: 214, mobile: 140 },
                ],
                [
                    { month: "January", desktop: 186, mobile: 80 },
                    { month: "February", desktop: 305, mobile: 200 },
                    { month: "March", desktop: 237, mobile: 120 },
                    { month: "April", desktop: 73, mobile: 190 },
                    { month: "May", desktop: 209, mobile: 130 },
                    { month: "June", desktop: 214, mobile: 140 },
                ],
            ]
        };
        clonedData[cardIndex] = tempObj;
        setListOfChart(clonedData)

    };

    const availableCharts = [
        { id: "chart-1", name: "Penjualan Maret 2024", imageUrl: "https://placehold.co/96x56/a0c4ff/ffffff?text=Chart1" },
        { id: "chart-2", name: "User Engagement Q1", imageUrl: "https://placehold.co/96x56/bde0fe/ffffff?text=Chart2" },
    ];

    const addedCharts = [
        { id: "chart-3", name: "Revenue Growth YTD", imageUrl: "https://placehold.co/96x56/ffafcc/ffffff?text=Chart3" },
    ];

    return (
        <div className={`flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed bg-card shadow-sm ${className}`}>
            <Dialog>
                <DialogTrigger asChild>
                    <button className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                        <Plus size={16} />
                        Add Chart
                    </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-2xl p-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogHeader className="p-6 pb-4">
                                <DialogTitle className="text-xl font-bold text-left">
                                    Choose Chart
                                </DialogTitle>
                            </DialogHeader>
                            <div className="border-t"></div>

                            <div className="grid gap-8 p-6">
                                <FormField
                                    control={form.control}
                                    name="selectedChartId"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel className="font-semibold text-muted-foreground">Available</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="grid gap-3"
                                                >
                                                    {availableCharts.map((chart) => (
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
                                    <h3 className="font-semibold text-muted-foreground">Added</h3>
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
                                    <Button variant="outline" className="w-full sm:w-auto cursor-pointer">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" className="w-full sm:w-auto cursor-pointer">Add to Dashboard</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
