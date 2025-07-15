"use client";

import syncIcon from "@/assets/logo/syncIcon.svg";
import { EditableText } from "@/components/EditableText";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ItemTypes } from "@/constant/DragTypes";
import { useDashboardContext } from "@/context/dashboard-context";
import { useDatasetRightContent } from "@/hooks/useDatasetRightContent";
import services from "@/services";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import { toast } from "sonner";

const testGetterObj = {
    firstName: "bob",
    lastName: "sagot",
    get name() {
        return `${this.firstName} ${this.lastName}`
    }
}


const DraggableItem = ({ item, type }) => {
    const [, drag] = useDrag(() => ({
        type,
        item,
    }));

    return (
        <li
            ref={drag}
            className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
        >
            <span>{item.icon}</span> {item.name}
        </li>
    );
};

export default function DatasetRightContent() {
    const pathname = usePathname();
    const { dataSetsList, setDataToUpdate, dataToUpdate, setIsFetchDataSetContents, isFetchDataSetContents, } = useDashboardContext();

    const [isShowsideContent, setIsShowsideContent] = useState(false);
    const [datasetId, setDatasetId] = useState(null);

    useEffect(() => {
        if (pathname !== "/dashboard") {
            const match = pathname.match(/\/datasets\/([a-f0-9\-]+)/);

            if (match) {
                const datasetId = match[1];
                setDatasetId(datasetId)
            }
        }
    }, [pathname]);

    const {
        availableDimensions,
        availableMeasures,
        loading
    } = useDatasetRightContent(datasetId);

    useEffect(() => {
        setIsShowsideContent(pathname !== "/dashboard");
    }, [pathname]);

    const handleUpdateData = async () => {
        const datasetContents = dataToUpdate.map((eachData) => ({
            id: eachData.id,
            data: eachData,
        }));

        try {
            const res = await services.dataset.updateDatasetContents(datasetId, {
                datasetContents,
            });

            if (res?.success) {
                toast("Dataset Updated successfully");
                setIsFetchDataSetContents(!isFetchDataSetContents)
            }
        } catch (e) {
            toast("Upload failed", {
                description: error.message,
            });
            throw new Error("Upload failed with status " + res.status);
        }
    };

    const currentDataset = useMemo(() => {
        if (datasetId) {
            const filteredData = dataSetsList.filter((eachData) => eachData.id === datasetId)
            return filteredData[0]
        }
    }, [dataSetsList, datasetId])

    const dataStaus = useMemo(() => {
        if (currentDataset) {
            switch (currentDataset.status) {
                case 0:
                    return "Draft"
                case 1:
                    return "Ready for Visualization"
            }

        }
    }, [currentDataset])

    const handleNameSave = async (newName) => {
        if (newName.trim() === currentDataset.sheet_name.trim()) {
            toast("No change detected after trimming whitespace. Not saving.");
            return; // Exit the function if the names are the same after trimming
        }
        if (newName.trim() === "") {
            toast("Name cannot be empty.");
            return;
        }

        const tempData = {
            "name": currentDataset.name,
            "sheet_name": newName,
            "status": currentDataset.status
        }

        try {
            const res = await services.dataset.updateDataset(datasetId, tempData);

            if (res?.success) {
                toast("Dataset Updated successfully");
                setIsFetchDataSetContents(!isFetchDataSetContents)
            }
        } catch (e) {
            toast("Upload failed", {
                description: e.message,
            });
            throw new Error("Upload failed with status " + res.status);
        }

        // and then refectch the dataste on the left side
    };

    return (
        <AnimatePresence>
            {isShowsideContent && (
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className="px-2 py-4 w-full max-w-sm h-full bg-white border-l"
                >
                    {/* Header */}
                    <CardHeader className="pb-2">
                        {/* <div className="flex justify-between items-start">
                            <H3 className="text-lg font-bold leading-snug">
                                {currentDataset?.sheet_name}
                            </H3>
                            <Button variant="outline" size="icon" className="h-7 w-7">
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </div> */}
                        <EditableText
                            initialName={currentDataset?.sheet_name}
                            onSave={handleNameSave}
                        />
                        <div className="flex items-center gap-2 my-3">
                            <Switch disabled={currentDataset?.status === 0 ? true : false} id="show-dashboard" defaultChecked />
                            <Label
                                htmlFor="show-dashboard"
                                className="text-sm font-medium text-gray-800"
                            >
                                Show to Dashboard
                            </Label>
                        </div>
                    </CardHeader>

                    {/* Dimensions and Measures */}
                    <CardContent className="pb-2">
                        <div className="mb-5">
                            <p className="text-sm font-semibold text-gray-500 mb-3">
                                Dimensions
                            </p>
                            {loading ? (
                                <div className="flex flex-col space-y-3">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[120px]" />
                                    </div>
                                </div>
                            ) : (
                                //  <ScrollArea className="h-auto max-h-28 rounded-md p-2">
                                < ul id="dimensionList" className="space-y-2">
                                    {availableDimensions.map((dim) => (
                                        <DraggableItem key={dim.name} item={dim} type={ItemTypes.DIMENSION} />
                                    ))}
                                </ul>
                                // </ScrollArea> 
                            )}

                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-500 mb-3">
                                Measures
                            </p>
                            {loading ? (
                                <div className="flex flex-col space-y-3">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[120px]" />
                                    </div>
                                </div>
                            ) : (
                                // <ScrollArea className="h-auto max-h-28 rounded-md p-2"> 
                                < ul id="measuresList" className="space-y-2">
                                    {availableMeasures.map((m) => (
                                        <DraggableItem key={m.name} item={m} type={ItemTypes.MEASURE} />
                                    ))}
                                </ul>
                                // </ScrollArea> 
                            )}
                        </div>
                    </CardContent>

                    {/* Footer: Details & Actions */}
                    <CardFooter className="flex flex-col items-start gap-4 border-t pt-4 text-sm text-gray-600">
                        <div className="space-y-1 w-full">
                            <p className="mb-4" style={{ fontWeight: 700, fontSize: 12 }}>DATA SET DETAILS</p>
                            <p className="mb-3">
                                <span className="font-medium">Data Source:</span>{" "}
                                <a href="#" className="text-blue-600 underline">
                                    Data_Penjualan_P...
                                </a>
                            </p>
                            <p className="mb-3">
                                <span className="font-medium">Created on:</span> 04/05/2025
                            </p>
                            <p className="mb-3">
                                <span className="font-medium">Last edited on:</span> -
                            </p>
                            <p className="mb-3">
                                <span className="font-medium">Last edited by:</span> Renaldo
                            </p>
                            <p className="mb-3">
                                <span className="font-medium">Data status:</span>{" "}
                                <span className="text-green-600">{dataStaus}</span>
                            </p>
                            <p className="mb-3">
                                <span className="font-medium">Quality Score:</span>{" "}
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    100%
                                </span>
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 w-full">

                            <Button onClick={handleUpdateData} variant="secondary" className="flex-1 cursor-pointer" style={{ background: "#0B2238", color: "white" }}>
                                <Image src={syncIcon} alt="Measure icon" className="w-5 h-5" />   Sync Changes
                            </Button>
                            <Button variant="destructive" className="flex-1 cursor-pointer">
                                Delete Data Set
                            </Button>
                        </div>
                    </CardFooter>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
}
