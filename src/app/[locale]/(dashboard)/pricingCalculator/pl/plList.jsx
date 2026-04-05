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
import { fmt } from "./plLib"

// Compute P/L for a single monthly record, using brand data for channel fees & SKU COGS
function computeRecordPL(pl, brand) {
    const sales = pl.sales ?? []
    const discounts = pl.discounts ?? []
    const returns = pl.returns ?? []
    const shippings = pl.shippings ?? []
    const fixedCosts = pl.fixed_costs ?? []
    const brandChannels = brand?.channels ?? []

    const chFeeMap = Object.fromEntries(brandChannels.map(ch => [ch.id, ch.fee_config ?? {}]))
    const skuId = pl.sku_id ?? pl.sku?.id
    const sku = (brand?.skus ?? []).find(s => s.id === skuId) ?? pl.sku ?? {}
    const cogsUnit = (parseFloat(sku.cogs_per_unit) || 0) + (parseFloat(sku.packaging_cost) || 0)

    // Per-channel COGS overrides (bundling)
    const cogsOverrides = Object.fromEntries(
        (pl.cogs_overrides ?? []).map(co => [co.channel_id, co])
    )

    let grossTotal = 0, discTotal = 0, retTotal = 0, shipTotal = 0, adsTotal = 0, cogsTotal = 0, chCostTotal = 0
    sales.forEach(s => {
        const vol = parseFloat(s.units_sold) || 0
        const gross = vol * (parseFloat(s.actual_selling_price) || 0)
        grossTotal += gross
        adsTotal += parseFloat(s.ads_spend_amount) || (gross * (parseFloat(s.ads_spend_rate) || 0))
        const co = cogsOverrides[s.channel_id]
        const bundCogs = parseFloat(co?.cogs_bundling) || 0
        const unitsPerBundle = parseFloat(co?.units_per_bundle) || 1
        cogsTotal += vol * (bundCogs > 0 ? bundCogs : unitsPerBundle * cogsUnit)
        const fee = chFeeMap[s.channel_id] ?? {}
        chCostTotal += gross * ((parseFloat(fee.commission_rate) || 0) + (parseFloat(fee.mall_fee_rate) || 0) + (parseFloat(fee.pgw_rate) || 0))
    })
    discounts.forEach(d => { discTotal += parseFloat(d.discount_amount) || 0 })
    returns.forEach(r => { retTotal += parseFloat(r.actual_refund_amount) || 0 })
    shippings.forEach(s => { shipTotal += (parseFloat(s.shipping_subsidy) || 0) + (parseFloat(s.processing_fee) || 0) })

    const netTotal = grossTotal - discTotal - retTotal - shipTotal - adsTotal
    const grossProfit = netTotal - cogsTotal
    const fixedTotal = fixedCosts.reduce((s, fc) => s + (parseFloat(fc.amount) || 0), 0)
    const operatingProfit = grossProfit - chCostTotal - fixedTotal

    return { grossTotal, netTotal, operatingProfit }
}

