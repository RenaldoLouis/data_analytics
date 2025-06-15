'use client'

import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H3 } from "@/components/ui/typography"
// import FormNewDataSet from "./FormNewDataSet"
import { DataTable } from "@/components/data-table"
import { DatasetViewConst } from "@/constant/DatasetViewConst"
import { useState } from "react"
import data from "./data.json"
import DatasetsChartView from "./datasetsChartView"

export default function DataSetView(props) {
    const { datasetId } = props

    const [currentView, setCurrentView] = useState(DatasetViewConst.chart);

    console.log("datasetId", datasetId)

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

