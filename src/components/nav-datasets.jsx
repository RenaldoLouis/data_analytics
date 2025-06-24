"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import services from "@/services";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const predefinedColors = [
  "#FF6B6B",
  "#6BCB77",
  "#4D96FF",
  "#FFD93D",
  "#9D4EDD",
  "#FF922B",
  "#00C2D1",
  "#A29BFE",
  "#F06595",
  "#20C997"
];

export function NavDatasets({ setSelectedNav, selectedNav, setDataSetsList, dataSetsList }) {
  const { isMobile } = useSidebar();
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      const res = await services.dataset.getAllDataset();

      if (res.success && res.data.length > 0) {
        const dataWithColors = res.data.map((item, index) => ({
          ...item,
          color: predefinedColors[index % predefinedColors.length], // cycle through colors
        }));

        setDataSetsList(dataWithColors);
      }
    }

    fetchData();
  }, []);

  const handleClickNavigateDataSets = (item) => {
    setSelectedNav(item.id)
    router.push(`/datasets/${item.id}`);
  }

  if (dataSetsList.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        <div className="flex justify-between w-100">
          Data Sets
          <IconPlus className="w-4 h-4 cursor-pointer" />
        </div>
      </SidebarGroupLabel>
      <SidebarMenu>
        {dataSetsList.map((item, index) => (
          <SidebarMenuItem key={`${item.name} ${index}`}>
            <SidebarMenuButton asChild>
              <div key={`${item.name} ${index}`} onClick={() => handleClickNavigateDataSets(item)} className="flex items-center space-x-3 cursor-pointer" style={{ background: selectedNav === item.id ? "#EAF3FB" : "" }}>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
