"use client"

import {
    SidebarCollapsibleGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconCalculator, IconPresentationAnalytics, IconTag } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

export function NavPricingCalculator({ selectedNav, setSelectedNav }) {
    const router = useRouter()

    const items = [
        {
            id: "pricing-sku",
            title: "SKU",
            url: "/pricingCalculator/sku",
            icon: IconTag,
        },
        {
            id: "pricing-calculator",
            title: "HPP Calculator",
            url: "/pricingCalculator/hpp",
            icon: IconCalculator,
        },
        {
            id: "pricing-pl",
            title: "P&L Calculator",
            url: "/pricingCalculator/pl",
            icon: IconPresentationAnalytics,
        },
    ]

    const handleClick = (item) => {
        setSelectedNav(item.id)
        router.push(item.url)
    }

    return (
        <SidebarCollapsibleGroup label="PRICING CALCULATOR">
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem
                        key={item.id}
                        onClick={() => handleClick(item)}
                        style={{ background: selectedNav === item.id ? "#EAF3FB" : "" }}
                        className="rounded-md"
                    >
                        <SidebarMenuButton tooltip={item.title} className="cursor-pointer">
                            <item.icon size={16} />
                            <span>{item.title}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarCollapsibleGroup>
    )
}