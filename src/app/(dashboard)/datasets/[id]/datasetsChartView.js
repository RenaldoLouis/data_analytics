"use client"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart"
import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
]
const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "#2563eb",
    },
    mobile: {
        label: "Mobile",
        color: "#60a5fa",
    },
}


const DatasetsChartView = () => {

    const [isShowChart, setIsShowChart] = useState(true);

    return (
        <div className="flex items-center justify-center min-h-screen">
            {isShowChart ? (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                    </BarChart>
                </ChartContainer>
            ) : (
                <div className="bg-white p-8 rounded shadow place-items-center">
                    <H3 className="text-xl font-bold">
                        You will be able to create chart after all validation are clear and normalized
                    </H3>
                    <Button variant="link" className="font-bold cursor-pointer" style={{ color: "#2168AB" }}>
                        Edit Data Sets
                    </Button>
                </div>
            )}
        </div>
    )
}

export default DatasetsChartView;