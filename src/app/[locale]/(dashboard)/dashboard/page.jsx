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
import { useRef } from "react";
import { useTranslations } from "next-intl";

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

  const renderlayout = () => {
    switch (selectedLayout) {
      case "layout1":
        return <DashboardLayoutPlaceholder layoutId={1} refetch={refetch} setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} />
      case "layout2":
        return <DashboardLayoutPlaceholder layoutId={2} refetch={refetch} setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} />
      case "layout3":
        return <DashboardLayoutPlaceholder layoutId={3} refetch={refetch} setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} />

      default:
        return <DashboardLayoutPlaceholder />
    }
  }

  return (
    <>
      <div className="flex justify-between px-4 lg:px-6">
        <H3>Dashboard</H3>
        <div className="flex">
          <Tabs
            value={selectedLayout}
            onValueChange={setSelectedLayout}
            className="w-[400px] items-end mr-3">
            <TabsList>
              <TabsTrigger className="cursor-pointer" value="layout1">{`${t("layout")} 1`}</TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="layout2">{`${t("layout")} 2`}</TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="layout3">{`${t("layout")} 3`}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="ml-2">
            <ModalExportDashboard layoutRef={layoutRef} />
          </div>
        </div>
      </div>
      {dataSetsList.length <= 0 && (
        <div className="px-4 lg:px-6" >
          <Alert variant="default" className="flex justify-between items-center bg-blue-100" style={{ height: 42 }}>
            <P>
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
