'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import LoadingScreen from "@/components/ui/loadingScreen"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { H3 } from "@/components/ui/typography"
import services from "@/services"
import {
    IconArrowsSort,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconInfoCircle,
    IconPlus,
    IconSortAscending,
    IconSortDescending,
    IconTrash,
} from "@tabler/icons-react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { fmt } from "./plLib"
import PlImportModal from "./PlImportModal"

// P/L per record = settlement - COGS
function computeRecordPL(pl) {
    const sales    = pl.sales ?? []
    const cogsUnit = parseFloat(pl.cogs_per_unit) || 0
    let settlement = 0, unitsSold = 0, grossGmv = 0
    sales.forEach(s => {
        const units = parseInt(s.units_sold) || 0
        const price = parseFloat(s.actual_selling_price) || 0
        settlement += parseFloat(s.settlement_amount) || 0
        unitsSold  += units
        grossGmv   += units * price
    })
    return { settlement, grossGmv, cogs: cogsUnit * unitsSold, netPL: settlement - cogsUnit * unitsSold }
}

// Group individual records by period, summing P/L across all SKUs in that period
function groupByPeriod(pls) {
    const map = new Map()
    for (const pl of pls) {
        const key = `${pl.period_year}_${pl.period_month}`
        const { settlement, grossGmv, cogs, netPL } = computeRecordPL(pl)
        if (!map.has(key)) {
            map.set(key, {
                key,
                period_month: pl.period_month,
                period_year:  pl.period_year,
                created_at:   pl.created_at,
                updated_at:   pl.updated_at,
                source:       pl.source ?? null,
                ids:          [pl.id],
                sku_names:    [(pl.product_names?.length ? pl.product_names[0] : null) ?? pl.sku_name ?? pl.sku_code].filter(Boolean),
                settlement,
                grossGmv,
                cogs,
                netPL,
            })
        } else {
            const g = map.get(key)
            g.ids.push(pl.id)
            g.settlement += settlement
            g.grossGmv   += grossGmv
            g.cogs       += cogs
            g.netPL      += netPL
            const skuLabel = (pl.product_names?.length ? pl.product_names[0] : null) ?? pl.sku_name ?? pl.sku_code
            if (skuLabel && !g.sku_names.includes(skuLabel)) g.sku_names.push(skuLabel)
            if (new Date(pl.updated_at) > new Date(g.updated_at)) g.updated_at = pl.updated_at
        }
    }
    return Array.from(map.values())
}

function SortableHeader({ column, children, className }) {
    const sorted = column.getIsSorted()
    return (
        <div
            className={`flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors ${className ?? ''}`}
            onClick={() => column.toggleSorting(sorted === 'asc')}
        >
            {children}
            {sorted === 'asc' ? <IconSortAscending size={13} /> : sorted === 'desc' ? <IconSortDescending size={13} /> : <IconArrowsSort size={13} className="opacity-40" />}
        </div>
    )
}

const SKELETON_ROWS = 5
const SKELETON_COLS = 6

