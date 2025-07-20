"use client"

import DashboardCardAreaChart from "@/components/DashboardCard/DashboardCardAreaChart";
import DashboardCardBarChart from "@/components/DashboardCard/DashboardCardBarChart";
import DashboardCardPieChart from "@/components/DashboardCard/DashboardCardPieChart";
import DashboardLayout1 from "@/components/DashboardLayout/DashboardLayout1";
import DashboardLayout2 from "@/components/DashboardLayout/DashboardLayout2";
import DashboardLayout3 from "@/components/DashboardLayout/DashboardLayout3";
import { ModalExportDashboard } from "@/components/ModalExportDashboard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H3, P } from "@/components/ui/typography";
import { useDashboardContext } from "@/context/dashboard-context";
import services from "@/services";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const { chartListType, setIsDialogOpenAddNewDataSet, dataSetsList, selectedLayout, setSelectedLayout } = useDashboardContext();
  const layoutRef = useRef(null);

  const [listOfChart, setListOfChart] = useState(Array(8).fill({}));

  const chartComponents = {
    bar: DashboardCardBarChart,
    stackedbar: DashboardCardBarChart,
    area: DashboardCardAreaChart,
    pie: DashboardCardPieChart,
    // lineChart: DashboardCardLineChart,
  };

  const transformApiDataToListOfChart = (apiData, chartTypeMap, layoutSize = 8) => {
    // Start with an empty grid (an array of nulls)
    const newListOfChart = Array(layoutSize).fill(null);

    // Iterate over each chart returned from the API
    apiData.forEach(chart => {
      // The API gives us a 1-based order, so we subtract 1 for the array index
      const gridIndex = chart.order - 1;

      // Make sure the order is within the bounds of our layout
      if (gridIndex >= 0 && gridIndex < layoutSize) {

        // Look up the chartType string (e.g., "bar") using the chart_id
        const chartType = chartTypeMap[chart.chart_id] || 'bar'; // Fallback to 'bar'

        // Place the formatted chart object into the correct slot in our array
        newListOfChart[gridIndex] = {
          chartType: chartType,
          data: chart.chart_content,
          name: chart.name,
          id: chart.id,
        };
      }
    });

    return newListOfChart;
  };

  useEffect(() => {
    setListOfChart([
      {
        chartType: "bar",
        data: [
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
        ]
      },
      {
        chartType: "area",
        data: [
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
          [
            { month: "January", desktop: 186, mobile: 80 },
            { month: "February", desktop: 305, mobile: 200 },
            { month: "March", desktop: 237, mobile: 120 },
            { month: "April", desktop: 73, mobile: 190 },
            { month: "May", desktop: 209, mobile: 130 },
            { month: "June", desktop: 214, mobile: 140 },
          ],
        ]
      },
      {},
      {},
      {},
      {},
      {},
      {},
    ])
  }, [])

  useEffect(() => {
    const fetchDashboardRecords = async () => {
      try {
        const numberString = selectedLayout.replace(/\D/g, '');
        const layoutNumber = parseInt(numberString, 10);
        const res = await services.dashboard.getDashboard(layoutNumber);

        if (res?.success && res.data) {
          // First, create a simple map for chart_id -> chartType
          // This assumes you have fetched your chartListType already
          const chartTypeMap = chartListType.reduce((acc, type) => {
            // Assuming type.name is "StackedBar", "Pie", etc.
            acc[type.id] = type.name.toLowerCase();
            return acc;
          }, {});

          // Call our new transformation function
          const formattedList = transformApiDataToListOfChart(res.data, chartTypeMap, 8);

          // Update the state with the correctly formatted and ordered list
          setListOfChart(formattedList);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard records:", e);
        // It's good practice to reset to an empty state on error
        setListOfChart(Array(8).fill(null));
      }
    };

    // We only run the fetch if we have the chart types needed for the mapping
    if (chartListType.length > 0) {
      fetchDashboardRecords();
    }

  }, [selectedLayout, chartListType]);

  const renderlayout = () => {
    switch (selectedLayout) {
      case "layout1":
        return <DashboardLayout1 setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} />
      case "layout2":
        return <DashboardLayout2 setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} />
      case "layout3":
        return <DashboardLayout3 setListOfChart={setListOfChart} listOfChart={listOfChart} chartComponents={chartComponents} />

      default:
        return <DashboardLayout1 />
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
              <TabsTrigger className="cursor-pointer" value="layout1">Layout 1</TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="layout2">Layout 2</TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="layout3">Layout 3</TabsTrigger>
            </TabsList>
          </Tabs>
          <ModalExportDashboard layoutRef={layoutRef} />
        </div>
      </div>
      {dataSetsList.lengt <= 0 && (
        <div className="px-4 lg:px-6" >
          <Alert variant="default" className="flex justify-between items-center" style={{ height: 42 }}>
            <P>
              You don’t have any data sets. Add data sets first in order to make dashboard
            </P>
            <Button
              onClick={() => setIsDialogOpenAddNewDataSet(true)}
              variant="link"
              className="cursor-pointer"
            >
              Add data sets
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
