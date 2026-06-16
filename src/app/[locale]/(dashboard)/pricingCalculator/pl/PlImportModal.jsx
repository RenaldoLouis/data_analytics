'use client'

import { useRef, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconArrowRight, IconCheck, IconFile, IconUpload, IconX } from "@tabler/icons-react"
import { useLocale, useTranslations } from "next-intl"
import services from "@/services"
import { fmt } from "./plLib"
import { parseShopeeReports } from "./plShopeeParser"
import { AuditTable, KpiCards, Section, SectionHeader } from "./PlComponents"

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const now = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => String(now - 3 + i))


// ─── Upload zone - same pattern as ModalSkuForm image upload ──────────────────
function UploadZone({ label, hint, file, onFile }) {
    const ref = useRef(null)
    return (
        <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{hint}</p>
            <input
                ref={ref}
                type="file"
                accept=".xlsx,.xls,.pdf"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                onClick={(e) => { e.target.value = "" }}
            />
            <div
                className="relative flex items-center justify-center h-24 rounded-lg border bg-muted overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => !file && ref.current?.click()}
            >
                {file ? (
                    <>
                        <div className="flex flex-col items-center gap-1 px-3 text-center">
                            <IconFile size={20} className="text-muted-foreground" />
                            <span className="text-xs font-medium line-clamp-2">{file.name}</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onFile(null) }}
                                className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                            >
                                <IconX size={14} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <IconUpload size={20} />
                        <span className="text-xs">{label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// Split an integer `total` across `weights` so the parts sum EXACTLY to round(total)
// (largest-remainder method). Used when distributing period totals across SKU records
// so the stored slices reconcile to the import totals with no rounding drift.
function allocateInt(total, weights) {
    const T = Math.round(total)
    const buckets = weights.length
    if (buckets === 0) return []
    const W = weights.reduce((s, w) => s + (w > 0 ? w : 0), 0)
    const raw = W > 0
        ? weights.map(w => (T * (w > 0 ? w : 0)) / W)
        : weights.map(() => T / buckets)
    const out = raw.map(v => Math.floor(v))
    let rem = T - out.reduce((s, v) => s + v, 0)
    const order = raw.map((v, i) => [i, v - Math.floor(v)]).sort((a, b) => b[1] - a[1])
    for (let k = 0; rem > 0 && k < order.length; k++) { out[order[k][0]]++; rem-- }
    return out
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({ t, year, setYear, monthIdx, setMonthIdx, incomeFile, setIncomeFile, orderFile, setOrderFile, locale, takenPeriods }) {
    const months = locale === 'id' ? MONTHS_ID : MONTHS_EN
    const isTaken = (i) => {
        const monthCode = String(i + 1).padStart(2, '0')
        return takenPeriods?.some(p => p.year === year && p.month === monthCode) ?? false
    }
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('shopeeImportPeriod')}</p>
                <div className="flex items-center gap-2">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={monthIdx !== null ? String(monthIdx) : ''}
                        onValueChange={(v) => setMonthIdx(parseInt(v))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('shopeeImportMonthPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => (
                                <SelectItem key={m} value={String(i)} disabled={isTaken(i)}>
                                    {m}{isTaken(i) ? ' ✓' : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('shopeeImportUploadTitle')}</p>
                <div className="grid grid-cols-2 gap-3">
                    <UploadZone
                        label={t('shopeeImportClickToUpload')}
                        hint={t('shopeeImportIncomeReport')}
                        file={incomeFile}
                        onFile={setIncomeFile}
                    />
                    <UploadZone
                        label={t('shopeeImportClickToUpload')}
                        hint={t('shopeeImportOrderReport')}
                        file={orderFile}
                        onFile={setOrderFile}
                    />
                </div>
                <p className="text-xs text-muted-foreground">{t('shopeeImportFileHint')}</p>
            </div>
        </div>
    )
}

// AuditTable, KpiCards, SectionHeader imported from PlComponents

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({ t, year, monthIdx, locale, data, skuMapping = {}, skuList = [] }) {
    const d = data
    const months = locale === 'id' ? MONTHS_ID : MONTHS_EN
    if (!d) return <p className="text-sm text-muted-foreground py-8 text-center">{t('shopeeImportParseError')}</p>

    const getMappedSkuCode = (shopeeProductName) => {
        const m = skuMapping?.[shopeeProductName]
        if (!m || m === 'skip') return null
        return m.sku_code ?? null
    }

    // Localized order status label (raw Shopee status → RETURNED / CANCELLED / MATCHED)
    const isRefundStatus = (s) => {
        const x = String(s ?? '').toLowerCase()
        return x.includes('pengembalian') || x.includes('dikembalikan') ||
            x.includes('kembali') || x.includes('refund') || x.includes('retur')
    }
    const orderStatusLabel = (r) => {
        if (!r.excluded) return t('shopeeImportStatusMatched')
        if (r.refunded || isRefundStatus(r.status)) return t('shopeeImportStatusReturned')
        return t('shopeeImportStatusCancelled')
    }

    const grossGmv = d.sales.reduce((s, p) => s + p.gross_gmv, 0)
    const feeTotal = d.channel_fees_total
    const settlement = d.settlement_report
    const isMatch = d.delta === 0

    // Proportional allocation of aggregate values + COGS lookup from mapped SKU.
    // Uses allocateInt with the same per-product GMV weights as handleImport so the
    // preview exactly matches what will be stored (no Math.round vs allocateInt drift).
    const enrichedSales = useMemo(() => {
        // Weights: mapped products keep their GMV; skipped products get 0 (excluded from pool).
        const gmvWeights = d.sales.map(p => {
            const mapping = skuMapping?.[p.sku]
            return (mapping && mapping !== 'skip') ? (p.gross_gmv || 0) : 0
        })
        const settle = d.settlement_report ?? d.settlement_calc ?? 0
        const allocDisc   = allocateInt(d.discount_total ?? 0,      gmvWeights)
        const allocFees   = allocateInt(d.channel_fees_total ?? 0,   gmvWeights)
        const allocShip   = allocateInt(d.net_shipping ?? 0,         gmvWeights)
        const allocSettle = allocateInt(settle,                       gmvWeights)

        return d.sales.map((p, idx) => {
            const mapping = skuMapping?.[p.sku]
            const mappedSku = (mapping && mapping !== 'skip')
                ? skuList.find(s => s.id === mapping.id)
                : null
            const cogsPerUnit = parseFloat(mappedSku?.cogs_per_unit) || 0
            const totalCogs = cogsPerUnit * (p.units_sold || 0)
            const alloc_settlement = allocSettle[idx]
            const contribution = cogsPerUnit > 0 ? (alloc_settlement - totalCogs) : null
            return {
                ...p,
                alloc_seller_discount: allocDisc[idx],
                alloc_channel_fees:    allocFees[idx],
                alloc_net_shipping:    allocShip[idx],
                alloc_settlement,
                cogs_per_unit: cogsPerUnit,
                total_cogs: totalCogs,
                contribution,
                cm_percent: (contribution != null && p.gross_gmv > 0)
                    ? (contribution / p.gross_gmv) * 100
                    : null,
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [d, skuList, skuMapping])

    // Prefer order_report_rows (has product names + qty from order report, enriched with financial data)
    const orderReportRows = d.order_report_rows ?? []
    const useOrderReport = orderReportRows.length > 0
    const orderRows = useOrderReport ? orderReportRows : (d.order_rows ?? [])
    const matchedRows = orderRows.filter(r => !r.excluded)
    // "Orders matched" = income report non-excluded rows (one per order×product line, includes duplicates
    // for multi-product orders). Income report is the source of financial data, so this is the correct count.
    // Order report rows (479) represent unique orders; income report rows (1807) represent transaction lines.
    // When order report is present, count its non-excluded rows (one per product per order = 1807).
    // Income report has one row per ORDER (479), so use order report count when available.
    const matchedCount = useOrderReport ? matchedRows.length : (d.matched_orders || matchedRows.length)

    return (
        <div className="space-y-3">
            {/* Header line */}
            <p className="text-xs text-muted-foreground">
                {t('shopeeImportPeriod')}: <span className="font-medium text-foreground">{months[monthIdx]} {year}</span>
                {' · '}{t('shopeeImportChannel')}: <span className="font-medium text-foreground">{d.channel}</span>
                {' · '}<span className="text-green-700 font-medium">✓ {t('shopeeImportMatched', { count: matchedCount })}</span>
                {(d.excluded_orders ?? 0) > 0 && (
                    <span className="text-muted-foreground ml-1">· {d.excluded_orders} {t('shopeeImportExcluded')}</span>
                )}
            </p>

            {/* Contribution = settlement − COGS (from Per SKU tab enrichedSales) */}
            {(() => {
                const totalCogs = enrichedSales.reduce((s, p) => s + (p.total_cogs ?? 0), 0)
                const hasAnyCogs = enrichedSales.some(p => (p.cogs_per_unit ?? 0) > 0)
                // Products with no COGS set (cogsPerUnit=0) contribute their full settlement
                // This matches P/L detail where COGS=0 → contribution = settlement
                const totalContribution = enrichedSales.reduce((s, p) => s + (p.contribution ?? p.settlement ?? 0), 0)
                const contribCls = totalContribution >= 0 ? 'text-green-700' : 'text-red-600'
                const contribSubtitle = hasAnyCogs
                    ? `${t('shopeeImportColCogs')} ${fmt(totalCogs)}`
                    : t('shopeeImportContributionNote')

                const refundGmv = d.refund_gmv ?? 0
                const netGmv = d.net_gmv ?? (grossGmv - refundGmv)
                const refundRate = grossGmv > 0 ? (refundGmv / grossGmv) * 100 : 0

                return (
                    <KpiCards cards={[
                        {
                            label: t('shopeeColGmv'), value: grossGmv, cls: 'text-blue-700',
                            extra: [
                                { label: `${t('shopeeImportGmvRefund')} (${refundRate.toFixed(1)}%)`, value: refundGmv, cls: 'text-amber-700' },
                                { label: t('shopeeImportGmvNet'), value: netGmv, cls: 'text-foreground' },
                            ]
                        },
                        {
                            label: t('shopeeImportFeesTotal'), value: feeTotal, cls: 'text-red-600',
                            subtitle: grossGmv > 0 ? `${((feeTotal / grossGmv) * 100).toFixed(1)}% GMV` : undefined
                        },
                        {
                            label: t('shopeeColSettlement'), value: settlement, cls: 'text-green-700',
                            subtitle: grossGmv > 0 ? `${((settlement / grossGmv) * 100).toFixed(1)}% GMV` : undefined
                        },
                        {
                            label: t('shopeeImportContribution'), value: totalContribution, cls: contribCls,
                            subtitle: contribSubtitle
                        },
                    ]} />
                )
            })()}

            {/* Tabs */}
            <Tabs defaultValue="preview">
                <TabsList className="mb-3">
                    <TabsTrigger value="preview">{t('shopeeImportTabPreview')}</TabsTrigger>
                    <TabsTrigger value="per-pesanan">{t('shopeeImportTabPerOrder')}</TabsTrigger>
                    <TabsTrigger value="per-sku">{t('shopeeImportTabPerSku')}</TabsTrigger>
                </TabsList>

                {/* ── Preview ── */}
                <TabsContent value="preview" className="mt-0 space-y-3">
                    {/* SKU / Sales table */}
                    <Section title={t('shopeeImportSectionRevenue')}>
                        <AuditTable noBorder rows={[
                            { label: t('shopeeImportRevenueGross'), value: grossGmv, cls: 'text-blue-700' },
                            { label: t('shopeeImportRevenuePlatformDisc'), value: d.platform_discount ?? 0, cls: 'text-muted-foreground', note: d.platform_discount ? undefined : t('shopeeImportOptional') },
                            { label: t('shopeeImportReturnsTotal'), value: d.refund_amount, cls: 'text-muted-foreground' },
                        ]} />
                    </Section>

                    <Section title={t('shopeeImportSectionDiscounts')}>
                        <AuditTable noBorder
                            rows={d.discounts.map(r => ({ label: t(r.tKey), value: r.value, cls: r.value > 0 ? 'text-amber-700' : 'text-muted-foreground' }))}
                            subtotal={{ label: t('shopeeImportDiscountTotal'), value: d.discount_total, cls: d.discount_total > 0 ? 'text-amber-700' : 'text-muted-foreground' }}
                        />
                    </Section>

                    <Section title={t('shopeeImportSectionFees')}>
                        <AuditTable noBorder
                            rows={d.channel_fees.map(f => ({ label: t(f.tKey), value: f.value, cls: f.value > 0 ? 'text-red-600' : 'text-muted-foreground' }))}
                            subtotal={{ label: t('shopeeImportFeesTotal'), value: feeTotal, cls: feeTotal > 0 ? 'text-red-600' : 'text-muted-foreground' }}
                        />
                    </Section>

                    <Section title={t('shopeeImportSectionShipping')}>
                        <AuditTable noBorder
                            rows={[
                                { label: t('shopeeImportShippingBuyer'), value: d.buyer_shipping_paid ?? 0, cls: 'text-muted-foreground', note: d.buyer_shipping_paid === 0 ? t('shopeeImportShippingFree') : undefined },
                                { label: t('shopeeImportShippingSubsidy'), value: d.shipping_subsidy, cls: 'text-blue-700' },
                                { label: t('shopeeImportShippingCarrier'), value: d.actual_shipping_cost, cls: 'text-red-600' },
                            ]}
                            subtotal={{ label: t('shopeeImportShippingNet'), value: d.net_shipping, cls: 'text-muted-foreground' }}
                        />
                    </Section>

                    <Section title={t('shopeeImportSectionSettlement')}>
                        <AuditTable noBorder
                            rows={[
                                { label: t('shopeeImportSettlementReport'), value: d.settlement_report, cls: 'text-blue-700' },
                                { label: t('shopeeImportSettlementFormula'), value: d.settlement_calc, cls: 'text-blue-700' },
                            ]}
                            subtotal={{ label: `${t('shopeeImportSettlementDiff')}${isMatch ? ' - ✓ ' + t('shopeeImportSettlementMatch') : ''}`, value: d.delta, cls: isMatch ? 'text-green-700' : 'text-red-600' }}
                        />
                    </Section>
                </TabsContent>

                {/* ── Per Pesanan ── */}
                <TabsContent value="per-pesanan" className="mt-0 space-y-2">
                    {useOrderReport && d.order_numbers_matched === false && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                            <span className="text-amber-600 text-base flex-shrink-0">⚠</span>
                            <p className="text-xs text-amber-800">
                                <strong>Order numbers don't match between files.</strong> Seller Discount, Channel Fees, and Settlement show <strong>-</strong> because the Income Report and Order Report use different order IDs. Make sure both files are exported from the same Shopee period.
                            </p>
                        </div>
                    )}
                    {orderRows.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">{t('shopeeImportParseError')}</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <Table className="min-w-[700px] [&_th]:text-[11px] [&_td]:text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('shopeeImportColOrderNo')}</TableHead>
                                        <TableHead>{t('shopeeImportColProduct')}</TableHead>
                                        <TableHead>{t('shopeeImportColStatus')}</TableHead>
                                        <TableHead className="text-right">{t('shopeeImportColQty')}</TableHead>
                                        <TableHead className="text-right">{t('shopeeImportColOriginalPrice')}</TableHead>
                                        <TableHead className="text-right">{t('shopeeImportColSellerDiscount')}</TableHead>
                                        <TableHead className="text-right">{t('shopeeImportSectionFees')}</TableHead>
                                        <TableHead className="text-right">{t('shopeeImportShippingNet')}</TableHead>
                                        <TableHead className="text-right">{t('shopeeImportColSettlement')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderRows.map((r, i) => {
                                        const excl = r.excluded
                                        const matched = r.income_matched !== false  // true unless explicitly false
                                        const orderNo = r.order_no ?? r.orderNo ?? '-'
                                        const product = r.product_name ?? '-'
                                        const qty = r.qty ?? r.units_sold ?? '-'
                                        const price = r.price ?? r.grossGmv ?? 0
                                        const discount = r.seller_discount ?? r.sellerDiscount
                                        const fees = r.fee_total ?? r.feeTotal
                                        const shipping = r.net_shipping ?? r.netShipping
                                        const settle = r.settlement
                                        const fmtOrDash = (v) => v != null ? fmt(v) : <span className="text-muted-foreground/40">-</span>
                                        return (
                                            <TableRow key={i} className={excl ? 'opacity-40' : ''}>
                                                <TableCell className="font-mono text-[11px]">{orderNo}</TableCell>
                                                <TableCell className="max-w-[160px] truncate">{product}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${excl ? 'bg-muted text-muted-foreground' : 'bg-green-50 text-green-700'}`}>
                                                        {orderStatusLabel(r)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">{qty}</TableCell>
                                                <TableCell className="text-right tabular-nums">{fmt(price)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{fmtOrDash(discount)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{fmtOrDash(fees)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{fmtOrDash(shipping)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{fmtOrDash(settle)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-xs text-muted-foreground">
                                            {t('shopeeImportTotalMatched', { count: matchedCount })}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums font-medium">{matchedRows.reduce((s, r) => s + (r.qty ?? r.units_sold ?? 0), 0)}</TableCell>
                                        <TableCell className={`text-right tabular-nums font-medium ${grossGmv >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(grossGmv)}</TableCell>
                                        <TableCell className={`text-right tabular-nums font-medium ${d.discount_total >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(d.discount_total)}</TableCell>
                                        <TableCell className={`text-right tabular-nums font-medium ${feeTotal >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(feeTotal)}</TableCell>
                                        <TableCell className={`text-right tabular-nums font-medium ${(d.net_shipping ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(d.net_shipping ?? 0)}</TableCell>
                                        <TableCell className={`text-right tabular-nums font-medium ${settlement >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(settlement)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2">
                        {t('shopeeImportPerOrderNote')}
                    </p>
                </TabsContent>

                {/* ── Per SKU ── */}
                <TabsContent value="per-sku" className="mt-0">
                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[920px] [&_th]:text-[11px] [&_td]:text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">SKU</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColUnitsSold')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColGrossGmv')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColRefund')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColSellerDiscount')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportSectionFees')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColNetShipping')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColSettlement')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColCogs')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColContribution')}</TableHead>
                                    <TableHead className="text-right">{t('shopeeImportColCmPercent')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrichedSales.map((s) => {
                                    const mappedCode = getMappedSkuCode(s.sku)
                                    return (
                                        <TableRow key={s.sku}>
                                            <TableCell className="w-[200px] max-w-[200px] whitespace-normal">
                                                <p className="font-medium leading-snug">{s.sku}</p>
                                                {mappedCode && <p className="text-[10px] text-primary font-medium mt-0.5">→ {mappedCode}</p>}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{s.units_sold}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmt(s.gross_gmv)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmt(s.refund_gmv ?? 0)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmt(s.alloc_seller_discount)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmt(s.alloc_channel_fees)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmt(s.alloc_net_shipping)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmt(s.alloc_settlement)}</TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {s.cogs_per_unit > 0 ? fmt(s.total_cogs) : <span className="text-muted-foreground/40">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {s.contribution != null ? fmt(s.contribution) : <span className="text-muted-foreground/40">-</span>}
                                            </TableCell>
                                            <TableCell className={`text-right tabular-nums ${s.cm_percent != null && s.cm_percent < 20 ? 'text-red-600' : ''}`}>
                                                {s.cm_percent != null ? `${s.cm_percent.toFixed(1)}%` : <span className="text-muted-foreground/40">-</span>}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="text-xs text-muted-foreground">{t('shopeeImportTotal')}</TableCell>
                                    <TableCell className="text-right tabular-nums font-medium">{enrichedSales.reduce((s, p) => s + (p.units_sold || 0), 0)}</TableCell>
                                    <TableCell className={`text-right tabular-nums font-medium ${grossGmv >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(grossGmv)}</TableCell>
                                    <TableCell className="text-right tabular-nums font-medium text-amber-700">{fmt(d.refund_gmv ?? 0)}</TableCell>
                                    <TableCell className={`text-right tabular-nums font-medium ${d.discount_total >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(d.discount_total)}</TableCell>
                                    <TableCell className={`text-right tabular-nums font-medium ${feeTotal >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(feeTotal)}</TableCell>
                                    <TableCell className={`text-right tabular-nums font-medium ${(d.net_shipping ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(d.net_shipping ?? 0)}</TableCell>
                                    <TableCell className={`text-right tabular-nums font-medium ${settlement >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(settlement)}</TableCell>
                                    {(() => {
                                        const totalCogs = enrichedSales.reduce((s, p) => s + p.total_cogs, 0)
                                        const hasCogs = enrichedSales.some(s => s.cogs_per_unit > 0)
                                        return (
                                            <TableCell className={`text-right tabular-nums font-medium ${hasCogs ? (totalCogs >= 0 ? 'text-green-700' : 'text-red-600') : ''}`}>
                                                {hasCogs ? fmt(totalCogs) : <span className="text-muted-foreground/40">-</span>}
                                            </TableCell>
                                        )
                                    })()}
                                    {(() => {
                                        const hasContrib = enrichedSales.some(s => s.contribution != null)
                                        const totalContrib = enrichedSales.reduce((s, p) => s + (p.contribution ?? p.settlement ?? 0), 0)
                                        return (
                                            <>
                                                <TableCell className={`text-right tabular-nums font-medium ${hasContrib ? (totalContrib >= 0 ? 'text-green-700' : 'text-red-600') : ''}`}>
                                                    {hasContrib ? fmt(totalContrib) : <span className="text-muted-foreground/40">-</span>}
                                                </TableCell>
                                                {/* CM% total intentionally omitted — not meaningful as an aggregate */}
                                                <TableCell />
                                            </>
                                        )
                                    })()}
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">{t('shopeeImportAllocNote')}</p>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function PlImportModal({ open, onOpenChange, onSkip, takenPeriods, onImported }) {
    const t = useTranslations('plpage')
    const locale = useLocale()
    const [step, setStep] = useState(1)
    const [year, setYear] = useState(String(new Date().getFullYear()))
    const [monthIdx, setMonthIdx] = useState(null)
    const [incomeFile, setIncomeFile] = useState(null)
    const [orderFile, setOrderFile] = useState(null)
    const [parsedData, setParsedData] = useState(null)
    const [isParsing, setIsParsing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [parseError, setParseError] = useState(null)
    const [skuList, setSkuList] = useState([])
    const [skuMapping, setSkuMapping] = useState({})
    const [isSkusLoading, setIsSkusLoading] = useState(false)

    function handleClose() {
        setStep(1)
        setMonthIdx(null)
        setIncomeFile(null)
        setOrderFile(null)
        setParsedData(null)
        setParseError(null)
        setSkuList([])
        setSkuMapping({})
        onOpenChange(false)
    }

    // Compute mapped items from parsedData + skuMapping
    const mappedItems = useMemo(() => {
        if (!parsedData) return []
        return (parsedData.sales ?? []).flatMap(sale => {
            const mapping = skuMapping?.[sale.sku]
            if (!mapping || mapping === 'skip') return []
            return [{
                productName: sale.sku,
                skuId: mapping.id,
                unitsSold: sale.units_sold ?? 0,
                avgPrice: sale.actual_selling_price ?? 0,
                grossGmv: sale.gross_gmv ?? 0,
                settlement: sale.settlement ?? 0,
            }]
        })
    }, [parsedData, skuMapping])

    async function handleNext() {
        setIsParsing(true)
        setParseError(null)
        try {
            const data = await parseShopeeReports(incomeFile, orderFile || null)
            setParsedData(data)

            // Load main SKU catalog and auto-match Shopee aliases
            setIsSkusLoading(true)
            services.sku.getSkus().then(res => {
                const list = res?.data?.data ?? res?.data ?? []
                setSkuList(list)
                const productNames = (data.sales ?? []).map(s => s.sku).filter(Boolean)
                const initial = {}
                for (const name of productNames) {
                    const normalized = name.toLowerCase().trim()
                    const match = list.find(s =>
                        s.channel_aliases?.shopee?.some(a => a.toLowerCase().trim() === normalized)
                    )
                    initial[name] = match ? { id: match.id, sku_code: match.sku_code } : null
                }
                setSkuMapping(initial)
                setIsSkusLoading(false)
            })

            setStep(2)
        } catch {
            setParseError(t('shopeeImportParseError'))
        } finally {
            setIsParsing(false)
        }
    }

    function handleSkip() {
        handleClose()
        onSkip?.()
    }

    async function handleImport() {
        if (!parsedData || mappedItems.length === 0) return
        const periodMonth = String(monthIdx + 1).padStart(2, '0')
        const periodYear = parseInt(year)
        const totalSettlement = mappedItems.reduce((s, i) => s + i.settlement, 0)

        setIsSaving(true)
        try {
            const getFee = (field) => (parsedData.channel_fees ?? []).find(f => f.field === field)?.value ?? 0
            const getDisc = (tKey) => (parsedData.discounts ?? []).find(x => x.tKey === tKey)?.value ?? 0

            // Group by skuId - pl_monthly_updates has unique(brand_id, sku_id, period).
            // Multiple Shopee products mapped to the same SKU must be merged into one record.
            const bySkuId = {}
            for (const item of mappedItems) {
                if (!bySkuId[item.skuId]) {
                    bySkuId[item.skuId] = {
                        skuId: item.skuId,
                        productNames: [],
                        unitsSold: 0,
                        grossGmv: 0,
                        settlement: 0,
                    }
                }
                const g = bySkuId[item.skuId]
                g.productNames.push(item.productName)
                g.unitsSold += item.unitsSold
                g.grossGmv += item.grossGmv
                g.settlement += item.settlement
            }

            const groups = Object.values(bySkuId)
            // Weight per record = its gross GMV share (same basis the Confirm modal uses
            // for per-SKU allocation). Largest-remainder so every column's slices sum
            // EXACTLY to the import total — no per-record rounding drift.
            const weights = groups.map(g => g.grossGmv)
            const alloc = {
                voucher:         allocateInt(getDisc('shopeeImportDiscountVoucher'),       weights),
                voucherCofund:   allocateInt(getDisc('shopeeImportDiscountVoucherCofund'), weights),
                coin:            allocateInt(getDisc('shopeeImportDiscountCoin'),          weights),
                coinCofund:      allocateInt(getDisc('shopeeImportDiscountCoinCofund'),    weights),
                discountTotal:   allocateInt(parsedData.discount_total ?? 0,               weights),
                platformVoucher: allocateInt(parsedData.platform_discount ?? 0,            weights),
                processingFee:   allocateInt(getFee('processing_fee'),       weights),
                commissionFee:   allocateInt(getFee('commission_fee'),       weights),
                serviceFee:      allocateInt(getFee('service_fee'),          weights),
                transactionFee:  allocateInt(getFee('transaction_fee'),      weights),
                campaignFee:     allocateInt(getFee('campaign_fee'),         weights),
                affiliateFee:    allocateInt(getFee('affiliate_commission'), weights),
                buyerShipping:   allocateInt(parsedData.buyer_shipping_paid  ?? 0, weights),
                shippingSubsidy: allocateInt(parsedData.shipping_subsidy     ?? 0, weights),
                actualShipping:  allocateInt(parsedData.actual_shipping_cost ?? 0, weights),
                refund:          allocateInt(parsedData.refund_amount        ?? 0, weights),
                settlement:      allocateInt(parsedData.settlement_report ?? totalSettlement, weights),
            }

            const matchedOrdersCount = (parsedData.order_report_rows?.length > 0
                ? (parsedData.order_report_rows ?? []).filter(r => !r.excluded).length
                : parsedData.matched_orders) ?? 0

            for (let idx = 0; idx < groups.length; idx++) {
                const g = groups[idx]

                const salesEntries = [{
                    units_sold: g.unitsSold || 1,
                    actual_selling_price: Math.round(g.grossGmv / Math.max(1, g.unitsSold)),
                    settlement_amount: alloc.settlement[idx],
                }]

                await services.pl.createMonthly({
                    sku_id: g.skuId,
                    period_month: periodMonth,
                    period_year: periodYear,
                    source: 'shopee',
                    product_names: g.productNames,
                    matched_orders: matchedOrdersCount,
                    excluded_orders: parsedData.excluded_orders ?? 0,
                    order_report_rows: parsedData.order_report_rows ?? [],
                    sales: salesEntries,
                    discounts: [{
                        voucher_amount:          alloc.voucher[idx],
                        voucher_cofund_amount:   alloc.voucherCofund[idx],
                        coin_amount:             alloc.coin[idx],
                        coin_cofund_amount:      alloc.coinCofund[idx],
                        discount_amount:         alloc.discountTotal[idx],
                        platform_voucher_amount: alloc.platformVoucher[idx],
                    }],
                    shippings: [{
                        // Stored separately so the P/L detail shows Buyer / Subsidy / Carrier like
                        // the import modal. Net shipping = buyer-paid (+) − courier cost (−) ≈ 0 (Bug #2).
                        buyer_shipping_paid:         alloc.buyerShipping[idx],
                        shipping_subsidy:            alloc.shippingSubsidy[idx],
                        actual_shipping_cost:        alloc.actualShipping[idx],
                        processing_fee:              alloc.processingFee[idx],
                        commission_fee_amount:       alloc.commissionFee[idx],
                        service_fee_amount:          alloc.serviceFee[idx],
                        transaction_fee_amount:      alloc.transactionFee[idx],
                        campaign_fee_amount:         alloc.campaignFee[idx],
                        affiliate_commission_amount: alloc.affiliateFee[idx],
                    }],
                    returns: [{
                        actual_refund_amount: alloc.refund[idx],
                    }],
                })
            }
            // Add Shopee product names to channel listings - batch by SKU so one call per SKU
            const newNamesBySkuId = {}
            for (const item of mappedItems) {
                if (!newNamesBySkuId[item.skuId]) newNamesBySkuId[item.skuId] = []
                if (!newNamesBySkuId[item.skuId].includes(item.productName)) {
                    newNamesBySkuId[item.skuId].push(item.productName)
                }
            }
            for (const [skuId, newNames] of Object.entries(newNamesBySkuId)) {
                const sku = skuList.find(s => s.id === skuId)
                if (!sku) continue
                const existing = sku.channel_aliases?.shopee ?? []
                const toAdd = newNames.filter(n => !existing.includes(n))
                if (toAdd.length > 0) {
                    services.sku.updateSku(skuId, {
                        channel_aliases: { shopee: [...existing, ...toAdd] }
                    }).catch(() => { })
                }
            }

            handleClose()
            onImported?.()
        } catch (e) {
            setParseError(e?.response?.data?.message ?? e?.message ?? t('saveFailed'))
        } finally {
            setIsSaving(false)
        }
    }

    const importProductNames = (parsedData?.sales ?? []).map(s => s.sku).filter(Boolean)

    const getMatchedSku = (productName) => {
        const mapping = skuMapping?.[productName]
        if (!mapping || mapping === 'skip') return null
        return skuList.find(s => s.id === mapping.id) ?? null
    }

    const stepTitles = [t('shopeeImportTitle'), t('skuMappingTitle'), t('shopeeImportConfirmTitle')]
    const stepDescs = [t('shopeeImportDesc1'), t('skuMappingSubtitle'), t('shopeeImportDesc2')]

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
            <DialogContent
                className="md:max-w-5xl h-[85vh] flex flex-col gap-0 p-0 overflow-hidden"
                preventClose
            >

                <DialogHeader className="px-5 pt-5 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{stepTitles[step - 1]}</DialogTitle>
                    <DialogDescription className="mt-1">{stepDescs[step - 1]}</DialogDescription>
                    <span className="absolute top-14 right-7 text-xs text-muted-foreground">
                        {t('shopeeImportStep')} {step} {t('shopeeImportOf')} 3
                    </span>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4">
                    {step === 1 && (
                        <Step1
                            t={t} locale={locale}
                            year={year} setYear={setYear}
                            monthIdx={monthIdx} setMonthIdx={setMonthIdx}
                            incomeFile={incomeFile} setIncomeFile={setIncomeFile}
                            orderFile={orderFile} setOrderFile={setOrderFile}
                            takenPeriods={takenPeriods}
                        />
                    )}

                    {step === 2 && (
                        <div className="space-y-2">
                            {importProductNames.map(productName => {
                                const mappedSku = getMatchedSku(productName)
                                const mappingValue = skuMapping?.[productName]
                                const isAutoMatched = mappedSku &&
                                    mappedSku.channel_aliases?.shopee?.some(
                                        a => a.toLowerCase().trim() === productName.toLowerCase().trim()
                                    )

                                return (
                                    <div key={productName}
                                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium line-clamp-2 break-words">{productName}</p>
                                            <p className="text-xs text-muted-foreground">{t('skuMappingFromImport')}</p>
                                        </div>
                                        <IconArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                            {mappedSku ? (
                                                <div className="flex items-center gap-3">
                                                    {isAutoMatched && (
                                                        <Badge variant="secondary" className="text-[10px] py-0 gap-0.5 h-4 flex-shrink-0">
                                                            <IconCheck size={9} />{t('skuMappingAutoMatched')}
                                                        </Badge>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <span className="block text-xs font-medium text-primary break-words">
                                                            {mappedSku.product_name || mappedSku.sku_code}
                                                        </span>
                                                        <span className="block text-xs text-muted-foreground">{mappedSku.sku_code}</span>
                                                    </div>
                                                    <button type="button"
                                                        onClick={() => setSkuMapping(prev => ({ ...prev, [productName]: null }))}
                                                        className="flex-shrink-0 text-muted-foreground hover:text-destructive text-sm leading-none">×</button>
                                                </div>
                                            ) : isSkusLoading ? (
                                                <Skeleton className="h-8 w-full" />
                                            ) : (
                                                <div className="flex gap-1.5">
                                                    <Select value=""
                                                        onValueChange={v => {
                                                            const selected = skuList.find(s => s.id === v)
                                                            setSkuMapping(prev => ({ ...prev, [productName]: selected ? { id: selected.id, sku_code: selected.sku_code } : null }))
                                                        }}>
                                                        <SelectTrigger className="h-8 text-xs flex-1">
                                                            <SelectValue placeholder={t('skuMappingSelectSku')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {skuList.map(s => (
                                                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                                                    {s.product_name || s.sku_code}
                                                                    <span className="text-muted-foreground ml-1">· {s.sku_code}</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {/* Skip removed - all products must be mapped */}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {step === 3 && (
                        <Step2 t={t} locale={locale} year={year} monthIdx={monthIdx} data={parsedData} skuMapping={skuMapping} skuList={skuList} />
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t flex-shrink-0">
                    {step === 1 && (
                        <>
                            <Button variant="outline" onClick={handleClose}>{t('shopeeImportCancel')}</Button>
                            {onSkip && (
                                <Button variant="ghost" onClick={handleSkip}>{t('shopeeImportSkip')}</Button>
                            )}
                            {parseError && (
                                <span className="text-xs text-red-600 mr-auto">{parseError}</span>
                            )}
                            <Button onClick={handleNext} disabled={!incomeFile || monthIdx === null || isParsing}>
                                {isParsing ? t('shopeeImportParsing') : t('shopeeImportNext')}
                            </Button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <Button variant="outline" onClick={() => setStep(1)}>{t('shopeeImportBack')}</Button>
                            <Button onClick={() => {
                                const unmapped = importProductNames.filter(n => skuMapping?.[n] == null)
                                if (unmapped.length > 0) return
                                setStep(3)
                            }}
                                disabled={importProductNames.some(n => skuMapping?.[n] == null)}>
                                {t('shopeeImportNext')}
                            </Button>
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <Button variant="outline" onClick={() => setStep(2)} disabled={isSaving}>{t('shopeeImportBack')}</Button>
                            {parseError && <span className="text-xs text-red-600 mr-auto">{parseError}</span>}
                            <Button onClick={handleImport} disabled={isSaving || mappedItems.length === 0}>
                                {isSaving ? t('shopeeImportParsing') : t('shopeeImportConfirm')}
                            </Button>
                        </>
                    )}
                </div>

            </DialogContent>
        </Dialog>
    )
}