// Compute enabler costs from brand config + monthly enabler_var data
function computeEnablerCost(records, brand, allSkuGross) {
    const ev = records[0]?.enabler_var ?? {}
    const ec = brand?.enabler_fee_config ?? {}

    const enablerFixed = (parseFloat(ec.retainer_amount) || 0)
        + (parseFloat(ec.store_operation_fee) || 0)
        + (parseFloat(ec.platform_fee) || 0)
        + (parseFloat(ec.live_commerce_cost) || 0)
        + (parseFloat(ec.warehouse_cost) || 0)
        + (ec.custom_fixed_components ?? []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

    const commissionVal = allSkuGross * (parseFloat(ev.commission_gmv_rate) || 0)
    const fulfilTotal = (parseFloat(ev.order_count) || 0) * (parseFloat(ec.fulfillment_per_order) || 0)
    const claimTotal = (parseFloat(ev.claim_support) || 0) + (parseFloat(ev.claim_voucher) || 0)
        + (parseFloat(ev.claim_mp_fee) || 0) + (parseFloat(ev.mp_affiliate) || 0)
        + (parseFloat(ev.campaign_ads_fee) || 0)
    const customVarTotal = Object.values(ev.custom_var_items ?? {}).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    const enablerVarTotal = commissionVal + fulfilTotal + claimTotal + customVarTotal

    return enablerFixed + enablerVarTotal
}

// Group raw monthly records by brand+period, compute final P/L using brand data
function groupByPeriod(pls, brandsMap) {
    const map = new Map()
    pls.forEach(pl => {
        const key = `${pl.brand_id}_${pl.period_month}_${pl.period_year}`
        const brand = brandsMap[pl.brand_id]
        if (!map.has(key)) {
            map.set(key, {
                ...pl,
                sku_names: pl.sku_name ? [pl.sku_name] : [],
                all_ids: [pl.id],
                _records: [pl],
                _skuPLs: [computeRecordPL(pl, brand)],
                _brand: brand,
            })
        } else {
            const g = map.get(key)
            g.all_ids.push(pl.id)
            g._records.push(pl)
            g._skuPLs.push(computeRecordPL(pl, brand))
            if (pl.sku_name && !g.sku_names.includes(pl.sku_name))
                g.sku_names.push(pl.sku_name)
            if (new Date(pl.updated_at) > new Date(g.updated_at))
                g.updated_at = pl.updated_at
        }
    })
    for (const g of map.values()) {
        const allSkuGross = g._skuPLs.reduce((s, p) => s + p.grossTotal, 0)
        const allSkuOpProfit = g._skuPLs.reduce((s, p) => s + p.operatingProfit, 0)
        const enablerCost = computeEnablerCost(g._records, g._brand, allSkuGross)
        g.finalMonthlyPL = allSkuOpProfit - enablerCost
        g.allSkuNetTotal = g._skuPLs.reduce((s, p) => s + p.netTotal, 0)
    }
    return Array.from(map.values())
}

const SKELETON_ROWS = 5
const SKELETON_COLS = 6

export default function PlList({ onAdd, onEdit }) {
    const t = useTranslations('plpage')
    const [pls, setPls] = useState([])
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [isMutating, setIsMutating] = useState(false)
    const [isFetch, setIsFetch] = useState(false)
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

    const [brandsMap, setBrandsMap] = useState({})

    useEffect(() => {
        const fetchData = async () => {
            setIsPageLoading(true)
            // Fetch monthly list and brands in parallel
            const [plRes, brandRes] = await Promise.all([
                services.pl.getPls(),
                services.pl.getBrands(),
            ])
            const list = plRes?.data?.data ?? plRes?.data ?? []
            const brands = brandRes?.data?.data ?? brandRes?.data ?? []
            const bMap = Object.fromEntries(
                (Array.isArray(brands) ? brands : [brands]).filter(Boolean).map(b => [b.id, b])
            )
            setBrandsMap(bMap)

            // Fetch full detail for each record to get nested sales/discounts/etc.
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

    const groupedPls = useMemo(() => groupByPeriod(pls, brandsMap), [pls, brandsMap])

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
            id: 'finalPL',
            header: () => <div className="text-right">{t('colFinalPL')}</div>,
            cell: ({ row }) => {
                const pl = row.original.finalMonthlyPL
                if (pl == null) return '-'
                const color = pl < 0 ? 'text-red-600' : 'text-green-700'
                const net = row.original.allSkuNetTotal
                const pctVal = net > 0 ? ((pl / net) * 100).toFixed(1) : '0.0'
                return (
                    <div className="text-right">
                        <span className={`text-xs font-semibold tabular-nums ${color}`}>{fmt(pl)}</span>
                        <span className={`text-[10px] ml-1 ${color}`}>({pctVal}%)</span>
                    </div>
                )
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
