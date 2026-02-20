"use client"

import {
  SidebarCollapsibleGroup,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from 'next/navigation';

export function NavMain({
  items,
  selectedNav,
  setSelectedNav,
  categoryLabel,
  collapsible = false,
}) {
  const router = useRouter();

  const handleClickMenu = (item) => {
    setSelectedNav(item.id)
    router.push(`/${item.url}`);
  }

  const menuContent = (
    <SidebarGroupContent className="flex flex-col gap-2">
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-2">
          {/* Reserved for Quick Create button */}
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem
            key={item.title}
            onClick={() => handleClickMenu(item)}
            style={{ background: selectedNav === item.id ? "#EAF3FB" : "" }}
          >
            <SidebarMenuButton tooltip={item.title} className="cursor-pointer">
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  )

  // If there's a label and it's collapsible, use SidebarCollapsibleGroup
  if (categoryLabel && collapsible) {
    return (
      <SidebarCollapsibleGroup label={categoryLabel}>
        {menuContent}
      </SidebarCollapsibleGroup>
    )
  }

  // Otherwise render a plain group (Dashboard — no label, never collapses)
  return (
    <SidebarGroup>
      {menuContent}
    </SidebarGroup>
  )
}