export default function PlList({ onEdit }) {
    const t = useTranslations('plpage')
    const [pls, setPls] = useState([])
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [isMutating, setIsMutating] = useState(false)
    const [isFetch, setIsFetch] = useState(false)
    const [deletingGroup, setDeletingGroup] = useState(null)  // { ids, label }
    const [importOpen, setImportOpen] = useState(false)
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [sorting, setSorting] = useState([{ id: 'period', desc: true }])

    useEffect(() => {
        const fetchData = async () => {
            setIsPageLoading(true)
            const listRes = await services.pl.getPls()
            const list = listRes?.data?.data ?? listRes?.data ?? []

            // Fetch full detail for each record to get sales/cogs
            const details = await Promise.allSettled(
                list.map(pl => services.pl.getMonthlyById(pl.id))
            )
            const enriched = list.map((pl, i) => {
                if (details[i].status === 'fulfilled') {
                    const full = details[i].value?.data?.data ?? details[i].value?.data ?? null
                    if (full) return { ...pl, ...full }
                }
                return pl
            })
            setPls(enriched)
            setIsPageLoading(false)
        }
        fetchData()
    }, [isFetch])

    const groups = useMemo(() => groupByPeriod(pls), [pls])

    const takenPeriods = useMemo(() =>
        groups.map(g => ({ year: String(g.period_year), month: g.period_month })),
        [groups]
    )

    const confirmDelete = async () => {
        if (!deletingGroup) return
        setDeletingGroup(null)
        setIsMutating(true)
        try {
            await Promise.all(deletingGroup.ids.map(id => services.pl.deleteMonthly(id)))
            toast.success(t('deleteSuccess'))
            setIsFetch(prev => !prev)
        } catch {
            toast.error(t('deleteFailed'))
        }
        setIsMutating(false)
    }

    const columns = useMemo(() => [
        {
            id: 'period',
            accessorFn: row => (row.period_year ?? 0) * 100 + parseInt(row.period_month ?? 0),
            header: ({ column }) => <SortableHeader column={column}>{t('colPeriod')}</SortableHeader>,
            cell: ({ row }) => {
                const { period_month, period_year } = row.original
                if (!period_month || !period_year) return '-'
                return new Date(period_year, parseInt(period_month) - 1)
                    .toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
            },
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => <SortableHeader column={column}>{t('colUploadedAt')}</SortableHeader>,
            cell: ({ row }) => {
                const d = row.original.created_at
                if (!d) return '-'
                return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            },
        },
        {
            id: 'channel',
            accessorFn: row => row.source ?? '',
            header: ({ column }) => <SortableHeader column={column}>{t('colChannel')}</SortableHeader>,
            cell: ({ row }) => {
                const src = row.original.source
                if (!src) return <span className="text-muted-foreground text-xs">-</span>
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-600 border border-orange-200">
                        {src.charAt(0).toUpperCase() + src.slice(1)}
                    </span>
                )
            },
        },
        {
            id: 'sku',
            accessorFn: row => row.sku_names.join(', '),
            header: ({ column }) => <SortableHeader column={column}>{t('colSku')}</SortableHeader>,
            cell: ({ row }) => (
                <div>
                    <span className="font-medium">{row.original.sku_names[0] ?? '-'}</span>
                    {row.original.sku_names.length > 1 && (
                        <span className="text-xs text-muted-foreground ml-1">
                            +{row.original.sku_names.length - 1} more
                        </span>
                    )}
                </div>
            ),
        },
        {
            id: 'grossGmv',
            accessorFn: row => row.grossGmv ?? 0,
            header: ({ column }) => <SortableHeader column={column} className="justify-end">{t('colGrossGmv')}</SortableHeader>,
            cell: ({ row }) => {
                const gmv = row.original.grossGmv
                if (gmv == null) return '-'
                return (
                    <div className="text-right">
                        <span className="text-xs font-semibold tabular-nums text-blue-700">{fmt(gmv)}</span>
                    </div>
                )
            },
        },
        {
            id: 'actions',
            enableSorting: false,
            header: () => <div className="text-right">{t('colActions')}</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-3">
                    <IconInfoCircle
                        size={16}
                        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => onEdit?.(row.original.ids[0], row.original.ids)}
                    />
                    <IconTrash
                        size={16}
                        className="cursor-pointer text-red-500 hover:text-red-700 transition-colors"
                        onClick={() => setDeletingGroup({
                            ids: row.original.ids,
                            label: row.original.sku_names.join(', '),
                        })}
                    />
                </div>
            ),
        },
    ], [t, onEdit])

    const table = useReactTable({
        data: groups,
        columns,
        state: { pagination, sorting },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <>
            {isMutating && <LoadingScreen />}

            <PlImportModal
                open={importOpen}
                onOpenChange={setImportOpen}
                takenPeriods={takenPeriods}
                onImported={() => setIsFetch(prev => !prev)}
            />

            <Dialog open={!!deletingGroup} onOpenChange={(open) => { if (!open) setDeletingGroup(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
                        <DialogDescription>{t('deleteConfirmDesc')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingGroup(null)}>{t('deleteCancel')}</Button>
                        <Button variant="destructive" onClick={confirmDelete}>{t('deleteConfirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-4 lg:px-6">
                    <H3 className="text-xl font-bold">{t('title')}</H3>
                    <Button onClick={() => setImportOpen(true)} disabled={isPageLoading}>
                        <IconPlus size={16} />
                        {t('addNew')}
                    </Button>
                </div>

                <div className="px-4 lg:px-6"><Separator /></div>

                <div className="px-4 lg:px-6 py-4 space-y-4">
                    <div className="overflow-hidden rounded-lg border [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4">
                        {isPageLoading ? (
                            <Table>
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    <TableRow>
                                        {Array.from({ length: SKELETON_COLS }).map((_, i) => (
                                            <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
                                        <TableRow key={rowIdx}>
                                            {Array.from({ length: SKELETON_COLS }).map((_, colIdx) => (
                                                <TableCell key={colIdx}><Skeleton className="h-4 w-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    {table.getHeaderGroups().map(hg => (
                                        <TableRow key={hg.id}>
                                            {hg.headers.map(h => (
                                                <TableHead key={h.id} colSpan={h.colSpan}>
                                                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.length ? (
                                        table.getRowModel().rows.map(row => (
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map(cell => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                                                {t('noData')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    {!isPageLoading && (
                        <div className="flex items-center justify-end gap-8 px-2">
                            <div className="flex w-fit items-center justify-center text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                                    <IconChevronsLeft />
                                </Button>
                                <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                                    <IconChevronLeft />
                                </Button>
                                <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                    <IconChevronRight />
                                </Button>
                                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                                    <IconChevronsRight />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
