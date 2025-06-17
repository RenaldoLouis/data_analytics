"use client"

import {
  IconInnerShadowTop,
  IconListDetails
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { NavDatasets } from "./nav-datasets"

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
  const [dataSetsList, setDataSetsList] = useState([]);

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
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} setSelectedNav={setSelectedNav} selectedNav={selectedNav} />
        <NavDatasets setDataSetsList={setDataSetsList} dataSetsList={dataSetsList} setSelectedNav={setSelectedNav} selectedNav={selectedNav} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
