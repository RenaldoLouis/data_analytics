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
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EditableSidebarItem } from "./editableTextSidebar";
import { Skeleton } from "./ui/skeleton";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("datasetpage");
  const { setIsFetchDataSetContents, isFetchDataSetContents, setIsDialogOpenAddNewDataSet, isFetchDataSetLists, setIsFetchDataSetLists, setDataSetsList, setChartDrawData, setSelectedChartType, setSelectedColumn, setSelectedRow } = useDashboardContext();

  const [isLoadingListDataset, setIsLoadingListDataSet] = useState();
  const [editingItemId, setEditingItemId] = useState(null);

  const currentDataset = useMemo(() => {
    return dataSetsList.find(item => item.id === selectedNav) || {};
  }, [dataSetsList, selectedNav]);

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
    setChartDrawData([])
    setSelectedChartType(null)
    setSelectedColumn([])
    setSelectedRow([])

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
        toast(t("datasetDeleted"));
        setIsFetchDataSetLists(!isFetchDataSetLists)
      }
    } catch (e) {
      toast(t("datasetDeletedFailed"), {
        description: e.message,
      });
      throw new Error("Delete failed with status " + res.status);
    }
  };

  const handleEditClick = (e, itemId) => {
    e.stopPropagation(); // Prevent navigation
    setEditingItemId(itemId);
  };

  const handleSaveName = async (itemId, newName) => {
    if (newName.trim() === currentDataset.name.trim()) {
      // toast("No change detected after trimming whitespace. Not saving.");
      return; // Exit the function if the names are the same after trimming
    }
    if (newName.trim() === "") {
      toast(t("emptyDatasetNameValidation"));
      return;
    }

    const tempData = {
      "name": newName,
      "sheet_name": currentDataset.sheet_name,
      "status": currentDataset.status
    }
    // TODO: Add your API call to update the name here
    const res = await services.dataset.updateDataset(itemId, tempData);
    if (res?.success) {
      toast(t("datasetUpdated"));
    } else {
      toast(t("datasetUpdatedFailed"));
      return;
    }

    // After saving, update the list in the state and exit edit mode
    setDataSetsList(prevList =>
      prevList.map(item =>
        item.id === itemId ? { ...item, name: newName } : item
      )
    );
    setEditingItemId(null);

    setIsFetchDataSetLists(!isFetchDataSetLists)
    setIsFetchDataSetContents(!isFetchDataSetContents)
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        <div className="flex justify-between w-100">
          {t("datasets").toUpperCase()}
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
                {editingItemId === item.id ? (
                  <EditableSidebarItem
                    initialName={item.name}
                    onSave={(newName) => handleSaveName(item.id, newName)}
                    onCancel={handleCancelEdit}
                  />
                ) : (
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
                    <div className="flex items-center space-x-2 invisible group-hover/item:visible">
                      <IconPencil
                        onClick={(e) => handleEditClick(e, item.id)}
                        className="w-4 h-4 invisible group-hover/item:visible hover:text-black cursor-pointer"
                      />
                      <IconTrash
                        onClick={(e) => handleDeleteDataset(e, item.id)}
                        className="w-4 h-4 text-muted-foreground invisible group-hover/item:visible hover:text-red-800 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
