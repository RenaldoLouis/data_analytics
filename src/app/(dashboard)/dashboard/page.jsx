"use client"

import DashboardLayout1 from "@/components/DashboardLayout/DashboardLayout1";
import DashboardLayout2 from "@/components/DashboardLayout/DashboardLayout2";
import DashboardLayout3 from "@/components/DashboardLayout/DashboardLayout3";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H3, P } from "@/components/ui/typography";
import { useState } from "react";
import FormNewDataSet from "./FormNewDataSet";

export default function Page() {

  const [selectedLayout, setSelectedLayout] = useState("layout1")

  const renderlayout = () => {
    switch (selectedLayout) {
      case "layout1":
        return <DashboardLayout1 />
      case "layout2":
        return <DashboardLayout2 />
      case "layout3":
        return <DashboardLayout3 />

      default:
        return <DashboardLayout1 />
    }
  }

  return (
    <>
      <div className="flex justify-between px-4 lg:px-6">
        <H3>Dashboard</H3>
        <Tabs
          value={selectedLayout}          // Use the `value` prop to bind to your state
          onValueChange={setSelectedLayout} // Use `onValueChange` to update your state
          className="w-[400px] items-end">
          <TabsList>
            <TabsTrigger value="layout1">Layout 1</TabsTrigger>
            <TabsTrigger value="layout2">Layout 2</TabsTrigger>
            <TabsTrigger value="layout3">Layout 3</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="px-4 lg:px-6" >
        <Alert variant="default" className="flex justify-between items-center" style={{ height: 42 }}>
          <P>
            You don’t have any data sets. Add data sets first in order to make chart
          </P>
          <FormNewDataSet />
        </Alert>
      </div>

      {/* <div class="grid grid-cols-2">
        <div className="px-4 lg:px-6" >
          <DashboardCardAreaChart />
        </div>
        <div className="px-4 lg:px-6" >
          <DashboardCardBarChart />
        </div>
      </div> */}

      {renderlayout()}
    </>
  );
}
