'use client'

import { useState } from "react"
import PlCalculator from "./PlCalculator"
import PlList from "./PlList"

export default function Page() {
    const [editId, setEditId] = useState(null)
    const [allIds, setAllIds] = useState([])

    if (editId) return (
        <PlCalculator
            editId={editId}
            allIds={allIds}
            onBack={() => { setEditId(null); setAllIds([]) }}
        />
    )

    return (
        <PlList
            onEdit={(id, ids) => { setEditId(id); setAllIds(ids ?? [id]) }}
        />
    )
}
