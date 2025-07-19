"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { useDashboardContext } from "@/context/dashboard-context";
import services from "@/services";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";

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

export function NavDatasets({ setSelectedNav, selectedNav, dataSetsList }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { setIsDialogOpenAddNewDataSet, isFetchDataSetLists, setIsFetchDataSetLists, setDataSetsList } = useDashboardContext();

  const [isLoadingListDataset, setIsLoadingListDataSet] = useState();

  useEffect(() => {
    setIsLoadingListDataSet(true)
    async function fetchData() {
      const res = await services.dataset.getAllDataset();

      try {
        if (res?.success && res?.data.length > 0) {
          const dataWithColors = res.data.map((item, index) => ({
            ...item,
            color: predefinedColors[index % predefinedColors.length], // cycle through colors
          }));

          setDataSetsList(dataWithColors);
          setIsLoadingListDataSet(false)
        } else {
          setDataSetsList([])
          setIsLoadingListDataSet(false)
        }
      } catch (e) {
        setDataSetsList([])
        setIsLoadingListDataSet(false)
      }
    }

    fetchData();
  }, [isFetchDataSetLists]);

  const handleClickNavigateDataSets = (item) => {
    setSelectedNav(item.id)
    router.push(`/datasets/${item.id}`);
  }

  if (dataSetsList.length === 0) return null;

  const handleOpenAddDataset = () => {
    setIsDialogOpenAddNewDataSet(true)
  }

  const handleDeleteDataset = async (e, datasetId) => {
    e.stopPropagation();
    const res = await services.dataset.deleteDataset(datasetId);

    try {
      if (res?.success) {
        toast("Dataset Deleted");
        setIsFetchDataSetLists(!isFetchDataSetLists)
      }
    } catch (e) {
      toast("Delete failed", {
        description: e.message,
      });
      throw new Error("Delete failed with status " + res.status);
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        <div className="flex justify-between w-100">
          Data Sets
          <IconPlus className="w-4 h-4 cursor-pointer" onClick={handleOpenAddDataset} />
        </div>
      </SidebarGroupLabel>
      <SidebarMenu>
        {isLoadingListDataset ? (
          <div className="flex flex-col space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ) : (
          dataSetsList.map((item, index) => (
            <SidebarMenuItem
              key={`${item.name} ${index}`}
              className="group/item rounded-md"
            >
              <SidebarMenuButton asChild>
                <div className="flex justify-between"
                  style={{ background: selectedNav === item.id ? "#EAF3FB" : "" }}>
                  <div style={{ width: "100%" }}>
                    <div
                      key={`${item.name} ${index}`}
                      onClick={() => handleClickNavigateDataSets(item)}
                      className="group flex items-center space-x-3 cursor-pointer">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                  </div>
                  <div>
                    <IconTrash
                      onClick={(e) => handleDeleteDataset(e, item.id)}
                      className="w-4 h-4 text-muted-foreground invisible group-hover/item:visible hover:text-red-800 cursor-pointer"
                    />
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
