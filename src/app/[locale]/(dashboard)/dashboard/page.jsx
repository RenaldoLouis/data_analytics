"use client"

import DashboardCardAreaChart from "@/components/DashboardCard/DashboardCardAreaChart";
import DashboardCardBarChart from "@/components/DashboardCard/DashboardCardBarChart";
import DashboardCardPieChart from "@/components/DashboardCard/DashboardCardPieChart";
import DashboardLayoutPlaceholder from "@/components/DashboardLayoutPlaceholder";
import { ModalExportDashboard } from "@/components/ModalExportDashboard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H3, P } from "@/components/ui/typography";
import { useDashboardContext } from "@/context/dashboard-context";
import { useDashboardRecords } from "@/hooks/useDashboardRecords";
import { useTranslations } from "next-intl";
import { useMemo, useRef } from "react";

export default function Page() {
  const { chartListType, setIsDialogOpenAddNewDataSet, dataSetsList, selectedLayout, setSelectedLayout } = useDashboardContext();

  const layoutRef = useRef(null);
  const t = useTranslations("dashboardpage");

  const chartComponents = {
    bar: DashboardCardBarChart,
    stackedbar: DashboardCardBarChart,
    area: DashboardCardAreaChart,
    pie: DashboardCardPieChart,
    // lineChart: DashboardCardLineChart,
  };

  const { listOfChart, setListOfChart, isLoading, error, refetch } = useDashboardRecords(selectedLayout, chartListType);

  const addedCharts = useMemo(() => {
    const idsOnCurrentDashboard = listOfChart
      .filter(chart => chart !== null)
      .map(chart => chart.dataset_id);

    const chartsOnDashboard = dataSetsList.filter(dataset => {
      const hasRecords = dataset.dashboard_records && dataset.dashboard_records.length > 0;

      // If it doesn't have records, it can't be an "added" chart.
      if (!hasRecords) {
        return false;
      }

      const isOnThisDashboard = idsOnCurrentDashboard.includes(dataset.id);

      // The dataset will only be included if both conditions are met.
      return isOnThisDashboard;
    });

    // 2. Map over the filtered list to create the structure for the UI.
    const formattedCharts = chartsOnDashboard.map(chart => {
      // Find the corresponding chart type information
      const chartTypeInfo = chartListType.find(type => type.id === chart.chart_id);
      const chartTypeName = chartTypeInfo ? chartTypeInfo.name : 'Chart';

      // Create a descriptive name for the chart.
      const displayName = `${chart.name}`;

      // Create a placeholder image URL.
      const imageUrl = `https://placehold.co/96x56/e2e8f0/666?text=${chartTypeName}`;

      // Return the new object in the desired format.
      return {
        id: chart.chart_record_id, // Use the unique ID for the chart instance
        name: displayName,
        imageUrl: imageUrl,
      };
    });

    return formattedCharts;
  }, [dataSetsList, chartListType, listOfChart]);

  const renderlayout = () => {
    switch (selectedLayout) {
      case "layout1":
        return <DashboardLayoutPlaceholder layoutId={1} refetch={refetch} setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} addedCharts={addedCharts} />
      case "layout2":
        return <DashboardLayoutPlaceholder layoutId={2} refetch={refetch} setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} addedCharts={addedCharts} />
      case "layout3":
        return <DashboardLayoutPlaceholder layoutId={3} refetch={refetch} setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} addedCharts={addedCharts} />

      default:
        return <DashboardLayoutPlaceholder />
    }
  }

  return (
    <>
      <div className="sm:flex sm:justify-between px-4 lg:px-6">
        <H3>Dashboard</H3>
        <div className="flex flex-col sm:flex-row items-start pt-2 sm:pt-0">
          <Tabs
            value={selectedLayout}
            onValueChange={setSelectedLayout}
            className="w-[400px] items-start sm:items-end mr-3 pr-2">
            <TabsList>
              <TabsTrigger className="cursor-pointer" value="layout1">{`${t("layout")} 1`}</TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="layout2">{`${t("layout")} 2`}</TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="layout3">{`${t("layout")} 3`}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="pt-3 sm:pt-0">
            <ModalExportDashboard layoutRef={layoutRef} isChartAdded={addedCharts.length > 0} />
          </div>
        </div>
      </div>
      {dataSetsList.length <= 0 && (
        <div className="px-4 lg:px-6" >
          <Alert variant="default" className="flex justify-between items-center bg-blue-100" style={{ height: 42 }}>
            <P className="truncate">
              {t("noDatasetDetected")}
            </P>
            <Button
              onClick={() => setIsDialogOpenAddNewDataSet(true)}
              variant="link"
              className="cursor-pointer text-blue-600"
            >
              {t("addDataset")}
            </Button>
          </Alert>
        </div>
      )}

      <div ref={layoutRef}>
        {renderlayout()}
      </div>
    </>
  );
}
