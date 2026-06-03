'use client'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import services from "@/services"
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconDownload } from "@tabler/icons-react"
import { useEffect, useState, useMemo } from "react"
import * as XLSX from "xlsx"
import { fmt } from "./plLib"
import { AuditTable, KpiCards, Section, SectionHeader, ShopeeChip, SkuCell } from "./PlComponents"

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const YEARS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 3 + i))
const ORDER_PAGE_SIZE = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

const n = (v) => Math.round(parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')) || 0)
const fmtInt = (v) => Math.round(v || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const toInt = (v) => v != null && v !== '' ? String(Math.round(parseFloat(v) || 0)) : ''

// Canonical SKU name (from skus table, not Shopee import name)
const canonicalName = (r) => r?.sku_name ?? r?.product_names?.[0] ?? r?.sku_code ?? 'SKU'

// ─── Build per-record form ────────────────────────────────────────────────────

function buildFormFromRecord(rec) {
    const salesArr = rec?.sales ?? []
    const d = rec?.discounts?.[0] ?? {}
    const r = rec?.returns?.[0] ?? {}
    const sh = rec?.shippings?.[0] ?? {}

    let aggUnits = 0, aggGrossGmv = 0, aggSettlement = 0
    for (const s of salesArr) {
        const u = parseInt(s.units_sold) || 0
        const p = parseInt(s.actual_selling_price) || 0
        const sett = parseInt(s.settlement_amount) || 0
        aggUnits += u
        aggGrossGmv += u * p
        aggSettlement += sett
    }
    const aggAvgPrice = aggUnits > 0 ? Math.round(aggGrossGmv / aggUnits) : 0
    const s0 = salesArr[0] ?? {}

    return {
        units_sold: salesArr.length > 1 ? String(aggUnits) : toInt(s0.units_sold),
        actual_selling_price: salesArr.length > 1 ? String(aggAvgPrice) : toInt(s0.actual_selling_price),
        settlement_amount: salesArr.length > 1 ? String(aggSettlement) : toInt(s0.settlement_amount),
        voucher_amount: toInt(d.voucher_amount),
        voucher_cofund_amount: toInt(d.voucher_cofund_amount),
        coin_amount: toInt(d.coin_amount),
        coin_cofund_amount: toInt(d.coin_cofund_amount),
        actual_refund_amount: toInt(r.actual_refund_amount),
        shipping_subsidy: toInt(sh.shipping_subsidy),
        actual_shipping_cost: toInt(sh.actual_shipping_cost),
        processing_fee: toInt(sh.processing_fee),
        commission_fee_amount: toInt(sh.commission_fee_amount),
        service_fee_amount: toInt(sh.service_fee_amount),
        transaction_fee_amount: toInt(sh.transaction_fee_amount),
        campaign_fee_amount: toInt(sh.campaign_fee_amount),
        affiliate_commission_amount: toInt(sh.affiliate_commission_amount),
        _sales: salesArr.map(s => ({
            order_no: s.order_no ?? '',
            units_sold: toInt(s.units_sold),
            actual_selling_price: toInt(s.actual_selling_price),
            seller_discount: toInt(s.seller_discount ?? '0'),
            fee_total: toInt(s.fee_total ?? '0'),
            net_shipping: toInt(s.net_shipping ?? '0'),
            settlement_amount: toInt(s.settlement_amount),
        })),
    }
}

// ─── Download Report ──────────────────────────────────────────────────────────

function downloadReport(records, forms) {
    const rows = records.map(rec => {
        const f = forms[rec.id] ?? buildFormFromRecord(rec)
        const cogs = (parseFloat(rec.cogs_per_unit) || 0) * n(f.units_sold)
        const sett = n(f.settlement_amount)
        const fees = n(f.commission_fee_amount) + n(f.service_fee_amount) + n(f.processing_fee) +
            n(f.transaction_fee_amount) + n(f.campaign_fee_amount) + n(f.affiliate_commission_amount)
        return {
            'SKU': canonicalName(rec),
            'SKU Code': rec.sku_code ?? '',
            'Period': `${MONTHS_EN[parseInt(rec.period_month) - 1]} ${rec.period_year}`,
            'Source': rec.source ?? '',
            'Units Sold': n(f.units_sold),
            'Avg Price (Rp)': n(f.actual_selling_price),
            'Gross GMV (Rp)': n(f.units_sold) * n(f.actual_selling_price),
            'Settlement (Rp)': sett,
            'Seller Voucher (Rp)': n(f.voucher_amount),
            'Seller Co-fund Voucher (Rp)': n(f.voucher_cofund_amount),
            'Coin Cashback (Rp)': n(f.coin_amount),
            'Coin Co-fund (Rp)': n(f.coin_cofund_amount),
            'Return/Refund (Rp)': n(f.actual_refund_amount),
            'Shipping Subsidy (Rp)': n(f.shipping_subsidy),
            'Actual Shipping Cost (Rp)': n(f.actual_shipping_cost),
            'Admin Fee / Commission (Rp)': n(f.commission_fee_amount),
            'Service Fee (Rp)': n(f.service_fee_amount),
            'Order Processing Fee (Rp)': n(f.processing_fee),
            'Transaction Fee (Rp)': n(f.transaction_fee_amount),
            'Campaign Fee (Rp)': n(f.campaign_fee_amount),
            'Affiliate Commission (Rp)': n(f.affiliate_commission_amount),
            'Total Channel Fees (Rp)': fees,
            'COGS per Unit (Rp)': Math.round(parseFloat(rec.cogs_per_unit) || 0),
            'Total COGS (Rp)': Math.round(cogs),
            'Net P/L (Rp)': sett - Math.round(cogs),
            'Net Margin (%)': sett > 0 ? +((sett - cogs) / sett * 100).toFixed(1) : 0,
        }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'P&L Report')
    const first = records[0]
    const period = first ? `${MONTHS_EN[parseInt(first.period_month) - 1]}_${first.period_year}` : 'report'
    XLSX.writeFile(wb, `pl_report_${period}.xlsx`)
}

// ─── Summary Tab ─────────────────────────────────────────────────────────────

function SummaryTab({ agg }) {
    // Formula matches import modal: GMV − Seller Discount − Channel Fees + Net Shipping − Returns
    const calculated = agg.grossGmv - agg.totalDisc - agg.totalFees + agg.netShipping - agg.refund
    const delta = agg.settlement - calculated
    const isMatch = delta === 0

    const t = (v, positive) => positive ? (v > 0 ? 'text-blue-700' : 'text-muted-foreground/60')
        : (v > 0 ? 'text-red-600' : 'text-muted-foreground/60')

    return (
        <div className="space-y-3">
            <Section title="Revenue">
                <AuditTable noBorder rows={[
                    { label: 'Original Price (before discount)', value: agg.grossGmv, cls: 'text-blue-700' },
                    { label: 'Platform Voucher (Shopee)', value: 0, cls: 'text-muted-foreground/60', note: 'not stored' },
                    { label: 'Total Returns', value: agg.refund, cls: 'text-muted-foreground/60' },
                ]} />
            </Section>
            <Section title="Seller Discounts">
                <AuditTable noBorder
                    rows={[
                        { label: 'Seller Sponsored Voucher', value: agg.voucher, cls: t(agg.voucher, false) },
                        { label: 'Seller Co-fund Voucher', value: agg.voucherCof, cls: t(agg.voucherCof, false) },
                        { label: 'Seller Coin Cashback', value: agg.coin, cls: t(agg.coin, false) },
                        { label: 'Seller Co-fund Coin Cashback', value: agg.coinCof, cls: t(agg.coinCof, false) },
                    ]}
                    subtotal={{ label: 'Total Seller Discount', value: agg.totalDisc, cls: 'text-muted-foreground/60' }}
                />
            </Section>
            <Section title="Channel Fees">
                <AuditTable noBorder
                    rows={[
                        { label: 'Admin Fee (Commission)', value: agg.commFee, cls: t(agg.commFee, false) },
                        { label: 'Service Fee', value: agg.svcFee, cls: t(agg.svcFee, false) },
                        { label: 'Order Processing Fee', value: agg.procFee, cls: t(agg.procFee, false) },
                        { label: 'Transaction Fee', value: agg.txFee, cls: t(agg.txFee, false) },
                        { label: 'Campaign Fee', value: agg.campFee, cls: t(agg.campFee, false) },
                        { label: 'Affiliate Commission', value: agg.affFee, cls: t(agg.affFee, false) },
                    ]}
                    subtotal={{ label: 'Total Channel Fees', value: agg.totalFees, cls: agg.totalFees > 0 ? 'text-red-600' : 'text-muted-foreground/60' }}
                />
            </Section>
            <Section title="Shipping">
                <AuditTable noBorder
                    rows={[
                        { label: 'Buyer Paid Shipping', value: 0, cls: 'text-muted-foreground/60', note: agg.subsidy > 0 ? 'free shipping' : undefined },
                        { label: 'Free Shipping Subsidy (Shopee)', value: agg.subsidy, cls: t(agg.subsidy, true) },
                        { label: 'Shipping to Carrier', value: agg.shipCost, cls: t(agg.shipCost, false) },
                        { label: 'Seller Shipping Promo', value: 0, cls: 'text-muted-foreground/60' },
                    ]}
                    subtotal={{ label: 'Net Shipping', value: agg.netShipping, cls: 'text-muted-foreground/60', note: agg.subsidy > 0 ? 'Shopee covered' : undefined }}
                />
            </Section>
            <Section title="Settlement Validation">
                <AuditTable noBorder
                    rows={[
                        { label: 'Total Income (Income Report)', value: agg.settlement, cls: 'text-blue-700' },
                        { label: 'GMV − Seller Discount − Channel Fees + Net Shipping − Returns', value: calculated, cls: 'text-blue-700' },
                    ]}
                    subtotal={{ label: `Difference${isMatch ? ' - ✓ matched' : ''}`, value: delta, cls: isMatch ? 'text-green-700' : 'text-red-600' }}
                />
            </Section>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlCalculator({ editId, allIds, onBack }) {
    const [records, setRecords] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [forms, setForms] = useState({})
    const [orderPage, setOrderPage] = useState(0)

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const ids = allIds?.length ? allIds : [editId]
        setIsLoading(true)
        Promise.allSettled(ids.map(id => services.pl.getMonthlyById(id)))
            .then(results => {
                const loaded = results
                    .filter(r => r.status === 'fulfilled')
                    .map(r => r.value?.data?.data ?? r.value?.data)
                    .filter(Boolean)
                setRecords(loaded)
                const init = {}
                loaded.forEach(rec => { init[rec.id] = buildFormFromRecord(rec) })
                setForms(init)
                setIsLoading(false)
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    const active = records[0]

    // ── Aggregate across ALL records (period-level) ───────────────────────────
    const agg = useMemo(() => {
        const sum = (fn) => records.reduce((s, rec) => {
            const f = forms[rec.id] ?? buildFormFromRecord(rec)
            return s + fn(f, rec)
        }, 0)
        const grossGmv = sum((f) => n(f.units_sold) * n(f.actual_selling_price))
        const settlement = sum((f) => n(f.settlement_amount))
        const voucher = sum((f) => n(f.voucher_amount))
        const voucherCof = sum((f) => n(f.voucher_cofund_amount))
        const coin = sum((f) => n(f.coin_amount))
        const coinCof = sum((f) => n(f.coin_cofund_amount))
        const totalDisc = voucher + voucherCof + coin + coinCof
        const refund = sum((f) => n(f.actual_refund_amount))
        const subsidy = sum((f) => n(f.shipping_subsidy))
        const shipCost = sum((f) => n(f.actual_shipping_cost))
        const netShipping = subsidy - shipCost
        const commFee = sum((f) => n(f.commission_fee_amount))
        const svcFee = sum((f) => n(f.service_fee_amount))
        const procFee = sum((f) => n(f.processing_fee))
        const txFee = sum((f) => n(f.transaction_fee_amount))
        const campFee = sum((f) => n(f.campaign_fee_amount))
        const affFee = sum((f) => n(f.affiliate_commission_amount))
        const totalFees = commFee + svcFee + procFee + txFee + campFee + affFee
        const totalCogs = sum((f, rec) => (parseFloat(rec.cogs_per_unit) || 0) * n(f.units_sold))
        return {
            grossGmv, settlement, voucher, voucherCof, coin, coinCof, totalDisc,
            refund, subsidy, shipCost, netShipping,
            commFee, svcFee, procFee, txFee, campFee, affFee, totalFees,
            totalCogs,
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [records, forms])

    // ── Flat list of all order rows (for Orders tab) ──────────────────────────
    // Prefer order_report_rows (all orders from the order report, including cancelled).
    // Fall back to _sales (income report rows) when no order report was uploaded.
    // Deduplicate by order_no across records so the same order isn't shown per SKU.
    const allOrderRows = useMemo(() => {
        const seen = new Set()
        return records.flatMap(rec => {
            // order_report_rows from the order report Excel (all orders, inc. cancelled)
            const reportRows = rec.order_report_rows ?? []
            if (reportRows.length > 0) {
                return reportRows
                    .filter(r => {
                        // Dedup by order_no + product_name so the same product in the
                        // same order only appears once across all SKU records
                        const key = `${r.order_no?.trim() ?? ''}::${r.product_name?.trim() ?? ''}`
                        if (!key || key === '::') return true
                        if (seen.has(key)) return false
                        seen.add(key)
                        return true
                    })
                    .map(r => ({ rec, entry: r, fromOrderReport: true }))
            }
            // Fall back to income-report rows stored in _sales
            const f = forms[rec.id] ?? {}
            const entries = f._sales ?? []
            if (entries.length === 0) return [{ rec, entry: null }]
            return entries
                .filter(entry => {
                    const key = entry.order_no?.trim()
                    if (!key) return true
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                .map(entry => ({ rec, entry, fromOrderReport: false }))
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [records, forms])

    const totalOrderPages = Math.max(1, Math.ceil(allOrderRows.length / ORDER_PAGE_SIZE))
    const safeOrderPage = Math.min(orderPage, totalOrderPages - 1)
    const pagedOrders = allOrderRows.slice(safeOrderPage * ORDER_PAGE_SIZE, (safeOrderPage + 1) * ORDER_PAGE_SIZE)

    useEffect(() => { setOrderPage(0) }, [records.length])

    // ── Per-SKU rows (for SKU tab) - one row per Shopee product ─────────────────
    const skuRows = useMemo(() =>
        records.flatMap(rec => {
            const f = forms[rec.id] ?? buildFormFromRecord(rec)
            const cogsUnit = parseFloat(rec.cogs_per_unit) || 0
            const reportRows = rec.order_report_rows ?? []
            const productNames = Array.isArray(rec.product_names) ? rec.product_names : []

            // When order report rows are available, break down per Shopee product
            if (reportRows.length > 0 && productNames.length > 0) {
                const recSettlement = n(f.settlement_amount)
                const recFees = n(f.commission_fee_amount) + n(f.service_fee_amount) +
                    n(f.processing_fee) + n(f.transaction_fee_amount) +
                    n(f.campaign_fee_amount) + n(f.affiliate_commission_amount)
                const recDisc = n(f.voucher_amount) + n(f.voucher_cofund_amount) + n(f.coin_amount) + n(f.coin_cofund_amount)
                const recNetShipping = n(f.shipping_subsidy) - n(f.actual_shipping_cost)

                // Aggregate per product from order report rows for this SKU's products
                const productMap = {}
                for (const r of reportRows.filter(r => !r.excluded && productNames.includes(r.product_name))) {
                    if (!productMap[r.product_name]) productMap[r.product_name] = { units: 0, gmv: 0 }
                    productMap[r.product_name].units += r.qty || 0
                    productMap[r.product_name].gmv += r.gmv || 0
                }

                const totalProductGmv = Object.values(productMap).reduce((s, p) => s + p.gmv, 0)

                return Object.entries(productMap).map(([productName, p]) => {
                    const share = totalProductGmv > 0 ? p.gmv / totalProductGmv : 0
                    const settlement = Math.round(recSettlement * share)
                    const channelFees = Math.round(recFees * share)
                    const discPenjual = Math.round(recDisc * share)
                    const netOngkir = Math.round(recNetShipping * share)
                    const cogs = cogsUnit * p.units
                    return { rec, productName, units: p.units, grossGmv: p.gmv, discPenjual, channelFees, netOngkir, settlement, cogs, contribution: settlement - cogs }
                })
            }

            // Fallback: single aggregate row per SKU record
            const units = n(f.units_sold)
            const grossGmv = units * n(f.actual_selling_price)
            const discPenjual = n(f.voucher_amount) + n(f.voucher_cofund_amount) + n(f.coin_amount) + n(f.coin_cofund_amount)
            const channelFees = n(f.commission_fee_amount) + n(f.service_fee_amount) + n(f.processing_fee) + n(f.transaction_fee_amount) + n(f.campaign_fee_amount) + n(f.affiliate_commission_amount)
            const netOngkir = n(f.shipping_subsidy) - n(f.actual_shipping_cost)
            const settlement = n(f.settlement_amount)
            const cogs = cogsUnit * units
            return [{ rec, productName: canonicalName(rec), units, grossGmv, discPenjual, channelFees, netOngkir, settlement, cogs, contribution: settlement - cogs }]
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [records, forms])

    // ── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="px-4 lg:px-6 py-6 space-y-4">
            {[64, 120, 160, 200, 160].map((h, i) => <Skeleton key={i} className="w-full rounded-lg" style={{ height: h }} />)}
        </div>
    )
    if (!active) return (
        <div className="px-4 lg:px-6 py-6 text-sm text-muted-foreground">
            Record not found. <button className="underline" onClick={onBack}>Go back</button>
        </div>
    )

    const periodMonth = active.period_month ? parseInt(active.period_month) - 1 : null

    // Orders tab footer totals (matched rows)
    const matchedRows = allOrderRows.filter(r => r.entry !== null && !r.entry?.excluded && !r.entry?.Excluded)
    // Use highest stored matched_orders across records (income report count).
    // Falls back to matchedRows.length (order report dedup count) for old imports.
    const displayMatchedOrders = records.reduce((max, r) => Math.max(max, r.matched_orders ?? 0), 0) || matchedRows.length
    // Use period-level aggregates for footer (consistent with KPI cards & Summary tab)
    // Row-level sums vary by income-report match status and pagination, so use agg instead
    const totalGmv      = agg.grossGmv
    const totalDiscount = agg.totalDisc
    const totalFees     = agg.totalFees
    const totalShipping = agg.netShipping
    const totalSettle   = agg.settlement


    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 lg:px-6">
                <button type="button" onClick={onBack} className="text-sm hover:opacity-70">←</button>
                <h2 className="text-xl font-bold">P/L Detail</h2>
                {active.source === 'shopee' && <ShopeeChip />}
            </div>

            <div className="px-4 lg:px-6"><Separator /></div>

            <div className="px-4 lg:px-6 pb-20 space-y-3">

                {/* Period (read-only display) */}
                <div className="border rounded-lg p-5 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Period</p>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Year</p>
                        <select value={active.period_year ?? ''} disabled className="h-8 rounded-md border px-2 text-sm bg-muted/50 text-muted-foreground w-24">
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {MONTH_LABELS.map((m, i) => (
                            <button key={m} type="button" disabled className={`px-3 py-1.5 text-sm rounded-lg border ${i === periodMonth ? 'bg-foreground text-background border-foreground font-medium' : 'bg-background text-muted-foreground border-input opacity-40'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI chips */}
                <KpiCards cards={[
                    {
                        label: 'Gross GMV', value: agg.grossGmv,
                        cls: 'text-blue-700',
                        subtitle: `${displayMatchedOrders} orders`,
                    },
                    {
                        label: 'Channel Fees', value: agg.totalFees,
                        cls: 'text-red-600',
                        subtitle: agg.grossGmv > 0 ? `${((agg.totalFees / agg.grossGmv) * 100).toFixed(1)}% GMV` : undefined
                    },
                    {
                        label: 'Settlement', value: agg.settlement,
                        cls: 'text-green-700',
                        subtitle: agg.grossGmv > 0 ? `${((agg.settlement / agg.grossGmv) * 100).toFixed(1)}% GMV` : undefined
                    },
                    {
                        label: 'Contribution Margin', value: agg.settlement - agg.totalCogs,
                        cls: (agg.settlement - agg.totalCogs) >= 0 ? 'text-green-700' : 'text-red-600',
                        subtitle: agg.totalCogs > 0 ? `After COGS ${fmt(agg.totalCogs)}` : 'COGS not set'
                    },
                ]} />

                {/* ══ TABS ════════════════════════════════════════════════════════════ */}
                <Tabs defaultValue="summary">
                    <TabsList className="mb-3">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="sku">SKU</TabsTrigger>
                    </TabsList>

                    {/* ── Summary ── */}
                    <TabsContent value="summary" className="mt-0">
                        <SummaryTab agg={agg} />
                    </TabsContent>

                    {/* ── Orders ── */}
                    <TabsContent value="orders" className="mt-0 space-y-3">
                        <div>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[680px] border rounded-b-md [&_tr:last-child_td]:border-b-0">
                                    <TableHeader>
                                        <TableRow className="bg-muted/60 hover:bg-muted/60">
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Order No.</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Qty</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Original Price</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Seller Discount</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Channel Fees</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Net Shipping</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Settlement</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pagedOrders.map(({ rec, entry, fromOrderReport }, i) => {
                                            if (!entry) {
                                                return (
                                                    <TableRow key={i} className="opacity-50">
                                                        <TableCell className="py-1.5 px-3 text-sm font-mono text-muted-foreground">-</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-muted-foreground">{canonicalName(rec)}</TableCell>
                                                        <TableCell colSpan={6} className="py-1.5 px-3 text-sm text-muted-foreground text-center">no order data</TableCell>
                                                    </TableRow>
                                                )
                                            }
                                            if (fromOrderReport) {
                                                const excluded = entry.excluded
                                                return (
                                                    <TableRow key={i} className={excluded ? 'opacity-40' : ''}>
                                                        <TableCell className="py-1.5 px-3 text-sm font-mono">{entry.order_no || '-'}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm">{entry.product_name}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{entry.qty}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(entry.price)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">-</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">-</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">-</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{excluded ? <span className="text-muted-foreground text-xs">{entry.status}</span> : fmt(entry.gmv)}</TableCell>
                                                    </TableRow>
                                                )
                                            }
                                            return (
                                                <TableRow key={i}>
                                                    <TableCell className="py-1.5 px-3 text-sm font-mono">{entry.order_no || '-'}</TableCell>
                                                    <TableCell className="py-1.5 px-3 text-sm">{canonicalName(rec)}</TableCell>
                                                    <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{n(entry.units_sold)}</TableCell>
                                                    <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.actual_selling_price))}</TableCell>
                                                    <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.seller_discount))}</TableCell>
                                                    <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.fee_total))}</TableCell>
                                                    <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.net_shipping))}</TableCell>
                                                    <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.settlement_amount))}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-muted/40">
                                            <TableCell colSpan={3} className="py-1.5 px-3 text-sm font-semibold">Total ({displayMatchedOrders} MATCHED)</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalGmv >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalGmv)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalDiscount >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalDiscount)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalFees >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalFees)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalShipping >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalShipping)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalSettle >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalSettle)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>
                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">
                                Only MATCHED orders are included. Cancelled and full-refund orders are excluded from the footer.
                            </p>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                <span className="text-xs text-muted-foreground">Page {safeOrderPage + 1} of {totalOrderPages}</span>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => setOrderPage(0)} disabled={safeOrderPage === 0}><IconChevronsLeft size={13} /></Button>
                                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => setOrderPage(p => Math.max(0, p - 1))} disabled={safeOrderPage === 0}><IconChevronLeft size={13} /></Button>
                                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => setOrderPage(p => Math.min(totalOrderPages - 1, p + 1))} disabled={safeOrderPage >= totalOrderPages - 1}><IconChevronRight size={13} /></Button>
                                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => setOrderPage(totalOrderPages - 1)} disabled={safeOrderPage >= totalOrderPages - 1}><IconChevronsRight size={13} /></Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── SKU ── */}
                    <TabsContent value="sku" className="mt-0 space-y-3">
                        <div>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[780px] border rounded-b-md [&_tr:last-child_td]:border-b-0">
                                    <TableHeader>
                                        <TableRow className="bg-muted/60 hover:bg-muted/60">
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Qty Sold</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Gross GMV</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Seller Discount</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Channel Fees</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Net Shipping</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Settlement</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">COGS</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Contribution</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {skuRows.map(({ rec, productName, units, grossGmv, discPenjual, channelFees, netOngkir, settlement, cogs, contribution }, idx) => (
                                            <TableRow key={`${rec.id}-${idx}`}>
                                                <TableCell className="py-1.5 px-3">
                                                    <p className="font-medium text-sm">{productName}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">↳ {rec.sku_code ?? canonicalName(rec)}</p>
                                                </TableCell>
                                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{units}</TableCell>
                                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(grossGmv)}</TableCell>
                                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(discPenjual)}</TableCell>
                                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(channelFees)}</TableCell>
                                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(netOngkir)}</TableCell>
                                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(settlement)}</TableCell>
                                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(cogs)}</TableCell>
                                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">
                                                    {fmt(contribution)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-muted/40">
                                            <TableCell className="py-1.5 px-3 text-sm font-semibold" colSpan={2}>Total</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.grossGmv >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.grossGmv)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.totalDisc >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.totalDisc)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.totalFees >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.totalFees)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.netShipping >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.netShipping)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.settlement >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.settlement)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.totalCogs >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.totalCogs)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-bold ${(agg.settlement - agg.totalCogs) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                {fmt(agg.settlement - agg.totalCogs)}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

            </div>

            {/* ── Bottom bar - download only ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-20">
                <div className="px-4 lg:px-6 py-3 flex items-center justify-end">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => downloadReport(records, forms)}>
                        <IconDownload size={13} />
                        Download Report
                    </Button>
                </div>
            </div>

        </div>
    )
}
