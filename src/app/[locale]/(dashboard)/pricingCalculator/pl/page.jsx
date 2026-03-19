'use client'

import { useState } from "react"
import PlCalculator from "./plCalculator"
import PlList from "./plList"

export default function Page() {
    const [view, setView] = useState('list')
    const [editId, setEditId] = useState(null)
    const [startAtMonthly, setStartAtMonthly] = useState(false)

    const goList = () => { setView('list'); setEditId(null); setStartAtMonthly(false) }

    if (view === 'form') return (
        <PlCalculator
            onBack={goList}
            editId={editId}
            startAtMonthly={startAtMonthly}
        />
    )

    return (
        <PlList
            onAdd={() => { setEditId(null); setStartAtMonthly(true); setView('form') }}
            onEdit={(id) => { setEditId(id); setStartAtMonthly(true); setView('form') }}
        />
    )
}
