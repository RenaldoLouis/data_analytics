'use client'

import { DataTable } from "@/components/data-table"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H3 } from "@/components/ui/typography"
import { DatasetViewConst } from "@/constant/DatasetViewConst"
import { useDashboardContext } from "@/context/dashboard-context"
import { useDatasetTable } from "@/hooks/useDatasetTable"
import { useEffect, useState } from "react"
import DatasetsChartView from "./datasetsChartView"
import { useTranslations } from "next-intl"

export default function DataSetView(props) {
    const { datasetId } = props

    const t = useTranslations("datasetpage");
    const { setIsFetchDataSetLists, isFetchDataSetLists, setDataToUpdate, dataToUpdate, setIsFetchDataSetContents, isFetchDataSetContents, } = useDashboardContext();
    const [currentView, setCurrentView] = useState(DatasetViewConst.chart);
    // const [dataToUpdate, setDataToUpdate] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })

    const {
        dataTable,
        data,
        chartData,
        loading,
        error,
        refetch,
    } = useDatasetTable(datasetId, pagination);

    useEffect(() => {
        refetch()
        setIsFetchDataSetLists(!isFetchDataSetLists)
    }, [isFetchDataSetContents])

    const handleTabView = (view) => {
        setCurrentView(view)
    }

    return (
        <>
            <div className="flex justify-between px-4 lg:px-6">
                <div className="flex items-center">
                    <H3 className="text-xl font-bold">{t("chart")}</H3>
                </div>
                {/* <Button onClick={handleUpdateData}>
                    Update Data
                </Button> */}

                <Tabs
                    defaultValue="chart"
                    value={currentView}
                    onValueChange={handleTabView}
                    className="w-[400px] items-end"
                >
                    <TabsList>
                        <TabsTrigger className="cursor-pointer" value="chart">{t("chart")}</TabsTrigger>
                        <TabsTrigger className="cursor-pointer" value="datasets">{t("datasets")}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div className="px-4 lg:px-6">
                <Separator />
            </div>
            {/* <SectionCards />
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
            </div> */}
            <div className="flex overflow-x-auto">
                <div className="flex-auto">
                    {currentView === DatasetViewConst.chart ? (
                        <DatasetsChartView
                            chartData={chartData}
                            datasetId={datasetId}
                        />
                    ) : (
                        <DataTable
                            data={dataTable}
                            setDataToUpdate={setDataToUpdate}
                            pagination={pagination}
                            setPagination={setPagination}
                            pageCount={data?.totalPages}
                        />
                    )}
                </div>
            </div>
        </>
    );
}