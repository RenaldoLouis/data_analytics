"use client"

import {
  IconLayoutDashboard,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavPricingCalculator } from "@/components/nav-pricing-calculator"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SideMenubarTitle, SideMenubarUrl } from "@/constant/SideMenubar"
import { useDashboardContext } from "@/context/dashboard-context"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { NavDatasets } from "./nav-datasets"
import { Separator } from "./ui/separator"

const data = {
  navMain: [
    {
      id: "1",
      title: SideMenubarTitle.Dashboard,
      url: SideMenubarUrl.Dashboard,
      icon: IconLayoutDashboard,
    },
  ],
}

export function AppSidebar({ ...props }) {
  const pathname = usePathname()
  const [selectedNav, setSelectedNav] = useState("1")
  const { dataSetsList } = useDashboardContext()

  useEffect(() => {
    if (pathname === "/dashboard") {
      setSelectedNav("1")
    } else if (pathname.startsWith("/pricingCalculator/sku")) {
      setSelectedNav("pricing-sku")
    } else if (pathname.startsWith("/pricingCalculator/pl")) {
      setSelectedNav("pricing-pl")
    } else if (pathname.startsWith("/pricingCalculator")) {
      setSelectedNav("pricing-calculator")
    } else {
      if (dataSetsList.length > 0) {
        const match = pathname.match(/\/datasets\/([a-f0-9\-]+)/)
        if (match) {
          setSelectedNav(match[1])
        }
      }
    }
  }, [pathname, dataSetsList])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Image
                src="/SiriusIcon.svg"
                alt="Sirius"
                width={180}
                height={28}
                style={{ width: "fit-content" }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        {/* Category 1: Dashboard */}
        <NavMain
          items={data.navMain}
          setSelectedNav={setSelectedNav}
          selectedNav={selectedNav}
        />

        <Separator className="mx-2" />

        {/* Category 2: Data Analytics */}
        <NavDatasets
          dataSetsList={dataSetsList}
          setSelectedNav={setSelectedNav}
          selectedNav={selectedNav}
        />

        <Separator className="mx-2" />

        {/* Category 3: Pricing Calculator */}
        <NavPricingCalculator
          selectedNav={selectedNav}
          setSelectedNav={setSelectedNav}
        />
      </SidebarContent>
    </Sidebar>
  )
}