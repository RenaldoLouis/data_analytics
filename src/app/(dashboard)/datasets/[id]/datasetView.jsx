'use client'

import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
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
    const [dataTable, setDataTable] = useState([])
    const [dataToUpdate, setDataToUpdate] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 1,
        pageLimit: 10,
    })

    useEffect(() => {
        async function fetchData() {
            const res = await services.dataset.getAllDatasetById(datasetId, pagination.pageLimit, pagination.pageIndex);
            const cleanedArray = res.data.datasets.map(item => ({
                ...item.data,
                id: item.id, // or dataset_id, or both if needed
            }));

            setData(res.data.datasets);
            setDataTable(cleanedArray);
        }

        fetchData();
    }, [datasetId, pagination]);

    const handleUpdateData = async () => {
        const datasetContents = dataToUpdate.map((eachData) => ({
            id: eachData.id,
            data: eachData, // or you can clone/pick specific fields if needed
        }));

        // ✅ Wrap in object when sending
        const res = await services.dataset.updateDataset(datasetId, {
            datasetContents,
        });
    };

    const handleTabView = (view) => {
        setCurrentView(view)
    }

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
            {currentView === DatasetViewConst.chart ? (
                <DatasetsChartView />
            ) : (
                <DataTable
                    data={dataTable}
                    setDataToUpdate={setDataToUpdate}
                />

            )}
        </>
    );
}

