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
import moment from "moment";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import LoadingScreen from "@/components/ui/loadingScreen";

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
    const t = useTranslations("datasetpage");
    const { selectedRow, selectedColumn, setSelectedColumn, setSelectedRow, chartListType, isFetchDataSetLists, setIsFetchDataSetLists, setChartDrawData, chartDrawData, setSelectedChartType, selectedChartType, dataSetsList, setDataToUpdate, dataToUpdate, setIsFetchDataSetContents, isFetchDataSetContents, } = useDashboardContext();

    const [isShowsideContent, setIsShowsideContent] = useState(false);
    const [isOpenSideContent, setIsOpenSideContent] = useState(false);
    const [datasetId, setDatasetId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (pathname !== "/dashboard") {
            const match = pathname.match(/\/datasets\/([a-f0-9\-]+)/);

            if (match) {
                const datasetId = match[1];
                setDatasetId(datasetId)
            }
        }
    }, [pathname]);

    const currentDataFromDataSetList = useMemo(() => {
        if (dataSetsList.length > 0 && datasetId) {
            const tempArray = dataSetsList.filter((eachData) => eachData.id === datasetId)
            return tempArray[0]
        }
    }, [dataSetsList, datasetId, chartListType, chartDrawData])

    // To draw the chart if the user has ever saved the chart
    useEffect(() => {
        if (currentDataFromDataSetList && currentDataFromDataSetList.chart_record_id && chartListType.length > 0) {
            const getChartRecords = async () => {
                try {
                    const res = await services.chart.getChartRecords(currentDataFromDataSetList?.chart_record_id)

                    // TODO return of error from BE when no chart exist must be fixed
                    if (res.message[0].code === "invalid_string") {
                        setChartDrawData([])
                        setSelectedChartType(null)
                        setSelectedColumn([])
                        setSelectedRow([])
                        throw new Error("No Chart Exist yet");
                    }
                    if (chartDrawData?.length <= 0) {
                        const selectedChart = chartListType.filter((eachData) => eachData.id === res?.data?.chart_id)
                        setChartDrawData(res?.data?.chart_content)
                        setSelectedChartType(selectedChart[0])
                        setSelectedColumn(res?.data?.selected_column)
                        setSelectedRow(res?.data?.selected_row)
                    }
                } catch (e) {
                    console.error(e)
                }
            }
            getChartRecords()
        }
    }, [currentDataFromDataSetList])

    const {
        availableDimensions,
        availableMeasures,
        loading
    } = useDatasetRightContent(datasetId);

    useEffect(() => {
        setIsShowsideContent(!pathname.includes("/dashboard"));
        setIsOpenSideContent(!pathname.includes("/dashboard"));
    }, [pathname]);

    const handleUpdateData = async () => {
        setIsLoading(true);
        const datasetContents = dataToUpdate.map((eachData) => ({
            id: eachData.id,
            data: eachData,
        }));

        try {
            const res = await services.dataset.updateDatasetContents(datasetId, {
                datasetContents,
            });

            if (res?.success) {
                toast(t("datasetUpdated"));
                setIsFetchDataSetContents(!isFetchDataSetContents)
            }
        } catch (e) {
            setIsLoading(false);
            toast(t("uploadFailed"), {
                description: error.message,
            });
            throw new Error("Upload failed with status " + res.status);
        }
        setIsLoading(false);
    };

    const currentDataset = useMemo(() => {
        if (datasetId) {
            const filteredData = dataSetsList.filter((eachData) => eachData.id === datasetId)
            return filteredData[0]
        }
    }, [dataSetsList, datasetId])

    const dataStatus = useMemo(() => {
        if (currentDataset) {
            switch (currentDataset.status) {
                case 0:
                    return t("draft")
                case 1:
                    return t("readyForVisualization")
            }

        }
    }, [currentDataset])

    const handleNameSave = async (newName) => {
        setIsLoading(true);
        if (newName.trim() === currentDataset.name.trim()) {
            setIsLoading(false);
            // toast("No change detected after trimming whitespace. Not saving.");
            return; // Exit the function if the names are the same after trimming
        }
        if (newName.trim() === "") {
            setIsLoading(false);
            toast(t("emptyDatasetNameValidation"));
            return;
        }

        const tempData = {
            "name": newName,
            "status": currentDataset.status
        }

        try {
            const res = await services.dataset.updateDataset(datasetId, tempData);

            if (res?.success) {
                toast(t("datasetUpdated"));
                setIsFetchDataSetLists(!isFetchDataSetLists)
                setIsFetchDataSetContents(!isFetchDataSetContents)
            }
        } catch (e) {
            setIsLoading(false);
            toast(t("datasetUpdatedFailed"), {
                description: e.message,
            });
            throw new Error("Upload failed with status " + res.status);
        }
        setIsLoading(false);
    };

    const handleSaveChart = async () => {
        setIsLoading(true);
        const tempObj = {
            "dataset_id": datasetId,
            "chart_id": selectedChartType.id,
            "chart_content": chartDrawData,
            "selected_row": selectedRow,
            "selected_column": selectedColumn,
        }

        // TODO: we should normalize all API call with try catch
        try {
            const res = await services.chart.postChartRecords(tempObj)
            if (res.success) {
                toast(t("chartUpdated"));
            } else {
                setIsLoading(false);
                // const errorData = await res.json(); // Try to get more details from the response body
                throw new Error(res.message || `Request failed with status ${res.status}`);
            }
        } catch (e) {
            setIsLoading(false);
            console.error("An error occurred:", e.message);
            toast.error(t("uploadFailed"), {
                description: e.message
            });
        }
        setIsLoading(false);
    }


    const handleDeleteDataset = async () => {
        const res = await services.dataset.deleteDataset(datasetId);

        try {
            if (res?.success) {
                toast("Dataset Deleted");
                setIsFetchDataSetContents(!isFetchDataSetContents)
                setIsFetchDataSetLists(!isFetchDataSetLists)
            }
        } catch (e) {
            toast("Delete failed", {
                description: e.message,
            });
            throw new Error("Delete failed with status " + res.status);
        }
    };

    const updateDataSetReadyVisualization = async () => {
        setIsLoading(true);
        const tempData = {
            "name": currentDataset?.name,
            "sheet_name": currentDataset?.sheet_name,
            "status": 1
        }

        try {
            const res = await services.dataset.updateDataset(datasetId, tempData);

            if (res?.success) {
                toast(t("datasetReadyToVisualize"));
                setIsFetchDataSetContents(!isFetchDataSetContents)
                setIsFetchDataSetLists(!isFetchDataSetLists)
            }
        } catch (e) {
            setIsLoading(false);
            toast(t("uploadFailed"), {
                description: e.message,
            });
            throw new Error("Upload failed with status " + res.status);
        }
        setIsLoading(false);
    }

    const toggleSidebar = () => {
        setIsOpenSideContent(!isOpenSideContent);
    }

    return (
        <AnimatePresence>
            {isLoading && (
                <LoadingScreen />
            )}
            {isShowsideContent && (
                <Button variant="ghost" onClick={toggleSidebar} className={`${isOpenSideContent ? "right-76" : "right-0"} z-50 absolute top-29 bg-white rounded rounded-full size-8 shadow border-none`}>
                    {isOpenSideContent
                        ? <ChevronRight className="w-5 h-5" />
                        : <ChevronLeft className="w-5 h-5" />
                    }
                </Button>
            )}
            {isOpenSideContent && (
                <div className={`${isOpenSideContent ? "w-80" : "w-0"} shrink-0 transition-all duration-300 relative`}>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                        className="py-4 pt-5 w-full max-w-sm h-full bg-white border-l"
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
                                initialName={currentDataset?.name}
                                onSave={handleNameSave}
                            />
                            <div className="flex items-center gap-2 my-3">
                                <Switch disabled={true} id="show-dashboard" checked={currentDataset?.status === 0 ? false : true} />
                                <Label
                                    htmlFor="show-dashboard"
                                    className="text-sm font-medium text-gray-800"
                                >
                                    {t("showToDashboard")}
                                </Label>
                            </div>
                        </CardHeader>

                        {/* Dimensions and Measures */}
                        <CardContent className="pb-2">
                            <div className="mb-5">
                                <p className="text-sm font-semibold text-gray-500 mb-3">
                                    {t("category")}
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
                                    {t("numeric")}
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
                                <p className="mb-4" style={{ fontWeight: 700, fontSize: 12 }}>{t("datasetDetail")}</p>
                                <p className="mb-3">
                                    <span className="font-medium">{t("dataSource")}: </span>
                                    {currentDataset?.sheet_name}
                                </p>
                                <p className="mb-3">
                                    <span className="font-medium">{t("createdOn")}: </span>
                                    {moment(currentDataset?.created_at).format("DD/MM/YYYY")}
                                </p>
                                <p className="mb-3">
                                    <span className="font-medium">{t("lastEditedOn")}: </span>
                                    {moment(currentDataset?.updated_at).format("DD/MM/YYYY")}
                                </p>
                                <p className="mb-3">
                                    <span className="font-medium">{t("lastEditedBy")}: </span>
                                    {currentDataset?.updated_by}
                                </p>
                                <p className="mb-3">
                                    <span className="font-medium">{t("dataStatus")}:</span>{" "}
                                    <span className="text-green-600">{dataStatus}</span>
                                </p>
                                {/* <p className="mb-3">
                                <span className="font-medium">Quality Score:</span>{" "}
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    100%
                                </span>
                            </p> */}
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                                <Button onClick={handleUpdateData} variant="default" className="flex-1 cursor-pointer">
                                    {/* <Image src={syncIcon} alt="Measure icon" className="w-5 h-5 color-blue-100" />    */}
                                    {t("saveDatasetChanges")}
                                </Button>
                                <Button disabled={chartDrawData?.length <= 0 ? true : false} onClick={handleSaveChart} variant="outline" className="flex-1 cursor-pointer">
                                    {t("saveChartChanges")}
                                </Button>
                                <Button onClick={updateDataSetReadyVisualization} variant="secondary" className="flex-1 cursor-pointer">
                                    {t("proceedToVisualization")}
                                </Button>
                                {/* <Button onClick={handleDeleteDataset} variant="destructive" className="flex-1 cursor-pointer">
                                Delete Data Set
                            </Button> */}
                            </div>
                        </CardFooter>
                    </motion.div>
                </div>
            )
            }
        </AnimatePresence >
    );
}
