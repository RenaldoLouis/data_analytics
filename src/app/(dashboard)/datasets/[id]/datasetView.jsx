'use client'

import { DataTable } from "@/components/data-table"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H3 } from "@/components/ui/typography"
import { DatasetViewConst } from "@/constant/DatasetViewConst"
import services from "@/services"
import { useEffect, useState } from "react"
import DatasetsChartView from "./datasetsChartView"

export default function DataSetView(props) {
    const { datasetId } = props

    const [currentView, setCurrentView] = useState(DatasetViewConst.chart);
    const [data, setData] = useState([])
    const [pagination, setPagination] = useState({
        pageIndex: 1,
        pageLimit: 10,
    })

    useEffect(() => {
        async function fetchData() {
            const res = await services.dataset.getAllDatasetById(datasetId, pagination.pageLimit, pagination.pageIndex);
            setData(res.data.datasets);
        }

        fetchData();
    }, [datasetId, pagination]);

    console.log("data", data)

    const handleTabView = (view) => {
        setCurrentView(view)
    }

    return (
        <>
            <div className="flex justify-between px-4 lg:px-6">
                <H3>All chart</H3>
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
            {currentView === DatasetViewConst.chart ? (
                <DatasetsChartView />
            ) : (
                <DataTable data={data}
                // dataSetId={id}
                />

            )}
        </>
    );
}

