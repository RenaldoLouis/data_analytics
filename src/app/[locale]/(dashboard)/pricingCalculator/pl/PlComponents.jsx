'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { Fragment, useState } from "react"
import { fmt, fmtCurrency, getChColor, parseCurrency } from "./plLib"

// ─── ChBadge ──────────────────────────────────────────────────────────────────
export function ChBadge({ code, label }) {
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
export function ChInput({ value, onChange, placeholder = "0", step, highlight, currency = false }) {
    const cls = highlight === 'filled'
        ? 'bg-emerald-50 border-emerald-400 focus:ring-emerald-400 focus:border-emerald-400'
        : highlight === 'warn'
            ? 'bg-orange-50 border-orange-300 focus:ring-orange-300 focus:border-orange-300'
            : 'bg-background border-input focus:ring-ring focus:border-ring'
    return (
        <input
            type={currency ? 'text' : 'number'}
            step={!currency ? step : undefined}
            value={currency ? fmtCurrency(value) : value}
            onChange={e => onChange(currency ? parseCurrency(e.target.value) : e.target.value)}
            placeholder={placeholder}
            className={`w-20 text-right text-xs px-2 py-1.5 rounded border outline-none transition-colors focus:ring-1 ${cls}`}
        />
    )
}

// ─── PnLAccordion ─────────────────────────────────────────────────────────────
export function PnLAccordion({ title, subtitle, pillText, pillVariant = "optional", defaultOpen = false, children }) {
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
export function SetupProgress({ steps, currentStep, completedSteps, onStepClick }) {
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
export function SetupStepCard({ number, title, subtitle, isDone, isActive, isLocked, onOpen, onNext, nextLabel, finishLabel, donePillLabel, activePillLabel, pendingPillLabel, isLast = false, children }) {
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
export function SetupSummaryCard({ setup, activeChannels }) {
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
export function InnerCard({ title, children, className = '' }) {
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
export function FieldInput({ label, subtitle, value, onChange, prefix, suffix, placeholder = '0', type = 'number', disabled = false }) {
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
export function AutoField({ label, value, autoLabel }) {
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
export function ProductTabs({ products, activeIndex, onSelect, onAdd, onRemove, addLabel }) {
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
export function ChTh({ children, className = '' }) {
    return (
        <th className={`pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 text-right whitespace-nowrap ${className}`}>
            {children}
        </th>
    )
}

// ─── SectionHeader - bar title for use inside a Section wrapper ──────────────
export function SectionHeader({ title }) {
    return (
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted px-2.5 py-1.5 border-b">
            {title}
        </div>
    )
}

// ─── Section - rounded border wrapper that contains SectionHeader + content ──
export function Section({ title, children }) {
    return (
        <div className="overflow-hidden rounded-md border">
            <SectionHeader title={title} />
            {children}
        </div>
    )
}

// ─── AuditTable - label / value rows with optional subtotal row ───────────────
export function AuditTable({ rows, subtotal, noBorder = false }) {
    return (
        <div className={noBorder ? '' : 'overflow-hidden rounded-lg border'}>
            <Table className="[&_th]:text-[11px] [&_td]:text-xs">
                <TableBody>
                    {rows.map(({ label, value, cls, note }) => (
                        <TableRow key={label}>
                            <TableCell className="text-muted-foreground w-[55%] whitespace-normal break-words">{label}</TableCell>
                            <TableCell className={`text-right tabular-nums ${cls ?? ''}`}>
                                {fmt(value)}
                                {note && <span className="text-[10px] text-muted-foreground ml-1">({note})</span>}
                            </TableCell>
                        </TableRow>
                    ))}
                    {subtotal && (
                        <TableRow className="bg-muted/40">
                            <TableCell className="font-medium whitespace-normal break-words">{subtotal.label}</TableCell>
                            <TableCell className={`text-right tabular-nums font-medium ${subtotal.cls ?? ''}`}>
                                {fmt(subtotal.value)}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

// ─── ProfitWaterfall - full P&L chain Gross GMV → Net Operating Profit ────────
// Invariants (July 2026 spec): subtotal after Return/Refund = Settlement; subtotal
// after Return Loss = Contribution Margin; last step = Net Op. Profit (CM - Ads).
// `data` is normalized so the detail and the import preview share this component.
// ── Profit Waterfall ─────────────────────────────────────────────────────────
// Colors: totals/checkpoints (blue), final Net Profit (green), deductions (red),
// additions (blue), tax/ads (amber), zero (grey).
const WF = { total: '#1d4ed8', final: '#15803d', down: '#dc2626', up: '#2563eb', tax: '#f59e0b', zero: '#cbd5e1' }
// Temporarily deactivated (July 2026): the PPh Final 0,5% step is hidden from the
// waterfall until the real Aug 2026 data lands. Flip to true to re-show it.
const SHOW_PPH_STEP = false
// Format a value in millions ("juta"): 20449000 -> "20,45"
const wfJt = (v) => (v / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const wfDelta = (v) => v === 0 ? '0' : (v < 0 ? '-' : '+') + wfJt(Math.abs(v))

// Ordered, cumulative step list shared by both charts.
function buildWfSteps(t, data) {
    const {
        grossGmv = 0, promo = 0, sellerFees = 0, affiliate = 0, pph = 0,
        netShipping = 0, refund = 0, settlement = 0, cogs = 0, returLoss = 0, ads = 0,
    } = data ?? {}
    const cm = settlement - cogs - returLoss
    const net = cm - ads
    const defs = [
        { key: 'gross',  short: 'Gross',  label: t('shopeeWfGross'),       total: grossGmv,     kind: 'start' },
        { key: 'promo',  short: 'Promo',  label: t('shopeeWfPromo'),       delta: -promo,       kind: 'sub' },
        { key: 'fees',   short: 'Fees',   label: t('shopeeWfSellerFees'),  delta: -sellerFees,  kind: 'sub' },
        { key: 'affil',  short: 'Affil',  label: t('shopeeWfAffiliate'),   delta: -affiliate,   kind: 'sub' },
        ...(SHOW_PPH_STEP ? [{ key: 'pph', short: 'PPh', label: t('shopeeWfPph'), delta: -pph, kind: 'tax' }] : []),
        { key: 'ship',   short: 'Ship',   label: t('shopeeWfNetShipping'), delta: netShipping,  kind: 'add' },
        { key: 'return', short: 'Return', label: t('shopeeWfReturn'),      delta: -refund,      kind: 'sub' },
        { key: 'settle', short: 'Settle', label: t('shopeeWfSettlement'),  total: settlement,   kind: 'checkpoint' },
        { key: 'cogs',   short: 'COGS',   label: t('shopeeWfHpp'),         delta: -cogs,        kind: 'sub' },
        { key: 'rloss',  short: 'R.Loss', label: t('shopeeWfReturLoss'),   delta: -returLoss,   kind: 'sub' },
        { key: 'cm',     short: 'CM',     label: t('shopeeWfCm'),          total: cm,           kind: 'checkpoint' },
        { key: 'ads',    short: 'Ads',    label: t('shopeeWfAds'),         delta: -ads,         kind: 'tax' },
        { key: 'net',    short: 'Net',    label: t('shopeeWfNetOp'),       total: net,          kind: 'final' },
    ]
    let cum = 0
    return defs.map((d) => {
        const isTotal = d.total !== undefined
        let start, end
        if (isTotal) { start = 0; end = d.total; cum = d.total }
        else { start = cum; cum += d.delta; end = cum }
        const value = isTotal ? d.total : d.delta
        const color = (d.kind === 'start' || d.kind === 'checkpoint') ? WF.total
            : d.kind === 'final' ? WF.final
            : d.kind === 'tax' ? (Math.abs(value) > 0 ? WF.tax : WF.zero)
            : value === 0 ? WF.zero
            : (value < 0 ? WF.down : WF.up)
        return { ...d, isTotal, start, end, running: cum, value, color }
    })
}

// Condensed 7-step list for the bridge chart (the at-a-glance business view).
// Net Profit here is the running total of the shown steps (for July, Affiliate/PPh/
// Return Loss/Ads are 0 so it equals the full Net Op. Profit; the expanded card carries
// every step).
function buildWfBridgeSteps(t, data) {
    const { grossGmv = 0, promo = 0, sellerFees = 0, netShipping = 0, refund = 0, cogs = 0 } = data ?? {}
    const defs = [
        { key: 'gross',  short: 'Gross',  label: t('shopeeWfGross'),       kind: 'start', total: grossGmv },
        { key: 'disc',   short: 'Disc',   label: t('shopeeWfSellerDisc'),  kind: 'sub',   delta: -promo },
        { key: 'fees',   short: 'Fees',   label: t('shopeeWfChannelFees'), kind: 'sub',   delta: -sellerFees },
        { key: 'ship',   short: 'Ship',   label: t('shopeeWfShipping'),    kind: 'add',   delta: netShipping },
        { key: 'return', short: 'Return', label: t('shopeeWfReturnShort'), kind: 'sub',   delta: -refund },
        { key: 'hpp',    short: 'COGS',   label: t('shopeeWfHppShort'),    kind: 'sub',   delta: -cogs },
        { key: 'net',    short: 'Net',    label: t('shopeeWfNetProfit'),   kind: 'final' },
    ]
    let cum = 0
    return defs.map((d) => {
        let start, end
        if (d.kind === 'start') { start = 0; end = d.total; cum = d.total }
        else if (d.kind === 'final') { start = 0; end = cum }
        else { start = cum; cum += d.delta; end = cum }
        const isTotal = d.kind === 'start' || d.kind === 'final'
        const value = isTotal ? end : d.delta
        const color = d.kind === 'start' ? WF.total
            : d.kind === 'final' ? WF.final
            : value === 0 ? WF.zero
            : (value < 0 ? WF.down : WF.up)
        return { ...d, isTotal, start, end, running: cum, value, color }
    })
}

// Graph 1: vertical waterfall / bridge chart with connector lines (custom SVG).
function WaterfallBridge({ steps }) {
    const W = 480, H = 226, padTop = 22, padBottom = 36, padX = 6
    const plotH = H - padTop - padBottom
    const maxV = Math.max(...steps.map(s => Math.max(s.start, s.end)), 1)
    const n = steps.length
    const slot = (W - padX * 2) / n
    const barW = Math.min(slot * 0.62, 30)
    const y = (v) => padTop + plotH * (1 - v / maxV)
    const cx = (i) => padX + slot * (i + 0.5)
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img">
            <line x1={padX} y1={y(0)} x2={W - padX} y2={y(0)} stroke="#e5e7eb" />
            {/* connector lines between adjacent bars at the running-total level */}
            {steps.slice(0, -1).map((s, i) => (
                <line key={`c${i}`} x1={cx(i) + barW / 2} y1={y(s.end)} x2={cx(i + 1) - barW / 2} y2={y(s.end)}
                      stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
            ))}
            {steps.map((s, i) => {
                const yHi = y(Math.max(s.start, s.end))
                const h = Math.max(y(Math.min(s.start, s.end)) - yHi, 2)
                return (
                    <g key={s.key}>
                        <title>{`${s.label}: ${wfJt(s.value)} jt`}</title>
                        <rect x={cx(i) - barW / 2} y={yHi} width={barW} height={h} rx="1.5" fill={s.color} />
                        <text x={cx(i)} y={yHi - 4} textAnchor="middle" fontSize="9"
                              fontWeight={s.isTotal ? 700 : 400} fill={s.isTotal ? s.color : '#475569'}>
                            {s.isTotal ? wfJt(s.value) : wfDelta(s.value)}
                        </text>
                        {(() => {
                            // Full label, wrapped onto up to two lines so it fits under the bar.
                            const words = String(s.label).split(' ')
                            const l1 = words[0]
                            const l2 = words.slice(1).join(' ')
                            return (
                                <text x={cx(i)} y={H - 20} textAnchor="middle" fontSize="8"
                                      fill={s.isTotal ? '#334155' : '#64748b'} fontWeight={s.isTotal ? 600 : 400}>
                                    <tspan x={cx(i)} dy="0">{l1}</tspan>
                                    {l2 && <tspan x={cx(i)} dy="9">{l2}</tspan>}
                                </text>
                            )
                        })()}
                    </g>
                )
            })}
        </svg>
    )
}

// Graph 2: horizontal "expanded structure" - delta + running-total bar per step.
// `fill` spreads the rows to occupy the full height of the card.
function WaterfallStructure({ steps, fill = false }) {
    const maxRun = Math.max(...steps.map(s => Math.abs(s.running)), 1)
    return (
        <div className={fill
            ? 'space-y-1 lg:space-y-0 lg:flex lg:flex-col lg:justify-between lg:gap-1 lg:h-full lg:min-h-0'
            : 'space-y-1'}>
            {steps.map((s) => {
                const w = Math.max((Math.abs(s.running) / maxRun) * 100, 3)
                const deltaCls = s.isTotal ? 'text-transparent'
                    : s.value < 0 ? 'text-red-600' : s.value > 0 ? 'text-blue-700' : 'text-muted-foreground/50'
                return (
                    <div key={s.key} className="grid items-center gap-2" style={{ gridTemplateColumns: '108px 54px 1fr' }}
                         title={`${s.label}: ${fmt(s.running)}`}>
                        <span className={`text-[10px] truncate ${s.isTotal ? 'font-semibold' : 'text-muted-foreground'}`}
                              style={s.isTotal ? { color: s.color } : undefined}>{s.label}</span>
                        <span className={`text-[10px] text-right tabular-nums ${deltaCls}`}>{s.isTotal ? '' : wfDelta(s.value)}</span>
                        <div className="relative h-4 rounded-sm bg-muted/30 overflow-hidden">
                            <div className="absolute inset-y-0 left-0 rounded-sm flex items-center justify-end pr-1"
                                 style={{ width: `${w}%`, background: s.color }}>
                                <span className="text-[9px] font-medium text-white tabular-nums">{wfJt(s.running)}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// Two separate cards (bridge | expanded structure) side by side; audit summary follows below.
export function ProfitWaterfall({ t, data }) {
    const bridgeSteps = buildWfBridgeSteps(t, data)
    const fullSteps = buildWfSteps(t, data)
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
            {/* Left card - condensed bridge */}
            <div className="overflow-hidden rounded-md border flex flex-col">
                <SectionHeader title={t('shopeeWfTitle')} />
                <div className="p-3 flex-1 flex flex-col">
                    <p className="text-[10px] text-muted-foreground text-right mb-1">{t('shopeeWfInMillions')}</p>
                    <div className="flex-1 flex items-center">
                        <WaterfallBridge steps={bridgeSteps} />
                    </div>
                </div>
            </div>
            {/* Right card - expanded structure (bars fill full card height) */}
            <div className="overflow-hidden rounded-md border flex flex-col">
                <SectionHeader title={t('shopeeWfStructure')} />
                <div className="p-3 flex-1 flex flex-col min-h-0">
                    <p className="text-[10px] text-muted-foreground text-right mb-2">{t('shopeeWfInMillions')}</p>
                    <div className="flex-1 min-h-0">
                        <WaterfallStructure steps={fullSteps} fill />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── KpiCards - flexible metric summary grid (3 or 4 columns) ────────────────
export function KpiCards({ cards }) {
    // cards: [{ label, value, cls, subtitle?, extra?: [{ label, value, cls? }] }]
    const cols = cards.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
    return (
        <div className={`grid ${cols} gap-2`}>
            {cards.map(({ label, value, cls, subtitle, extra }) => (
                <div key={label} className="rounded-lg border bg-muted/30 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                    <p className={`text-sm font-semibold tabular-nums ${cls ?? ''}`}>{fmt(value)}</p>
                    {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
                    {extra?.map((e) => (
                        <p key={e.label} className="text-[10px] text-muted-foreground mt-0.5 flex justify-between gap-2">
                            <span>{e.label}</span>
                            <span className={`tabular-nums font-medium ${e.cls ?? 'text-foreground'}`}>{fmt(e.value)}</span>
                        </p>
                    ))}
                </div>
            ))}
        </div>
    )
}

// ─── Channel-fee breakdown components ─────────────────────────────────────────
// The 6 fee components stored per SKU record (program_fee is folded at import and
// not persisted separately) + program_fee which only the per-order breakdown carries.
const FEE_BREAKDOWN_FIELDS = [
    ['commission_fee',       'shopeeImportFeeCommission'],
    ['service_fee',          'shopeeImportFeeService'],
    ['processing_fee',       'shopeeImportFeeProcessing'],
    ['transaction_fee',      'shopeeImportFeeTransaction'],
    ['program_fee',          'shopeeImportFeeProgram'],
    ['campaign_fee',         'shopeeImportFeeCampaign'],
    ['affiliate_commission', 'shopeeImportFeeAffiliate'],
]

// The standard six fee components always listed in the breakdown (mirrors the Summary
// tab), even when zero. program_fee is the only field shown conditionally (when > 0).
const ALWAYS_SHOWN_FEES = new Set([
    'commission_fee', 'service_fee', 'processing_fee', 'transaction_fee', 'campaign_fee', 'affiliate_commission',
])

// Per-component segment colors (bar fill + legend dot), keyed by fee field.
const FEE_COLORS = {
    commission_fee:       'bg-rose-400',
    service_fee:          'bg-amber-400',
    processing_fee:       'bg-sky-400',
    transaction_fee:      'bg-violet-400',
    program_fee:          'bg-teal-400',
    campaign_fee:         'bg-fuchsia-400',
    affiliate_commission: 'bg-slate-400',
}

// ExpandToggle - rightmost chevron button that expands/collapses a detail row.
export function ExpandToggle({ open, onClick, label }) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-expanded={open}
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
            {open ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </button>
    )
}

// FeeBreakdownDetail - full-width channel-fee breakdown shown inside an expanded row.
// `fees` is a snake_case object; only non-zero components are listed. A stacked bar
// shows each component's share of the total; each line shows its share of GMV (when
// `gmv` is provided) and share of total fees. The subtotal reconciles to the row.
export function FeeBreakdownDetail({ t, fees, gmv, emptyLabel }) {
    // Show the full standard set of fee components (same six as the Summary tab) even
    // when they're zero; program_fee is only listed when it actually carries a value.
    const rows = FEE_BREAKDOWN_FIELDS
        .map(([key, tKey]) => ({ key, label: t(tKey), value: Math.round(Number(fees?.[key]) || 0), color: FEE_COLORS[key] }))
        .filter(r => ALWAYS_SHOWN_FEES.has(r.key) || r.value !== 0)
    const total = rows.reduce((s, r) => s + r.value, 0)
    const grossGmv = Math.round(Number(gmv) || 0)
    const pct = (v, base) => base > 0 ? `${((v / base) * 100).toFixed(1)}%` : null

    if (total === 0) {
        return (
            <div className="rounded-md border bg-muted/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('shopeeImportSectionFees')}</p>
                <p className="text-xs text-muted-foreground">{emptyLabel ?? t('shopeeImportFeeBreakdownEmpty')}</p>
            </div>
        )
    }

    return (
        <div className="w-fit max-w-full rounded-md border bg-muted/20 px-4 py-3.5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('shopeeImportSectionFees')}</p>

            {/* Bar + component lines share the same constrained width so the bar tracks
                the text block rather than stretching across the whole row. */}
            <div className="w-[28rem] max-w-full space-y-3">

                {/* Stacked proportion bar - each segment is its share of total fees */}
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                    {rows.map(r => (
                        <div
                            key={r.key}
                            className={r.color}
                            style={{ width: `${(r.value / total) * 100}%` }}
                            title={`${r.label}: ${fmt(r.value)}`}
                        />
                    ))}
                </div>

                {/* Component lines: label · Rp value · % of GMV · % of total fees. */}
                <div className="space-y-2">
                {rows.map(r => (
                    <div key={r.key} className={`flex items-center gap-3 text-sm ${r.value === 0 ? 'opacity-45' : ''}`}>
                        <span className="flex items-center gap-2 flex-1 min-w-0 text-muted-foreground">
                            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${r.color}`} />
                            <span className="truncate">{r.label}</span>
                        </span>
                        <span className="tabular-nums text-right w-24 text-foreground">{fmt(r.value)}</span>
                        <span className="tabular-nums text-right w-20 text-xs text-muted-foreground">{pct(r.value, grossGmv) ? `${pct(r.value, grossGmv)} GMV` : '-'}</span>
                        <span className="tabular-nums text-right w-14 text-xs text-muted-foreground">{r.value === 0 ? '0%' : pct(r.value, total)}</span>
                    </div>
                ))}

                {/* Total - reconciles to the row's Channel Fees cell */}
                <div className="flex items-center gap-3 text-sm border-t pt-2 mt-2">
                    <span className="flex-1 min-w-0 font-medium truncate">{t('shopeeImportFeesTotal')}</span>
                    <span className="tabular-nums text-right w-24 font-semibold text-red-600">{fmt(total)}</span>
                    <span className="tabular-nums text-right w-20 text-xs text-muted-foreground">{pct(total, grossGmv) ? `${pct(total, grossGmv)} GMV` : '-'}</span>
                    <span className="tabular-nums text-right w-14 text-xs text-muted-foreground">100%</span>
                </div>
                </div>
            </div>
        </div>
    )
}

// ─── ShopeeChip - orange Shopee platform badge ────────────────────────────────
export function ShopeeChip() {
    return (
        <Badge className="bg-orange-50 text-orange-600 border-orange-200 font-medium text-xs rounded-full px-2.5 py-0.5 hover:bg-orange-50">
            Shopee
        </Badge>
    )
}

// ─── ClassificationBadge - Improvement A order bucket pill ────────────────────
// cls: SETTLED | PENDING | CROSS_PERIOD | ANOMALY | CANCELLED. `label` is the
// localized text to display (caller passes it via t()).
const CLASSIFICATION_STYLES = {
    SETTLED:      'bg-green-50 text-green-700',
    PENDING:      'bg-blue-50 text-blue-700',
    CROSS_PERIOD: 'bg-purple-50 text-purple-700',
    ANOMALY:      'bg-red-50 text-red-700',
    CANCELLED:    'bg-muted text-muted-foreground',
}
export function ClassificationBadge({ cls, label }) {
    const style = CLASSIFICATION_STYLES[cls] ?? CLASSIFICATION_STYLES.CANCELLED
    return (
        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${style}`}>
            {label ?? cls}
        </span>
    )
}

// ─── SkuCell - SKU canonical name + code + optional import alias ──────────────
export function SkuCell({ rec }) {
    const name      = rec?.sku_name
    const code      = rec?.sku_code
    const alias     = rec?.product_names?.[0]
    const showAlias = alias && alias !== name
    return (
        <div>
            <p className="font-medium text-sm">{name ?? code ?? 'SKU'}</p>
            {code      && <p className="text-[11px] text-muted-foreground mt-0.5">{code}</p>}
            {showAlias && <p className="text-[10px] text-muted-foreground/60 mt-0.5">↳ {alias}</p>}
        </div>
    )
}

// ─── SectionCard (for Monthly P&L phase) ─────────────────────────────────────
export function SectionCard({ icon, title, subtitle, children }) {
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
