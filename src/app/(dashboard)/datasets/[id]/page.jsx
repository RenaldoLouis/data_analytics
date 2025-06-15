import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H3 } from "@/components/ui/typography"
// import FormNewDataSet from "./FormNewDataSet"
import { DataTable } from "@/components/data-table"
import data from "./data.json"

export default async function Page({ params }) {
    const { id } = await params

    return (
        <>
            <div className="flex justify-between px-4 lg:px-6">
                <H3>All chart</H3>
                <Tabs defaultValue="chart" className="w-[400px] items-end">
                    <TabsList>
                        <TabsTrigger value="chart">Chart</TabsTrigger>
                        <TabsTrigger value="datasets">Datasets</TabsTrigger>
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
            <DataTable data={data}
            // dataSetId={id}
            />
        </>
    );
}

