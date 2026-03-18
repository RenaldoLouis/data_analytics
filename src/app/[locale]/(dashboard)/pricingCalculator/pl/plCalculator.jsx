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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useSidebar } from "@/components/ui/sidebar"
import { H3 } from "@/components/ui/typography"
import services from "@/services"
import {
    IconChevronDown,
    IconChevronUp,
    IconPresentationAnalytics,
    IconSearch,
    IconSettings,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { Fragment, useMemo, useState } from "react"
import { toast } from "sonner"

const fmt = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID')
const pct = (n) => (isFinite(n) ? n.toFixed(1) : '0.0') + '%'
const num = (s) => parseFloat(String(s).replace(/[^\d.]/g, '')) || 0

const DISKON_KEYS = ["voucher", "subsidi", "flash", "coin", "affiliate", "bundling", "loyalty"]

function getChColor(code, label) {
    const key = (label || code || "").toLowerCase()
    if (key.includes("shopee"))    return { bg: "#fff7f0", color: "#c83200" }
    if (key.includes("tokopedia")) return { bg: "#f0fff4", color: "#1a6e42" }
    if (key.includes("tiktok"))    return { bg: "#f0f8ff", color: "#0a4a8c" }
    if (key.includes("lazada"))    return { bg: "#f5f0ff", color: "#4a1fcc" }
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
function ChInput({ value, onChange, placeholder = "0", step, highlight }) {
    const cls = highlight === 'filled'
        ? 'bg-green-50 border-green-300 text-green-900'
        : highlight === 'warn'
            ? 'bg-orange-50 border-orange-300'
            : 'bg-background border-input'
    return (
        <input
            type="number"
            step={step}
            value={value}
            onChange={e => onChange(e.target.value)}
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
        filled:   "bg-green-50 text-green-700 border border-green-300",
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
            <button
                type="button"
                onClick={onEditSetup}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 border rounded-md px-2.5 py-1.5"
            >
                <IconSettings size={13} />
                {editLabel}
            </button>
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
function FieldInput({ label, subtitle, value, onChange, prefix, suffix, placeholder = '0', type = 'number' }) {
    return (
        <div className="grid gap-1">
            {label && <Label>{label}</Label>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            <div className="flex items-center border border-input rounded-md overflow-hidden bg-transparent shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all">
                {prefix && (
                    <span className="px-3 text-xs text-muted-foreground border-r border-input bg-muted/50 self-stretch flex items-center">Rp</span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-3 h-9 text-sm text-foreground outline-none bg-transparent min-w-0"
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
                    {p.name}
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
        name: `${label} ${index + 1}`,
        sku: null,
        cogs: '',
        pkg: '',
        hj: {},
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PlCalculator() {
    const t = useTranslations('plpage')
    const { open: sidebarOpen } = useSidebar()

    const DISKON_LABELS = [
        t('diskonVoucher'), t('diskonSubsidi'), t('diskonFlash'), t('diskonCoin'),
        t('diskonAffiliate'), t('diskonBundling'), t('diskonLoyalty'),
    ]

    const FC_FIELDS = [
        { id: "gaji",     label: t('fcGajiLabel'),     sub: t('fcGajiSub'),     group: t('fcGroupHR') },
        { id: "bpjs",     label: t('fcBpjsLabel'),     sub: t('fcBpjsSub') },
        { id: "konten",   label: t('fcKontenLabel'),   sub: t('fcKontenSub'),   group: t('fcGroupMarketing') },
        { id: "kol",      label: t('fcKolLabel'),      sub: t('fcKolSub') },
        { id: "sampling", label: t('fcSamplingLabel'), sub: t('fcSamplingSub') },
        { id: "sewa",     label: t('fcSewaLabel'),     sub: t('fcSewaSub'),     group: t('fcGroupOps') },
        { id: "tools",    label: t('fcToolsLabel'),    sub: t('fcToolsSub') },
    ]

    // ── Setup step state ──────────────────────────────────────────────────────
    const [setupStep, setSetupStep] = useState(1)
    const [completedSetupSteps, setCompletedSetupSteps] = useState([])
    const [setupDone, setSetupDone] = useState(false)

    const doneSetupStep = (n) => {
        setCompletedSetupSteps(prev => [...new Set([...prev, n])])
        if (n < 3) {
            setSetupStep(n + 1)
        } else {
            setSetupDone(true)
        }
    }

    const getStepStatus = (n) => ({
        isDone:   completedSetupSteps.includes(n),
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
        model: 'ret',
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

    // ── SKU modal ─────────────────────────────────────────────────────────────
    const [skuModalOpen, setSkuModalOpen]   = useState(false)
    const [skuList, setSkuList]             = useState([])
    const [skuSearch, setSkuSearch]         = useState('')
    const [isSkusLoading, setIsSkusLoading] = useState(false)

    const openSkuModal = async () => {
        setSkuModalOpen(true)
        if (skuList.length === 0) {
            setIsSkusLoading(true)
            const res = await services.sku.getSkus()
            setSkuList(res?.data ?? res ?? [])
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
    const filteredSkus = useMemo(() =>
        skuList.filter(s =>
            !skuSearch ||
            s.product_name?.toLowerCase().includes(skuSearch.toLowerCase()) ||
            s.sku_code?.toLowerCase().includes(skuSearch.toLowerCase())
        ), [skuList, skuSearch])

    // ── Monthly P&L state ─────────────────────────────────────────────────────
    const [activeMo, setActiveMo] = useState('')
    const [selectedSku, setSelectedSku] = useState('')
    const [infoData, setInfoData]     = useState({})
    const [diskonData, setDiskonData] = useState({})
    const [returnData, setReturnData] = useState({})
    const [ongkirData, setOngkirData] = useState({})
    const [adsData, setAdsData]       = useState({})
    const [fixedData, setFixedData]   = useState({})
    const [claimData, setClaimData]   = useState({ support: '', voucher: '', mpFee: '', mpAffiliate: '', campaign: '' })
    const [customRows, setCustomRows] = useState([])
    const [orders, setOrders]         = useState('')
    const [secFilled, setSecFilled]   = useState({ info: false, diskon: false, ret: false, ads: false, fixed: false })
    const markFilled = (sec) => setSecFilled(prev => ({ ...prev, [sec]: true }))

    // ── Active SKU for monthly ─────────────────────────────────────────────────
    const activeSku = products.find(prod => prod.name === selectedSku) || products[0] || {}
    const cogsUnit = (parseFloat(activeSku.cogs) || 0) + (parseFloat(activeSku.pkg) || 0)

    // ── P&L multi-channel calculations ───────────────────────────────────────
    const totalDiskonPct = (ch) =>
        DISKON_KEYS.reduce((s, k) => s + (parseFloat(diskonData[ch]?.[k]) || 0), 0)

    const grossByChannel = channels.map(ch => {
        const vol = parseFloat(infoData[ch]?.vol) || 0
        const hj  = parseFloat(infoData[ch]?.hj ?? activeSku.hj?.[ch]?.harga) || 0
        return vol * hj
    })
    const grossTotal     = grossByChannel.reduce((a, b) => a + b, 0)
    const discByChannel  = channels.map((ch, i) => grossByChannel[i] * totalDiskonPct(ch) / 100)
    const retByChannel   = channels.map((ch, i) => grossByChannel[i] * ((parseFloat(returnData[ch]?.rate) || 0) / 100))
    const shipByChannel  = channels.map(ch => parseFloat(ongkirData[ch]?.subsidi) || 0)
    const netByChannel   = channels.map((_, i) => grossByChannel[i] - discByChannel[i] - retByChannel[i] - shipByChannel[i])
    const netTotal       = netByChannel.reduce((a, b) => a + b, 0)

    const totalVol   = channels.reduce((s, ch) => s + (parseFloat(infoData[ch]?.vol) || 0), 0)
    const cogsTotal  = totalVol * cogsUnit
    const commCost   = channels.reduce((s, ch) => s + grossTotal * (parseFloat(getChFee(ch, 'comm')) / 100), 0)
    const mallCost   = channels.reduce((s, ch) => s + grossTotal * (parseFloat(getChFee(ch, 'mall')) / 100), 0)
    const pgwCost    = channels.reduce((s, ch) => s + grossTotal * (parseFloat(getChFee(ch, 'pgw'))  / 100), 0)
    const adsCostTotal = channels.reduce((s, ch) => s + grossTotal * ((parseFloat(adsData[ch]?.rate) || 0) / 100), 0)
    const channelCost  = commCost + mallCost + pgwCost + adsCostTotal

    const retainerVal = parseFloat((enablerConfig.retainer || '').replace(/\./g, '')) || 0
    const sofVal      = parseFloat((enablerConfig.sof     || '').replace(/\./g, '')) || 0
    const swiftVal    = parseFloat((enablerConfig.swift   || '').replace(/\./g, '')) || 0
    const liveVal     = parseFloat((enablerConfig.live    || '').replace(/\./g, '')) || 0
    const gudangVal   = parseFloat((enablerConfig.gudang  || '').replace(/\./g, '')) || 0
    const komisiVal   = grossTotal * ((parseFloat(enablerConfig.komisiRate) || 0) / 100)
    const fulfilRate  = parseFloat((enablerConfig.fulfilRate || '').replace(/\./g, '').replace(',', '.')) || 12000
    const fulfilTotal = (parseFloat(orders) || 0) * fulfilRate
    const claimTotal  = Object.values(claimData).reduce((s, v) => s + (parseFloat(v) || 0), 0)

    const customFixedTotal = enablerConfig.customFixed.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)
    const enablerFixedTotal = (enablerConfig.model === 'ret' || enablerConfig.model === 'hyb' ? retainerVal : 0) + sofVal + swiftVal + liveVal + gudangVal + customFixedTotal

    const customVarTotal = enablerConfig.customVar.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)
    const enablerVarTotal   = (enablerConfig.model === 'kom' || enablerConfig.model === 'hyb' ? komisiVal : 0) + fulfilTotal + claimTotal + customVarTotal
    const enablerTotal      = enablerFixedTotal + enablerVarTotal

    const fixedTotal  = FC_FIELDS.reduce((s, f) => s + (parseFloat(fixedData[f.id]) || 0), 0)
                      + customRows.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)

    const blendedAmt  = netTotal - cogsTotal - channelCost - enablerTotal
    const blendedPct  = netTotal > 0 ? (blendedAmt / netTotal) * 100 : 0
    const marginColor = blendedPct >= 30 ? 'text-green-700' : blendedPct >= 15 ? 'text-amber-600' : 'text-red-600'
    const modelText   = {
        ret: `Retainer Only · ${fmt(retainerVal)}`,
        kom: `Komisi GMV · ${enablerConfig.komisiRate || '0'}%`,
        hyb: `Hybrid · ${fmt(retainerVal)} + ${enablerConfig.komisiRate || '0'}% GMV`,
    }[enablerConfig.model] || '—'
    const hasVolInput = channels.some(ch => parseFloat(infoData[ch]?.vol) > 0)

    // ── Save / Calculate ──────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false)

    const handleCalculate = async () => {
        if (!setup.brand_name) return toast.error(t('errorBrandRequired'))

        const skusPayload = products
            .filter(prod => prod.name && (parseFloat(prod.cogs) >= 0))
            .map(prod => ({
                name:   prod.name,
                cogs:   num(prod.cogs),
                pkg:    num(prod.pkg),
                channels: channels.map(ch => ({
                    channel:    ch,
                    harga_jual: parseFloat(infoData[ch]?.hj) || parseFloat(prod.hj?.[ch]?.harga) || 0,
                    volume:     parseFloat(infoData[ch]?.vol) || 0,
                })),
            }))

        const payload = {
            brand_name: setup.brand_name,
            kategori:   setup.kategori,
            ...(setup.enabler && { enabler: { enabled: true, name: setup.enabler } }),
            channels,
            ...(skusPayload.length && { skus: skusPayload }),
        }

        setIsSaving(true)
        try {
            const res = await services.pl.createPl(payload)
            if (res?.success) toast.success(t('saveSuccess'))
            else toast.error(res?.message || t('saveError'))
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
                    <H3 className="text-xl font-bold">{t('title')}</H3>
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
                                onNext={() => doneSetupStep(1)}
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
                                            <Label>{t('productCategory')}</Label>
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

                                    {/* Enabler model */}
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                            {t('enablerFeeModel')}{setup.enabler && <span className="font-normal text-primary normal-case tracking-normal ml-1">({setup.enabler})</span>}
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            {[['ret', '🔒', t('modelRetainerOnly')], ['kom', '📊', t('modelKomisiGmv')], ['hyb', '⚡', t('modelHybrid')]].map(([m, icon, label]) => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setEC('model', m)}
                                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors
                                                        ${enablerConfig.model === m ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card hover:bg-muted/50'}`}
                                                >
                                                    <span className="text-base">{icon}</span>
                                                    <span className="text-center leading-tight">{label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {(enablerConfig.model === 'ret' || enablerConfig.model === 'hyb') && (
                                                <FieldInput label={t('retainerMonthly')} value={enablerConfig.retainer} onChange={v => setEC('retainer', v)} prefix="Rp" />
                                            )}
                                            {(enablerConfig.model === 'kom' || enablerConfig.model === 'hyb') && (
                                                <FieldInput label={t('komisiGmvRate')} subtitle={t('pctGrossGmv')} value={enablerConfig.komisiRate} onChange={v => setEC('komisiRate', v)} suffix="% GMV" />
                                            )}
                                            <FieldInput label={t('storeOperationFee')}   subtitle={t('storeOperationFeeSub')}   value={enablerConfig.sof}        onChange={v => setEC('sof', v)}        prefix="Rp" />
                                            <FieldInput label={t('platformTechFee')}     subtitle={t('platformTechFeeSub')}     value={enablerConfig.swift}      onChange={v => setEC('swift', v)}      prefix="Rp" />
                                            <FieldInput label={t('liveCommerceCost')}    subtitle={t('liveCommerceCostSub')}    value={enablerConfig.live}       onChange={v => setEC('live', v)}       prefix="Rp" />
                                            <FieldInput label={t('warehouseCost')}       subtitle={t('warehouseCostSub')}       value={enablerConfig.gudang}     onChange={v => setEC('gudang', v)}     prefix="Rp" />
                                            <FieldInput label={t('fulfillmentPerOrder')} subtitle={t('fulfillmentPerOrderSub')} value={enablerConfig.fulfilRate} onChange={v => setEC('fulfilRate', v)} prefix="Rp" />
                                        </div>

                                        {/* Custom fixed rows */}
                                        <div className="mt-3 space-y-2">
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

                                        {/* Custom variable rows */}
                                        <div className="mt-3 space-y-2">
                                            {enablerConfig.customVar.map(r => (
                                                <div key={r.id} className="flex items-center gap-2">
                                                    <Input placeholder={t('customVarPlaceholder')} value={r.name} onChange={e => setEC('customVar', enablerConfig.customVar.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} className="flex-1 h-9 text-sm" />
                                                    <FieldInput value={r.val} onChange={v => setEC('customVar', enablerConfig.customVar.map(x => x.id === r.id ? { ...x, val: v } : x))} prefix="Rp" label="" />
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
                                onNext={() => doneSetupStep(3)}
                                nextLabel={t('nextStep')}
                                finishLabel={t('finishSetup')}
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
                                                    <p className="text-sm font-semibold">{p.sku.product_name || '—'}</p>
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
                    {setupDone && (
                        <>
                            {/* Setup summary */}
                            <SetupSummaryCard
                                setup={setup}
                                activeChannels={channels.map(ch => ({ code: ch, label: ch }))}
                                onEditSetup={() => setSetupDone(false)}
                                editLabel={t('editSetup')}
                            />

                            {/* Month selector */}
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{t('periodeTitle')}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setActiveMo(m)}
                                            className={`h-8 w-11 rounded text-xs font-medium border transition-colors ${activeMo === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted/50'}`}
                                        >{m}</button>
                                    ))}
                                </div>
                            </div>

                            {/* SKU selector */}
                            {products.filter(prod => prod.name).length > 0 && (
                                <div className="rounded-lg border bg-card p-4">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('skuTitle')}</p>
                                    <select
                                        className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 outline-none"
                                        value={selectedSku}
                                        onChange={e => setSelectedSku(e.target.value)}
                                    >
                                        <option value="">{t('selectSkuDropdown')}</option>
                                        {products.filter(prod => prod.name).map((prod) => (
                                            <option key={prod.id} value={prod.name}>{prod.name}</option>
                                        ))}
                                    </select>
                                    {selectedSku && activeSku.cogs && (
                                        <p className="text-xs text-muted-foreground mt-1.5">COGS: {fmt(parseFloat(activeSku.cogs)||0)} · Packaging: {fmt(parseFloat(activeSku.pkg)||0)}</p>
                                    )}
                                </div>
                            )}

                            {/* Monthly P&L accordion card */}
                            {channels.length > 0 && (
                                <SectionCard
                                    icon={<IconPresentationAnalytics size={18} />}
                                    title={t('monthlyPnlTitle')}
                                    subtitle={t('monthlyPnlSubtitle')}
                                >
                                    <div className="-mx-5 -mb-5 border-t mt-5">

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
                                                            const hjVal = infoData[ch]?.hj
                                                            return (
                                                                <tr key={ch} className="border-t">
                                                                    <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                                    <td className="py-2.5 px-2 text-right">
                                                                        <ChInput
                                                                            value={hjVal ?? activeSku.hj?.[ch]?.harga ?? ''}
                                                                            onChange={v => setInfoData(prev => ({ ...prev, [ch]: { ...prev[ch], hj: v } }))}
                                                                            highlight={hjVal !== undefined ? 'filled' : undefined}
                                                                        />
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
                                                    <span className="text-xs font-semibold text-teal-700 tabular-nums">{activeSku.cogs ? fmt(parseFloat(activeSku.cogs)||0) : '—'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2.5">
                                                    <div>
                                                        <p className="text-xs font-medium">{t('packagingPerUnitRow')}</p>
                                                        <p className="text-[11px] text-muted-foreground">{t('packagingDesc')}</p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-teal-700 tabular-nums">{activeSku.pkg ? fmt(parseFloat(activeSku.pkg)||0) : '—'}</span>
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
                                                                        <td className="py-2.5 px-2 text-right"><ChInput value='' onChange={() => {}} /></td>
                                                                        <td className="py-2.5 px-2 text-right"><ChInput value='' onChange={() => {}} placeholder="1" /></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center py-2.5">
                                                    <p className="text-xs text-muted-foreground">{t('totalCogsRow', { units: totalVol.toLocaleString('id-ID') })}</p>
                                                    <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(cogsTotal)})</span>
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
                                                                        value={returnData[ch]?.est ?? ''}
                                                                        onChange={v => setReturnData(prev => ({ ...prev, [ch]: { ...prev[ch], est: v } }))}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
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
                                                                        value={ongkirData[ch]?.subsidi ?? ''}
                                                                        onChange={v => setOngkirData(prev => ({ ...prev, [ch]: { ...prev[ch], subsidi: v } }))}
                                                                        highlight={(parseFloat(ongkirData[ch]?.subsidi) || 0) > 0 ? 'filled' : undefined}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput
                                                                        value={ongkirData[ch]?.aktual ?? ''}
                                                                        onChange={v => setOngkirData(prev => ({ ...prev, [ch]: { ...prev[ch], aktual: v } }))}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-2 text-right">
                                                                    <ChInput value={ongkirData[ch]?.processing ?? ''} onChange={v => setOngkirData(prev => ({ ...prev, [ch]: { ...prev[ch], processing: v } }))} />
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

                                        {/* H. Fixed Cost Enabler (pre-filled) */}
                                        {setup.enabler && (
                                            <PnLAccordion
                                                title={t('enablerFixedTitle')}
                                                subtitle={t('enablerFixedSubtitle')}
                                                pillVariant="prefilled"
                                                pillText={t('pillPrefilled')}
                                            >
                                                <div className="divide-y mt-2">
                                                    {[
                                                        (enablerConfig.model === 'ret' || enablerConfig.model === 'hyb') && retainerVal > 0 && [t('retainerMonthly'), retainerVal, t('flatPerMonth')],
                                                        sofVal > 0    && [t('storeOperationFee'),  sofVal,    t('flatPerMonth')],
                                                        swiftVal > 0  && [t('platformTechFee'),    swiftVal,  t('platformAccessTools')],
                                                        liveVal > 0   && [t('liveCommerceCost'),   liveVal,   t('flatPerMonth')],
                                                        gudangVal > 0 && [t('warehouseCost'),      gudangVal, t('warehouseOps')],
                                                    ].filter(Boolean).map(([label, val, sub]) => (
                                                        <div key={label} className="flex items-center justify-between py-2.5">
                                                            <div>
                                                                <p className="text-xs font-medium">{label}</p>
                                                                <p className="text-[11px] text-muted-foreground">{sub}</p>
                                                            </div>
                                                            <span className="text-xs font-semibold text-teal-700 tabular-nums">{fmt(val)}</span>
                                                        </div>
                                                    ))}
                                                    {/* Custom fixed rows display */}
                                                    {enablerConfig.customFixed.filter(r => parseFloat(r.val) > 0).map(r => (
                                                        <div key={r.id} className="flex items-center justify-between py-2.5">
                                                            <div>
                                                                <p className="text-xs font-medium">{r.name || '—'}</p>
                                                                <p className="text-[11px] text-muted-foreground">{t('flatPerMonth')}</p>
                                                            </div>
                                                            <span className="text-xs font-semibold text-teal-700 tabular-nums">{fmt(parseFloat(r.val))}</span>
                                                        </div>
                                                    ))}
                                                    {enablerFixedTotal > 0 ? (
                                                        <div className="flex justify-between py-2.5">
                                                            <span className="text-xs text-muted-foreground">{t('subtotalFixed')}</span>
                                                            <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(enablerFixedTotal)})</span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground py-3 text-center">{t('configureEnablerHint')}</p>
                                                    )}
                                                </div>
                                            </PnLAccordion>
                                        )}

                                        {/* I. Variable Cost Enabler */}
                                        {setup.enabler && (
                                            <PnLAccordion
                                                title={t('enablerVarTitle')}
                                                subtitle={t('enablerVarSubtitle')}
                                                pillVariant={claimTotal > 0 ? "filled" : "required"}
                                                pillText={claimTotal > 0 ? t('pillFilled') : t('pillRequired')}
                                            >
                                                <div className="divide-y mt-2">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pb-2">{t('autoFromFormula')}</p>

                                                    {(enablerConfig.model === 'kom' || enablerConfig.model === 'hyb') && (
                                                        <div className="flex items-center justify-between py-2.5">
                                                            <div>
                                                                <p className="text-xs font-medium">{t('komisiGmvLabel')}</p>
                                                                <p className="text-[11px] text-muted-foreground">{t('pctTimesGrossGmv', { rate: enablerConfig.komisiRate || '0' })}</p>
                                                            </div>
                                                            <span className="text-xs font-semibold text-teal-700 tabular-nums">{fmt(komisiVal)}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between py-2.5">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium">{t('fulfillmentLabel')}</p>
                                                            <p className="text-[11px] text-muted-foreground">{t('fulfillmentDesc', { rate: fmt(num(enablerConfig.fulfilRate)) })}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <input
                                                                type="number"
                                                                value={orders}
                                                                onChange={e => setOrders(e.target.value)}
                                                                placeholder="0"
                                                                className="w-20 text-right text-xs px-2 py-1.5 rounded border border-teal-300 bg-teal-50 text-teal-800 outline-none"
                                                            />
                                                            <span className="text-xs text-muted-foreground">{t('orderUnit')}</span>
                                                            <span className="text-xs font-semibold text-teal-700 tabular-nums min-w-[80px] text-right">{fmt(fulfilTotal)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Custom var rows display */}
                                                    {enablerConfig.customVar.filter(r => parseFloat(r.val) > 0).map(r => (
                                                        <div key={r.id} className="flex items-center justify-between py-2.5">
                                                            <div>
                                                                <p className="text-xs font-medium">{r.name || '—'}</p>
                                                            </div>
                                                            <span className="text-xs font-semibold text-teal-700 tabular-nums">{fmt(parseFloat(r.val))}</span>
                                                        </div>
                                                    ))}

                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-3 pb-2">{t('manualClaimInput')}</p>

                                                    {[
                                                        ['support',     t('claimSupport'),  t('claimSupportNote')],
                                                        ['voucher',     t('claimVoucher'),  t('claimSupportNote')],
                                                        ['mpFee',       t('claimMpFee'),    t('claimMpFeeNote')],
                                                        ['mpAffiliate', t('mpAffiliate'),   t('mpAffiliateNote')],
                                                        ['campaign',    t('campaignAds'),   t('campaignAdsNote')],
                                                    ].map(([key, label, note]) => (
                                                        <div key={key} className="flex items-center justify-between py-2.5">
                                                            <div className="flex-1">
                                                                <p className="text-xs font-medium">{label}</p>
                                                                {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-muted-foreground">Rp</span>
                                                                <ChInput
                                                                    value={claimData[key] ?? ''}
                                                                    onChange={v => setClaimData(prev => ({ ...prev, [key]: v }))}
                                                                    highlight={(parseFloat(claimData[key]) || 0) > 0 ? 'filled' : 'warn'}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <div className="flex justify-between py-2.5">
                                                        <span className="text-xs text-muted-foreground">{t('subtotalVar')}</span>
                                                        <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(enablerVarTotal)})</span>
                                                    </div>
                                                </div>
                                            </PnLAccordion>
                                        )}

                                        {/* J. Fixed Cost */}
                                        <PnLAccordion
                                            title={t('fixedCostTitle')}
                                            subtitle={t('fixedCostSubtitle')}
                                            pillVariant={secFilled.fixed ? "filled" : "required"}
                                            pillText={secFilled.fixed ? t('pillFilled') : t('pillRequired')}
                                        >
                                            <div className="divide-y mt-2">
                                                {(() => {
                                                    let lastGroup = null
                                                    return FC_FIELDS.map(f => {
                                                        const showGroup = f.group && f.group !== lastGroup
                                                        if (showGroup) lastGroup = f.group
                                                        return (
                                                            <div key={f.id}>
                                                                {showGroup && (
                                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-3 pb-1">{f.group}</p>
                                                                )}
                                                                <div className="flex items-center justify-between py-2.5">
                                                                    <div>
                                                                        <p className="text-xs font-medium">{f.label}</p>
                                                                        <p className="text-[11px] text-muted-foreground">{f.sub}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <span className="text-xs text-muted-foreground">Rp</span>
                                                                        <ChInput
                                                                            value={fixedData[f.id] ?? ''}
                                                                            onChange={v => {
                                                                                setFixedData(prev => ({ ...prev, [f.id]: v }))
                                                                                markFilled('fixed')
                                                                            }}
                                                                            highlight={(parseFloat(fixedData[f.id]) || 0) > 0 ? 'filled' : 'warn'}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                })()}

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

                                                <div className="pt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCustomRows(prev => [...prev, { id: Date.now(), name: '', val: '' }])}
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >{t('addCostItem')}</button>
                                                </div>

                                                <div className="flex justify-between py-2.5">
                                                    <span className="text-xs text-muted-foreground">{t('totalFixedCost')}</span>
                                                    <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(fixedTotal)})</span>
                                                </div>
                                            </div>
                                        </PnLAccordion>

                                    </div>
                                </SectionCard>
                            )}

                            {/* Hasil Kalkulasi */}
                            {hasVolInput && channels.length > 0 && (
                                <SectionCard
                                    icon={<IconPresentationAnalytics size={18} />}
                                    title={t('hasilKalkulasiTitle')}
                                    subtitle={t('hasilKalkulasiSubtitle')}
                                >
                                    {/* GMV Summary Cards */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 mt-5">
                                        <div className="rounded-lg border overflow-hidden">
                                            <div className="px-4 py-3 border-b flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-sm bg-blue-500 flex-shrink-0" />
                                                <span className="text-sm font-semibold">{t('grossGmvCardTitle')}</span>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-xl font-semibold tabular-nums mb-0.5">{fmt(grossTotal)}</p>
                                                <p className="text-xs text-muted-foreground mb-3">{t('grossGmvCardDesc')}</p>
                                                <div className="space-y-2 border-t pt-3">
                                                    {channels.map((ch, i) => (
                                                        <div key={ch} className="flex justify-between items-center">
                                                            <ChBadge code={ch} label={ch} />
                                                            <span className="text-xs tabular-nums">{fmt(grossByChannel[i])}</span>
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
                                                <p className="text-xl font-semibold tabular-nums mb-0.5">{fmt(netTotal)}</p>
                                                <p className="text-xs text-muted-foreground mb-3">{t('netGmvCardDesc')}</p>
                                                <div className="space-y-2 border-t pt-3">
                                                    {channels.map((ch, i) => (
                                                        <div key={ch} className="flex justify-between items-center">
                                                            <ChBadge code={ch} label={ch} />
                                                            <span className={`text-xs tabular-nums font-medium ${netByChannel[i] < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                                {fmt(netByChannel[i])}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border overflow-hidden">
                                            <div className="px-4 py-3 border-b flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${blendedPct >= 30 ? 'bg-green-600' : blendedPct >= 15 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                <span className="text-sm font-semibold">{t('blendedGrossMarginTitle')}</span>
                                            </div>
                                            <div className="p-4">
                                                <p className={`text-xl font-semibold tabular-nums mb-0.5 ${marginColor}`}>{blendedPct.toFixed(1)}%</p>
                                                <p className="text-xs text-muted-foreground mb-3">{t('blendedGrossMarginDesc')}</p>
                                                <div className="space-y-1 border-t pt-3">
                                                    {[
                                                        [t('rowGrossGmv'),        fmt(grossTotal),                                   ''],
                                                        [t('rowDeductDiskon'),    fmt(discByChannel.reduce((a, b) => a + b, 0)),     'd'],
                                                        [t('rowDeductReturn'),    fmt(retByChannel.reduce((a, b) => a + b, 0)),      'd'],
                                                        [t('rowDeductOngkir'),    fmt(shipByChannel.reduce((a, b) => a + b, 0)),     'd'],
                                                        [t('rowNetGmv'),          fmt(netTotal),                                      'n'],
                                                        [t('rowDeductCogs'),      fmt(cogsTotal),                                    'd'],
                                                        [t('rowDeductChannelCost'), fmt(channelCost),                                'd'],
                                                        [t('rowDeductEnablerCost'), fmt(enablerTotal),                               'd'],
                                                    ].map(([label, val, type]) => (
                                                        <div key={label} className="flex justify-between">
                                                            <span className="text-xs text-muted-foreground">{label}</span>
                                                            <span className={`text-xs tabular-nums ${type === 'd' ? 'text-red-600' : type === 'n' ? 'font-semibold' : ''}`}>{val}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between border-t pt-2 mt-1">
                                                        <span className="text-xs font-semibold">{t('rowGrossMarginRp')}</span>
                                                        <span className={`text-xs font-bold tabular-nums ${marginColor}`}>{fmt(blendedAmt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Breakdown Table */}
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="px-4 py-3 border-b">
                                            <p className="text-sm font-semibold">{t('breakdownTitle')}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{t('breakdownSubtitle')}</p>
                                        </div>
                                        <div className="p-4 overflow-x-auto">
                                            <table className="w-full border-collapse text-sm" style={{ minWidth: 500 }}>
                                                <thead>
                                                    <tr>
                                                        <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">{t('colChannel')}</th>
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
                                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums">{fmt(grossByChannel[i])}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(discByChannel[i])}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(retByChannel[i])}</td>
                                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(shipByChannel[i])}</td>
                                                            <td className={`py-2.5 px-2 text-right text-xs tabular-nums font-semibold ${netByChannel[i] < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                                {fmt(netByChannel[i])}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="border-t bg-muted/40">
                                                        <td className="py-2.5 text-xs font-semibold">{t('totalRow')}</td>
                                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums">{fmt(grossTotal)}</td>
                                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(discByChannel.reduce((a, b) => a + b, 0))}</td>
                                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(retByChannel.reduce((a, b) => a + b, 0))}</td>
                                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(shipByChannel.reduce((a, b) => a + b, 0))}</td>
                                                        <td className={`py-2.5 px-2 text-right text-xs font-bold tabular-nums ${netTotal < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                            {fmt(netTotal)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </SectionCard>
                            )}
                        </>
                    )}

                </div>
            </div>

            {/* ── Fixed Footer (only in Monthly P&L phase) ──────────────────── */}
            {setupDone && (
                <div
                    className="fixed bottom-0 right-0 z-10 border-t bg-background transition-[left] duration-200 ease-linear"
                    style={{ left: sidebarOpen ? 'var(--sidebar-width)' : '0' }}
                >
                    <div className="flex justify-end px-4 lg:px-6 py-3">
                        <Button size="lg" onClick={handleCalculate} disabled={isSaving}>
                            {isSaving ? t('saving') : t('calculate')}
                        </Button>
                    </div>
                </div>
            )}

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
                            filteredSkus.map(sku => (
                                <button
                                    key={sku.id}
                                    type="button"
                                    onClick={() => selectSku(sku)}
                                    className="w-full text-left rounded-md border p-3 hover:bg-muted/60 transition-colors space-y-0.5"
                                >
                                    <p className="text-sm font-medium">{sku.product_name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {sku.sku_code}
                                        {sku.brand && ` · ${sku.brand}`}
                                        {sku.variant && ` · ${sku.variant}`}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
