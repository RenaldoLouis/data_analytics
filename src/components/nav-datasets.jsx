"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { useMemo } from "react";

// Helper to generate a random hex color
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  return "#" + Array.from({ length: 6 }, () =>
    letters[Math.floor(Math.random() * 16)]
  ).join("");
}

export function NavDatasets({ items }) {
  const { isMobile } = useSidebar();

  // Generate stable random colors using useMemo
  const coloredItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      color: getRandomColor()
    }));
  }, [items]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Data Sets</SidebarGroupLabel>
      <SidebarMenu>
        {coloredItems.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <div href={item.url} className="flex items-center space-x-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
            </SidebarMenuButton>
            {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover className="data-[state=open]:bg-accent rounded-sm">
                    <IconDots />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-24 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}>
                  <DropdownMenuItem>
                    <IconFolder />
                    <span>Open</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconShare3 />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <IconTrash />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

