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
import { useEffect, useState } from "react";

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

export function NavDatasets({ items }) {
  const { isMobile } = useSidebar();
  const [dataSetsList, setDataSetsList] = useState([]);
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      const res = await services.dataset.getAllDataset();

      const dataWithColors = res.data.map((item, index) => ({
        ...item,
        color: predefinedColors[index % predefinedColors.length], // cycle through colors
      }));

      setDataSetsList(dataWithColors);
    }

    fetchData();
  }, []);

  const handleClickNavigateDataSets = (sheetId) => {
    router.push(`/datasets/${sheetId}`);
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
              <div key={`${item.name} ${index}`} onClick={() => handleClickNavigateDataSets(item.id)} className="flex items-center space-x-3">
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
