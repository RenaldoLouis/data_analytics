'use client'

import PlImportPage from "../PlImportPage"
import { useRouter } from "next/navigation"

export default function Page() {
    const router = useRouter()
    return <PlImportPage onBack={() => router.push('/pricingCalculator/pl')} />
}
