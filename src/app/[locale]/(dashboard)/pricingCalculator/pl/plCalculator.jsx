'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useSidebar } from "@/components/ui/sidebar"
import { H3 } from "@/components/ui/typography"
import services from "@/services"
import {
    IconArrowLeft,
    IconBuildingStore,
    IconChevronDown,
    IconChevronUp,
    IconPresentationAnalytics,
    IconSearch,
    IconSettings,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

const MONTH_LABELS_CONST = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const fmt = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID')
const pct = (n) => (isFinite(n) ? n.toFixed(1) : '0.0') + '%'
const num = (s) => parseFloat(String(s).replace(/[^\d.]/g, '')) || 0

// Currency input helpers — format raw integer string → "13.000", strip on change
const fmtCurrency = (v) => {
    if (v === '' || v == null) return ''
    const n = parseInt(String(v).replace(/\D/g, ''), 10)
    return isNaN(n) ? '' : n.toLocaleString('id-ID')
}
const parseCurrency = (v) => String(v).replace(/\D/g, '')

const DISKON_KEYS = ["voucher", "subsidi", "flash", "coin", "affiliate", "bundling", "loyalty"]

// ─── API value helpers (module-scope so effects and helpers can share them) ───
const toAmt = (v) => v != null && v !== '' ? String(Math.round(parseFloat(v))) : ''
const toRate = (v, scale = 100) => v != null ? String(parseFloat((parseFloat(v) * scale).toFixed(4))) : '0'

// ─── Map a monthly DB record to form-state shape ───────────────────────────────
function mapMonthlyRecordToFormData(mr, chIdToName) {
    const data = {
        infoData: {},
        diskonData: {},
        returnData: {},
        ongkirData: {},
        adsData: {},
        claimData: { support: '', voucher: '', mpFee: '', mpAffiliate: '', campaign: '' },
        varData: {},
        monthlyKomisiRate: '',
        customRows: [],
        bundlingData: {},
        orders: '',
        secFilled: { info: false, diskon: false, ret: false, ads: false, fixed: false },
    }
    if (mr.sales?.length) {
        mr.sales.forEach(s => {
            const ch = chIdToName[s.channel_id]
            if (!ch) return
            data.infoData[ch] = { vol: s.units_sold != null ? String(s.units_sold) : '' }
            data.adsData[ch] = { rate: s.ads_spend_rate != null ? toRate(s.ads_spend_rate) : '0' }
        })
    }
    if (mr.diskons?.length) {
        mr.diskons.forEach(d => {
            const ch = chIdToName[d.channel_id]
            if (!ch) return
            data.diskonData[ch] = {
                voucher: toRate(d.voucher_pct),
                subsidi: toRate(d.subsidy_pct),
                flash: toRate(d.flash_sale_pct),
                coin: toRate(d.coin_pct),
                affiliate: toRate(d.affiliate_pct),
                bundling: toRate(d.bundling_pct),
                loyalty: toRate(d.loyalty_pct),
                nilai: d.discount_amount != null ? toAmt(d.discount_amount) : '',
            }
        })
    }
    if (mr.returns?.length) {
        mr.returns.forEach(r => {
            const ch = chIdToName[r.channel_id]
            if (!ch) return
            data.returnData[ch] = {
                rate: toRate(r.return_rate_pct),
                units: r.return_units != null ? String(r.return_units) : '',
                est: r.estimated_return_value != null ? toAmt(r.estimated_return_value) : '',
                aktual: r.actual_refund_amount != null ? toAmt(r.actual_refund_amount) : '',
            }
        })
    }
    if (mr.ongkirs?.length) {
        mr.ongkirs.forEach(o => {
            const ch = chIdToName[o.channel_id]
            if (!ch) return
            data.ongkirData[ch] = {
                subsidi: o.shipping_subsidy != null ? toAmt(o.shipping_subsidy) : '',
                aktual: o.actual_shipping_cost != null ? toAmt(o.actual_shipping_cost) : '',
                processing: o.processing_fee != null ? toAmt(o.processing_fee) : '',
                berat: o.weight_diff_kg != null ? String(o.weight_diff_kg) : '',
            }
        })
    }
    if (mr.enabler_var) {
        const ev = mr.enabler_var
        data.claimData = {
            support: ev.claim_support != null ? toAmt(ev.claim_support) : '',
            voucher: ev.claim_voucher != null ? toAmt(ev.claim_voucher) : '',
            mpFee: ev.claim_mp_fee != null ? toAmt(ev.claim_mp_fee) : '',
            mpAffiliate: ev.mp_affiliate != null ? toAmt(ev.mp_affiliate) : '',
            campaign: ev.campaign_ads_fee != null ? toAmt(ev.campaign_ads_fee) : '',
        }
        if (ev.order_count != null) data.orders = String(ev.order_count)
        if (ev.commission_gmv_rate != null) data.monthlyKomisiRate = toRate(ev.commission_gmv_rate)
        if (ev.custom_var_items && typeof ev.custom_var_items === 'object') {
            data.varData = Object.fromEntries(
                Object.entries(ev.custom_var_items).map(([k, v]) => [k, toAmt(v)])
            )
        }
    }
    if (mr.fixed_costs?.length) {
        data.customRows = mr.fixed_costs
            .filter(fc => fc.item_name)
            .map((fc, i) => ({ id: i, name: fc.item_name, val: toAmt(fc.amount) }))
    }
    if (mr.cogs_overrides?.length) {
        mr.cogs_overrides.forEach(co => {
            const ch = chIdToName[co.channel_id]
            if (!ch) return
            data.bundlingData[ch] = {
                cogs:  co.cogs_bundling    != null ? toAmt(co.cogs_bundling)     : '',
                units: co.units_per_bundle != null ? String(co.units_per_bundle) : '',
            }
        })
    }
    return data
}

function getChColor(code, label) {
    const key = (label || code || "").toLowerCase()
    if (key.includes("shopee")) return { bg: "#fff7f0", color: "#c83200" }
    if (key.includes("tokopedia")) return { bg: "#f0fff4", color: "#1a6e42" }
    if (key.includes("tiktok")) return { bg: "#f0f8ff", color: "#0a4a8c" }
    if (key.includes("lazada")) return { bg: "#f5f0ff", color: "#4a1fcc" }
    return { bg: "#f5f5f5", color: "#555" }
}

// ─── ChBadge ──────────────────────────────────────────────────────────────────
function ChBadge({ code, label }) {
    const { bg, color } = getChColor(code, label)
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
            style={{ background: bg, color }}
        >
            {label || code}
        </span>
    )
}

// ─── ChInput: compact number input for channel tables ─────────────────────────
function ChInput({ value, onChange, placeholder = "0", step, highlight, currency = false }) {
    const cls = highlight === 'filled'
        ? 'bg-green-50 border-green-300 text-green-900'
        : highlight === 'warn'
            ? 'bg-orange-50 border-orange-300'
            : 'bg-background border-input'
    return (
        <input
            type={currency ? 'text' : 'number'}
            step={!currency ? step : undefined}
            value={currency ? fmtCurrency(value) : value}
            onChange={e => onChange(currency ? parseCurrency(e.target.value) : e.target.value)}
            placeholder={placeholder}
            className={`w-20 text-right text-xs px-2 py-1.5 rounded border outline-none transition-colors focus:ring-1 focus:ring-ring focus:border-ring ${cls}`}
        />
    )
}

// ─── PnLAccordion ─────────────────────────────────────────────────────────────
function PnLAccordion({ title, subtitle, pillText, pillVariant = "optional", defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen)
    const pillClass = {
        required: "bg-orange-50 text-orange-700 border border-orange-200",
        prefilled: "bg-teal-50 text-teal-700 border border-teal-200",
        filled: "bg-green-50 text-green-700 border border-green-300",
        optional: "bg-muted text-muted-foreground border",
    }[pillVariant] || "bg-muted text-muted-foreground border"
    return (
        <div className="border-b last:border-b-0">
            <div
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-muted/20 transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <div className="min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pillClass}`}>{pillText}</span>
                    {open ? <IconChevronUp size={14} className="text-muted-foreground" /> : <IconChevronDown size={14} className="text-muted-foreground" />}
                </div>
            </div>
            {open && <div className="px-5 pb-5 pt-1">{children}</div>}
        </div>
    )
}

