'use client'

import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H3 } from "@/components/ui/typography"
import { DatasetViewConst } from "@/constant/DatasetViewConst"
import { useDatasetTable } from "@/hooks/useDatasetTable"
import services from "@/services"
import { useState } from "react"
import { toast } from "sonner"
import DatasetsChartView from "./datasetsChartView"

export default function DataSetView(props) {
    const { datasetId } = props

    const [currentView, setCurrentView] = useState(DatasetViewConst.chart);
    const [dataToUpdate, setDataToUpdate] = useState([]);
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
        refetch, // <- call this after updates
    } = useDatasetTable(datasetId, pagination);

    const handleUpdateData = async () => {
        const datasetContents = dataToUpdate.map((eachData) => ({
            id: eachData.id,
            data: eachData,
        }));

        const res = await services.dataset.updateDataset(datasetId, {
            datasetContents,
        });

        try {
            if (res?.success) {
                toast("Dataset Updated successfully");
                refetch();
            }
        } catch (e) {
            toast("Upload failed", {
                description: error.message,
            });
            throw new Error("Upload failed with status " + res.status);
        }
    };

    const handleTabView = (view) => {
        setCurrentView(view)
    }

    console.log("data", data)
    // console.log("dataTable", dataTable)
    console.log("chartData", chartData)

    return (
        <>
            <div className="flex justify-between px-4 lg:px-6">
                <H3>All chart</H3>
                <Button onClick={handleUpdateData}>
                    Update Data
                </Button>

                <Tabs
                    defaultValue="chart"
                    value={currentView}
                    onValueChange={handleTabView}
                    className="w-[400px] items-end"
                >
                    <TabsList>
                        <TabsTrigger className="cursor-pointer" value="chart">Chart</TabsTrigger>
                        <TabsTrigger className="cursor-pointer" value="datasets">Datasets</TabsTrigger>
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
            <div className="flex">
                <div className="flex-auto">
                    {currentView === DatasetViewConst.chart ? (
                        <DatasetsChartView
                            chartData={chartData}
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