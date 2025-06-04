import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H3 } from "@/components/ui/typography"
import data from "./data.json"
import FormNewDataSet from "./FormNewDataSet"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)"
        }
      }>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col" style={{ background: "#f2f2f2" }}>
          <div className="@container/main flex flex-1 flex-col gap-2" style={{ background: "white", margin: 50, borderRadius: 12, border: "1px solid black" }}>
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex justify-between px-4 lg:px-6">
                <H3>
                  All chart
                </H3>
                <Tabs defaultValue="account" className="w-[400px] items-end">
                  <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="px-4 lg:px-6">
                <Separator />
              </div>
              <div className="px-4 lg:px-6">
                <Alert variant="default" className="flex justify-between items-center">
                  <AlertTitle>You don’t have any data sets. Add data sets first in order to make chart</AlertTitle>
                  <FormNewDataSet />
                </Alert>
              </div>
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider >
  );
}
