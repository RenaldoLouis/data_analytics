"use client"

import {
  IconLayoutDashboard,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavPricingCalculator } from "@/components/nav-pricing-calculator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

  const getNavFromPath = (p) => {
    if (p.includes("/pricingCalculator/sku-modal"))  return "pricing-sku-modal"
    if (p.includes("/pricingCalculator/sku"))        return "pricing-sku"
    if (p.includes("/pricingCalculator/simulation")) return "pricing-simulation"
    if (p.includes("/pricingCalculator/pl"))         return "pricing-pl"
    if (p.includes("/pricingCalculator/brand"))      return "pricing-brand"
    if (p.includes("/pricingCalculator"))            return "pricing-calculator"
    if (p.includes("/dashboard"))                    return "1"
    return "1"
  }

  const [selectedNav, setSelectedNav] = useState(() => getNavFromPath(pathname))
  const { dataSetsList } = useDashboardContext()

  useEffect(() => {
    if (pathname.includes("/dashboard")) {
      setSelectedNav("1")
    } else if (pathname.includes("/pricingCalculator/sku-modal")) {
      setSelectedNav("pricing-sku-modal")
    } else if (pathname.includes("/pricingCalculator/sku")) {
      setSelectedNav("pricing-sku")
    } else if (pathname.includes("/pricingCalculator/simulation")) {
      setSelectedNav("pricing-simulation")
    } else if (pathname.includes("/pricingCalculator/pl")) {
      setSelectedNav("pricing-pl")
    } else if (pathname.includes("/pricingCalculator/brand")) {
      setSelectedNav("pricing-brand")
    } else if (pathname.includes("/pricingCalculator/hpp")) {
      setSelectedNav("pricing-calculator")
    } else if (pathname.includes("/pricingCalculator")) {
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
        {/* <NavMain
          items={data.navMain}
          setSelectedNav={setSelectedNav}
          selectedNav={selectedNav}
        /> */}

        <Separator className="mx-2" />

        {/* Category 2: Data Analytics */}
        {/* <NavDatasets
          dataSetsList={dataSetsList}
          setSelectedNav={setSelectedNav}
          selectedNav={selectedNav}
        /> */}

        {/* <Separator className="mx-2" /> */}

        {/* Category 3: Pricing Calculator */}
        <NavPricingCalculator
          selectedNav={selectedNav}
          setSelectedNav={setSelectedNav}
        />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-300">
            BETA
          </span>
          <span className="text-[11px] text-muted-foreground">v0.1.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}