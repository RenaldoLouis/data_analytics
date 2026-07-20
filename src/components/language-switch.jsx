"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"

// Compact EN | ID toggle for the dashboard header. Swaps the leading locale
// segment of the current path (e.g. /id/pricingCalculator/pl -> /en/...), the
// same approach the login page uses.
export function LanguageSwitch() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    const change = (newLocale) => {
        if (newLocale === locale) return
        router.replace(pathname.replace(/^\/(en|id)/, `/${newLocale}`))
    }

    const btn = (code, label) => (
        <button
            type="button"
            onClick={() => change(code)}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${locale === code
                ? "text-blue-600 font-semibold"
                : "text-muted-foreground hover:text-foreground"}`}
        >
            {label}
        </button>
    )

    return (
        <div className="flex items-center text-xs font-medium mr-1">
            {btn("en", "EN")}
            <span className="text-muted-foreground/40">|</span>
            {btn("id", "ID")}
        </div>
    )
}
