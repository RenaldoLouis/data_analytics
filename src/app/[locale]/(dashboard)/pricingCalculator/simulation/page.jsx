'use client'

import { useRouter } from "next/navigation"
import PlImportPage from "../pl/PlImportPage"

export default function Page() {
    const router = useRouter()
    return <PlImportPage onBack={() => router.back()} />
}
