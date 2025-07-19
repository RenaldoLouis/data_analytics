"use client"

import {
  IconListDetails
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { SideMenubarTitle, SideMenubarUrl } from "@/constant/SideMenubar"
import { useDashboardContext } from "@/context/dashboard-context"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { NavDatasets } from "./nav-datasets"
import { Separator } from "./ui/separator"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    // avatar: IconUsers,
  },
  navMain: [
    {
      id: '1',
      title: SideMenubarTitle.Dashboard,
      url: SideMenubarUrl.Dashboard,
      icon: IconListDetails,
    },
    // {
    //   title: SideMenubarTitle.DataSets,
    //   url: SideMenubarUrl.DataSets,
    //   icon: IconChartBar,
    // },
    // {
    //   title: "Projects",
    //   url: "#",
    //   icon: IconFolder,
    // },
    // {
    //   title: "Team",
    //   url: "#",
    //   icon: IconUsers,
    // },
  ],
  // navClouds: [
  //   {
  //     title: "Capture",
  //     icon: IconChartBar,
  //     isActive: true,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Proposal",
  //     icon: IconChartBar,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Prompts",
  //     icon: IconChartBar,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  // ],
  // navSecondary: [
  //   {
  //     title: "Settings",
  //     url: "#",
  //     icon: IconChartBar,
  //   },
  //   {
  //     title: "Get Help",
  //     url: "#",
  //     icon: IconChartBar,
  //   },
  //   {
  //     title: "Search",
  //     url: "#",
  //     icon: IconChartBar,
  //   },
  // ],
  // documents: [
  //   {
  //     id: '2',
  //     name: "Data Library",
  //     url: "#"
  //   },
  //   {
  //     id: '3',
  //     name: "Reports",
  //     url: "#"
  //   },
  //   {
  //     id: '4',
  //     name: "Word Assistant",
  //     url: "#"
  //   },
  // ],
}

export function AppSidebar({
  ...props
}) {
  const pathname = usePathname();

  const [selectedNav, setSelectedNav] = useState("1");
  const { dataSetsList } = useDashboardContext();

  useEffect(() => {
    if (pathname === "/dashboard") {
      setSelectedNav('1')
    } else {
      if (dataSetsList.length > 0) {
        const match = pathname.match(/\/datasets\/([a-f0-9\-]+)/);

        if (match) {
          const datasetId = match[1];
          setSelectedNav(datasetId)
        }
      }
    }
  }, [pathname, dataSetsList]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Image src="/logo.svg" alt="Daya Cipta Tech" width={180} height={28} style={{ width: "fit-content" }} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <NavMain items={data.navMain} setSelectedNav={setSelectedNav} selectedNav={selectedNav} />
        <NavDatasets dataSetsList={dataSetsList} setSelectedNav={setSelectedNav} selectedNav={selectedNav} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
    </Sidebar>
  );
}
