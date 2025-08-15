

"use client"

import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { useMemo } from "react";

export default function DashboardLayoutPlaceholder({ layoutId, refetch, listOfChart, setListOfChart, chartComponents }) {
    const layoutConfig1 = [
        { className: "md:col-span-6 md:row-span-2", cardClassName: "min-h-82" }, // Large top card
        { className: "md:col-span-3" },
        { className: "md:col-span-3" },
        { className: "md:col-span-3" },
        { className: "md:col-span-3" },
        { className: "md:col-span-2" },
        { className: "md:col-span-2" },
        { className: "md:col-span-2" },
    ];
    const layoutConfig2 = [
        { className: "md:col-span-2" },
        { className: "md:col-span-4" },
        { className: "md:col-span-2" },
        { className: "md:col-span-4" },
        { className: "md:col-span-6 md:row-span-2", cardClassName: "min-h-96" },
        { className: "md:col-span-2" },
        { className: "md:col-span-2" },
        { className: "md:col-span-2" },
    ];
    const layoutConfig3 = [
        { className: "md:col-span-3" },
        { className: "md:col-span-3" },
        { className: "md:col-span-2" },
        { className: "md:col-span-2" },
        { className: "md:col-span-2" },
        { className: "md:col-span-6 md:row-span-2", cardClassName: "min-h-96" },
        { className: "md:col-span-3" },
        { className: "md:col-span-3" },
    ];

    const layoutConfig = useMemo(() => {
        if (layoutId) {
            switch (layoutId) {
                case 1:
                    return layoutConfig1
                case 2:
                    return layoutConfig2
                case 3:
                    return layoutConfig3
            }
        } else {
            return []
        }
    }, [layoutId])

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-6 lg:px-6">
            {layoutConfig?.map((cell, index) => {
                const chartInfo = listOfChart[index];
                const ChartComponent = chartInfo ? chartComponents[chartInfo.chartType] : null;

                return (
                    <div key={index} className={cell.className}>
                        {chartInfo && ChartComponent ? (
                            <ChartComponent
                                refetch={refetch}
                                chartInfo={chartInfo}
                                chartData={chartInfo.data} className={cell.cardClassName}
                                stacked={chartInfo.chartType === 'stackedbar'}
                            />
                        ) : (
                            <DashboardCard
                                refetch={refetch}
                                className={cell.cardClassName}
                                cardIndex={index}
                                setListOfChart={setListOfChart}
                                listOfChart={listOfChart} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