// ─── SetupProgress ───────────────────────────────────────────────────────────
function SetupProgress({ steps, currentStep, completedSteps, onStepClick }) {
    return (
        <div className="flex items-center w-full mb-2">
            {steps.map((label, i) => {
                const n = i + 1
                const isDone = completedSteps.includes(n)
                const isActive = currentStep === n
                const isLocked = !completedSteps.includes(n) && currentStep < n
                return (
                    <Fragment key={i}>
                        {i > 0 && (
                            <div className={`flex-1 h-px mx-2 transition-colors ${completedSteps.includes(i) ? 'bg-green-300' : 'bg-border'}`} />
                        )}
                        <div
                            className={`flex items-center gap-1.5 flex-shrink-0 ${isLocked ? 'cursor-not-allowed' : !isActive ? 'cursor-pointer' : ''}`}
                            onClick={() => !isLocked && onStepClick?.(n)}
                        >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors
                                ${isDone ? 'bg-green-100 text-green-700' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {isDone ? '✓' : n}
                            </div>
                            <span className={`text-xs transition-colors hidden sm:block
                                ${isDone ? 'text-green-700' : isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {label}
                            </span>
                        </div>
                    </Fragment>
                )
            })}
        </div>
    )
}

// ─── SetupStepCard ────────────────────────────────────────────────────────────
function SetupStepCard({ number, title, subtitle, isDone, isActive, isLocked, onOpen, onNext, nextLabel, finishLabel, donePillLabel, activePillLabel, pendingPillLabel, isLast = false, children }) {
    const statusPill = isDone
        ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{donePillLabel}</span>
        : isActive
            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{activePillLabel}</span>
            : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">{pendingPillLabel}</span>

    return (
        <Card className={`gap-0 py-0 overflow-hidden transition-all ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
            <div
                className={`flex items-center gap-4 px-5 py-4 select-none ${!isLocked ? 'cursor-pointer hover:bg-muted/20 transition-colors' : ''}`}
                onClick={!isLocked ? onOpen : undefined}
            >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                    ${isDone ? 'bg-green-100 text-green-700' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {isDone ? '✓' : number}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {statusPill}
                    {!isLocked && (
                        isActive
                            ? <IconChevronUp size={14} className="text-muted-foreground" />
                            : <IconChevronDown size={14} className="text-muted-foreground" />
                    )}
                </div>
            </div>
            {isActive && (
                <div className="border-t px-5 pt-4 pb-5">
                    {children}
                    <div className="mt-5 flex justify-end">
                        <Button onClick={onNext}>
                            {isLast ? finishLabel : nextLabel}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    )
}

// ─── SetupSummaryCard ─────────────────────────────────────────────────────────
function SetupSummaryCard({ setup, activeChannels, onEditSetup, editLabel }) {
    return (
        <div className="rounded-lg border bg-card px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {(setup.brand_name || 'B')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-sm">{setup.brand_name || 'Brand'}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {activeChannels.map(ch => <ChBadge key={ch.code} code={ch.code} label={ch.label} />)}
                        {setup.enabler && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                via {setup.enabler}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── InnerCard ────────────────────────────────────────────────────────────────
function InnerCard({ title, children, className = '' }) {
    return (
        <div className={`rounded-lg border bg-muted/40 p-4 flex-1 ${className}`}>
            {title && (
                <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-3">{title}</p>
            )}
            {children}
        </div>
    )
}

// ─── FieldInput ───────────────────────────────────────────────────────────────
function FieldInput({ label, subtitle, value, onChange, prefix, suffix, placeholder = '0', type = 'number', disabled = false }) {
    const isCurrency = prefix === 'Rp'
    return (
        <div className="grid gap-1">
            {label && <Label>{label}</Label>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            <div className={`flex items-center border border-input rounded-md overflow-hidden shadow-xs transition-all ${disabled ? 'bg-muted/50 opacity-60' : 'bg-transparent focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring'}`}>
                {prefix && (
                    <span className="px-3 text-xs text-muted-foreground border-r border-input bg-muted/50 self-stretch flex items-center">Rp</span>
                )}
                <input
                    type={isCurrency ? 'text' : type}
                    value={isCurrency ? fmtCurrency(value) : value}
                    onChange={(e) => !disabled && onChange(isCurrency ? parseCurrency(e.target.value) : e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 px-3 h-9 text-sm text-foreground outline-none bg-transparent min-w-0 disabled:cursor-not-allowed"
                />
                {suffix && (
                    <span className="px-3 text-xs text-muted-foreground border-l border-input bg-muted/50 self-stretch flex items-center whitespace-nowrap">{suffix}</span>
                )}
            </div>
        </div>
    )
}

// ─── AutoField ────────────────────────────────────────────────────────────────
function AutoField({ label, value, autoLabel }) {
    return (
        <div className="grid gap-1">
            <Label>{label} <span className="text-xs text-muted-foreground font-normal">({autoLabel})</span></Label>
            <div className="rounded-md border border-teal-300 bg-teal-50 dark:bg-teal-950 px-3 py-2 h-9 flex items-center text-sm font-medium text-teal-700 dark:text-teal-300">
                {value}
            </div>
        </div>
    )
}

// ─── ProductTabs ─────────────────────────────────────────────────────────────
function ProductTabs({ products, activeIndex, onSelect, onAdd, onRemove, addLabel }) {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {products.map((p, i) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelect(i)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors
                        ${i === activeIndex ? 'bg-primary text-primary-foreground' : 'border bg-card hover:bg-muted'}`}
                >
                    {p.name || `SKU ${i + 1}`}
                    {products.length > 1 && (
                        <span
                            className="ml-0.5 opacity-60 hover:opacity-100 leading-none"
                            onClick={(e) => { e.stopPropagation(); onRemove(i) }}
                        >×</span>
                    )}
                </button>
            ))}
            <button
                type="button"
                onClick={onAdd}
                className="rounded-full border px-3 py-1 text-sm hover:bg-muted transition-colors"
            >
                {addLabel}
            </button>
        </div>
    )
}

// ─── ChTh ─────────────────────────────────────────────────────────────────────
function ChTh({ children, className = '' }) {
    return (
        <th className={`pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 text-right whitespace-nowrap ${className}`}>
            {children}
        </th>
    )
}

// ─── SectionCard (for Monthly P&L phase) ─────────────────────────────────────
function SectionCard({ icon, title, subtitle, children }) {
    const [open, setOpen] = useState(true)
    return (
        <Card className="gap-0 py-0 overflow-hidden">
            <div
                className="flex items-start gap-3 px-5 pt-5 pb-5 cursor-pointer select-none hover:bg-muted/10 transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <span className="mt-0.5 text-primary flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground text-sm">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                <span className="text-muted-foreground mt-0.5">
                    {open ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </span>
            </div>
            {open && <div className="px-5 pb-5 border-t">{children}</div>}
        </Card>
    )
}

function makeProduct(index, label = 'Product') {
    return {
        id: Date.now() + index,
        name: '',
        sku: null,
        cogs: '',
        pkg: '',
        hj: {},
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PlCalculator({ onBack, onSaveComplete, editId, brandOnly = false, startAtMonthly = false }) {
    const t = useTranslations('plpage')
    const { open: sidebarOpen } = useSidebar()

    const DISKON_LABELS = [
        t('diskonVoucher'), t('diskonSubsidi'), t('diskonFlash'), t('diskonCoin'),
        t('diskonAffiliate'), t('diskonBundling'), t('diskonLoyalty'),
    ]


    // ── Setup step state ──────────────────────────────────────────────────────
    const [setupStep, setSetupStep] = useState(1)
    const [completedSetupSteps, setCompletedSetupSteps] = useState([])
    const [setupDone, setSetupDone] = useState(startAtMonthly)

    const doneSetupStep = (n) => {
        setCompletedSetupSteps(prev => [...new Set([...prev, n])])
        if (n < 3) {
            setSetupStep(n + 1)
        } else {
            setSetupDone(true)
        }
    }

    const getStepStatus = (n) => ({
        isDone: completedSetupSteps.includes(n),
        isActive: setupStep === n,
        isLocked: !completedSetupSteps.includes(n) && setupStep < n,
    })

    const handleStepOpen = (n) => {
        const { isLocked } = getStepStatus(n)
        if (!isLocked) setSetupStep(n)
    }

    // ── Setup state ───────────────────────────────────────────────────────────
    const [setup, setSetup] = useState({ brand_name: '', kategori: '', enabler: '' })
    const setS = (field, value) => setSetup(prev => ({ ...prev, [field]: value }))

    // ── Channels: string array (tag input) ────────────────────────────────────
    const [channels, setChannels] = useState([])
    const [mallStatus, setMallStatus] = useState({})
    const [tagInput, setTagInput] = useState('')

    const addChannel = (val) => {
        val = val.trim().replace(',', '')
        if (!val || channels.includes(val)) return
        setChannels(prev => [...prev, val])
        setMallStatus(prev => ({ ...prev, [val]: false }))
    }
    const removeChannel = (ch) => {
        setChannels(prev => prev.filter(c => c !== ch))
        setMallStatus(prev => { const n = { ...prev }; delete n[ch]; return n })
    }

    // ── Channel fees ──────────────────────────────────────────────────────────
    const [channelFees, setChannelFees] = useState({})
    const getChFee = (ch, key) =>
        channelFees[ch]?.[key] ?? ({ comm: '5', mall: '0', pgw: '1.5' }[key])
    const setChFee = (ch, key, value) =>
        setChannelFees(prev => ({ ...prev, [ch]: { ...prev[ch], [key]: value } }))

    // ── Enabler config ────────────────────────────────────────────────────────
    const [enablerConfig, setEnablerConfig] = useState({
        retainer: '', komisiRate: '',
        sof: '', swift: '', live: '', gudang: '',
        fulfilRate: '12000',
        customFixed: [],
        customVar: [],
    })
    const setEC = (field, value) => setEnablerConfig(prev => ({ ...prev, [field]: value }))

    // ── Products ──────────────────────────────────────────────────────────────
    const productLabel = t('productLabel')
    const [products, setProducts] = useState(() => [makeProduct(0, productLabel)])
    const [activeIdx, setActiveIdx] = useState(0)

    const p = products[activeIdx]
    const updateP = (field, value) =>
        setProducts(prev => prev.map((item, i) => i === activeIdx ? { ...item, [field]: value } : item))

    const addProduct = () => {
        const next = makeProduct(products.length, productLabel)
        setProducts(prev => [...prev, next])
        setActiveIdx(products.length)
    }
    const removeProduct = (index) => {
        if (products.length === 1) return
        setProducts(prev => prev.filter((_, i) => i !== index))
        setActiveIdx(prev => Math.max(0, prev >= index ? prev - 1 : prev))
    }

    // ── Pre-fill state when editing ───────────────────────────────────────────
    useEffect(() => {
        if (!editId && !startAtMonthly) return
        const load = async () => {
            let brandId = null
            let monthlyRecord = null

            if (editId && brandOnly) {
                // brandOnly: editId is a brand ID directly
                brandId = editId
            } else if (editId) {
                // editId is a monthly record ID — fetch it first to get brand_id + period data
                const monthlyRes = await services.pl.getMonthlyById(editId)
                const m = monthlyRes?.data?.data ?? monthlyRes?.data
                if (!m) return
                monthlyRecord = m
                setMonthlyId(m.id ?? editId)
                const skuId = m.sku_id ?? m.sku?.id
                if (skuId) setSelectedSku(skuId)
                if (m.period_month && m.period_year) {
                    const yr = String(m.period_year)
                    const mo = MONTH_LABELS_CONST[parseInt(m.period_month) - 1] ?? ''
                    setActiveYear(yr)
                    setMoByYear(prev => ({ ...prev, [yr]: mo }))
                }
                brandId = m.brand_id ?? m.brand?.id
            } else if (startAtMonthly) {
                // Add New flow — fetch first available brand
                const listRes = await services.pl.getBrands()
                const raw = listRes?.data?.data ?? listRes?.data ?? null
                const brands = Array.isArray(raw) ? raw : (raw ? [raw] : [])
                if (!brands.length) return
                brandId = brands[0].id
            }

            if (!brandId) return
            const res = await services.pl.getBrands()
            const raw = res?.data?.data ?? res?.data ?? null
            const brandList = Array.isArray(raw) ? raw : (raw ? [raw] : [])
            const d = brandList.find(b => b.id === brandId) ?? brandList[0]
            if (!d) return

            setSetup({ brand_name: d.name || '', kategori: d.category || '', enabler: d.enabler_name || '' })

            const chs = [...(d.channels || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            const chIdToName = Object.fromEntries(chs.map(ch => [ch.id, ch.name]))
            setChannels(chs.map(ch => ch.name))
            setMallStatus(Object.fromEntries(chs.map(ch => [ch.name, ch.is_mall || false])))
            setChannelFees(Object.fromEntries(chs.map(ch => [ch.name, {
                comm: toRate(ch.fee_config?.commission_rate),
                mall: toRate(ch.fee_config?.mall_fee_rate),
                pgw: toRate(ch.fee_config?.pgw_rate),
            }])))

            const ec = d.enabler_fee_config
            if (ec) {
                setEnablerConfig({
                    retainer: toAmt(ec.retainer_amount),
                    komisiRate: toRate(ec.commission_gmv_rate),
                    sof: toAmt(ec.store_operation_fee),
                    swift: toAmt(ec.platform_fee),
                    live: toAmt(ec.live_commerce_cost),
                    gudang: toAmt(ec.warehouse_cost),
                    fulfilRate: toAmt(ec.fulfillment_per_order) || '12000',
                    customFixed: (ec.custom_fixed_components || []).map((r, i) => ({ id: i, name: r.name, val: toAmt(r.amount) })),
                    customVar: (ec.custom_var_components || []).map((r, i) => ({ id: i, name: r.name, val: toAmt(r.amount) })),
                })
            }

            if (d.skus?.length) {
                setProducts(d.skus.map((sku, i) => ({
                    id: sku.id || i,
                    name: sku.name || '',
                    sku,
                    cogs: toAmt(sku.cogs_per_unit),
                    pkg: toAmt(sku.packaging_cost),
                    hj: Object.fromEntries(
                        (sku.channel_prices || [])
                            .map(cp => {
                                const chName = cp.channel_name || chIdToName[cp.channel_id] || ''
                                return [chName, { harga: toAmt(cp.selling_price), diskon: toRate(cp.diskon_default_pct) }]
                            })
                            .filter(([k]) => k)
                    ),
                })))
                setActiveIdx(0)
            }

            // Pre-fill monthly form fields from saved record
            if (monthlyRecord) {
                const fd = mapMonthlyRecordToFormData(monthlyRecord, chIdToName)
                setInfoData(fd.infoData)
                setAdsData(fd.adsData)
                setDiskonData(fd.diskonData)
                setReturnData(fd.returnData)
                setOngkirData(fd.ongkirData)
                setClaimData(fd.claimData)
                if (fd.orders) setOrders(fd.orders)
                if (fd.customRows?.length) setCustomRows(fd.customRows)
            }

            setBrandData(d)
            setCompletedSetupSteps([1, 2, 3])
            setSetupStep(1)
            setSetupDone(startAtMonthly)
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, startAtMonthly])

    // ── SKU modal ─────────────────────────────────────────────────────────────
    const [skuModalOpen, setSkuModalOpen] = useState(false)
    const [detailModalSku, setDetailModalSku] = useState(null)
    const [skuList, setSkuList] = useState([])
    const [skuSearch, setSkuSearch] = useState('')
    const [isSkusLoading, setIsSkusLoading] = useState(false)

    const openSkuModal = async () => {
        setSkuModalOpen(true)
        if (skuList.length === 0) {
            setIsSkusLoading(true)
            const res = await services.sku.getSkus()
            setSkuList(res?.data?.data ?? res?.data ?? [])
            setIsSkusLoading(false)
        }
    }
    const selectSku = (sku) => {
        setProducts(prev => prev.map((item, i) =>
            i === activeIdx ? { ...item, sku, name: sku.product_name || sku.sku_code } : item
        ))
        setSkuModalOpen(false)
        setSkuSearch('')
    }
    const usedSkuKeys = useMemo(() => {
        const currentSku = products[activeIdx]?.sku
        return new Set(
            products
                .filter((_, i) => i !== activeIdx)
                .flatMap(p => [p.sku?.id, p.sku?.sku_code, p.sku?.name].filter(Boolean))
                .filter(k => k !== currentSku?.id && k !== currentSku?.sku_code && k !== currentSku?.name)
        )
    }, [products, activeIdx])

    const filteredSkus = useMemo(() =>
        skuList.filter(s =>
            !usedSkuKeys.has(s.id) &&
            !usedSkuKeys.has(s.sku_code) &&
            !usedSkuKeys.has(s.product_name) &&
            (!skuSearch ||
                s.product_name?.toLowerCase().includes(skuSearch.toLowerCase()) ||
                s.sku_code?.toLowerCase().includes(skuSearch.toLowerCase()))
        ), [skuList, skuSearch, usedSkuKeys])

    // ── Monthly P&L state ─────────────────────────────────────────────────────
    const [monthlyId, setMonthlyId] = useState(null)
    const [activeYear, setActiveYear] = useState(String(new Date().getFullYear()))
    const [takenMonths, setTakenMonths] = useState([])
    const [isMonthsLoading, setIsMonthsLoading] = useState(false)
    const [moByYear, setMoByYear] = useState({})
    const activeMo = moByYear[activeYear] ?? ''
    const setActiveMo = (m) => setMoByYear(prev => ({ ...prev, [activeYear]: m }))
    const [selectedSku, setSelectedSku] = useState('')
    const skuInitRef = useRef(false)
    const skuDataCacheRef = useRef({})   // { [skuId]: { data: formSnapshot, recordId: id|null } }
    const prevSkuRef = useRef(null)
    const formDataRef = useRef({})   // always-current form state snapshot
    const contextRef = useRef({})   // always-current context snapshot
    const [infoData, setInfoData] = useState({})
    const [diskonData, setDiskonData] = useState({})
    const [returnData, setReturnData] = useState({})
    const [ongkirData, setOngkirData] = useState({})
    const [adsData, setAdsData] = useState({})
    const [claimData, setClaimData] = useState({ support: '', voucher: '', mpFee: '', mpAffiliate: '', campaign: '' })
    const [varData, setVarData] = useState({})
    const [monthlyKomisiRate, setMonthlyKomisiRate] = useState('')
    const [customRows, setCustomRows] = useState([])
    const [bundlingData, setBundlingData] = useState({})
    const [orders, setOrders] = useState('')
    const [secFilled, setSecFilled] = useState({ info: false, diskon: false, ret: false, ads: false, fixed: false })
    const markFilled = (sec) => setSecFilled(prev => ({ ...prev, [sec]: true }))

    // ── Active SKU for monthly ─────────────────────────────────────────────────
    const activeSku = products.find(prod => prod.id === selectedSku) || products[0] || {}
    const cogsUnit = (parseFloat(activeSku.cogs) || 0) + (parseFloat(activeSku.pkg) || 0)

    // ── Keep refs always current (no deps — runs after every render) ───────────
    // Must be declared BEFORE the SKU-change effect so they run first each cycle.
    useEffect(() => {
        formDataRef.current = { infoData, diskonData, returnData, ongkirData, adsData, claimData, varData, monthlyKomisiRate, customRows, bundlingData, orders, secFilled }
    })
    useEffect(() => {
        contextRef.current = { brandData, activeMo, activeYear, monthlyId }
    })

    // ── Restore all form fields from a cached snapshot ─────────────────────────
    const restoreFromFormData = (d) => {
        setInfoData(d.infoData ?? {})
        setDiskonData(d.diskonData ?? {})
        setReturnData(d.returnData ?? {})
        setOngkirData(d.ongkirData ?? {})
        setAdsData(d.adsData ?? {})
        setClaimData(d.claimData ?? { support: '', voucher: '', mpFee: '', mpAffiliate: '', campaign: '' })
        setVarData(d.varData ?? {})
        setMonthlyKomisiRate(d.monthlyKomisiRate ?? '')
        setCustomRows(d.customRows ?? [])
        setBundlingData(d.bundlingData ?? {})
        setOrders(d.orders ?? '')
        setSecFilled(d.secFilled ?? { info: false, diskon: false, ret: false, ads: false, fixed: false })
    }

    // ── SKU switch: save previous data, then restore/load for new SKU ──────────
    useEffect(() => {
        if (!selectedSku) return
        if (!skuInitRef.current) {
            skuInitRef.current = true
            prevSkuRef.current = selectedSku
            return
        }

        const prevSku = prevSkuRef.current
        prevSkuRef.current = selectedSku

        // Save current data to cache for the SKU we are leaving
        if (prevSku) {
            skuDataCacheRef.current[prevSku] = {
                data: { ...formDataRef.current },
                recordId: contextRef.current.monthlyId ?? null,
            }
        }

        // If we already have cached data for the new SKU, restore it
        const cached = skuDataCacheRef.current[selectedSku]
        if (cached) {
            restoreFromFormData(cached.data)
            setMonthlyId(cached.recordId ?? null)
            return
        }

        // Otherwise try to load from DB for current period
        const { brandData: bd, activeMo: mo, activeYear: yr } = contextRef.current
        if (bd?.id && mo && yr) {
            const periodMonth = String(MONTH_LABELS_CONST.indexOf(mo) + 1).padStart(2, '0')
            const periodYear = parseInt(yr)
            services.pl.getMonthlyByPeriod(bd.id, selectedSku, periodMonth, periodYear)
                .then(res => {
                    const mr = res?.data?.data ?? res?.data ?? null
                    if (mr && mr.id) {
                        const chIdToName = Object.fromEntries((bd.channels ?? []).map(ch => [ch.id, ch.name]))
                        const fd = mapMonthlyRecordToFormData(mr, chIdToName)
                        restoreFromFormData(fd)
                        setMonthlyId(mr.id)
                        skuDataCacheRef.current[selectedSku] = { data: fd, recordId: mr.id }
                    } else {
                        restoreFromFormData({})
                        setMonthlyId(null)
                    }
                })
                .catch(() => { restoreFromFormData({}); setMonthlyId(null) })
        } else {
            restoreFromFormData({})
            setMonthlyId(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSku])

    // ── P&L multi-channel calculations ───────────────────────────────────────
    const totalDiskonPct = (ch) =>
        DISKON_KEYS.reduce((s, k) => s + (parseFloat(diskonData[ch]?.[k]) || 0), 0)

    const grossByChannel = channels.map(ch => {
        const vol = parseFloat(infoData[ch]?.vol) || 0
        const hj = parseFloat(activeSku.hj?.[ch]?.harga) || 0
        return vol * hj
    })
    const grossTotal = grossByChannel.reduce((a, b) => a + b, 0)
    const discByChannel = channels.map((ch, i) => grossByChannel[i] * totalDiskonPct(ch) / 100)
    const retByChannel = channels.map((ch, i) => grossByChannel[i] * ((parseFloat(returnData[ch]?.rate) || 0) / 100))
    const shipByChannel = channels.map(ch => parseFloat(ongkirData[ch]?.subsidi) || 0)
    const netByChannel = channels.map((_, i) => grossByChannel[i] - discByChannel[i] - retByChannel[i] - shipByChannel[i])
    const netTotal = netByChannel.reduce((a, b) => a + b, 0)

    const totalVol = channels.reduce((s, ch) => s + (parseFloat(infoData[ch]?.vol) || 0), 0)
    const cogsTotal = channels.reduce((s, ch) => {
        const vol = parseFloat(infoData[ch]?.vol) || 0
        const bundCogs = parseFloat(bundlingData[ch]?.cogs) || 0
        const unitsPerBundle = parseFloat(bundlingData[ch]?.units) || 1
        return s + vol * (bundCogs + unitsPerBundle * cogsUnit)
    }, 0)
    const commCost = channels.reduce((s, ch) => s + grossTotal * (parseFloat(getChFee(ch, 'comm')) / 100), 0)
    const mallCost = channels.reduce((s, ch) => s + grossTotal * (parseFloat(getChFee(ch, 'mall')) / 100), 0)
    const pgwCost = channels.reduce((s, ch) => s + grossTotal * (parseFloat(getChFee(ch, 'pgw')) / 100), 0)
    const adsCostTotal = channels.reduce((s, ch) => s + grossTotal * ((parseFloat(adsData[ch]?.rate) || 0) / 100), 0)
    const channelCost = commCost + mallCost + pgwCost + adsCostTotal

    const retainerVal = parseFloat((enablerConfig.retainer || '').replace(/\./g, '')) || 0
    const sofVal = parseFloat((enablerConfig.sof || '').replace(/\./g, '')) || 0
    const swiftVal = parseFloat((enablerConfig.swift || '').replace(/\./g, '')) || 0
    const liveVal = parseFloat((enablerConfig.live || '').replace(/\./g, '')) || 0
    const gudangVal = parseFloat((enablerConfig.gudang || '').replace(/\./g, '')) || 0
    const komisiVal = grossTotal * ((parseFloat(monthlyKomisiRate) || 0) / 100)
    const fulfilRate = parseFloat((enablerConfig.fulfilRate || '').replace(/\./g, '').replace(',', '.')) || 12000
    const fulfilTotal = (parseFloat(orders) || 0) * fulfilRate
    const claimTotal = Object.values(claimData).reduce((s, v) => s + (parseFloat(v) || 0), 0)

    const customFixedTotal = enablerConfig.customFixed.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)
    const enablerFixedTotal = retainerVal + sofVal + swiftVal + liveVal + gudangVal + customFixedTotal

    const customVarTotal = Object.values(varData).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    const enablerVarTotal = komisiVal + fulfilTotal + claimTotal + customVarTotal
    const enablerTotal = enablerFixedTotal + enablerVarTotal

    const fixedTotal = customRows.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)

    // ── Per-SKU metrics helper ────────────────────────────────────────────────
    const computeSkuMetrics = (formData, sku) => {
        const { infoData: fi = {}, diskonData: fd = {}, returnData: fr = {},
                ongkirData: fo = {}, adsData: fa = {}, customRows: fc = [], bundlingData: fb = {} } = formData
        const cu = (parseFloat(sku.cogs) || 0) + (parseFloat(sku.pkg) || 0)
        const gByCh = channels.map(ch => (parseFloat(fi[ch]?.vol) || 0) * (parseFloat(sku.hj?.[ch]?.harga) || 0))
        const gTot = gByCh.reduce((a, b) => a + b, 0)
        const dByCh = channels.map((ch, i) => gByCh[i] * DISKON_KEYS.reduce((s, k) => s + (parseFloat(fd[ch]?.[k]) || 0), 0) / 100)
        const rByCh = channels.map((ch, i) => gByCh[i] * ((parseFloat(fr[ch]?.rate) || 0) / 100))
        const sByCh = channels.map(ch => parseFloat(fo[ch]?.subsidi) || 0)
        const nByCh = channels.map((_, i) => gByCh[i] - dByCh[i] - rByCh[i] - sByCh[i])
        const nTot = nByCh.reduce((a, b) => a + b, 0)
        const cogsTot = channels.reduce((s, ch) => {
            const vol = parseFloat(fi[ch]?.vol) || 0
            const bundCogs = parseFloat(fb[ch]?.cogs) || 0
            const unitsPerBundle = parseFloat(fb[ch]?.units) || 1
            return s + vol * (bundCogs + unitsPerBundle * cu)
        }, 0)
        const chCost = channels.reduce((s, ch) => s + gTot * (
            (parseFloat(getChFee(ch, 'comm')) + parseFloat(getChFee(ch, 'mall')) + parseFloat(getChFee(ch, 'pgw'))) / 100 +
            (parseFloat(fa[ch]?.rate) || 0) / 100
        ), 0)
        const fcTot = fc.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)
        const gpTot = nTot - cogsTot                    // Gross Profit
        const opTot = gpTot - chCost - fcTot             // Operating Profit
        return { grossTotal: gTot, netTotal: nTot, cogsTotal: cogsTot, channelCost: chCost,
                 fixedCost: fcTot, grossProfit: gpTot, operatingProfit: opTot,
                 grossMarginPct: nTot > 0 ? (gpTot / nTot) * 100 : 0,
                 operatingMarginPct: nTot > 0 ? (opTot / nTot) * 100 : 0,
                 grossByCh: gByCh, discByCh: dByCh, retByCh: rByCh, shipByCh: sByCh, netByCh: nByCh }
    }

    // ── All-SKU aggregated metrics ────────────────────────────────────────────
    const namedProducts = products.filter(p => p.name)
    const allSkuMetrics = namedProducts.map(p => {
        if (p.id === selectedSku) {
            const gp = netTotal - cogsTotal
            const op = gp - channelCost - fixedTotal
            return { sku: p, grossTotal, netTotal, cogsTotal, channelCost, fixedCost: fixedTotal,
                     grossProfit: gp, operatingProfit: op,
                     grossMarginPct:    netTotal > 0 ? (gp / netTotal) * 100 : 0,
                     operatingMarginPct: netTotal > 0 ? (op / netTotal) * 100 : 0,
                     grossByCh: grossByChannel, discByCh: discByChannel, retByCh: retByChannel,
                     shipByCh: shipByChannel, netByCh: netByChannel }
        }
        return { sku: p, ...computeSkuMetrics(skuDataCacheRef.current[p.id]?.data ?? {}, p) }
    })
    const allSkuGrossTotal   = allSkuMetrics.reduce((s, m) => s + m.grossTotal,        0)
    const allSkuNetTotal     = allSkuMetrics.reduce((s, m) => s + m.netTotal,          0)
    const allSkuFixedTotal   = allSkuMetrics.reduce((s, m) => s + m.fixedCost,         0)
    const allSkuOpProfit     = allSkuMetrics.reduce((s, m) => s + m.operatingProfit,   0)
    const finalMonthlyPL     = allSkuOpProfit - enablerTotal
    const finalMonthlyPLPct  = allSkuNetTotal > 0 ? (finalMonthlyPL / allSkuNetTotal) * 100 : 0
    const finalPlColor = finalMonthlyPLPct >= 20 ? 'text-green-700' : finalMonthlyPLPct >= 10 ? 'text-amber-600' : 'text-red-600'

    // ── Detail modal data ─────────────────────────────────────────────────────
    const skuDetailData = detailModalSku
        ? allSkuMetrics.find(m => m.sku.id === detailModalSku.id) ?? null
        : null
    const d = skuDetailData
    const gpColor = (d?.grossMarginPct ?? 0) >= 30 ? 'text-green-700' : (d?.grossMarginPct ?? 0) >= 15 ? 'text-amber-600' : 'text-red-600'
    const opColor = (d?.operatingMarginPct ?? 0) >= 20 ? 'text-green-700' : (d?.operatingMarginPct ?? 0) >= 10 ? 'text-amber-600' : 'text-red-600'

    const hasVolInput = channels.some(ch => parseFloat(infoData[ch]?.vol) > 0)

    // ── Save / Calculate ──────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false)
    const [brandData, setBrandData] = useState(null)

    // ── Taken months loader ───────────────────────────────────────────────────
    useEffect(() => {
        if (!startAtMonthly || !brandData?.id || !activeYear) return
        const load = async () => {
            setIsMonthsLoading(true)
            try {
                const res = await services.pl.getTakenMonths(brandData.id, activeYear)
                const rows = res?.data?.data ?? res?.data ?? []
                // Use contextRef to get the latest monthlyId at the time the API
                // response arrives, avoiding stale-closure from the dep array.
                const currentMonthlyId = contextRef.current.monthlyId
                const { activeMo } = contextRef.current
                const editingMonthCode = currentMonthlyId && activeMo
                    ? String(MONTH_LABELS_CONST.indexOf(activeMo) + 1).padStart(2, '0')
                    : null
                const taken = rows.filter(r =>
                    editingMonthCode ? r.period_month !== editingMonthCode : r.id !== currentMonthlyId
                ).map(r => r.period_month)
                setTakenMonths(taken)
                setMoByYear(prev => {
                    const cur = prev[activeYear] ?? ''
                    if (!cur) return prev
                    const moCode = String(MONTH_LABELS_CONST.indexOf(cur) + 1).padStart(2, '0')
                    return taken.includes(moCode) ? { ...prev, [activeYear]: '' } : prev
                })
            } finally {
                setIsMonthsLoading(false)
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeYear, brandData?.id, startAtMonthly])

    const channelMap = useMemo(() => Object.fromEntries((brandData?.channels ?? []).map(ch => [ch.name, ch.id])), [brandData])
    const skuMap = useMemo(() => Object.fromEntries((brandData?.skus ?? []).map(s => [s.name, s.id])), [brandData])

    const errMsg = (msg, fallback) =>
        typeof msg === 'string' ? msg : msg ? JSON.stringify(msg) : fallback

    const MONTH_LABELS = MONTH_LABELS_CONST

    const buildMonthlyPayload = (resolvedBrandId, resolvedChannels) => {
        const chId = (ch) => resolvedChannels.find(c => c.name === ch)?.id ?? channelMap[ch]
        const periodMonth = String(MONTH_LABELS.indexOf(activeMo) + 1).padStart(2, '0')
        const periodYear = parseInt(activeYear)
        const resolvedSkuId = selectedSku
        return {
            brand_id: resolvedBrandId,
            sku_id: resolvedSkuId,
            period_month: periodMonth,
            period_year: periodYear,
            status: 'DRAFT',
            sales: channels.map((ch, i) => ({
                channel_id: chId(ch),
                units_sold: parseFloat(infoData[ch]?.vol) || 0,
                actual_selling_price: parseFloat(activeSku.hj?.[ch]?.harga) || 0,
                ads_spend_rate: (parseFloat(adsData[ch]?.rate) || 0) / 100,
                ads_spend_amount: grossByChannel[i] * ((parseFloat(adsData[ch]?.rate) || 0) / 100),
            })),
            diskons: channels.map((ch, i) => ({
                channel_id: chId(ch),
                voucher_pct: (parseFloat(diskonData[ch]?.voucher) || 0) / 100,
                subsidy_pct: (parseFloat(diskonData[ch]?.subsidi) || 0) / 100,
                flash_sale_pct: (parseFloat(diskonData[ch]?.flash) || 0) / 100,
                coin_pct: (parseFloat(diskonData[ch]?.coin) || 0) / 100,
                affiliate_pct: (parseFloat(diskonData[ch]?.affiliate) || 0) / 100,
                bundling_pct: (parseFloat(diskonData[ch]?.bundling) || 0) / 100,
                loyalty_pct: (parseFloat(diskonData[ch]?.loyalty) || 0) / 100,
                total_discount_pct: totalDiskonPct(ch) / 100,
                discount_amount: discByChannel[i],
            })),
            returns: channels.map(ch => ({
                channel_id: chId(ch),
                return_rate_pct: (parseFloat(returnData[ch]?.rate) || 0) / 100,
                return_units: parseFloat(returnData[ch]?.units) || 0,
                estimated_return_value: parseFloat(returnData[ch]?.est) || 0,
                actual_refund_amount: parseFloat(returnData[ch]?.aktual) || 0,
            })),
            ongkirs: channels.map(ch => ({
                channel_id: chId(ch),
                shipping_subsidy: parseFloat(ongkirData[ch]?.subsidi) || 0,
                actual_shipping_cost: parseFloat(ongkirData[ch]?.aktual) || 0,
                processing_fee: parseFloat(ongkirData[ch]?.processing) || 0,
                weight_diff_kg: parseFloat(ongkirData[ch]?.berat) || 0,
            })),
            enabler_var: {
                commission_gmv_rate: (parseFloat(monthlyKomisiRate) || 0) / 100,
                order_count: parseFloat(orders) || 0,
                claim_support: parseFloat(claimData.support) || 0,
                claim_voucher: parseFloat(claimData.voucher) || 0,
                claim_mp_fee: parseFloat(claimData.mpFee) || 0,
                mp_affiliate: parseFloat(claimData.mpAffiliate) || 0,
                campaign_ads_fee: parseFloat(claimData.campaign) || 0,
                custom_var_items: Object.fromEntries(
                    Object.entries(varData).map(([k, v]) => [k, parseFloat(v) || 0])
                ),
            },
            fixed_costs: customRows
                .filter(r => r.name && parseFloat(r.val) > 0)
                .map(r => ({ item_name: r.name, amount: parseFloat(r.val) || 0 })),
            cogs_overrides: channels.map(ch => ({
                channel_id: chId(ch),
                cogs_override: null,
                packaging_override: null,
                cogs_bundling: parseFloat(bundlingData[ch]?.cogs) || null,
                units_per_bundle: parseFloat(bundlingData[ch]?.units) || null,
            })),
        }
    }

    const handleSaveChanges = async () => {
        if (!brandOnly) {
            if (!activeMo) return toast.error(t('selectMonthFirst'))
            if (!activeYear) return toast.error(t('selectYearFirst'))
            if (!selectedSku) return toast.error(t('selectSkuFirst'))
        }

        setIsSaving(true)
        try {
            // ── Flow 1: brandOnly (Brand tab) ─────────────────────────────────
            if (brandOnly) {
                const skusPayload = products.filter(p => p.name).map(p => ({
                    name: p.name,
                    cogs_per_unit: num(p.cogs),
                    packaging_cost: num(p.pkg),
                    is_active: true,
                    channel_prices: channels.map(ch => ({
                        channel_name: ch,
                        selling_price: parseFloat(p.hj?.[ch]?.harga) || 0,
                        diskon_default_pct: (parseFloat(p.hj?.[ch]?.diskon) || 0) / 100,
                    })),
                }))
                const brandPayload = {
                    name: setup.brand_name,
                    category: setup.kategori,
                    ...(setup.enabler && { enabler_name: setup.enabler }),
                    via_enabler: !!setup.enabler,
                    ecom_model: 'MARKETPLACE',
                    status: 'active',
                    channels: channels.map((ch, i) => ({
                        name: ch,
                        is_mall: mallStatus[ch] ?? false,
                        is_active: true,
                        sort_order: i + 1,
                        fee_config: {
                            commission_rate: parseFloat(getChFee(ch, 'comm')) / 100,
                            mall_fee_rate: parseFloat(getChFee(ch, 'mall')) / 100,
                            pgw_rate: parseFloat(getChFee(ch, 'pgw')) / 100,
                        },
                    })),
                    ...(skusPayload.length && { skus: skusPayload }),
                    enabler_fee_config: {
                        retainer_amount: retainerVal,
                        store_operation_fee: sofVal,
                        platform_fee: swiftVal,
                        live_commerce_cost: liveVal,
                        warehouse_cost: gudangVal,
                        commission_gmv_rate: (parseFloat(enablerConfig.komisiRate) || 0) / 100,
                        fulfillment_per_order: fulfilRate,
                        custom_fixed_components: enablerConfig.customFixed.map(r => ({ name: r.name, amount: parseFloat(r.val) || 0 })),
                        custom_var_components: enablerConfig.customVar.map(r => ({ name: r.name, amount: parseFloat(r.val) || 0 })),
                    },
                }
                const brandId = brandData?.id ?? editId
                const res = brandId
                    ? await services.pl.updatePl(brandId, brandPayload)
                    : await services.pl.createPl(brandPayload)
                if (!res?.success) return toast.error(errMsg(res?.message, t('saveError')))
                const saved = res.data?.data ?? res.data ?? null
                setBrandData(saved)
                toast.success(t('saveSuccess'))
                if (onSaveComplete) onSaveComplete(saved?.id ?? brandId)
                return
            }

            // ── Flow 2: startAtMonthly (Add New / Edit from list) ─────────────
            // Brand already exists — skip brand save, only save monthly
            if (startAtMonthly) {
                if (!brandData?.id) return toast.error(t('errorBrandRequired'))
                const payload = buildMonthlyPayload(brandData.id, brandData.channels ?? [])

                // Resolve monthlyId — if null, check if a record already exists for this
                // brand+sku+period (guards against duplicate creates after SKU switching)
                let resolvedMonthlyId = monthlyId
                if (!resolvedMonthlyId) {
                    const periodMonth = String(MONTH_LABELS_CONST.indexOf(activeMo) + 1).padStart(2, '0')
                    const chk = await services.pl.getMonthlyByPeriod(brandData.id, selectedSku, periodMonth, parseInt(activeYear))
                    const existing = chk?.data?.data ?? chk?.data ?? null
                    if (existing?.id) {
                        resolvedMonthlyId = existing.id
                        setMonthlyId(existing.id)
                    }
                }

                const res = resolvedMonthlyId
                    ? await services.pl.updateMonthly(resolvedMonthlyId, payload)
                    : await services.pl.createMonthly(payload)
                if (res?.success) {
                    toast.success(t('saveSuccess'))
                    if (!resolvedMonthlyId) {
                        const newId = res.data?.data?.id ?? res.data?.id
                        if (newId) setMonthlyId(newId)
                    }
                } else {
                    toast.error(errMsg(res?.message, t('saveError')))
                }
                return
            }

            // ── Flow 3: Full setup (new brand + monthly) ──────────────────────
            const skusPayload = products.filter(p => p.name).map(p => ({
                name: p.name,
                cogs_per_unit: num(p.cogs),
                packaging_cost: num(p.pkg),
                is_active: true,
                channel_prices: channels.map(ch => ({
                    channel_name: ch,
                    harga_jual: parseFloat(p.hj?.[ch]?.harga) || 0,
                    diskon_default_pct: (parseFloat(p.hj?.[ch]?.diskon) || 0) / 100,
                })),
            }))
            const brandPayload = {
                name: setup.brand_name,
                category: setup.kategori,
                ...(setup.enabler && { enabler_name: setup.enabler }),
                via_enabler: !!setup.enabler,
                ecom_model: 'MARKETPLACE',
                status: 'active',
                channels: channels.map((ch, i) => ({
                    name: ch,
                    is_mall: mallStatus[ch] ?? false,
                    is_active: true,
                    sort_order: i + 1,
                    fee_config: {
                        commission_rate: parseFloat(getChFee(ch, 'comm')) / 100,
                        mall_fee_rate: parseFloat(getChFee(ch, 'mall')) / 100,
                        pgw_rate: parseFloat(getChFee(ch, 'pgw')) / 100,
                    },
                })),
                ...(skusPayload.length && { skus: skusPayload }),
                ...(setup.enabler && {
                    enabler_fee_config: {
                        retainer_amount: retainerVal,
                        store_operation_fee: sofVal,
                        platform_fee: swiftVal,
                        live_commerce_cost: liveVal,
                        warehouse_cost: gudangVal,
                        commission_gmv_rate: (parseFloat(enablerConfig.komisiRate) || 0) / 100,
                        fulfillment_per_order: fulfilRate,
                        custom_fixed_components: enablerConfig.customFixed.map(r => ({ name: r.name, amount: parseFloat(r.val) || 0 })),
                        custom_var_components: enablerConfig.customVar.map(r => ({ name: r.name, amount: parseFloat(r.val) || 0 })),
                    },
                }),
            }
            const brandId = brandData?.id ?? editId
            const brandRes = brandId
                ? await services.pl.updatePl(brandId, brandPayload)
                : await services.pl.createPl(brandPayload)
            if (!brandRes?.success) return toast.error(errMsg(brandRes?.message, t('saveError')))
            const saved = brandRes.data?.data ?? brandRes.data ?? null
            setBrandData(saved)

            const payload = buildMonthlyPayload(saved.id, saved.channels ?? [])
            const monthlyRes = await services.pl.createMonthly(payload)
            if (monthlyRes?.success) toast.success(t('saveSuccess'))
            else toast.error(errMsg(monthlyRes?.message, t('saveError')))
        } catch {
            toast.error(t('saveError'))
        } finally {
            setIsSaving(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    const step1 = getStepStatus(1)
    const step2 = getStepStatus(2)
    const step3 = getStepStatus(3)

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                                <IconArrowLeft size={16} />
                            </Button>
                        )}
                        <H3 className="text-xl font-bold">{brandOnly ? t('colBrand') : editId ? t('editTitle') : t('title')}</H3>
                    </div>
                </div>
                <div className="px-4 lg:px-6"><Separator /></div>

                <div className="px-4 lg:px-6 py-4 pb-20 space-y-4">

                    {/* ═══════════════════════════════════════════════════════
                        SETUP PHASE
                    ═══════════════════════════════════════════════════════ */}
                    {!setupDone && (
                        <>
                            {/* Progress bar */}
                            <SetupProgress
                                steps={[t('setupStep1Progress'), t('setupStep2Progress'), t('setupStep3Progress')]}
                                currentStep={setupStep}
                                completedSteps={completedSetupSteps}
                                onStepClick={handleStepOpen}
                            />

                            {/* ── Step 1: Brand & Channel ─────────────────── */}
                            <SetupStepCard
                                number={1}
                                title={t('step1Title')}
                                subtitle={t('step1Subtitle')}
                                {...step1}
                                onOpen={() => handleStepOpen(1)}
                                onNext={() => {
                                    if (!setup.brand_name) return toast.error(t('errorBrandRequired'))
                                    if (!setup.kategori) return toast.error(t('errorCategoryRequired'))
                                    if (channels.length === 0) return toast.error(t('errorChannelRequired'))
                                    doneSetupStep(1)
                                }}
                                nextLabel={t('nextStep')}
                                finishLabel={t('finishSetup')}
                                donePillLabel={t('stepStatusDone')}
                                activePillLabel={t('stepStatusActive')}
                                pendingPillLabel={t('stepStatusPending')}
                            >
                                <div className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <FieldInput
                                            label={t('brandName')}
                                            value={setup.brand_name}
                                            onChange={v => setS('brand_name', v)}
                                            placeholder={t('brandNamePlaceholder')}
                                            type="text"
                                        />
                                        <div className="grid gap-1">
                                            <Label>{t('productCategory')} <span className="text-red-500">*</span></Label>
                                            <Input
                                                value={setup.kategori}
                                                onChange={e => setS('kategori', e.target.value)}
                                                placeholder={t('selectCategory')}
                                            />
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="grid gap-1">
                                        <Label>{t('ecommerceEnabler')}</Label>
                                        <p className="text-xs text-muted-foreground">{t('enablerSubtitle')}</p>
                                        <Input
                                            value={setup.enabler}
                                            onChange={e => setS('enabler', e.target.value)}
                                            placeholder={t('enablerNamePlaceholder')}
                                        />
                                    </div>
                                    <Separator />
                                    <div className="grid gap-2">
                                        <Label>{t('targetPlatform')}</Label>
                                        <p className="text-xs text-muted-foreground">{t('platformSubtitle')}</p>
                                        {/* Tag input */}
                                        <div
                                            className="flex flex-wrap gap-1.5 min-h-10 rounded-md border border-input px-3 py-2 cursor-text"
                                            onClick={() => document.getElementById('ch-tag-inp').focus()}
                                        >
                                            {channels.map(ch => (
                                                <span key={ch} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-muted border">
                                                    {ch}
                                                    <span className="cursor-pointer opacity-50 hover:opacity-100 leading-none" onClick={e => { e.stopPropagation(); removeChannel(ch) }}>×</span>
                                                </span>
                                            ))}
                                            <input
                                                id="ch-tag-inp"
                                                className="flex-1 min-w-24 text-sm bg-transparent outline-none"
                                                value={tagInput}
                                                onChange={e => setTagInput(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChannel(tagInput); setTagInput('') }
                                                    else if (e.key === 'Backspace' && !tagInput && channels.length > 0) removeChannel(channels[channels.length - 1])
                                                }}
                                                placeholder={channels.length === 0 ? t('addChannelPlaceholder') : ''}
                                            />
                                        </div>
                                    </div>
                                    {/* Mall toggle section */}
                                    {channels.length > 0 && (
                                        <div className="grid gap-2">
                                            <Label>{t('mallToggleTitle')}</Label>
                                            {channels.map(ch => (
                                                <div key={ch} className="flex items-center justify-between rounded-md border px-4 py-3">
                                                    <div>
                                                        <p className="text-sm font-medium">{ch}</p>
                                                        <p className="text-xs text-muted-foreground">{ch} Official Store / Mall</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={!!mallStatus[ch]}
                                                        onClick={() => setMallStatus(prev => ({ ...prev, [ch]: !prev[ch] }))}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${mallStatus[ch] ? 'bg-primary' : 'bg-input'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${mallStatus[ch] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </SetupStepCard>

                            {/* ── Step 2: Biaya & Enabler ─────────────────── */}
                            <SetupStepCard
                                number={2}
                                title={t('step2Title')}
                                subtitle={t('step2Subtitle')}
                                {...step2}
                                onOpen={() => handleStepOpen(2)}
                                onNext={() => doneSetupStep(2)}
                                nextLabel={t('nextStep')}
                                finishLabel={t('finishSetup')}
                                donePillLabel={t('stepStatusDone')}
                                activePillLabel={t('stepStatusActive')}
                                pendingPillLabel={t('stepStatusPending')}
                            >
                                <div className="space-y-5">
                                    {/* Channel fees */}
                                    {channels.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                                {t('channelFeeTableHeader')}
                                            </p>
                                            <div className="overflow-x-auto rounded-lg border">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-muted/40">
                                                            <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px]">{t('colChannel')}</th>
                                                            <ChTh>{t('commissionPct')}</ChTh>
                                                            <ChTh>{t('mallFeePct')}</ChTh>
                                                            <ChTh>{t('pgwRatePct')}</ChTh>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {channels.map(ch => (
                                                            <tr key={ch} className="border-t">
                                                                <td className="px-4 py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                {['comm', 'mall', 'pgw'].map(key => (
                                                                    <td key={key} className="py-2.5 px-2 text-right">
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            value={getChFee(ch, key)}
                                                                            onChange={e => setChFee(ch, key, e.target.value)}
                                                                            className="w-20 text-right text-xs px-2 py-1.5 rounded border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
                                                                        />
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    <Separator />

                                    {/* Fixed Cost Enabler */}
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                            {t('fixedCostEnabler')}{setup.enabler && <span className="font-normal text-primary normal-case tracking-normal ml-1">({setup.enabler})</span>}
                                        </p>
                                        <div className="space-y-2">
                                            {enablerConfig.customFixed.map(r => (
                                                <div key={r.id} className="flex items-center gap-2">
                                                    <Input
                                                        placeholder={t('customFixedPlaceholder')}
                                                        value={r.name}
                                                        onChange={e => setEC('customFixed', enablerConfig.customFixed.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))}
                                                        className="flex-1 h-9 text-sm"
                                                    />
                                                    <FieldInput value={r.val} onChange={v => setEC('customFixed', enablerConfig.customFixed.map(x => x.id === r.id ? { ...x, val: v } : x))} prefix="Rp" label="" />
                                                    <button type="button" onClick={() => setEC('customFixed', enablerConfig.customFixed.filter(x => x.id !== r.id))} className="w-8 h-8 flex items-center justify-center rounded border text-muted-foreground hover:text-destructive text-sm">×</button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => setEC('customFixed', [...enablerConfig.customFixed, { id: Date.now(), name: '', val: '' }])} className="text-xs text-primary hover:underline">{t('addFixedRow')}</button>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Variable Cost Enabler */}
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                            {t('variableCostEnabler')}
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                                            <FieldInput label={t('komisiGmvRate')} subtitle={t('pctGrossGmv')} value={enablerConfig.komisiRate} onChange={v => setEC('komisiRate', v)} suffix="% GMV" disabled />
                                        </div>
                                        <div className="space-y-2">
                                            {enablerConfig.customVar.map(r => (
                                                <div key={r.id} className="flex items-center gap-2">
                                                    <Input placeholder={t('customVarPlaceholder')} value={r.name} onChange={e => setEC('customVar', enablerConfig.customVar.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} className="flex-1 h-9 text-sm" />
                                                    <FieldInput value={r.val} onChange={() => { }} prefix="Rp" label="" disabled />
                                                    <button type="button" onClick={() => setEC('customVar', enablerConfig.customVar.filter(x => x.id !== r.id))} className="w-8 h-8 flex items-center justify-center rounded border text-muted-foreground hover:text-destructive text-sm">×</button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => setEC('customVar', [...enablerConfig.customVar, { id: Date.now(), name: '', val: '' }])} className="text-xs text-primary hover:underline">{t('addVarRow')}</button>
                                        </div>
                                    </div>
                                </div>
                            </SetupStepCard>

                            {/* ── Step 3: Produk & COGS ───────────────────── */}
                            <SetupStepCard
                                number={3}
                                title={t('step3Title')}
                                subtitle={t('step3Subtitle')}
                                {...step3}
                                onOpen={() => handleStepOpen(3)}
                                onNext={() => {
                                    const named = products.filter(p => p.name)
                                    if (named.length === 0) return toast.error(t('errorSkuRequired'))
                                    const missingPrice = named.some(p =>
                                        channels.some(ch => !(parseFloat(p.hj?.[ch]?.harga) > 0))
                                    )
                                    if (missingPrice) return toast.error(t('errorSkuPriceRequired'))
                                    if (brandOnly) handleSaveChanges()
                                    else doneSetupStep(3)
                                }}
                                nextLabel={t('nextStep')}
                                finishLabel={brandOnly ? t('saveBrand') : t('finishSetup')}
                                donePillLabel={t('stepStatusDone')}
                                activePillLabel={t('stepStatusActive')}
                                pendingPillLabel={t('stepStatusPending')}
                                isLast
                            >
                                <div className="space-y-4">
                                    <ProductTabs
                                        products={products}
                                        activeIndex={activeIdx}
                                        onSelect={setActiveIdx}
                                        onAdd={addProduct}
                                        onRemove={removeProduct}
                                        addLabel={t('addProduct')}
                                    />

                                    {/* SKU chooser */}
                                    <InnerCard title={t('chooseSku')}>
                                        {p.sku ? (
                                            <div className="space-y-2">
                                                <div className="rounded-md border bg-card p-3 space-y-0.5">
                                                    <p className="text-sm font-semibold">{p.sku.product_name || p.sku.name || '—'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.sku.sku_code}
                                                        {p.sku.variant && ` · ${p.sku.variant}`}
                                                    </p>
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full" onClick={openSkuModal}>
                                                    {t('changeSku')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={openSkuModal}
                                                className="w-full rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/50 transition-colors text-center"
                                            >
                                                {t('noSkuSelected')}
                                            </button>
                                        )}
                                    </InnerCard>

                                    {/* COGS + Packaging */}
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <FieldInput label={t('cogsPerUnit')} value={p.cogs} onChange={v => updateP('cogs', v)} prefix="Rp" />
                                        <FieldInput label={t('packagingPerUnit')} value={p.pkg} onChange={v => updateP('pkg', v)} prefix="Rp" />
                                    </div>

                                    {/* Harga jual per channel */}
                                    {channels.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('hjPerChannel')}</p>
                                            <div className="overflow-x-auto rounded-lg border">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-muted/40">
                                                            <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('colChannel')}</th>
                                                            <ChTh>{t('colHargaJualRp')}</ChTh>
                                                            <ChTh>{t('colDiskonDefaultPct')}</ChTh>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {channels.map(ch => (
                                                            <tr key={ch} className="border-t">
                                                                <td className="px-4 py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        currency
                                                                        value={p.hj[ch]?.harga ?? ''}
                                                                        onChange={v => updateP('hj', { ...p.hj, [ch]: { ...p.hj[ch], harga: v } })}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        value={p.hj[ch]?.diskon ?? ''}
                                                                        onChange={v => updateP('hj', { ...p.hj, [ch]: { ...p.hj[ch], diskon: v } })}
                                                                        step="0.1"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </SetupStepCard>
                        </>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        MONTHLY P&L PHASE
                    ═══════════════════════════════════════════════════════ */}
                    {setupDone && !brandOnly && (
                        <>
                            {/* Setup summary */}
                            <SetupSummaryCard
                                setup={setup}
                                activeChannels={channels.map(ch => ({ code: ch, label: ch }))}
                                onEditSetup={() => setSetupDone(false)}
                                editLabel={t('editSetup')}
                            />

                            {/* Period selector */}
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{t('periodeTitle')} <span className="text-red-500">*</span></p>
                                {/* Year dropdown — above months */}
                                <div className="mb-3">
                                    <Label className="text-xs mb-1 block">{t('yearLabel')}</Label>
                                    <Select
                                        value={activeYear}
                                        onValueChange={val => setActiveYear(val)}
                                    >
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder={t('yearLabel')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 30 }, (_, i) => {
                                                const y = String(new Date().getFullYear() - i)
                                                return <SelectItem key={y} value={y}>{y}</SelectItem>
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Month chips */}
                                <div className="flex flex-wrap gap-1.5">
                                    {isMonthsLoading
                                        ? MONTH_LABELS_CONST.map(m => (
                                            <Skeleton key={m} className="h-8 w-11 rounded" />
                                        ))
                                        : MONTH_LABELS_CONST.map((m, i) => {
                                            const monthCode = String(i + 1).padStart(2, '0')
                                            const isTaken = takenMonths.includes(monthCode)
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    disabled={isTaken}
                                                    onClick={() => !isTaken && setActiveMo(m)}
                                                    className={`h-8 w-11 rounded text-xs font-medium border transition-colors
                                                        ${activeMo === m ? 'bg-primary text-primary-foreground border-primary'
                                                            : isTaken ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50'
                                                                : 'bg-card hover:bg-muted/50'}`}
                                                >{m}</button>
                                            )
                                        })
                                    }
                                </div>
                            </div>

                            {/* Monthly Enabler Cost — fixed prefilled, variable required */}
                            <SectionCard
                                icon={<IconBuildingStore size={18} />}
                                title={t('monthlyEnablerCostTitle')}
                                subtitle={t('monthlyEnablerCostSubtitle')}
                            >
                                <div className="-mx-5 -mb-5 mt-5">
                                    {/* Fixed Cost section */}
                                    <PnLAccordion
                                        title={t('enablerFixedTitle')}
                                        subtitle={t('enablerFixedSubtitle')}
                                        pillVariant="prefilled"
                                        pillText={t('pillPrefilled')}
                                        defaultOpen
                                    >
                                        <div className="divide-y">
                                            {enablerConfig.customFixed.filter(r => parseFloat(r.val) > 0).map(r => (
                                                <div key={r.id} className="flex items-center justify-between py-2.5">
                                                    <p className="text-xs font-medium">{r.name || '—'}</p>
                                                    <span className="text-xs font-semibold text-teal-700 tabular-nums">{fmt(parseFloat(r.val))}</span>
                                                </div>
                                            ))}
                                            {enablerFixedTotal > 0 ? (
                                                <div className="flex justify-between py-2.5">
                                                    <span className="text-xs text-muted-foreground">{t('subtotalFixed')}</span>
                                                    <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(enablerFixedTotal)})</span>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground py-2 text-center">{t('configureEnablerHint')}</p>
                                            )}
                                        </div>
                                    </PnLAccordion>

                                    {/* Variable Cost section — editable monthly values, names from brand */}
                                    <PnLAccordion
                                        title={t('enablerVarTitle')}
                                        subtitle={t('enablerVarSubtitle')}
                                        pillVariant={customVarTotal > 0 ? "filled" : "required"}
                                        pillText={customVarTotal > 0 ? t('pillFilled') : t('pillRequired')}
                                        defaultOpen
                                    >
                                        <div className="divide-y">
                                            <div className="flex items-center justify-between py-2.5">
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium">{t('komisiGmvLabel')}</p>
                                                    <p className="text-[11px] text-muted-foreground">{t('pctGrossGmv')}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={monthlyKomisiRate}
                                                        onChange={e => setMonthlyKomisiRate(e.target.value)}
                                                        placeholder="0"
                                                        className={`w-20 text-right text-xs px-2 py-1.5 rounded border outline-none ${(parseFloat(monthlyKomisiRate) || 0) > 0 ? 'border-green-300 bg-green-50 text-green-900' : 'border-orange-300 bg-orange-50'}`}
                                                    />
                                                    <span className="text-xs text-muted-foreground">% GMV</span>
                                                </div>
                                            </div>
                                            {enablerConfig.customVar.filter(r => r.name).map(r => (
                                                <div key={r.id} className="flex items-center justify-between py-2.5">
                                                    <p className="text-xs font-medium">{r.name}</p>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-xs text-muted-foreground">Rp</span>
                                                        <ChInput
                                                            currency
                                                            value={varData[r.name] ?? ''}
                                                            onChange={v => setVarData(prev => ({ ...prev, [r.name]: v }))}
                                                            highlight={(parseFloat(varData[r.name]) || 0) > 0 ? 'filled' : 'warn'}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {enablerConfig.customVar.filter(r => r.name).length === 0 && (
                                                <p className="text-xs text-muted-foreground py-2 text-center">{t('configureEnablerHint')}</p>
                                            )}
                                            {customVarTotal > 0 && (
                                                <div className="flex justify-between py-2.5">
                                                    <span className="text-xs text-muted-foreground">{t('subtotalVar')}</span>
                                                    <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(customVarTotal)})</span>
                                                </div>
                                            )}
                                        </div>
                                    </PnLAccordion>
                                </div>
                            </SectionCard>

                            {/* SKU selector — chips */}
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('skuTitle')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {products.filter(p => p.name).map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedSku(p.id)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                                                ${selectedSku === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                                {selectedSku && activeSku.cogs && (
                                    <p className="text-xs text-muted-foreground mt-2">COGS: {fmt(parseFloat(activeSku.cogs) || 0)} · Packaging: {fmt(parseFloat(activeSku.pkg) || 0)}</p>
                                )}
                            </div>

                            {/* Monthly P&L accordion card */}
                            {channels.length > 0 && (
                                <SectionCard
                                    icon={<IconPresentationAnalytics size={18} />}
                                    title={t('monthlyPnlTitle')}
                                    subtitle={t('monthlyPnlSubtitle')}
                                >
                                    <div className="-mx-5 -mb-5 mt-5">

                                        {/* A. Info Dasar */}
                                        <PnLAccordion
                                            title={t('infoDasarTitle')}
                                            subtitle={t('infoDasarSubtitle')}
                                            pillVariant={secFilled.info ? "filled" : "required"}
                                            pillText={secFilled.info ? t('pillFilled') : t('pillRequired')}
                                            defaultOpen
                                        >
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">{t('colChannel')}</th>
                                                            <ChTh>{t('colHargaJual')}</ChTh>
                                                            <ChTh>{t('colVolumeTerjual')}</ChTh>
                                                            <ChTh>{t('colGrossGmv')}</ChTh>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {channels.map((ch, i) => {
                                                            const vol = parseFloat(infoData[ch]?.vol) || 0
                                                            const prefillHj = activeSku.hj?.[ch]?.harga ?? ''
                                                            return (
                                                                <tr key={ch} className="border-t">
                                                                    <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                    {/* Selling price — prefilled read-only */}
                                                                    <td className="py-2.5 px-2 text-right">
                                                                        <span className="inline-flex items-center rounded border border-teal-300 bg-teal-50 px-2 py-1.5 text-xs font-medium text-teal-700 tabular-nums whitespace-nowrap">
                                                                            {prefillHj ? fmtCurrency(prefillHj) : '—'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2.5 px-2 text-right">
                                                                        <ChInput
                                                                            value={infoData[ch]?.vol ?? ''}
                                                                            onChange={v => {
                                                                                setInfoData(prev => ({ ...prev, [ch]: { ...prev[ch], vol: v } }))
                                                                                if (parseFloat(v) > 0) markFilled('info')
                                                                            }}
                                                                            highlight={vol > 0 ? 'filled' : 'warn'}
                                                                        />
                                                                    </td>
                                                                    <td className="py-2.5 px-2 text-right text-xs font-medium tabular-nums">
                                                                        {grossByChannel[i] > 0 ? fmt(grossByChannel[i]) : '—'}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </PnLAccordion>

                                        {/* B. COGS */}
                                        <PnLAccordion
                                            title={t('cogsAccordionTitle')}
                                            subtitle={t('cogsAccordionSubtitle')}
                                            pillVariant="prefilled"
                                            pillText={t('pillPrefilled')}
                                        >
                                            <div className="divide-y mt-2">
                                                <div className="flex justify-between items-center py-2.5">
                                                    <div>
                                                        <p className="text-xs font-medium">{t('cogsPerUnitRow')}</p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-teal-700 tabular-nums">{activeSku.cogs ? fmt(parseFloat(activeSku.cogs) || 0) : '—'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2.5">
                                                    <div>
                                                        <p className="text-xs font-medium">{t('packagingPerUnitRow')}</p>
                                                        <p className="text-[11px] text-muted-foreground">{t('packagingDesc')}</p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-teal-700 tabular-nums">{activeSku.pkg ? fmt(parseFloat(activeSku.pkg) || 0) : '—'}</span>
                                                </div>
                                                {/* COGS bundling per channel */}
                                                <div className="pt-3">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('cogsBundlingTitle')}</p>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full border-collapse text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('colChannel')}</th>
                                                                    <ChTh>{t('colCogsBundling')}</ChTh>
                                                                    <ChTh>{t('colIsiBundling')}</ChTh>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {channels.map(ch => (
                                                                    <tr key={ch} className="border-t">
                                                                        <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                        <td className="py-2.5 px-2 text-right">
                                                                            <ChInput
                                                                                currency
                                                                                value={bundlingData[ch]?.cogs ?? ''}
                                                                                onChange={v => setBundlingData(prev => ({ ...prev, [ch]: { ...prev[ch], cogs: v } }))}
                                                                            />
                                                                        </td>
                                                                        <td className="py-2.5 px-2 text-right">
                                                                            <ChInput
                                                                                value={bundlingData[ch]?.units ?? ''}
                                                                                onChange={v => setBundlingData(prev => ({ ...prev, [ch]: { ...prev[ch], units: v } }))}
                                                                                placeholder="1"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </PnLAccordion>

                                        {/* C. Return Rate */}
                                        <PnLAccordion
                                            title={t('returnRateTitle')}
                                            subtitle={t('returnRateSubtitle')}
                                            pillVariant={secFilled.ret ? "filled" : "required"}
                                            pillText={secFilled.ret ? t('pillFilled') : t('pillRequired')}
                                        >
                                            <div className="overflow-x-auto mt-2">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">{t('colChannel')}</th>
                                                            <ChTh>{t('colReturnRate')}</ChTh>
                                                            <ChTh>{t('colJmlUnitReturn')}</ChTh>
                                                            <ChTh>{t('colReturnEst')}</ChTh>
                                                            <ChTh>{t('colRefundAktual')}</ChTh>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {channels.map(ch => (
                                                            <tr key={ch} className="border-t">
                                                                <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        value={returnData[ch]?.rate ?? ''}
                                                                        onChange={v => {
                                                                            setReturnData(prev => ({ ...prev, [ch]: { ...prev[ch], rate: v } }))
                                                                            if (parseFloat(v) > 0) markFilled('ret')
                                                                        }}
                                                                        step="0.1"
                                                                        highlight={(parseFloat(returnData[ch]?.rate) || 0) > 0 ? 'filled' : 'warn'}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        value={returnData[ch]?.units ?? ''}
                                                                        onChange={v => setReturnData(prev => ({ ...prev, [ch]: { ...prev[ch], units: v } }))}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        currency
                                                                        value={returnData[ch]?.est ?? ''}
                                                                        onChange={v => setReturnData(prev => ({ ...prev, [ch]: { ...prev[ch], est: v } }))}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        currency
                                                                        value={returnData[ch]?.aktual ?? ''}
                                                                        onChange={v => setReturnData(prev => ({ ...prev, [ch]: { ...prev[ch], aktual: v } }))}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </PnLAccordion>

                                        {/* D. Diskon Seller */}
                                        <PnLAccordion
                                            title={t('diskonSellerTitle')}
                                            subtitle={t('diskonSellerSubtitle')}
                                            pillVariant={secFilled.diskon ? "filled" : "required"}
                                            pillText={secFilled.diskon ? t('pillFilled') : t('pillRequired')}
                                        >
                                            <div className="overflow-x-auto mt-2">
                                                <table className="w-full border-collapse text-sm" style={{ minWidth: 880 }}>
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[100px]">{t('colChannel')}</th>
                                                            {DISKON_LABELS.map(h => <ChTh key={h}>{h}</ChTh>)}
                                                            <ChTh>{t('colTotalPct')}</ChTh>
                                                            <ChTh>{t('colNilai')}</ChTh>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {channels.map(ch => (
                                                            <tr key={ch} className="border-t">
                                                                <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                {DISKON_KEYS.map(k => (
                                                                    <td key={k} className="py-2.5 px-1 text-right">
                                                                        <ChInput
                                                                            value={diskonData[ch]?.[k] ?? ''}
                                                                            onChange={v => {
                                                                                setDiskonData(prev => ({ ...prev, [ch]: { ...prev[ch], [k]: v } }))
                                                                                if (parseFloat(v) > 0) markFilled('diskon')
                                                                            }}
                                                                            step="0.1"
                                                                            highlight={(parseFloat(diskonData[ch]?.[k]) || 0) > 0 ? 'filled' : undefined}
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <span className="text-xs font-semibold tabular-nums bg-muted px-2 py-1 rounded whitespace-nowrap">
                                                                        {totalDiskonPct(ch).toFixed(1)}%
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        currency
                                                                        value={diskonData[ch]?.nilai ?? ''}
                                                                        onChange={v => setDiskonData(prev => ({ ...prev, [ch]: { ...prev[ch], nilai: v } }))}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </PnLAccordion>

                                        {/* E. Ongkir */}
                                        <PnLAccordion
                                            title={t('ongkirTitle')}
                                            subtitle={t('ongkirSubtitle')}
                                            pillVariant="optional"
                                            pillText={t('pillOptional')}
                                        >
                                            <div className="overflow-x-auto mt-2">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">{t('colChannel')}</th>
                                                            <ChTh>{t('colSubsidiOngkir')}</ChTh>
                                                            <ChTh>{t('colOngkirAktual')}</ChTh>
                                                            <ChTh>{t('colBiayaPemrosesan')}</ChTh>
                                                            <ChTh>{t('colSelisihBerat')}</ChTh>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {channels.map(ch => (
                                                            <tr key={ch} className="border-t">
                                                                <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        currency
                                                                        value={ongkirData[ch]?.subsidi ?? ''}
                                                                        onChange={v => setOngkirData(prev => ({ ...prev, [ch]: { ...prev[ch], subsidi: v } }))}
                                                                        highlight={(parseFloat(ongkirData[ch]?.subsidi) || 0) > 0 ? 'filled' : undefined}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        currency
                                                                        value={ongkirData[ch]?.aktual ?? ''}
                                                                        onChange={v => setOngkirData(prev => ({ ...prev, [ch]: { ...prev[ch], aktual: v } }))}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput currency value={ongkirData[ch]?.processing ?? ''} onChange={v => setOngkirData(prev => ({ ...prev, [ch]: { ...prev[ch], processing: v } }))} />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput value={ongkirData[ch]?.berat ?? ''} onChange={v => setOngkirData(prev => ({ ...prev, [ch]: { ...prev[ch], berat: v } }))} step="0.01" />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </PnLAccordion>

                                        {/* F. Ads Spend */}
                                        <PnLAccordion
                                            title={t('adsSpendTitle')}
                                            subtitle={t('adsSpendSubtitle')}
                                            pillVariant={secFilled.ads ? "filled" : "required"}
                                            pillText={secFilled.ads ? t('pillFilled') : t('pillRequired')}
                                        >
                                            <div className="overflow-x-auto mt-2">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">{t('colChannel')}</th>
                                                            <ChTh>{t('colRateGmv')}</ChTh>
                                                            <ChTh>{t('colNilaiRp')}</ChTh>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {channels.map(ch => (
                                                            <tr key={ch} className="border-t">
                                                                <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        value={adsData[ch]?.rate ?? ''}
                                                                        onChange={v => {
                                                                            setAdsData(prev => ({ ...prev, [ch]: { ...prev[ch], rate: v } }))
                                                                            markFilled('ads')
                                                                        }}
                                                                        step="0.1"
                                                                        highlight={(parseFloat(adsData[ch]?.rate) || 0) > 0 ? 'filled' : 'warn'}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right text-xs font-medium tabular-nums">
                                                                    {(parseFloat(adsData[ch]?.rate) || 0) > 0
                                                                        ? fmt(grossTotal * (parseFloat(adsData[ch].rate) / 100))
                                                                        : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </PnLAccordion>

                                        {/* G. Biaya Channel (pre-filled) */}
                                        <PnLAccordion
                                            title={t('biayaChannelTitle')}
                                            subtitle={t('biayaChannelSubtitle')}
                                            pillVariant="prefilled"
                                            pillText={t('pillPrefilled')}
                                        >
                                            <table className="w-full border-collapse text-sm mt-2">
                                                <thead>
                                                    <tr>
                                                        <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('colChannel')}</th>
                                                        <ChTh>{t('colCommission')}</ChTh>
                                                        <ChTh>{t('colMallFee')}</ChTh>
                                                        <ChTh>{t('colPgw')}</ChTh>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {channels.map(ch => (
                                                        <tr key={ch} className="border-t">
                                                            <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                            <td className="py-2.5 px-2 text-right text-xs font-semibold text-teal-700">{getChFee(ch, 'comm')}%</td>
                                                            <td className="py-2.5 px-2 text-right text-xs font-semibold text-teal-700">{getChFee(ch, 'mall')}%</td>
                                                            <td className="py-2.5 px-2 text-right text-xs font-semibold text-teal-700">{getChFee(ch, 'pgw')}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </PnLAccordion>

                                        {/* H. Fixed Cost */}
                                        <PnLAccordion
                                            title={t('fixedCostTitle')}
                                            subtitle={t('fixedCostSubtitle')}
                                            pillVariant={secFilled.fixed ? "filled" : "required"}
                                            pillText={secFilled.fixed ? t('pillFilled') : t('pillRequired')}
                                        >
                                            <div className="divide-y mt-2">
                                                {customRows.map(r => (
                                                    <div key={r.id} className="flex items-center gap-2 py-2.5">
                                                        <Input
                                                            placeholder={t('costNamePlaceholder')}
                                                            value={r.name}
                                                            onChange={e => setCustomRows(prev => prev.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))}
                                                            className="flex-1 h-8 text-xs"
                                                        />
                                                        <span className="text-xs text-muted-foreground flex-shrink-0">Rp</span>
                                                        <ChInput
                                                            currency
                                                            value={r.val}
                                                            onChange={v => {
                                                                setCustomRows(prev => prev.map(x => x.id === r.id ? { ...x, val: v } : x))
                                                                markFilled('fixed')
                                                            }}
                                                            highlight={(parseFloat(r.val) || 0) > 0 ? 'filled' : 'warn'}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setCustomRows(prev => prev.filter(x => x.id !== r.id))}
                                                            className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors text-sm"
                                                        >×</button>
                                                    </div>
                                                ))}

                                                <div className="flex items-center justify-between py-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCustomRows(prev => [...prev, { id: Date.now(), name: '', val: '' }])}
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >{t('addCostItem')}</button>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-muted-foreground">{t('totalFixedCost')}</span>
                                                        <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(fixedTotal)})</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </PnLAccordion>

                                    </div>

                                </SectionCard>
                            )}

                            {/* Hasil Kalkulasi */}
                            {channels.length > 0 && (
                                <SectionCard
                                    icon={<IconPresentationAnalytics size={18} />}
                                    title={t('hasilKalkulasiTitle')}
                                    subtitle={t('hasilKalkulasiSubtitle')}
                                >
                                    {/* Per-SKU Summary Table */}
                                    <div className="rounded-lg border overflow-hidden mt-5">
                                        <div className="px-4 py-3 border-b">
                                            <p className="text-sm font-semibold">{t('perSkuSummaryTitle')}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{t('perSkuSummarySubtitle')}</p>
                                        </div>
                                        <div className="p-4 overflow-x-auto">
                                            <table className="w-full border-collapse" style={{ minWidth: 560 }}>
                                                <thead>
                                                    <tr>
                                                        <th className="text-left pb-2 pl-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('colSku')}</th>
                                                        <ChTh>{t('colGrossGmv')}</ChTh>
                                                        <ChTh>{t('colNetGmv')}</ChTh>
                                                        <ChTh>{t('fixedCostTitle')}</ChTh>
                                                        <ChTh className="pr-4">{t('colBlendedGM')}</ChTh>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allSkuMetrics.map(m => (
                                                        <tr key={m.sku.id}
                                                            className={`border-t cursor-pointer hover:bg-muted/30 transition-colors ${m.sku.id === selectedSku ? 'bg-primary/5' : ''}`}
                                                            onClick={() => setDetailModalSku(m.sku)}
                                                        >
                                                            <td className="py-2.5 pl-4 text-xs font-medium">{m.sku.name}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums">{fmt(m.grossTotal)}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums">{fmt(m.netTotal)}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">
                                                                {m.fixedCost > 0 ? `− ${fmt(m.fixedCost)}` : <span className="text-muted-foreground">—</span>}
                                                            </td>
                                                            <td className="py-2.5 px-2 pr-4 text-right text-xs tabular-nums font-semibold">
                                                                <span className={m.operatingProfit < 0 ? 'text-red-600' : 'text-green-700'}>{fmt(m.operatingProfit)}</span>
                                                                <span className="text-[10px] font-normal text-muted-foreground ml-1">({m.operatingMarginPct.toFixed(1)}%)</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {namedProducts.length > 1 && (
                                                        <tr className="border-t bg-muted/40">
                                                            <td className="py-2.5 pl-4 text-xs font-semibold">{t('totalRow')}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums">{fmt(allSkuGrossTotal)}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums">{fmt(allSkuNetTotal)}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">
                                                                {allSkuFixedTotal > 0 ? `− ${fmt(allSkuFixedTotal)}` : <span className="text-muted-foreground">—</span>}
                                                            </td>
                                                            <td className={`py-2.5 px-2 pr-4 text-right text-xs font-bold tabular-nums ${allSkuOpProfit < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                                {fmt(allSkuOpProfit)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Monthly P&L Summary */}
                                    <div className="rounded-lg border overflow-hidden mt-4">
                                        <div className="px-4 py-3 border-b flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${finalMonthlyPLPct >= 20 ? 'bg-green-600' : finalMonthlyPLPct >= 10 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            <div>
                                                <p className="text-sm font-semibold">{t('monthlyPlSummaryTitle')}</p>
                                                <p className="text-xs text-muted-foreground">{t('monthlyPlSummarySubtitle')}</p>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="space-y-1.5">
                                                {[
                                                    [t('rowAllSkuOpProfit'), fmt(allSkuOpProfit), ''],
                                                    [t('rowDeductEnablerFixed'), fmt(enablerFixedTotal), 'd'],
                                                    [t('rowDeductEnablerVar'), fmt(enablerVarTotal), 'd'],
                                                ].map(([label, val, type]) => (
                                                    <div key={label} className="flex justify-between">
                                                        <span className="text-xs text-muted-foreground">{label}</span>
                                                        <span className={`text-xs tabular-nums ${type === 'd' ? 'text-red-600' : ''}`}>{val}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-baseline border-t pt-2 mt-1">
                                                    <span className="text-xs font-semibold">{t('rowFinalMonthlyPL')}</span>
                                                    <div className="text-right">
                                                        <span className={`text-base font-bold tabular-nums ${finalPlColor}`}>{fmt(finalMonthlyPL)}</span>
                                                        <span className={`text-xs font-semibold ml-1.5 ${finalPlColor}`}>({finalMonthlyPLPct.toFixed(1)}%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </SectionCard>
                            )}
                        </>
                    )}

                </div>
            </div>

            {/* ── Fixed Footer (only in Monthly P&L phase) ──────────────────── */}
            {setupDone && !brandOnly && (
                <div
                    className="fixed bottom-0 right-0 z-10 border-t bg-background transition-[left] duration-200 ease-linear"
                    style={{ left: sidebarOpen ? 'var(--sidebar-width)' : '0' }}
                >
                    <div className="flex justify-end px-4 lg:px-6 py-3">
                        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? t('saving') : t('saveChanges')}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── SKU Detail Modal ─────────────────────────────────────────── */}
            <Dialog open={!!detailModalSku} onOpenChange={open => !open && setDetailModalSku(null)}>
                <DialogContent className="w-full md:w-[90vw] md:max-w-5xl flex flex-col gap-0 p-0 overflow-hidden h-[92vh] md:h-auto md:max-h-[88vh]">
                    <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b flex-shrink-0">
                        <DialogTitle>{detailModalSku?.name}</DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('skuDetailModalSubtitle')}</p>
                    </DialogHeader>
                    {skuDetailData && (
                        <div className="overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
                            {/* 3 summary cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="rounded-lg border overflow-hidden">
                                    <div className="px-4 py-3 border-b flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-sm bg-blue-500 flex-shrink-0" />
                                        <span className="text-sm font-semibold">{t('grossGmvCardTitle')}</span>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xl font-semibold tabular-nums mb-0.5">{fmt(skuDetailData.grossTotal)}</p>
                                        <p className="text-xs text-muted-foreground mb-3">{t('grossGmvCardDesc')}</p>
                                        <div className="space-y-2 border-t pt-3">
                                            {channels.map((ch, i) => (
                                                <div key={ch} className="flex justify-between items-center">
                                                    <ChBadge code={ch} label={ch} />
                                                    <span className="text-xs tabular-nums">{fmt(skuDetailData.grossByCh[i])}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border overflow-hidden">
                                    <div className="px-4 py-3 border-b flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-sm bg-green-600 flex-shrink-0" />
                                        <span className="text-sm font-semibold">{t('netGmvCardTitle')}</span>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xl font-semibold tabular-nums mb-0.5">{fmt(skuDetailData.netTotal)}</p>
                                        <p className="text-xs text-muted-foreground mb-3">{t('netGmvCardDesc')}</p>
                                        <div className="space-y-2 border-t pt-3">
                                            {channels.map((ch, i) => (
                                                <div key={ch} className="flex justify-between items-center">
                                                    <ChBadge code={ch} label={ch} />
                                                    <span className={`text-xs tabular-nums font-medium ${skuDetailData.netByCh[i] < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                        {fmt(skuDetailData.netByCh[i])}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border overflow-hidden">
                                    <div className="px-4 py-3 border-b flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${opColor === 'text-green-700' ? 'bg-green-600' : opColor === 'text-amber-600' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                        <span className="text-sm font-semibold">{t('plSummaryCardTitle')}</span>
                                    </div>
                                    <div className="p-4">
                                        <p className={`text-xl font-semibold tabular-nums mb-0.5 ${opColor}`}>{d.operatingMarginPct.toFixed(1)}%</p>
                                        <p className="text-xs text-muted-foreground mb-3">{t('plSummaryCardDesc')}</p>
                                        <div className="space-y-1 border-t pt-3">
                                            {/* Revenue waterfall */}
                                            {[
                                                [t('rowGrossGmv'), fmt(d.grossTotal), ''],
                                                [t('rowDeductDiskon'), fmt(d.discByCh.reduce((a, b) => a + b, 0)), 'd'],
                                                [t('rowDeductReturn'), fmt(d.retByCh.reduce((a, b) => a + b, 0)), 'd'],
                                                [t('rowDeductOngkir'), fmt(d.shipByCh.reduce((a, b) => a + b, 0)), 'd'],
                                            ].map(([label, val, type]) => (
                                                <div key={label} className="flex justify-between">
                                                    <span className="text-xs text-muted-foreground">{label}</span>
                                                    <span className={`text-xs tabular-nums ${type === 'd' ? 'text-red-600' : ''}`}>{val}</span>
                                                </div>
                                            ))}
                                            {/* Net Revenue */}
                                            <div className="flex justify-between border-t pt-1.5 mt-0.5">
                                                <span className="text-xs font-semibold">{t('rowNetRevenue')}</span>
                                                <span className="text-xs font-semibold tabular-nums">{fmt(d.netTotal)}</span>
                                            </div>
                                            {/* COGS */}
                                            <div className="flex justify-between">
                                                <span className="text-xs text-muted-foreground">{t('rowDeductCogs')}</span>
                                                <span className="text-xs tabular-nums text-red-600">{fmt(d.cogsTotal)}</span>
                                            </div>
                                            {/* Gross Profit */}
                                            <div className="flex justify-between border-t pt-1.5 mt-0.5">
                                                <span className="text-xs font-semibold">{t('rowGrossProfit')}</span>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className={`text-[10px] tabular-nums ${gpColor}`}>({d.grossMarginPct.toFixed(1)}%)</span>
                                                    <span className={`text-xs font-bold tabular-nums ${gpColor}`}>{fmt(d.grossProfit)}</span>
                                                </div>
                                            </div>
                                            {/* Operating expenses */}
                                            <div className="flex justify-between">
                                                <span className="text-xs text-muted-foreground">{t('rowDeductChannelCost')}</span>
                                                <span className="text-xs tabular-nums text-red-600">{fmt(d.channelCost)}</span>
                                            </div>
                                            {d.fixedCost > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-muted-foreground">{t('rowDeductFixedCost')}</span>
                                                    <span className="text-xs tabular-nums text-red-600">{fmt(d.fixedCost)}</span>
                                                </div>
                                            )}
                                            {/* Operating Profit */}
                                            <div className="flex justify-between border-t pt-1.5 mt-0.5">
                                                <span className="text-xs font-semibold">{t('rowOperatingProfit')}</span>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className={`text-[10px] tabular-nums ${opColor}`}>({d.operatingMarginPct.toFixed(1)}%)</span>
                                                    <span className={`text-xs font-bold tabular-nums ${opColor}`}>{fmt(d.operatingProfit)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown per Channel */}
                            <div className="rounded-lg border overflow-hidden">
                                <div className="px-4 py-3 border-b">
                                    <p className="text-sm font-semibold">{t('breakdownTitle')}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('breakdownSubtitle')}</p>
                                </div>
                                <div className="p-4 overflow-x-auto">
                                    <table className="w-full border-collapse text-sm" style={{ minWidth: 460 }}>
                                        <thead>
                                            <tr>
                                                <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[100px]">{t('colChannel')}</th>
                                                <ChTh>{t('colGrossGmv')}</ChTh>
                                                <ChTh>{t('colDiskon')}</ChTh>
                                                <ChTh>{t('colReturn')}</ChTh>
                                                <ChTh>{t('colOngkir')}</ChTh>
                                                <ChTh>{t('colNetGmv')}</ChTh>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {channels.map((ch, i) => (
                                                <tr key={ch} className="border-t">
                                                    <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                    <td className="py-2.5 px-2 text-right text-xs tabular-nums">{fmt(skuDetailData.grossByCh[i])}</td>
                                                    <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(skuDetailData.discByCh[i])}</td>
                                                    <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(skuDetailData.retByCh[i])}</td>
                                                    <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(skuDetailData.shipByCh[i])}</td>
                                                    <td className={`py-2.5 px-2 text-right text-xs tabular-nums font-semibold ${skuDetailData.netByCh[i] < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                        {fmt(skuDetailData.netByCh[i])}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="border-t bg-muted/40">
                                                <td className="py-2.5 text-xs font-semibold">{t('totalRow')}</td>
                                                <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums">{fmt(skuDetailData.grossTotal)}</td>
                                                <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(skuDetailData.discByCh.reduce((a, b) => a + b, 0))}</td>
                                                <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(skuDetailData.retByCh.reduce((a, b) => a + b, 0))}</td>
                                                <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(skuDetailData.shipByCh.reduce((a, b) => a + b, 0))}</td>
                                                <td className={`py-2.5 px-2 text-right text-xs font-bold tabular-nums ${skuDetailData.netTotal < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                    {fmt(skuDetailData.netTotal)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── SKU Selection Modal ───────────────────────────────────────── */}
            <Dialog open={skuModalOpen} onOpenChange={setSkuModalOpen}>
                <DialogContent className="max-w-lg h-[70vh] flex flex-col gap-0 p-0 overflow-hidden">
                    <DialogHeader className="px-5 pt-5 pb-4 border-b flex-shrink-0">
                        <DialogTitle>{t('selectSkuTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="px-4 py-3 border-b flex-shrink-0">
                        <div className="relative">
                            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder={t('searchSkuPlaceholder')}
                                value={skuSearch}
                                onChange={e => setSkuSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 min-h-0 p-4 space-y-2">
                        {isSkusLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-md" />
                            ))
                        ) : filteredSkus.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">{t('noSkusFound')}</p>
                        ) : (
                            filteredSkus.map(sku => {
                                const isSelected = p.sku?.id === sku.id
                                return (
                                    <button
                                        key={sku.id}
                                        type="button"
                                        onClick={() => selectSku(sku)}
                                        className={`w-full text-left rounded-md border p-3 transition-colors space-y-0.5 ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'}`}
                                    >
                                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{sku.product_name || '—'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {sku.sku_code}
                                            {sku.brand && ` · ${sku.brand}`}
                                            {sku.variant && ` · ${sku.variant}`}
                                        </p>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
