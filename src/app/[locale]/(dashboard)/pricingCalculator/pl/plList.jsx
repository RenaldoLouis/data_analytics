'use client'

import { Button } from "@/components/ui/button"
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
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconPencil,
    IconPlus,
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

// Group raw monthly records by brand+period so the list shows one row per period.
// Each group carries `all_ids` (all record IDs) and `sku_names` (all SKU names).
function groupByPeriod(pls) {
    const map = new Map()
    pls.forEach(pl => {
        const key = `${pl.brand_id}_${pl.period_month}_${pl.period_year}`
        if (!map.has(key)) {
            map.set(key, {
                ...pl,
                sku_names: pl.sku_name ? [pl.sku_name] : [],
                all_ids:   [pl.id],
            })
        } else {
            const g = map.get(key)
            g.all_ids.push(pl.id)
            if (pl.sku_name && !g.sku_names.includes(pl.sku_name))
                g.sku_names.push(pl.sku_name)
            if (new Date(pl.updated_at) > new Date(g.updated_at))
                g.updated_at = pl.updated_at
        }
    })
    return Array.from(map.values())
}

const SKELETON_ROWS = 5
const SKELETON_COLS = 5

export default function PlList({ onAdd, onEdit }) {
    const t = useTranslations('plpage')
    const [pls, setPls] = useState([])
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [isMutating, setIsMutating] = useState(false)
    const [isFetch, setIsFetch] = useState(false)
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

    useEffect(() => {
        const fetchData = async () => {
            setIsPageLoading(true)
            const res = await services.pl.getPls()
            setPls(res?.data?.data ?? res?.data ?? [])
            setIsPageLoading(false)
        }
        fetchData()
    }, [isFetch])

    const groupedPls = useMemo(() => groupByPeriod(pls), [pls])

    const handleDelete = async (allIds) => {
        setIsMutating(true)
        try {
            await Promise.all(allIds.map(id => services.pl.deleteMonthly(id)))
            toast.success(t('deleteSuccess'))
            setIsFetch(prev => !prev)
        } catch {
            toast.error(t('deleteFailed'))
        }
        setIsMutating(false)
    }

    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: t('colBrand'),
            cell: ({ row }) => <span className="font-medium">{row.original.name || row.original.brand_name || '-'}</span>,
        },
        {
            id: 'sku',
            header: t('colSku'),
            cell: ({ row }) => <span>{row.original.sku_names?.join(', ') || '-'}</span>,
        },
        {
            id: 'period',
            header: t('colPeriod'),
            cell: ({ row }) => {
                const month = row.original.period_month
                const year = row.original.period_year
                if (!month && !year) return '-'
                const date = new Date(year, month - 1)
                return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
            },
        },
        {
            accessorKey: 'created_at',
            header: t('colCreatedAt'),
            cell: ({ row }) => {
                const d = row.original.created_at
                if (!d) return '-'
                return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            },
        },
        {
            accessorKey: 'updated_at',
            header: t('colUpdatedAt'),
            cell: ({ row }) => {
                const d = row.original.updated_at
                if (!d) return '-'
                return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('colActions')}</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-3">
                    <IconPencil
                        size={16}
                        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => onEdit?.(row.original.id)}
                    />
                    <IconTrash
                        size={16}
                        className="cursor-pointer text-red-500 hover:text-red-700 transition-colors"
                        onClick={() => handleDelete(row.original.all_ids)}
                    />
                </div>
            ),
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t])

    const table = useReactTable({
        data: groupedPls,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <>
            {isMutating && <LoadingScreen />}

            <div className="space-y-4">
                <div className="flex justify-between items-center px-4 lg:px-6">
                    <H3 className="text-xl font-bold">{t('title')}</H3>
                    <Button onClick={onAdd} disabled={isPageLoading}>
                        <IconPlus size={16} />
                        {t('addNew')}
                    </Button>
                </div>

                <div className="px-4 lg:px-6">
                    <Separator />
                </div>

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
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <TableHead key={header.id} colSpan={header.colSpan}>
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                                    <span className="sr-only">Go to first page</span>
                                    <IconChevronsLeft />
                                </Button>
                                <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                                    <span className="sr-only">Go to previous page</span>
                                    <IconChevronLeft />
                                </Button>
                                <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                    <span className="sr-only">Go to next page</span>
                                    <IconChevronRight />
                                </Button>
                                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                                    <span className="sr-only">Go to last page</span>
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
