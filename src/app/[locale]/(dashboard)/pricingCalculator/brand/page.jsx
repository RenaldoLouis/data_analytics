'use client'

import LoadingScreen from "@/components/ui/loadingScreen"
import services from "@/services"
import { useEffect, useState } from "react"
import PlCalculator from "../pl/PlCalculator"

export default function BrandPage() {
    const [brandId, setBrandId] = useState(undefined) // undefined = loading, null = none, string = has brand
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const res = await services.pl.getBrands()
            const raw = res?.data?.data ?? res?.data ?? null
            const brands = Array.isArray(raw) ? raw : (raw ? [raw] : [])
            setBrandId(brands.length > 0 ? brands[0].id : null)
            setIsLoading(false)
        }
        load()
    }, [])

    if (isLoading) return <LoadingScreen />

    return (
        <PlCalculator
            brandOnly
            editId={brandId}
            onSaveComplete={(id) => setBrandId(id)}
        />
    )
}
