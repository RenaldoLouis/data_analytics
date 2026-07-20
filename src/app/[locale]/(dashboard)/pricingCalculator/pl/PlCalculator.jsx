'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import services from "@/services"
import { IconAdjustmentsHorizontal, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconReceiptTax } from "@tabler/icons-react"
import { useLocale, useTranslations } from "next-intl"
import { Fragment, useEffect, useState, useMemo } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts"
import { classifyOrderRow, cogsUnitsForRow, fmt, parentSku } from "./plLib"
import { evaluateSkuAlerts, sortAlertRows, thresholdsFromConfig, topSeverity } from "./plAlerts"
import { AuditTable, ClassificationBadge, ExpandToggle, FeeBreakdownDetail, KpiCards, ProfitWaterfall, Section, SectionHeader, ShopeeChip, SkuCell } from "./PlComponents"

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LABELS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const YEARS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 3 + i))
const ORDER_PAGE_SIZE = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

const n = (v) => Math.round(parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')) || 0)
const fmtInt = (v) => Math.round(v || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const toInt = (v) => v != null && v !== '' ? String(Math.round(parseFloat(v) || 0)) : ''

// Canonical SKU name (from skus table, not Shopee import name)
const canonicalName = (r) => r?.sku_name ?? r?.product_names?.[0] ?? r?.sku_code ?? 'SKU'

// Per-order fee components shown in the expandable breakdown.
const FEE_COMPONENT_KEYS = ['commission_fee', 'service_fee', 'processing_fee', 'transaction_fee', 'campaign_fee', 'affiliate_commission']

// Reconstruct a per-order fee breakdown for legacy imports that only stored `fee_total`
// (before the parser captured the component split). Splits fee_total across the SKU
// record's fee-component proportions; the largest component absorbs the rounding
// remainder so the parts sum EXACTLY to fee_total (keeps the "matches row" guarantee).
const reconstructFeeBreakdown = (feeTotal, comps) => {
    const sum = FEE_COMPONENT_KEYS.reduce((s, k) => s + (comps[k] || 0), 0)
    if (!(feeTotal > 0) || sum <= 0) return null
    const raw = FEE_COMPONENT_KEYS.map(k => feeTotal * (comps[k] || 0) / sum)
    const rounded = raw.map(v => Math.round(v))
    let maxIdx = 0
    raw.forEach((v, idx) => { if (v > raw[maxIdx]) maxIdx = idx })
    rounded[maxIdx] += feeTotal - rounded.reduce((a, b) => a + b, 0)
    return Object.fromEntries(FEE_COMPONENT_KEYS.map((k, idx) => [k, rounded[idx]]))
}

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
        seller_discount_amount: toInt(d.seller_discount_amount),
        voucher_cofund_amount: toInt(d.voucher_cofund_amount),
        coin_amount: toInt(d.coin_amount),
        coin_cofund_amount: toInt(d.coin_cofund_amount),
        actual_refund_amount: toInt(r.actual_refund_amount),
        platform_voucher_amount: toInt(d.platform_voucher_amount),
        shipping_subsidy: toInt(sh.shipping_subsidy),
        buyer_shipping_paid: toInt(sh.buyer_shipping_paid),
        actual_shipping_cost: toInt(sh.actual_shipping_cost),
        processing_fee: toInt(sh.processing_fee),
        commission_fee_amount: toInt(sh.commission_fee_amount),
        service_fee_amount: toInt(sh.service_fee_amount),
        transaction_fee_amount: toInt(sh.transaction_fee_amount),
        campaign_fee_amount: toInt(sh.campaign_fee_amount),
        affiliate_commission_amount: toInt(sh.affiliate_commission_amount),
        // July 2026 improvements - structural (Rp 0 until Aug 2026)
        ads_spend_amount: toInt(sh.ads_spend_amount),
        pph_final_amount: toInt(sh.pph_final_amount),
        affiliate_seller_amount: toInt(d.affiliate_seller_amount),
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

// ─── P1: Alert badge + panel ──────────────────────────────────────────────────

const SEVERITY_STYLE = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high:     'bg-orange-100 text-orange-700 border-orange-300',
    medium:   'bg-amber-100 text-amber-700 border-amber-300',
    low:      'bg-slate-100 text-slate-700 border-slate-300',
    info:     'bg-slate-100 text-slate-600 border-slate-300',
}
const ruleLabel = (t, rule) => t(`shopeeAlertRule${rule}`)

function AlertBadge({ t, severity, rule }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.info}`}>
            {ruleLabel(t, rule)}
        </span>
    )
}

// "Alerts & Insights" panel - flagged parent SKUs only, sorted by severity → |CM|.
function AlertsPanel({ t, rows, onDrill }) {
    if (!rows.length) {
        return (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5">
                <span className="text-green-600 flex-shrink-0">✓</span>
                <p className="text-xs text-green-800">{t('shopeeAlertNone')}</p>
            </div>
        )
    }
    return (
        <div className="rounded-md border overflow-hidden">
            <SectionHeader title={t('shopeeAlertTitle')} />
            <div className="divide-y">
                {rows.map((p) => {
                    const name = p.names.size ? Array.from(p.names)[0] : p.parent
                    return (
                        <button key={p.parent} type="button" onClick={() => onDrill?.(p.parent)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/40 transition-colors">
                            <p className="text-sm font-medium truncate min-w-0 flex-1">{name}
                                <span className="text-[11px] text-muted-foreground font-normal ml-1.5">{p.parent}</span>
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {p.flags.map(f => <AlertBadge key={f.rule} t={t} severity={f.severity} rule={f.rule} />)}
                            </div>
                            <div className="flex-shrink-0 text-[11px] tabular-nums text-muted-foreground whitespace-nowrap">
                                {p.cmPct != null ? `CM ${(p.cmPct * 100).toFixed(1)}%` : 'CM -'} · {t('shopeeAlertReturnRate')} {(p.returnRate * 100).toFixed(1)}%
                            </div>
                            <span className="flex-shrink-0 text-[11px] text-primary ml-4">{t('shopeeAlertDrill')} →</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Summary Tab ─────────────────────────────────────────────────────────────

function SummaryTab({ agg, alertRows, onDrill }) {
    const t = useTranslations('plpage')
    // Formula matches import modal: GMV - Seller Discount - Channel Fees + Net Shipping - Returns
    const calculated = agg.grossGmv - agg.totalDisc - agg.totalFees + agg.netShipping - agg.refund
    const delta = agg.settlement - calculated
    const isMatch = delta === 0

    const cl = (v, positive) => positive ? (v > 0 ? 'text-blue-700' : 'text-muted-foreground/60')
        : (v > 0 ? 'text-red-600' : 'text-muted-foreground/60')

    const waterfall = {
        grossGmv: agg.grossGmv, promo: agg.totalDisc, sellerFees: agg.totalFees,
        affiliate: agg.affiliateSeller, pph: agg.pphFinal, netShipping: agg.netShipping,
        refund: agg.refund, settlement: agg.settlement, cogs: agg.totalCogs,
        returLoss: agg.returLoss, ads: agg.adsSpend,
    }

    return (
        <div className="space-y-3">
            <AlertsPanel t={t} rows={alertRows ?? []} onDrill={onDrill} />
            <ProfitWaterfall t={t} data={waterfall} />
            <Section title={t('shopeeImportSectionRevenue')}>
                <AuditTable noBorder rows={[
                    { label: t('shopeeImportRevenueGross'), value: agg.grossGmv, cls: 'text-blue-700' },
                    { label: t('shopeeImportRevenuePlatformDisc'), value: agg.platformVoucher, cls: 'text-muted-foreground/60', note: agg.platformVoucher ? undefined : t('shopeeImportOptional') },
                    { label: t('shopeeImportReturnsTotal'), value: agg.refund, cls: 'text-muted-foreground/60' },
                ]} />
            </Section>
            <Section title={t('shopeeImportSectionDiscounts')}>
                <AuditTable noBorder
                    rows={[
                        { label: t('shopeeImportDiscountVoucher'), value: agg.voucher, cls: cl(agg.voucher, false) },
                        { label: t('shopeeImportDiscountSeller'), value: agg.sellerDiscount, cls: cl(agg.sellerDiscount, false) },
                        { label: t('shopeeImportDiscountVoucherCofund'), value: agg.voucherCof, cls: cl(agg.voucherCof, false) },
                        { label: t('shopeeImportDiscountCoin'), value: agg.coin, cls: cl(agg.coin, false) },
                        { label: t('shopeeImportDiscountCoinCofund'), value: agg.coinCof, cls: cl(agg.coinCof, false) },
                    ]}
                    subtotal={{ label: t('shopeeImportDiscountTotal'), value: agg.totalDisc, cls: 'text-muted-foreground/60' }}
                />
            </Section>
            <Section title={t('shopeeImportSectionFees')}>
                <AuditTable noBorder
                    rows={[
                        { label: t('shopeeImportFeeCommission'), value: agg.commFee, cls: cl(agg.commFee, false) },
                        { label: t('shopeeImportFeeService'), value: agg.svcFee, cls: cl(agg.svcFee, false) },
                        { label: t('shopeeImportFeeProcessing'), value: agg.procFee, cls: cl(agg.procFee, false) },
                        { label: t('shopeeImportFeeTransaction'), value: agg.txFee, cls: cl(agg.txFee, false) },
                        { label: t('shopeeImportFeeCampaign'), value: agg.campFee, cls: cl(agg.campFee, false) },
                        { label: t('shopeeImportFeeAffiliate'), value: agg.affFee, cls: cl(agg.affFee, false) },
                    ]}
                    subtotal={{ label: t('shopeeImportFeesTotal'), value: agg.totalFees, cls: agg.totalFees > 0 ? 'text-red-600' : 'text-muted-foreground/60' }}
                />
            </Section>
            <Section title={t('shopeeImportSectionShipping')}>
                <AuditTable noBorder
                    rows={[
                        { label: t('shopeeImportShippingBuyer'), value: agg.buyerShipping, cls: 'text-muted-foreground/60', note: agg.buyerShipping === 0 ? t('shopeeImportShippingFree') : undefined },
                        { label: t('shopeeImportShippingSubsidy'), value: agg.subsidy, cls: cl(agg.subsidy, true) },
                        { label: t('shopeeImportShippingCarrier'), value: agg.shipCost, cls: cl(agg.shipCost, false) },
                    ]}
                    subtotal={{ label: t('shopeeImportShippingNet'), value: agg.netShipping, cls: 'text-muted-foreground/60' }}
                />
            </Section>
            <Section title={t('shopeeImportSectionSettlement')}>
                <AuditTable noBorder
                    rows={[
                        { label: t('shopeeImportSettlementReport'), value: agg.settlement, cls: 'text-blue-700' },
                        { label: t('shopeeImportSettlementFormula'), value: calculated, cls: 'text-blue-700' },
                    ]}
                    subtotal={{ label: `${t('shopeeImportSettlementDiff')}${isMatch ? ' - ✓ ' + t('shopeeImportSettlementMatch') : ''}`, value: delta, cls: isMatch ? 'text-green-700' : 'text-red-600' }}
                />
            </Section>
        </div>
    )
}

// ─── P2: Monthly Trend tab ────────────────────────────────────────────────────

function TrendTab({ currentPeriod, locale }) {
    const t = useTranslations('plpage')
    const MONTHS = locale === 'id' ? MONTH_LABELS_ID : MONTH_LABELS_EN
    const [series, setSeries] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let alive = true
        setLoading(true)
        services.pl.getTrend()
            .then(res => { if (alive) setSeries((res?.data?.data ?? res?.data ?? []).filter(Boolean)) })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [])

    if (loading) return <Skeleton className="w-full h-64 rounded-lg" />

    const periodLabel = (p) => `${MONTHS[parseInt(p.period_month) - 1] ?? p.period_month} ${String(p.period_year).slice(-2)}`
    const isCurrent = (p) => currentPeriod
        && String(p.period_month).padStart(2, '0') === String(currentPeriod.month).padStart(2, '0')
        && String(p.period_year) === String(currentPeriod.year)

    // MoM deltas vs the previous period in the series.
    const rows = series.map((p, i) => {
        const prev = series[i - 1]
        return {
            ...p,
            momCm: prev ? p.cm - prev.cm : null,
            momCmPct: prev && p.cmPct != null && prev.cmPct != null ? (p.cmPct - prev.cmPct) * 100 : null, // percentage points
        }
    })
    const chartData = rows.map(p => ({ name: periodLabel(p), settlement: Math.round(p.settlement), cm: Math.round(p.cm) }))
    const jt = (v) => `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 0 })}jt`

    const TH = ({ children, right }) => <TableHead className={`py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${right ? 'text-right' : ''}`}>{children}</TableHead>
    const momCls = (v) => v == null ? 'text-muted-foreground/40' : v > 0 ? 'text-green-700' : v < 0 ? 'text-red-600' : 'text-muted-foreground'
    const momTxt = (v, suffix) => v == null ? '-' : `${v > 0 ? '+' : ''}${suffix === 'pct' ? v.toFixed(1) + '%' : fmt(v)}`

    return (
        <div className="space-y-3">
            {series.length >= 2 && (
                <Section title={t('shopeeTrendTitle')}>
                    <div className="p-3">
                        <div className="flex items-center gap-4 mb-2 text-[11px]">
                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-blue-700" />{t('shopeeTrendSettlement')}</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-green-700" />{t('shopeeTrendCm')}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData} margin={{ top: 6, right: 12, left: 4, bottom: 6 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickMargin={10} padding={{ left: 10, right: 10 }} />
                                <YAxis tickFormatter={jt} tick={{ fontSize: 10 }} width={40} axisLine={false} tickLine={false} tickMargin={6} />
                                <RTooltip formatter={(v, n) => [fmt(v), n === 'settlement' ? t('shopeeTrendSettlement') : t('shopeeTrendCm')]} labelClassName="text-xs" contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                <Line type="monotone" dataKey="settlement" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                <Line type="monotone" dataKey="cm" stroke="#15803d" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Section>
            )}

            <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-[760px] [&_tr:last-child_td]:border-b-0">
                    <TableHeader>
                        <TableRow className="bg-muted/60 hover:bg-muted/60">
                            <TH>{t('shopeeTrendColPeriod')}</TH>
                            <TH right>{t('shopeeColGmv')}</TH>
                            <TH right>{t('shopeeTrendColNetGmv')}</TH>
                            <TH right>{t('shopeeColSettlement')}</TH>
                            <TH right>{t('shopeeImportContribution')}</TH>
                            <TH right>{t('shopeeImportColCmPercent')}</TH>
                            <TH right>{t('shopeeTrendColOrders')}</TH>
                            <TH right>Δ {t('shopeeTrendMoM')} CM</TH>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((p) => (
                            <TableRow key={p.period} className={isCurrent(p) ? 'bg-primary/5 hover:bg-primary/5' : ''}>
                                <TableCell className="py-1.5 px-3 text-sm font-medium">
                                    {periodLabel(p)}
                                    {isCurrent(p) && <span className="ml-1.5 text-[10px] text-primary">({t('shopeeTrendCurrent')})</span>}
                                </TableCell>
                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums text-blue-700">{fmt(p.grossGmv)}</TableCell>
                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(p.netGmv)}</TableCell>
                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums text-blue-700">{fmt(p.settlement)}</TableCell>
                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums text-green-700">{fmt(p.cm)}</TableCell>
                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{p.cmPct != null ? `${(p.cmPct * 100).toFixed(1)}%` : '-'}</TableCell>
                                <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{p.ordersSettled}</TableCell>
                                <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums ${momCls(p.momCmPct)}`}>{momTxt(p.momCmPct, 'pct')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {series.length < 2 && (
                <p className="text-[11px] text-muted-foreground px-1">{t('shopeeTrendNone')}</p>
            )}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── P3: PPh tax-config (per account) ─────────────────────────────────────────

const DEFAULT_TAX = { tipe_wp: 'OP', is_pkp: false, harga_termasuk_ppn: false, sudah_lapor_surat: false }

// Temporarily deactivated (July 2026): PPh Final 0,5% + Tax Settings are hidden until
// the real Aug 2026 data lands. Flip to true to re-show the Tax button and PPh step
// (backend also gated by PPH_ENABLED in services/pl.js).
const TAX_ENABLED = false

// A labelled switch row used inside the tax dialog.
function TaxToggle({ label, hint, checked, onChange }) {
    return (
        <div className="flex items-start justify-between gap-3 py-1.5">
            <div className="space-y-0.5">
                <p className="text-sm font-medium leading-none">{label}</p>
                {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    )
}

function TaxSettingsDialog({ open, onOpenChange, config, onSaved }) {
    const t = useTranslations('plpage')
    const [form, setForm] = useState(config ?? DEFAULT_TAX)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setForm({
            tipe_wp: config?.tipe_wp ?? 'OP',
            is_pkp: !!config?.is_pkp,
            harga_termasuk_ppn: !!config?.harga_termasuk_ppn,
            sudah_lapor_surat: !!config?.sudah_lapor_surat,
        })
    }, [config, open])

    const set = (patch) => setForm(prev => ({ ...prev, ...patch }))

    const save = async () => {
        setSaving(true)
        const res = await services.pl.updateTaxConfig(form)
        setSaving(false)
        if (!res?.error) {
            onSaved?.(res?.data?.data ?? form)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('shopeeTaxTitle')}</DialogTitle>
                    <DialogDescription>{t('shopeeTaxSubtitle')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{t('shopeeTaxWpType')}</Label>
                        <RadioGroup
                            value={form.tipe_wp}
                            onValueChange={(v) => set({ tipe_wp: v })}
                            className="grid grid-cols-1 gap-2"
                        >
                            {[
                                { v: 'OP', label: t('shopeeTaxWpOp'), hint: t('shopeeTaxWpOpHint') },
                                { v: 'BADAN', label: t('shopeeTaxWpBadan'), hint: t('shopeeTaxWpBadanHint') },
                            ].map(o => (
                                <label
                                    key={o.v}
                                    htmlFor={`wp-${o.v}`}
                                    className={`flex items-start gap-3 rounded-md border p-2.5 cursor-pointer transition-colors ${form.tipe_wp === o.v ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/40'}`}
                                >
                                    <RadioGroupItem id={`wp-${o.v}`} value={o.v} className="mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium leading-none">{o.label}</p>
                                        <p className="text-xs text-muted-foreground">{o.hint}</p>
                                    </div>
                                </label>
                            ))}
                        </RadioGroup>
                    </div>

                    <Separator />

                    <TaxToggle
                        label={t('shopeeTaxPkp')}
                        checked={form.is_pkp}
                        onChange={(v) => set({ is_pkp: v, harga_termasuk_ppn: v ? form.harga_termasuk_ppn : false })}
                    />
                    {form.is_pkp ? (
                        <TaxToggle
                            label={t('shopeeTaxPriceInclPpn')}
                            hint={t('shopeeTaxPriceInclPpnHint')}
                            checked={form.harga_termasuk_ppn}
                            onChange={(v) => set({ harga_termasuk_ppn: v })}
                        />
                    ) : null}
                    {form.tipe_wp === 'OP' ? (
                        <TaxToggle
                            label={t('shopeeTaxDeclared')}
                            hint={t('shopeeTaxDeclaredHint')}
                            checked={form.sudah_lapor_surat}
                            onChange={(v) => set({ sudah_lapor_surat: v })}
                        />
                    ) : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        {t('shopeeTaxCancel')}
                    </Button>
                    <Button onClick={save} disabled={saving}>
                        {saving ? t('shopeeTaxSaving') : t('shopeeTaxSave')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── P1: SKU-alert threshold config (per account) ─────────────────────────────

const DEFAULT_ALERT = { low_margin_pct: 0.10, high_return_rate: 0.05 }

// A labelled whole-percent input row for the thresholds dialog.
function ThresholdField({ label, hint, value, onChange }) {
    return (
        <div className="flex items-start justify-between gap-3 py-1.5">
            <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-sm font-medium leading-none">{label}</p>
                {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
            </div>
            <div className="relative w-24 flex-shrink-0">
                <Input
                    type="number" inputMode="decimal" min={0} max={100} step={0.5}
                    value={value} onChange={(e) => onChange(e.target.value)}
                    className="pr-6 text-right tabular-nums"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
        </div>
    )
}

function AlertThresholdsDialog({ open, onOpenChange, config, onSaved }) {
    const t = useTranslations('plpage')
    // Edit in whole-percent units; persist as fractions.
    const toPct = (frac, d) => String(+(Number(frac ?? d) * 100).toFixed(2))
    const [form, setForm] = useState({ lowMargin: '10', highReturn: '5' })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setForm({
            lowMargin:  toPct(config?.low_margin_pct,   DEFAULT_ALERT.low_margin_pct),
            highReturn: toPct(config?.high_return_rate, DEFAULT_ALERT.high_return_rate),
        })
    }, [config, open])

    const set = (patch) => setForm(prev => ({ ...prev, ...patch }))
    const frac = (v, d) => {
        const n = parseFloat(v)
        return Number.isFinite(n) ? Math.min(Math.max(n / 100, 0), 1) : d
    }

    const save = async () => {
        const payload = {
            low_margin_pct:   frac(form.lowMargin,  DEFAULT_ALERT.low_margin_pct),
            high_return_rate: frac(form.highReturn, DEFAULT_ALERT.high_return_rate),
        }
        // Schema requires > 0; fall back to the default for any empty/zero field.
        for (const k of Object.keys(payload)) if (!(payload[k] > 0)) payload[k] = DEFAULT_ALERT[k]
        setSaving(true)
        const res = await services.pl.updateAlertConfig(payload)
        setSaving(false)
        if (!res?.error) { onSaved?.(res?.data?.data ?? payload); onOpenChange(false) }
    }

    const resetDefaults = () => setForm({ lowMargin: '10', highReturn: '5' })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="mb-3">
                    <DialogTitle>{t('shopeeAlertCfgTitle')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-1">
                    <ThresholdField
                        label={t('shopeeAlertCfgLowMargin')} hint={t('shopeeAlertCfgLowMarginHint')}
                        value={form.lowMargin} onChange={(v) => set({ lowMargin: v })}
                    />
                    <Separator />
                    <ThresholdField
                        label={t('shopeeAlertCfgHighReturn')} hint={t('shopeeAlertCfgHighReturnHint')}
                        value={form.highReturn} onChange={(v) => set({ highReturn: v })}
                    />
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={resetDefaults} disabled={saving} className="text-xs">
                        {t('shopeeAlertCfgReset')}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                            {t('shopeeTaxCancel')}
                        </Button>
                        <Button onClick={save} disabled={saving}>
                            {saving ? t('shopeeTaxSaving') : t('shopeeTaxSave')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PlCalculator({ editId, allIds, onBack }) {
    const locale = useLocale()
    const t = useTranslations('plpage')
    const MONTH_LABELS = locale === 'id' ? MONTH_LABELS_ID : MONTH_LABELS_EN
    const [records, setRecords] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [forms, setForms] = useState({})
    const [taxConfig, setTaxConfig] = useState(null)      // PPh regime (per account)
    const [showTaxSettings, setShowTaxSettings] = useState(false)
    const [alertConfig, setAlertConfig] = useState(null)  // SKU-alert thresholds (per account)
    const [showAlertSettings, setShowAlertSettings] = useState(false)
    const [orderPage, setOrderPage] = useState(0)
    const [tab, setTab] = useState('summary')          // controlled tabs (for alert drill-down)
    const [skuFilter, setSkuFilter] = useState(null)   // { type:'parent'|'rule', value } | null
    // Expand/collapse state for the per-order & per-SKU channel-fee detail rows.
    const [expandedOrders, setExpandedOrders] = useState(() => new Set())
    const [expandedSkus, setExpandedSkus] = useState(() => new Set())
    const toggleKey = (setter) => (key) => setter(prev => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key); else next.add(key)
        return next
    })
    const toggleOrder = toggleKey(setExpandedOrders)
    const toggleSku = toggleKey(setExpandedSkus)

    // Drill-down: clicking an alert jumps to the SKU tab filtered to that parent.
    const drillToParent = (parent) => { setSkuFilter({ type: 'parent', value: parent }); setTab('sku') }
    const chipCls = (on) => `px-2 py-0.5 rounded-full text-[11px] border cursor-pointer transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-input hover:bg-muted/50'}`

    // Improvement A: localized label for an order's classification bucket.
    const classLabel = (cls) => ({
        SETTLED:      t('shopeeClassSettled'),
        PENDING:      t('shopeeClassPending'),
        CROSS_PERIOD: t('shopeeClassCrossPeriod'),
        ANOMALY:      t('shopeeClassAnomaly'),
        CANCELLED:    t('shopeeImportStatusCancelled'),
    }[cls] ?? cls)

    // ── Load ──────────────────────────────────────────────────────────────────
    // Single batched request for all of the period's records (was one per record).
    // The backend computes PPh Final live from the tax config, so re-running this
    // after saving the config refreshes the waterfall's PPh figure.
    const loadRecords = () => {
        const ids = allIds?.length ? allIds : [editId]
        setIsLoading(true)
        return services.pl.getMonthlyByIds(ids)
            .then(res => {
                const loaded = (res?.data?.data ?? res?.data ?? []).filter(Boolean)
                setRecords(loaded)
                const init = {}
                loaded.forEach(rec => { init[rec.id] = buildFormFromRecord(rec) })
                setForms(init)
            })
            .finally(() => setIsLoading(false))
    }

    useEffect(() => {
        loadRecords()
        if (TAX_ENABLED) services.pl.getTaxConfig().then(res => {
            setTaxConfig(res?.data?.data ?? res?.data ?? DEFAULT_TAX)
        })
        services.pl.getAlertConfig().then(res => {
            setAlertConfig(res?.data?.data ?? res?.data ?? DEFAULT_ALERT)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    // P1: configured alert thresholds (defaults until the account config loads).
    const alertThresholds = useMemo(() => thresholdsFromConfig(alertConfig), [alertConfig])

    const active = records[0]

    // ── Aggregate across ALL records (period-level) ───────────────────────────
    const agg = useMemo(() => {
        const sum = (fn) => records.reduce((s, rec) => {
            const f = forms[rec.id] ?? buildFormFromRecord(rec)
            return s + fn(f, rec)
        }, 0)
        // Prefer summing r.gmv from order_report_rows (exact, avoids avg-price rounding drift).
        // All records for the same import period share identical order_report_rows.
        const firstOrderRows = records[0]?.order_report_rows ?? []
        const grossGmv = firstOrderRows.length > 0
            ? firstOrderRows
                // SETTLED only (Improvement A) - excludes PENDING/CROSS_PERIOD from P&L.
                .filter(r => (r.classification ?? classifyOrderRow(r)) === 'SETTLED')
                .reduce((s, r) => s + (r.gmv || 0), 0)
            : sum((f) => n(f.units_sold) * n(f.actual_selling_price))
        const settlement = sum((f) => n(f.settlement_amount))
        const voucher = sum((f) => n(f.voucher_amount))
        const sellerDiscount = sum((f) => n(f.seller_discount_amount))
        const voucherCof = sum((f) => n(f.voucher_cofund_amount))
        const coin = sum((f) => n(f.coin_amount))
        const coinCof = sum((f) => n(f.coin_cofund_amount))
        const totalDisc = voucher + sellerDiscount + voucherCof + coin + coinCof
        const refund = sum((f) => n(f.actual_refund_amount))
        const platformVoucher = sum((f) => n(f.platform_voucher_amount))
        const subsidy = sum((f) => n(f.shipping_subsidy))
        const buyerShipping = sum((f) => n(f.buyer_shipping_paid))
        const shipCost = sum((f) => n(f.actual_shipping_cost))
        // Net shipping = buyer-paid (+) - courier cost (-) ≈ 0 (Bug #2)
        const netShipping = buyerShipping - shipCost
        const commFee = sum((f) => n(f.commission_fee_amount))
        const svcFee = sum((f) => n(f.service_fee_amount))
        const procFee = sum((f) => n(f.processing_fee))
        const txFee = sum((f) => n(f.transaction_fee_amount))
        const campFee = sum((f) => n(f.campaign_fee_amount))
        const affFee = sum((f) => n(f.affiliate_commission_amount))
        const totalFees = commFee + svcFee + procFee + txFee + campFee + affFee
        // COGS (Bug #1 + Improvement B): core COGS is charged only on completed
        // (settled, non-refunded) units. Refunded units are restockable by default
        // (no COGS); non-restockable refunds surface as a separate "Return Loss".
        // Falls back to stored units_sold (completed-only) when no order report exists.
        let totalCogs = 0, returLoss = 0
        for (const rec of records) {
            const cogsUnit = parseFloat(rec.cogs_per_unit) || 0
            const rows = rec.order_report_rows ?? []
            const names = Array.isArray(rec.product_names) ? rec.product_names : []
            if (rows.length > 0 && names.length > 0) {
                for (const r of rows) {
                    if (!names.includes(r.product_name)) continue
                    if ((r.classification ?? classifyOrderRow(r)) !== 'SETTLED') continue
                    const { core, loss } = cogsUnitsForRow(r)
                    totalCogs += cogsUnit * core
                    returLoss += cogsUnit * loss
                }
            } else {
                const f = forms[rec.id] ?? buildFormFromRecord(rec)
                totalCogs += cogsUnit * n(f.units_sold)
            }
        }
        // July 2026 improvements - structural fields (Rp 0 until Aug 2026)
        const adsSpend = sum((f) => n(f.ads_spend_amount))
        const pphFinal = sum((f) => n(f.pph_final_amount))
        const affiliateSeller = sum((f) => n(f.affiliate_seller_amount))
        return {
            grossGmv, settlement, voucher, sellerDiscount, voucherCof, coin, coinCof, totalDisc,
            refund, platformVoucher, subsidy, buyerShipping, shipCost, netShipping,
            commFee, svcFee, procFee, txFee, campFee, affFee, totalFees,
            totalCogs, returLoss,
            adsSpend, pphFinal, affiliateSeller,
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
    const skuRows = useMemo(() => {
        // Per-variant (WYSIWYG) alert flags: each row is evaluated against its OWN
        // metrics/CM% (not the parent aggregate) so the SKU-tab badge lines up with the
        // number shown in that row. The Summary panel stays parent-level (see parentRows).
        const rowFlags = (row) => {
            const soldU = (row.units || 0) + (row.refundedUnits || 0)
            const flags = evaluateSkuAlerts({
                settlement: row.settlement,
                cm: row.contribution,
                cmPct: row.cmPercent != null ? row.cmPercent / 100 : null,
                returnRate: soldU > 0 ? (row.refundedUnits || 0) / soldU : 0,
                missingCogs: (row.units || 0) > 0 && !(row.cogsUnit > 0),
            }, alertThresholds)
            return { ...row, flags, topSeverity: topSeverity(flags) }
        }
        return records.flatMap(rec => {
            const f = forms[rec.id] ?? buildFormFromRecord(rec)
            const cogsUnit = parseFloat(rec.cogs_per_unit) || 0
            const reportRows = rec.order_report_rows ?? []
            const productNames = Array.isArray(rec.product_names) ? rec.product_names : []

            // When order report rows are available, break down per Shopee product
            if (reportRows.length > 0 && productNames.length > 0) {
                const recFees = n(f.commission_fee_amount) + n(f.service_fee_amount) +
                    n(f.processing_fee) + n(f.transaction_fee_amount) +
                    n(f.campaign_fee_amount) + n(f.affiliate_commission_amount)
                const recDisc = n(f.voucher_amount) + n(f.seller_discount_amount) + n(f.voucher_cofund_amount) + n(f.coin_amount) + n(f.coin_cofund_amount)
                const recNetShipping = n(f.buyer_shipping_paid) - n(f.actual_shipping_cost)

                // Bug 1: actual per-order settlement. The Income join puts the same order
                // settlement (signed - negative for refunds) on every line of that order;
                // build order → { revenue, settlement } from ALL settled lines so we can
                // split it across SKUs by revenue share instead of a flat GMV rate.
                const orderAgg = {}
                for (const r of reportRows) {
                    if ((r.classification ?? classifyOrderRow(r)) !== 'SETTLED') continue
                    const key = (r.order_no ?? '').trim()
                    if (!key) continue
                    if (!orderAgg[key]) orderAgg[key] = { totalGmv: 0, settlement: 0 }
                    orderAgg[key].totalGmv += r.gmv || 0
                    orderAgg[key].settlement = r.settlement ?? 0   // same value on every line
                }

                // Aggregate per product for this SKU's products.
                //  - settlement: actual per-order value allocated by revenue (Bug 1, signed)
                //  - cogsUnits: qty - returned_qty across ALL settled lines (Bug 2 - refund
                //    goods not returned by the buyer still cost COGS)
                const productMap = {}
                for (const r of reportRows.filter(r => productNames.includes(r.product_name))) {
                    // SETTLED only (Improvement A) - skip cancelled, pending & cross-period.
                    if ((r.classification ?? classifyOrderRow(r)) !== 'SETTLED') continue
                    if (!productMap[r.product_name]) productMap[r.product_name] = { units: 0, gmv: 0, refund: 0, refundedUnits: 0, settlement: 0, cogsUnits: 0, lossUnits: 0 }
                    const pm = productMap[r.product_name]
                    pm.gmv += r.gmv || 0
                    // Bug #1 + Improvement B: COGS on completed units; non-restockable
                    // refunds accrue as Return Loss instead of core COGS.
                    const { core, loss } = cogsUnitsForRow(r)
                    pm.cogsUnits += core
                    pm.lossUnits += loss
                    const oa = orderAgg[(r.order_no ?? '').trim()]
                    if (oa && oa.totalGmv > 0) pm.settlement += oa.settlement * ((r.gmv || 0) / oa.totalGmv)   // Bug 1
                    if (r.refunded) { pm.refund += r.gmv || 0; pm.refundedUnits += r.qty || 0 }   // refunded value + units (P1 return rate)
                    else            pm.units  += r.qty || 0     // completed → QTY display
                }

                const totalProductGmv = Object.values(productMap).reduce((s, p) => s + p.gmv, 0)

                return Object.entries(productMap).map(([productName, p]) => {
                    const share = totalProductGmv > 0 ? p.gmv / totalProductGmv : 0
                    const settlement = Math.round(p.settlement)        // Bug 1: actual per-order
                    // Per-component fee allocation by revenue share; channelFees is the sum so
                    // the row total always matches the expandable breakdown subtotal.
                    const feeBreakdown = {
                        commission_fee:       Math.round(n(f.commission_fee_amount) * share),
                        service_fee:          Math.round(n(f.service_fee_amount) * share),
                        processing_fee:       Math.round(n(f.processing_fee) * share),
                        transaction_fee:      Math.round(n(f.transaction_fee_amount) * share),
                        campaign_fee:         Math.round(n(f.campaign_fee_amount) * share),
                        affiliate_commission: Math.round(n(f.affiliate_commission_amount) * share),
                    }
                    const channelFees = Object.values(feeBreakdown).reduce((s, v) => s + v, 0)
                    const discPenjual = Math.round(recDisc * share)
                    const netOngkir = Math.round(recNetShipping * share)
                    const cogs = cogsUnit * p.cogsUnits                // core COGS (completed units)
                    const returLoss = cogsUnit * p.lossUnits           // Improvement B: non-restockable
                    const contribution = settlement - cogs - returLoss
                    // Improvement A: CM% over Settlement; n/a when settlement ≤ 0.
                    return rowFlags({ rec, productName, skuCode: rec.sku_code, cogsUnit, units: p.units, refundedUnits: p.refundedUnits, grossGmv: p.gmv, refundGmv: p.refund, discPenjual, channelFees, feeBreakdown, netOngkir, settlement, cogs, returLoss, contribution,
                        cmPercent: settlement > 0 ? (contribution / settlement) * 100 : null })
                })
            }

            // Fallback: single aggregate row per SKU record
            const units = n(f.units_sold)
            const grossGmv = units * n(f.actual_selling_price)
            const discPenjual = n(f.voucher_amount) + n(f.seller_discount_amount) + n(f.voucher_cofund_amount) + n(f.coin_amount) + n(f.coin_cofund_amount)
            const feeBreakdown = {
                commission_fee:       n(f.commission_fee_amount),
                service_fee:          n(f.service_fee_amount),
                processing_fee:       n(f.processing_fee),
                transaction_fee:      n(f.transaction_fee_amount),
                campaign_fee:         n(f.campaign_fee_amount),
                affiliate_commission: n(f.affiliate_commission_amount),
            }
            const channelFees = Object.values(feeBreakdown).reduce((s, v) => s + v, 0)
            const netOngkir = n(f.buyer_shipping_paid) - n(f.actual_shipping_cost)
            const settlement = n(f.settlement_amount)
            const cogs = cogsUnit * units
            const returLoss = 0   // no order report → refunds already excluded from units_sold
            const contribution = settlement - cogs - returLoss
            // Improvement A: CM% over Settlement; n/a when settlement ≤ 0.
            return [rowFlags({ rec, productName: canonicalName(rec), skuCode: rec.sku_code, cogsUnit, units, refundedUnits: 0, grossGmv, refundGmv: 0, discPenjual, channelFees, feeBreakdown, netOngkir, settlement, cogs, returLoss, contribution,
                cmPercent: settlement > 0 ? (contribution / settlement) * 100 : null })]
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [records, forms, alertThresholds])

    // ── P1: per-parent-SKU roll-up + alert evaluation ───────────────────────────
    // Group the per-variant skuRows by parent code (FSH-006-* → FSH-006). CM/CM% at
    // parent level are pro-rata sums (approximate for multi-item orders); return rate
    // is exact from the order-line refunded/sold units.
    const parentRows = useMemo(() => {
        const map = new Map()
        for (const r of skuRows) {
            const key = parentSku(r.skuCode) || r.productName
            if (!map.has(key)) map.set(key, {
                parent: key, variants: [], names: new Set(),
                units: 0, refundedUnits: 0, grossGmv: 0, refundGmv: 0,
                settlement: 0, cogs: 0, returLoss: 0, contribution: 0,
                promoSeller: 0, missingCogs: false,
            })
            const g = map.get(key)
            g.variants.push(r)
            if (r.productName) g.names.add(r.productName)
            g.units += r.units || 0
            g.refundedUnits += r.refundedUnits || 0
            g.grossGmv += r.grossGmv || 0
            g.refundGmv += r.refundGmv || 0
            g.settlement += r.settlement || 0
            g.cogs += r.cogs || 0
            g.returLoss += r.returLoss || 0
            g.contribution += r.contribution || 0
            g.promoSeller += r.discPenjual || 0
            // Data quality: a variant that sold units but has no parent COGS (0) → flag.
            if ((r.units || 0) > 0 && !(r.cogsUnit > 0)) g.missingCogs = true
        }
        // Per-record Aug-only fields (affiliate/ads), summed once per record within a parent.
        const seenRec = new Set()
        for (const r of skuRows) {
            const key = parentSku(r.skuCode) || r.productName
            const g = map.get(key)
            const recId = r.rec?.id
            if (!g || !recId || seenRec.has(recId)) continue
            seenRec.add(recId)
            const f = forms[recId] ?? {}
            g.affiliateSeller = (g.affiliateSeller || 0) + n(f.affiliate_seller_amount)
            g.adsSpend = (g.adsSpend || 0) + n(f.ads_spend_amount)
        }
        return Array.from(map.values()).map(g => {
            const soldUnits = (g.units || 0) + (g.refundedUnits || 0)
            const cm = g.contribution
            const cmPct = g.settlement > 0 ? cm / g.settlement : null
            const netGmv = g.grossGmv - g.refundGmv
            const metrics = {
                settlement: g.settlement, cm, cmPct,
                returnRate: soldUnits > 0 ? (g.refundedUnits / soldUnits) : 0,
                promoSeller: g.promoSeller, affiliate: g.affiliateSeller || 0, ads: g.adsSpend || 0,
                netGmv, missingCogs: g.missingCogs,
            }
            const flags = evaluateSkuAlerts(metrics, alertThresholds)
            return { ...g, ...metrics, soldUnits, flags, topSeverity: topSeverity(flags) }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skuRows, forms, alertThresholds])

    const alertRows = useMemo(() => sortAlertRows(parentRows.filter(p => p.flags.length)), [parentRows])

    // SKU-tab filtering (parent drill-down from an alert, or a rule chip).
    const filteredSkuRows = useMemo(() => {
        if (!skuFilter) return skuRows
        if (skuFilter.type === 'parent') return skuRows.filter(r => (parentSku(r.skuCode) || r.productName) === skuFilter.value)
        // Rule chip filters by each row's OWN flags (per-variant, matches the badge).
        if (skuFilter.type === 'rule') return skuRows.filter(r => (r.flags ?? []).some(f => f.rule === skuFilter.value))
        return skuRows
    }, [skuRows, skuFilter])

    const alertRuleOptions = useMemo(() => {
        const s = new Set()
        for (const r of skuRows) for (const f of (r.flags ?? [])) s.add(f.rule)
        return Array.from(s)
    }, [skuRows])

    // ── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="px-4 lg:px-6 py-6 space-y-4">
            {[64, 120, 160, 200, 160].map((h, i) => <Skeleton key={i} className="w-full rounded-lg" style={{ height: h }} />)}
        </div>
    )
    if (!active) return (
        <div className="px-4 lg:px-6 py-6 text-sm text-muted-foreground">
            {t('plDetailNotFound')} <button className="underline" onClick={onBack}>{t('plDetailGoBack')}</button>
        </div>
    )

    const periodMonth = active.period_month ? parseInt(active.period_month) - 1 : null

    // Improvement A: informational classification counts (orders not in P&L).
    // All period records store the same order_report_rows, so read the first only.
    const classInfo = (() => {
        const rows = records[0]?.order_report_rows ?? []
        const pend = new Set(), cross = new Set()
        let pendingGmv = 0, crossGmv = 0
        for (const r of rows) {
            const cls = r.classification ?? classifyOrderRow(r)
            if (cls === 'PENDING') { pendingGmv += r.gmv || 0; if (r.order_no) pend.add(r.order_no.trim()) }
            else if (cls === 'CROSS_PERIOD') { crossGmv += r.gmv || 0; if (r.order_no) cross.add(r.order_no.trim()) }
        }
        return { pendingCount: pend.size, crossCount: cross.size, pendingGmv, crossGmv }
    })()

    // Improvement A: anomalies persisted at import (Income rows with no matching order).
    const anomalies = records[0]?.anomalies ?? []

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

    // Gross GMV = all orders; Refund = returned value; Net GMV = Selesai only (Improv. A)
    const refundGmv  = allOrderRows.reduce((s, r) => s + (r.entry?.refunded ? (r.entry.gmv || 0) : 0), 0)
    const netGmv     = agg.grossGmv - refundGmv
    const refundRate = agg.grossGmv > 0 ? (refundGmv / agg.grossGmv) * 100 : 0


    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 lg:px-6">
                <button type="button" onClick={onBack} className="text-sm hover:opacity-70">←</button>
                <h2 className="text-xl font-bold">{t('plDetailTitle')}</h2>
                {active.source === 'shopee' && <ShopeeChip />}
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline" size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => setShowAlertSettings(true)}
                    >
                        <IconAdjustmentsHorizontal size={15} />
                        <span className="hidden sm:inline">{t('shopeeAlertCfgEdit')}</span>
                    </Button>
                    {TAX_ENABLED && (
                        <Button
                            variant="outline" size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => setShowTaxSettings(true)}
                        >
                            <IconReceiptTax size={15} />
                            <span className="hidden sm:inline">{t('shopeeTaxEdit')}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                                {taxConfig?.tipe_wp === 'BADAN' ? t('shopeeTaxWpBadanShort') : t('shopeeTaxWpOpShort')}
                            </span>
                        </Button>
                    )}
                </div>
            </div>

            {TAX_ENABLED && (
                <TaxSettingsDialog
                    open={showTaxSettings}
                    onOpenChange={setShowTaxSettings}
                    config={taxConfig}
                    onSaved={(cfg) => { setTaxConfig(cfg); loadRecords() }}
                />
            )}

            <AlertThresholdsDialog
                open={showAlertSettings}
                onOpenChange={setShowAlertSettings}
                config={alertConfig}
                onSaved={(cfg) => setAlertConfig(cfg)}
            />

            <div className="px-4 lg:px-6"><Separator /></div>

            <div className="px-4 lg:px-6 pb-20 space-y-3">

                {/* Period (read-only display) */}
                <div className="border rounded-lg p-5 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('shopeeImportPeriod')}</p>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">{t('yearLabel')}</p>
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
                        label: t('shopeeColGmv'), value: agg.grossGmv,
                        cls: 'text-blue-700',
                        extra: [
                            { label: `${t('shopeeImportGmvRefund')} (${refundRate.toFixed(1)}%)`, value: refundGmv, cls: 'text-amber-700' },
                            { label: t('shopeeImportGmvNet'), value: netGmv, cls: 'text-foreground' },
                        ],
                    },
                    {
                        label: t('shopeeImportFeesTotal'), value: agg.totalFees,
                        cls: 'text-red-600',
                        subtitle: agg.grossGmv > 0 ? `${((agg.totalFees / agg.grossGmv) * 100).toFixed(1)}% GMV` : undefined
                    },
                    {
                        label: t('shopeeColSettlement'), value: agg.settlement,
                        cls: 'text-green-700',
                        subtitle: agg.grossGmv > 0 ? `${((agg.settlement / agg.grossGmv) * 100).toFixed(1)}% GMV` : undefined
                    },
                    {
                        label: t('shopeeImportContribution'), value: agg.settlement - agg.totalCogs - agg.returLoss,
                        cls: (agg.settlement - agg.totalCogs - agg.returLoss) >= 0 ? 'text-green-700' : 'text-red-600',
                        subtitle: agg.returLoss > 0
                            ? `${t('shopeeImportColCogs')} ${fmt(agg.totalCogs)} · ${t('shopeeImportReturLoss')} ${fmt(agg.returLoss)}`
                            : agg.totalCogs > 0 ? `${t('shopeeImportColCogs')} ${fmt(agg.totalCogs)}` : t('shopeeImportContributionNote')
                    },
                ]} />

                {/* ══ TABS ════════════════════════════════════════════════════════════ */}
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="mb-3">
                        <TabsTrigger value="summary">{t('shopeeImportTabPreview')}</TabsTrigger>
                        <TabsTrigger value="orders">{t('shopeeImportOrders')}</TabsTrigger>
                        <TabsTrigger value="sku">{t('shopeeImportTabPerSku')}</TabsTrigger>
                        <TabsTrigger value="trend">{t('shopeeTrendTab')}</TabsTrigger>
                    </TabsList>

                    {/* ── Summary ── */}
                    <TabsContent value="summary" className="mt-0">
                        <SummaryTab agg={agg} alertRows={alertRows} onDrill={drillToParent} />
                    </TabsContent>

                    {/* ── Orders ── */}
                    <TabsContent value="orders" className="mt-0 space-y-3">
                        {/* Improvement A: anomaly banner (persisted at import) */}
                        {anomalies.length > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5">
                                <span className="text-red-600 text-base flex-shrink-0">⚠</span>
                                <p className="text-xs text-red-800">
                                    {t('shopeeClassAnomalyBanner', { count: anomalies.length })}
                                </p>
                            </div>
                        )}
                        <div>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[760px] border rounded-b-md [&_tr:last-child_td]:border-b-0">
                                    <TableHeader>
                                        <TableRow className="bg-muted/60 hover:bg-muted/60">
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('shopeeImportColOrderNo')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('shopeeImportColProduct')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('shopeeImportColStatus')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColQty')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColOriginalPrice')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColSellerDiscount')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportSectionFees')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColNetShipping')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColSettlement')}</TableHead>
                                            <TableHead className="py-1.5 px-3 w-8 text-right"><span className="sr-only">{t('shopeeImportColDetail')}</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pagedOrders.map(({ rec, entry, fromOrderReport }, i) => {
                                            const rowKey = entry
                                                ? `${rec.id}::${entry.order_no ?? entry.orderNo ?? ''}::${entry.product_name ?? ''}::${i}`
                                                : `${rec.id}::empty::${i}`
                                            // Stored breakdown (new imports) or reconstructed from fee_total
                                            // via the record's component proportions (legacy imports).
                                            let feeBreakdown = entry?.fee_breakdown ?? null
                                            if (!feeBreakdown && entry) {
                                                // Use the SKU record whose products include this order's product
                                                // (order rows are deduped across records, so `rec` may differ).
                                                const propRec = records.find(rr =>
                                                    Array.isArray(rr.product_names) && rr.product_names.includes(entry.product_name)
                                                ) ?? rec
                                                const ff = forms[propRec.id] ?? buildFormFromRecord(propRec)
                                                feeBreakdown = reconstructFeeBreakdown(n(entry.fee_total ?? entry.feeTotal ?? 0), {
                                                    commission_fee:       n(ff.commission_fee_amount),
                                                    service_fee:          n(ff.service_fee_amount),
                                                    processing_fee:       n(ff.processing_fee),
                                                    transaction_fee:      n(ff.transaction_fee_amount),
                                                    campaign_fee:         n(ff.campaign_fee_amount),
                                                    affiliate_commission: n(ff.affiliate_commission_amount),
                                                })
                                            }
                                            const isOpen = expandedOrders.has(rowKey)
                                            if (!entry) {
                                                return (
                                                    <TableRow key={rowKey} className="opacity-50">
                                                        <TableCell className="py-1.5 px-3 text-sm font-mono text-muted-foreground">-</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-muted-foreground">{canonicalName(rec)}</TableCell>
                                                        <TableCell colSpan={8} className="py-1.5 px-3 text-sm text-muted-foreground text-center">{t('plDetailNoOrderData')}</TableCell>
                                                    </TableRow>
                                                )
                                            }
                                            // Improvement A: classify per stored row (income_matched/status).
                                            // Falls back to the income-report row case (SETTLED) when not present.
                                            const cls = entry.classification
                                                ?? (fromOrderReport ? classifyOrderRow(entry) : 'SETTLED')
                                            const statusBadge = <ClassificationBadge cls={cls} label={classLabel(cls)} />
                                            const detailRow = feeBreakdown && isOpen && (
                                                <TableRow className="bg-muted/20 hover:bg-muted/20">
                                                    <TableCell colSpan={10} className="py-2 px-3">
                                                        <FeeBreakdownDetail t={t} fees={feeBreakdown} gmv={entry?.gmv} />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                            const toggleCell = (
                                                <TableCell className="py-1.5 px-3 text-right">
                                                    {feeBreakdown && (
                                                        <ExpandToggle open={isOpen} onClick={() => toggleOrder(rowKey)} label={t('shopeeImportExpandFees')} />
                                                    )}
                                                </TableCell>
                                            )
                                            if (fromOrderReport) {
                                                const excluded = entry.excluded
                                                return (
                                                    <Fragment key={rowKey}>
                                                        <TableRow
                                                            className={`${excluded ? 'opacity-40 ' : ''}${feeBreakdown ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                                                            onClick={feeBreakdown ? () => toggleOrder(rowKey) : undefined}
                                                        >
                                                            <TableCell className="py-1.5 px-3 text-sm font-mono">{entry.order_no || '-'}</TableCell>
                                                            <TableCell className="py-1.5 px-3 text-sm">{entry.product_name}</TableCell>
                                                            <TableCell className="py-1.5 px-3">{statusBadge}</TableCell>
                                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{entry.qty}</TableCell>
                                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(entry.price)}</TableCell>
                                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.seller_discount))}</TableCell>
                                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.fee_total))}</TableCell>
                                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.net_shipping))}</TableCell>
                                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.settlement))}</TableCell>
                                                            {toggleCell}
                                                        </TableRow>
                                                        {detailRow}
                                                    </Fragment>
                                                )
                                            }
                                            return (
                                                <Fragment key={rowKey}>
                                                    <TableRow
                                                        className={feeBreakdown ? 'cursor-pointer hover:bg-muted/30' : ''}
                                                        onClick={feeBreakdown ? () => toggleOrder(rowKey) : undefined}
                                                    >
                                                        <TableCell className="py-1.5 px-3 text-sm font-mono">{entry.order_no || '-'}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm">{canonicalName(rec)}</TableCell>
                                                        <TableCell className="py-1.5 px-3">{statusBadge}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{n(entry.units_sold)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.actual_selling_price))}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.seller_discount))}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.fee_total))}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.net_shipping))}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(n(entry.settlement_amount))}</TableCell>
                                                        {toggleCell}
                                                    </TableRow>
                                                    {detailRow}
                                                </Fragment>
                                            )
                                        })}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-muted/40">
                                            <TableCell colSpan={3} className="py-1.5 px-3 text-sm font-semibold">{t('shopeeImportTotalMatched', { count: displayMatchedOrders })}</TableCell>
                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums font-semibold">{matchedRows.reduce((s, r) => s + n(r.entry?.qty ?? r.entry?.units_sold ?? 0), 0)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalGmv >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalGmv)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalDiscount >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalDiscount)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalFees >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalFees)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalShipping >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalShipping)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${totalSettle >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalSettle)}</TableCell>
                                            <TableCell className="py-1.5 px-3" />
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>
                        {/* Improvement A: informational counts (not in P&L) */}
                        {(classInfo.pendingCount > 0 || classInfo.crossCount > 0) && (
                            <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 space-y-1">
                                <p className="text-[11px] font-medium text-muted-foreground">{t('shopeeClassInfoNote')}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    {classInfo.pendingCount > 0 && (
                                        <span className="text-blue-700">
                                            {t('shopeeClassPendingSummary', { count: classInfo.pendingCount, gmv: fmt(classInfo.pendingGmv) })}
                                        </span>
                                    )}
                                    {classInfo.crossCount > 0 && (
                                        <span className="text-purple-700">
                                            {t('shopeeClassCrossSummary', { count: classInfo.crossCount, gmv: fmt(classInfo.crossGmv) })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">
                                {t('shopeeImportPerOrderNote')}
                            </p>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                <span className="text-xs text-muted-foreground">{t('plDetailPage', { page: safeOrderPage + 1, total: totalOrderPages })}</span>
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
                        {(alertRuleOptions.length > 0 || skuFilter) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] text-muted-foreground mr-1">{t('shopeeFilterLabel')}:</span>
                                <button type="button" className={chipCls(!skuFilter)} onClick={() => setSkuFilter(null)}>{t('shopeeAlertFilterAll')}</button>
                                {alertRuleOptions.map(rule => (
                                    <button key={rule} type="button" className={chipCls(skuFilter?.type === 'rule' && skuFilter.value === rule)}
                                        onClick={() => setSkuFilter({ type: 'rule', value: rule })}>{ruleLabel(t, rule)}</button>
                                ))}
                                {skuFilter?.type === 'parent' && (
                                    <button type="button" className={chipCls(true)} onClick={() => setSkuFilter(null)}>{skuFilter.value} ✕</button>
                                )}
                            </div>
                        )}
                        <div>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[1020px] border rounded-b-md [&_tr:last-child_td]:border-b-0">
                                    <TableHeader>
                                        <TableRow className="bg-muted/60 hover:bg-muted/60">
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('shopeeImportTabPerSku')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColUnitsSold')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColGrossGmv')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColRefund')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColSellerDiscount')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportSectionFees')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColNetShipping')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColSettlement')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColCogs')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColContribution')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeImportColCmPercent')}</TableHead>
                                            <TableHead className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('shopeeColReturnRate')}</TableHead>
                                            <TableHead className="py-1.5 px-3 w-8 text-right"><span className="sr-only">{t('shopeeImportColDetail')}</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSkuRows.map(({ rec, productName, skuCode, units, refundedUnits, grossGmv, refundGmv, discPenjual, channelFees, feeBreakdown, netOngkir, settlement, cogs, contribution, cmPercent, flags }, idx) => {
                                            const rowKey = `${rec.id}-${idx}`
                                            const isOpen = expandedSkus.has(rowKey)
                                            const rowFlagList = flags ?? []
                                            const soldU = (units || 0) + (refundedUnits || 0)
                                            const returnRate = soldU > 0 ? (refundedUnits || 0) / soldU : 0
                                            return (
                                                <Fragment key={rowKey}>
                                                    <TableRow className="cursor-pointer hover:bg-muted/30" onClick={() => toggleSku(rowKey)}>
                                                        <TableCell className="py-1.5 px-3">
                                                            <p className="font-medium text-sm">{productName}</p>
                                                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                                <p className="text-[11px] text-muted-foreground">↳ {rec.sku_code ?? canonicalName(rec)}</p>
                                                                {rowFlagList.map(f => <AlertBadge key={f.rule} t={t} severity={f.severity} rule={f.rule} />)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{units}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(grossGmv)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(refundGmv ?? 0)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(discPenjual)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(channelFees)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(netOngkir)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(settlement)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">{fmt(cogs)}</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">
                                                            {fmt(contribution)}
                                                        </TableCell>
                                                        <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums ${cmPercent != null && cmPercent < 20 ? 'text-red-600' : ''}`}>
                                                            {cmPercent != null ? `${cmPercent.toFixed(1)}%` : <span className="text-muted-foreground/40">-</span>}
                                                        </TableCell>
                                                        <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums ${returnRate > 0.05 ? 'text-red-600' : ''}`}>{(returnRate * 100).toFixed(1)}%</TableCell>
                                                        <TableCell className="py-1.5 px-3 text-right">
                                                            <ExpandToggle open={isOpen} onClick={() => toggleSku(rowKey)} label={t('shopeeImportExpandFees')} />
                                                        </TableCell>
                                                    </TableRow>
                                                    {isOpen && (
                                                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                                                            <TableCell colSpan={13} className="py-2 px-3">
                                                                <FeeBreakdownDetail t={t} fees={feeBreakdown} gmv={grossGmv} />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </Fragment>
                                            )
                                        })}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-muted/40">
                                            <TableCell className="py-1.5 px-3 text-sm font-semibold">{t('shopeeImportTotal')}</TableCell>
                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums font-semibold">{skuRows.reduce((s, r) => s + (r.units || 0), 0)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.grossGmv >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.grossGmv)}</TableCell>
                                            <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums font-semibold text-amber-700">{fmt(refundGmv)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.totalDisc >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.totalDisc)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.totalFees >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.totalFees)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.netShipping >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.netShipping)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.settlement >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.settlement)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${agg.totalCogs >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(agg.totalCogs)}</TableCell>
                                            <TableCell className={`py-1.5 px-3 text-sm text-right tabular-nums font-semibold ${(agg.settlement - agg.totalCogs - agg.returLoss) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                {fmt(agg.settlement - agg.totalCogs - agg.returLoss)}
                                            </TableCell>
                                            {/* CM% and Return Rate totals intentionally omitted - not meaningful as aggregates */}
                                            <TableCell className="py-1.5 px-3" />
                                            <TableCell className="py-1.5 px-3" />
                                            <TableCell className="py-1.5 px-3" />
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Trend ── */}
                    <TabsContent value="trend" className="mt-0">
                        <TrendTab currentPeriod={{ year: active.period_year, month: active.period_month }} locale={locale} />
                    </TabsContent>
                </Tabs>

            </div>

        </div>
    )
}
