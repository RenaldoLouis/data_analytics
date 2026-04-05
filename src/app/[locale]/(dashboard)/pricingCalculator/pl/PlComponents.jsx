'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { Fragment, useState } from "react"
import { fmtCurrency, getChColor, parseCurrency } from "./plLib"

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
