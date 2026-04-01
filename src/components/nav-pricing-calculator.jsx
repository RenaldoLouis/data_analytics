"use client"

import {
    SidebarCollapsibleGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconBuildingStore, IconCalculator, IconPresentationAnalytics, IconTag } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

export function NavPricingCalculator({ selectedNav, setSelectedNav }) {
    const router = useRouter()
    const t = useTranslations("nav")

    const items = [
        {
            id: "pricing-sku",
            title: t("sku"),
            url: "/pricingCalculator/sku",
            icon: IconTag,
        },
        // {
        //     id: "pricing-calculator",
        //     title: "HPP Calculator",
        //     url: "/pricingCalculator/hpp",
        //     icon: IconCalculator,
        // },
        {
            id: "pricing-brand",
            title: t("brand"),
            url: "/pricingCalculator/brand",
            icon: IconBuildingStore,
        },
        {
            id: "pricing-pl",
            title: t("profitLoss"),
            url: "/pricingCalculator/pl",
            icon: IconPresentationAnalytics,
        },
    ]

    const handleClick = (item) => {
        setSelectedNav(item.id)
        router.push(item.url)
    }

    return (
        <SidebarCollapsibleGroup label={t("pricingCalculator")}>
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
