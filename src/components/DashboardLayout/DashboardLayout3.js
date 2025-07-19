



"use client"

import { DashboardCard } from "@/components/DashboardCard/DashboardCard";

export default function DashboardLayout3({ listOfChart = [], setListOfChart, chartComponents }) {
    // Defines the unique grid structure for Layout 3
    const layoutConfig = [
        { className: "md:col-span-3" },
        { className: "md:col-span-3" },
        { className: "md:col-span-2" },
        { className: "md:col-span-2" },
        { className: "md:col-span-2" },
        { className: "md:col-span-6 md:row-span-2", cardClassName: "min-h-96" },
        { className: "md:col-span-3" },
        { className: "md:col-span-3" },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-6 md:gap-6 lg:p-6">
            {layoutConfig.map((cell, index) => {
                const chartInfo = listOfChart[index];
                const ChartComponent = chartInfo ? chartComponents[chartInfo.chartType] : null;

                return (
                    <div key={index} className={cell.className}>
                        {chartInfo && ChartComponent ? (
                            <ChartComponent chartData={chartInfo.data} className={cell.cardClassName} />
                        ) : (
                            <DashboardCard
                                className={cell.cardClassName}
                                cardIndex={index}
                                setListOfChart={setListOfChart}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
