"use client";

import siriussync from "@/assets/images/siriussync.svg";
import { EditableText } from "@/components/EditableText";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import LoadingScreen from "@/components/ui/loadingScreen";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemTypes } from "@/constant/DragTypes";
import { useDashboardContext } from "@/context/dashboard-context";
import { useDatasetRightContent } from "@/hooks/useDatasetRightContent";
import services from "@/services";
import { AnimatePresence, motion } from "framer-motion";
import { toJpeg } from 'html-to-image';
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import { toast } from "sonner";

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
    const {
        isChangesExistToSync, setIsChangesExistToSync,
        chartContainerRef, selectedRow, selectedColumn,
        setSelectedColumn, setSelectedRow, chartListType,
        isFetchDataSetLists, setIsFetchDataSetLists,
        setChartDrawData, chartDrawData,
        setSelectedChartType, selectedChartType,
        dataSetsList, setDataToUpdate, dataToUpdate,
        setIsFetchDataSetContents, isFetchDataSetContents,
    } = useDashboardContext();

    const [isShowsideContent, setIsShowsideContent] = useState(false);
    const [isOpenSideContent, setIsOpenSideContent] = useState(false);
    const [datasetId, setDatasetId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const match = pathname.match(/\/datasets\/([a-f0-9\-]+)/);
        if (match) {
            setDatasetId(match[1]);
        } else {
            setDatasetId(null);
        }
    }, [pathname]);

    // Only show on dataset routes
    useEffect(() => {
        const isDatasetRoute = /\/datasets\/([a-f0-9\-]+)/.test(pathname);
        setIsShowsideContent(isDatasetRoute);
        setIsOpenSideContent(isDatasetRoute);
    }, [pathname]);

    const currentDataFromDataSetList = useMemo(() => {
        if (dataSetsList.length > 0 && datasetId) {
            return dataSetsList.find((eachData) => eachData.id === datasetId);
        }
    }, [dataSetsList, datasetId, chartListType, chartDrawData]);

    useEffect(() => {
        if (currentDataFromDataSetList && currentDataFromDataSetList.chart_record_id && chartListType.length > 0) {
            const getChartRecords = async () => {
                try {
                    const res = await services.chart.getChartRecords(currentDataFromDataSetList?.chart_record_id);

                    if (res?.message[0]?.code === "invalid_string") {
                        setChartDrawData([]);
                        setSelectedChartType(null);
                        setSelectedColumn([]);
                        setSelectedRow([]);
                        throw new Error("No Chart Exist yet");
                    }
                    if (chartDrawData?.length <= 0) {
                        const selectedChart = chartListType.filter((eachData) => eachData.id === res?.data?.chart_id);
                        setChartDrawData(res?.data?.chart_content);
                        setSelectedChartType(selectedChart[0]);
                        setSelectedColumn(res?.data?.selected_column);
                        setSelectedRow(res?.data?.selected_row);
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            getChartRecords();
        }
    }, [currentDataFromDataSetList]);

    const { availableDimensions, availableMeasures, loading } = useDatasetRightContent(datasetId);

    const currentDataset = useMemo(() => {
        if (datasetId) {
            return dataSetsList.find((eachData) => eachData.id === datasetId);
        }
    }, [dataSetsList, datasetId]);

    const dataStatus = useMemo(() => {
        if (currentDataset) {
            switch (currentDataset.status) {
                case 0: return t("draft");
                case 1: return t("readyForVisualization");
            }
        }
    }, [currentDataset]);

    const handleNameSave = async (newName) => {
        setIsLoading(true);
        if (newName.trim() === currentDataset.name.trim()) {
            setIsLoading(false);
            return;
        }
        if (newName.trim() === "") {
            setIsLoading(false);
            toast(t("emptyDatasetNameValidation"));
            return;
        }

        const tempData = { "name": newName, "status": currentDataset.status };

        try {
            const res = await services.dataset.updateDataset(datasetId, tempData);
            if (res?.success) {
                toast(t("datasetUpdated"));
                setIsFetchDataSetLists(!isFetchDataSetLists);
                setIsFetchDataSetContents(!isFetchDataSetContents);
            }
        } catch (e) {
            setIsLoading(false);
            toast(t("datasetUpdatedFailed"), { description: e.message });
            throw new Error("Upload failed with status " + e.message);
        }
        setIsLoading(false);
    };

    const handleSyncChanges = async () => {
        setIsLoading(true);
        let datasetError = null;
        let chartError = null;
        let dataUpdated = false;

        try {
            const datasetContents = dataToUpdate.map((eachData) => ({
                id: eachData.id,
                data: eachData,
            }));
            const res = await services.dataset.updateDatasetContents(datasetId, { datasetContents });
            if (res?.success) {
                dataUpdated = true;
            } else {
                throw new Error(res.message || "Failed to update dataset");
            }
        } catch (e) {
            datasetError = e;
        }

        const shouldSaveChart = chartDrawData?.length > 0;
        if (shouldSaveChart && !datasetError) {
            let chartThumbnail = null;
            try {
                if (chartContainerRef.current) {
                    chartThumbnail = await toJpeg(chartContainerRef.current, {
                        quality: 0.7,
                        backgroundColor: '#ffffff',
                        style: { margin: 0 }
                    });
                }
            } catch (e) {
                console.error("Error generating chart thumbnail:", e);
            }

            try {
                const tempObj = {
                    "dataset_id": datasetId,
                    "chart_id": selectedChartType.id,
                    "chart_content": chartDrawData,
                    "selected_row": selectedRow,
                    "selected_column": selectedColumn,
                    "chart_thumbnail": chartThumbnail
                };
                const res = await services.chart.postChartRecords(tempObj);
                if (!res.success) {
                    throw new Error(res.message || "Failed to save chart");
                } else {
                    dataUpdated = true;
                }
            } catch (e) {
                dataUpdated = false;
                chartError = e;
            }
        }

        setIsLoading(false);

        if (datasetError || chartError) {
            const errorMsg = datasetError ? datasetError.message : chartError.message;
            toast.error(t("uploadFailed"), { description: errorMsg });
        } else {
            toast(t("syncSuccess") || "Changes synced successfully");
        }

        if (dataUpdated) {
            setIsFetchDataSetContents(!isFetchDataSetContents);
            setIsChangesExistToSync(false);
        }
    };

    const handleDeleteDataset = async () => {
        const res = await services.dataset.deleteDataset(datasetId);
        try {
            if (res?.success) {
                toast("Dataset Deleted");
                setIsFetchDataSetContents(!isFetchDataSetContents);
                setIsFetchDataSetLists(!isFetchDataSetLists);
            }
        } catch (e) {
            toast("Delete failed", { description: e.message });
            throw new Error("Delete failed with status " + res.status);
        }
    };

    const updateDataSetReadyVisualization = async () => {
        setIsLoading(true);
        const tempData = {
            "name": currentDataset?.name,
            "sheet_name": currentDataset?.sheet_name,
            "status": 1
        };

        try {
            const res = await services.dataset.updateDataset(datasetId, tempData);
            if (res?.success) {
                toast(t("datasetReadyToVisualize"));
                setIsFetchDataSetContents(!isFetchDataSetContents);
                setIsFetchDataSetLists(!isFetchDataSetLists);
            }
        } catch (e) {
            setIsLoading(false);
            toast(t("uploadFailed"), { description: e.message });
            throw new Error("Upload failed with status " + e.message);
        }
        setIsLoading(false);
    };

    const toggleSidebar = () => setIsOpenSideContent(!isOpenSideContent);

    return (
        <>
            {isLoading && <LoadingScreen />}
            {isShowsideContent && (
                <Button
                    variant="ghost"
                    onClick={toggleSidebar}
                    className={`${isOpenSideContent ? "right-76" : "right-0"} z-50 absolute top-29 bg-white rounded rounded-full size-8 shadow border-none`}
                >
                    {isOpenSideContent
                        ? <ChevronRight className="w-5 h-5" />
                        : <ChevronLeft className="w-5 h-5" />
                    }
                </Button>
            )}
            <AnimatePresence>
                {isOpenSideContent && (
                    <div className={`${isOpenSideContent ? "w-80" : "w-0"} shrink-0 transition-all duration-300 relative`}>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.3 }}
                            className="py-4 pt-5 w-full max-w-sm h-full bg-white border-l"
                        >
                            <CardHeader className="pb-2">
                                <EditableText
                                    initialName={currentDataset?.name}
                                    onSave={handleNameSave}
                                />
                            </CardHeader>

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
                                        <ul id="dimensionList" className="space-y-2">
                                            {availableDimensions.map((dim, index) => (
                                                <DraggableItem key={`dimension ${dim.name} ${index}`} item={dim} type={ItemTypes.DIMENSION} />
                                            ))}
                                        </ul>
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
                                        <ul id="measuresList" className="space-y-2">
                                            {availableMeasures.map((m, index) => (
                                                <DraggableItem key={`measure ${m.name} ${index}`} item={m} type={ItemTypes.MEASURE} />
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col items-start gap-4 border-t pt-4 text-sm text-gray-600">
                                <div className="w-full">
                                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                        {t("datasetDetail")}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-600">
                                        <p className="font-medium text-gray-500">{t("dataSource")}</p>
                                        <p className="truncate text-gray-800" title={currentDataset?.sheet_name}>
                                            {currentDataset?.sheet_name}
                                        </p>

                                        <p className="font-medium text-gray-500">{t("createdOn")}</p>
                                        <p className="text-gray-800">
                                            {moment(currentDataset?.created_at).format("DD/MM/YYYY")}
                                        </p>

                                        <p className="font-medium text-gray-500">{t("lastEditedOn")}</p>
                                        <p className="text-gray-800">
                                            {moment(currentDataset?.updated_at).format("DD/MM/YYYY")}
                                        </p>

                                        <p className="font-medium text-gray-500">{t("lastEditedBy")}</p>
                                        <p className="text-gray-800">{currentDataset?.updated_by}</p>

                                        <p className="font-medium text-gray-500">{t("dataStatus")}</p>
                                        <p className="font-medium text-green-600">{dataStatus}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 w-full">
                                    <Button
                                        disabled={!isChangesExistToSync}
                                        onClick={handleSyncChanges}
                                        variant="default"
                                        className="flex-1 cursor-pointer"
                                    >
                                        {t("syncChanges") || "Sync Changes"}
                                        <Image src={siriussync} alt="siriussync" />
                                    </Button>
                                    <Button
                                        onClick={updateDataSetReadyVisualization}
                                        variant="secondary"
                                        className="flex-1 cursor-pointer"
                                        style={{ background: "#0B2238" }}
                                    >
                                        {t("showToDashboard")}
                                    </Button>
                                </div>
                            </CardFooter>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}