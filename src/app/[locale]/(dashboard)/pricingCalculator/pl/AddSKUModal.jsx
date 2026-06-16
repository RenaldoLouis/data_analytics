'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import services from "@/services"
import {
    IconBarcode,
    IconPhoto,
    IconSearch,
    IconUpload,
    IconX,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// ── Constants ──────────────────────────────────────────────────────────────────

const SKU_STATUSES = ['ACTIVE', 'INACTIVE', 'DISCONTINUED']

const DEFAULT_VALUES = {
    sku_type:          'single',
    sku_code:          '',
    product_name:      '',
    variant:           '',
    size:              '',
    category_id:       '',
    sub_category_id:   '',
    brand:             '',
    cogs_per_unit:     '',
    weight:            '',
    length:            '',
    width:             '',
    height:            '',
    image_url:         '',
    barcode_url:       '',
    status:            'ACTIVE',
    bundle_components: [],
    channel_aliases:   { shopee: [] },
}

const CHANNELS = [
    { key: 'shopee', label: 'Shopee' },
]

const DIMENSION_KEYS = ['weight', 'length', 'width', 'height']

// ── Main export ────────────────────────────────────────────────────────────────

export default function AddSKUModal({
    open, onClose, onSubmit,
    editingSku = null,
    categoryOptions = [],
}) {
    const t = useTranslations('skupage')

    const [form, setForm]           = useState(DEFAULT_VALUES)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [subCategories, setSubCategories]   = useState([])
    const [isSubCatsLoading, setIsSubCatsLoading] = useState(false)
    const [imageErrors, setImageErrors] = useState({ image_url: false, barcode_url: false })

    const fileRefs = { image_url: useRef(null), barcode_url: useRef(null) }

    // Populate form when opening for edit
    useEffect(() => {
        if (!open) return
        if (editingSku) {
            setForm({
                sku_type:          editingSku.sku_type ?? 'single',
                sku_code:          editingSku.sku_code ?? '',
                product_name:      editingSku.product_name ?? '',
                variant:           editingSku.variant ?? '',
                size:              editingSku.size ?? '',
                category_id:       editingSku.category_id ?? '',
                sub_category_id:   editingSku.subcategory_id ?? editingSku.sub_category_id ?? '',
                brand:             editingSku.brand ?? '',
                cogs_per_unit:     editingSku.cogs_per_unit != null ? String(editingSku.cogs_per_unit) : '',
                weight:            editingSku.weight ?? '',
                length:            editingSku.length ?? '',
                width:             editingSku.width ?? '',
                height:            editingSku.height ?? '',
                image_url:         editingSku.sku_image ?? editingSku.image_url ?? '',
                barcode_url:       editingSku.sku_barcode ?? editingSku.barcode_url ?? '',
                status:            editingSku.status ?? 'ACTIVE',
                bundle_components: (editingSku.bundle_components ?? []).map(c => ({
                    id:            c.component_sku_id ?? c.id ?? null,
                    sku_code:      c.sku_code ?? '',
                    product_name:  c.product_name ?? '',
                    cogs_per_unit: c.cogs_per_unit ?? 0,
                    quantity:      Math.round(Number(c.quantity) || 1),
                })),
                channel_aliases:   editingSku.channel_aliases ?? { shopee: [] },
            })
        } else {
            setForm(DEFAULT_VALUES)
        }
        setImageErrors({ image_url: false, barcode_url: false })
    }, [open, editingSku])

    // Load sub-categories when category changes
    useEffect(() => {
        if (!form.category_id) {
            setSubCategories(prev => prev.length === 0 ? prev : [])
            return
        }
        setIsSubCatsLoading(true)
        services.sku.getCategoryById(form.category_id).then(res => {
            setSubCategories(res?.data?.sub_categories ?? [])
            setIsSubCatsLoading(false)
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.category_id])

    const set = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value, ...(field === 'category_id' ? { sub_category_id: '' } : {}) }))

    const handleFileUpload = (field, file) => {
        if (!file) return
        const reader = new FileReader()
        reader.onload = e => {
            set(field, e.target.result)
            setImageErrors(prev => ({ ...prev, [field]: false }))
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async () => {
        if (!form.sku_code.trim())     return toast(t('skuCodeRequired'))
        if (!form.product_name.trim()) return toast(t('productNameRequired'))
        if (!form.category_id)         return toast(t('categoryRequired'))

        setIsSubmitting(true)
        const success = await onSubmit?.(form)
        setIsSubmitting(false)
        if (success !== false) onClose?.()
    }

    const handleClose = () => { setForm(DEFAULT_VALUES); onClose?.() }

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">

                <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                    <DialogTitle>{editingSku ? t('editSku') : t('addNew')}</DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 px-6 pb-4 space-y-5">
                    {/* ── SKU Type ── */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {t('skuType')}
                        </Label>
                        <div className="flex gap-2">
                            {[
                                { val: 'single', label: t('skuTypeSingle') },
                                { val: 'bundle', label: t('skuTypeBundle') },
                            ].map(({ val, label }) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => set('sku_type', val)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                                        ${form.sku_type === val
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-muted-foreground border-input hover:bg-muted/50'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* ── Basic fields ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>{t('skuCode')} <span className="text-destructive">*</span></Label>
                            <Input placeholder={t('skuCodePlaceholder')} value={form.sku_code}
                                   onChange={e => set('sku_code', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('productName')} <span className="text-destructive">*</span></Label>
                            <Input placeholder={t('productNamePlaceholder')} value={form.product_name}
                                   onChange={e => set('product_name', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>{t('variant')}</Label>
                            <Input placeholder={t('variantPlaceholder')} value={form.variant}
                                   onChange={e => set('variant', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('size')}</Label>
                            <Input placeholder={t('sizePlaceholder')} value={form.size}
                                   onChange={e => set('size', e.target.value)} />
                        </div>
                    </div>

                    {/* ── Category / Sub-category / Brand ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>{t('category')} <span className="text-destructive">*</span></Label>
                            <Select value={form.category_id} onValueChange={v => set('category_id', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('selectCategory')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map(c => (
                                        <SelectItem key={c.id ?? c.value} value={c.id ?? c.value}>
                                            {c.name ?? c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>{t('subCategory')}</Label>
                            {isSubCatsLoading ? <Skeleton className="h-9 w-full" /> : (
                                <Select value={form.sub_category_id}
                                        onValueChange={v => set('sub_category_id', v)}
                                        disabled={!form.category_id}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('selectSubCategory')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subCategories.map(s => (
                                            <SelectItem key={s.id ?? s.value} value={s.id ?? s.value}>
                                                {s.name ?? s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>{t('brand')}</Label>
                            <Input placeholder={t('brandPlaceholder')} value={form.brand}
                                   onChange={e => set('brand', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('status')}</Label>
                            <Select value={form.status} onValueChange={v => set('status', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SKU_STATUSES.map(s => (
                                        <SelectItem key={s} value={s}>
                                            {s.charAt(0) + s.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* ── Bundle Components (shown first for bundle type) ── */}
                    {form.sku_type === 'bundle' && (
                        <BundleComponentsField
                            value={form.bundle_components}
                            onChange={v => set('bundle_components', v)}
                            currentSkuId={editingSku?.id}
                        />
                    )}

                    {/* ── COGS (below bundle components for bundle type) ── */}
                    {form.sku_type === 'single' ? (
                        <div className="space-y-1">
                            <Label>
                                {t('cogsPerUnit')} <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
                                <Input
                                    type="number" min="0" step="1" placeholder="0"
                                    value={form.cogs_per_unit}
                                    onChange={e => set('cogs_per_unit', e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    ) : (
                        <BundleCogsDisplay components={form.bundle_components} t={t} />
                    )}

                    <Separator />

                    {/* ── Dimensions ── */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{t('dimensions')}</p>
                        <div className="grid grid-cols-4 gap-3">
                            {DIMENSION_KEYS.map(key => (
                                <div key={key} className="space-y-1">
                                    <Label className="text-xs">{t(key)}</Label>
                                    <div className="relative">
                                        <Input type="number" step="0.01" min="0" placeholder="0"
                                               value={form[key]}
                                               onChange={e => set(key, e.target.value)}
                                               className="pr-7" />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                            {key === 'weight' ? 'kg' : 'cm'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* ── Channel Listings ── */}
                    <ChannelListingsField
                        value={form.channel_aliases}
                        onChange={v => set('channel_aliases', v)}
                    />

                    <Separator />

                    {/* ── Images ── */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { field: 'image_url',   label: t('skuImage'),   Icon: IconPhoto   },
                            { field: 'barcode_url', label: t('skuBarcode'), Icon: IconBarcode },
                        ].map(({ field, label, Icon }) => (
                            <div key={field} className="space-y-2">
                                <Label>{label}</Label>
                                <input ref={fileRefs[field]} type="file" accept="image/*" className="hidden"
                                       onChange={e => handleFileUpload(field, e.target.files?.[0])}
                                       onClick={e => { e.target.value = '' }} />
                                <div
                                    className="relative flex items-center justify-center h-36 rounded-lg border bg-muted overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                                    onClick={() => !form[field] && fileRefs[field].current?.click()}
                                >
                                    {form[field] && !imageErrors[field] ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={form[field]} alt={label}
                                                 className="w-full h-full object-contain"
                                                 onError={() => setImageErrors(prev => ({ ...prev, [field]: true }))} />
                                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                                                <button type="button"
                                                        onClick={e => { e.stopPropagation(); fileRefs[field].current?.click() }}
                                                        className="flex items-center justify-center h-8 w-8 rounded-full bg-white/90 text-foreground hover:bg-white transition-colors">
                                                    <IconUpload size={14} />
                                                </button>
                                                <button type="button"
                                                        onClick={e => { e.stopPropagation(); set(field, ''); setImageErrors(p => ({ ...p, [field]: false })) }}
                                                        className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">
                                                    <IconX size={14} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Icon size={28} />
                                            <span className="text-xs">{t('clickToUpload')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? t('saving') : editingSku ? t('update') : t('create')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ── Bundle COGS display ────────────────────────────────────────────────────────

function BundleCogsDisplay({ components = [], t }) {
    const tFn = useTranslations('skupage')
    const tr  = t ?? tFn
    const total = components.reduce(
        (sum, c) => sum + (parseFloat(c.cogs_per_unit) || 0) * (Math.round(Number(c.quantity) || 1)),
        0
    )
    const fmtRp = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID')

    if (!components.length) return null

    return (
        <div className="rounded-lg border bg-blue-50/60 p-3 space-y-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{tr('cogsPerUnit')} ({tr('cogsAutoLabel')})</p>
            <div className="space-y-1">
                {components.map((c, i) => (
                    c.id && (
                        <div key={i} className="flex justify-between text-sm text-muted-foreground">
                            <span>{c.product_name || c.sku_code || '-'}</span>
                            <span>{fmtRp(parseFloat(c.cogs_per_unit) || 0)} × {Math.round(Number(c.quantity) || 1)}</span>
                        </div>
                    )
                ))}
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                <span>{tr('cogsBundleTotal')}</span>
                <span className="text-blue-700">{fmtRp(total)}</span>
            </div>
        </div>
    )
}

// ── Channel Listings sub-component ────────────────────────────────────────────

function ChannelListingsField({ value, onChange }) {
    const t = useTranslations('skupage')
    const [inputVal, setInputVal] = useState('')
    const aliases = value?.shopee ?? []

    const addAlias = () => {
        const v = inputVal.trim()
        if (!v || aliases.includes(v)) return
        onChange({ ...value, shopee: [...aliases, v] })
        setInputVal('')
    }

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{t('channelListings')}</p>
            <div className="space-y-2">
                {aliases.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {aliases.map(a => (
                            <Badge key={a} variant="secondary" className="gap-1 pr-1">
                                {a}
                                <button type="button"
                                        onClick={() => onChange({ ...value, shopee: aliases.filter(x => x !== a) })}
                                        className="ml-0.5 hover:text-destructive transition-colors">
                                    <IconX size={10} />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <Input value={inputVal} onChange={e => setInputVal(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                           placeholder={t('channelListingsPlaceholder', { channel: 'Shopee' })}
                           className="flex-1 h-8 text-sm" />
                    <Button type="button" variant="outline" size="sm" onClick={addAlias}
                            disabled={!inputVal.trim()}>
                        + {t('addAlias')}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ── Bundle Components sub-component ───────────────────────────────────────────

function BundleComponentsField({ value = [], onChange, currentSkuId }) {
    const t = useTranslations('skupage')
    const addRow = () =>
        onChange([...value, { id: null, sku_code: '', product_name: '', quantity: 1 }])
    const updateRow = (i, patch) => onChange(value.map((r, idx) => idx === i ? { ...r, ...patch } : r))
    const removeRow = (i) => onChange(value.filter((_, idx) => idx !== i))

    return (
        <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">{t('bundleComponents')}</p>
            {value.length > 0 && (
                <div className="grid gap-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) 90px 32px' }}>
                    <span className="text-xs font-medium text-muted-foreground">{t('bundleProduct')}</span>
                    <span className="text-xs font-medium text-muted-foreground">{t('bundleQty')}</span>
                    <span />
                </div>
            )}
            {value.map((row, i) => (
                <BundleRow key={i} row={row}
                           allSelected={value.map(r => r.id).filter(Boolean)}
                           currentSkuId={currentSkuId}
                           onUpdate={patch => updateRow(i, patch)}
                           onRemove={() => removeRow(i)} />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
                + {t('addBundleProduct')}
            </Button>
        </div>
    )
}

function BundleRow({ row, allSelected, currentSkuId, onUpdate, onRemove }) {
    const t = useTranslations('skupage')
    const [query,   setQuery]   = useState('')
    const [results, setResults] = useState([])
    const [open,    setOpen]    = useState(false)
    const [busy,    setBusy]    = useState(false)
    const dropRef  = useRef(null)
    const inputRef = useRef(null)
    const isSelected = !!row.id

    useEffect(() => {
        const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const runSearch = useCallback(async (q) => {
        setBusy(true)
        try {
            const res = await services.sku.getSkus()
            const all = res?.data?.data ?? res?.data ?? []
            const filtered = q.trim()
                ? all.filter(s =>
                    s.product_name?.toLowerCase().includes(q.toLowerCase()) ||
                    s.sku_code?.toLowerCase().includes(q.toLowerCase()))
                : all
            setResults(filtered.filter(s => s.id !== currentSkuId))
        } catch { setResults([]) }
        setBusy(false)
        setOpen(true)
    }, [currentSkuId])

    const selectSku = (sku) => {
        onUpdate({
            id:            sku.id,
            sku_code:      sku.sku_code,
            product_name:  sku.product_name || sku.name || '',
            cogs_per_unit: parseFloat(sku.cogs_per_unit) || 0,
        })
        setOpen(false); setQuery('')
    }
    const clearSelection = () => {
        onUpdate({ id: null, sku_code: '', product_name: '' })
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    return (
        <div className="grid gap-2 items-center" style={{ gridTemplateColumns: 'minmax(0, 1fr) 90px 32px' }}>
            {isSelected ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 h-9">
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{row.product_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{row.sku_code}</span>
                    <button type="button" onClick={clearSelection}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0">
                        <IconX size={12} />
                    </button>
                </div>
            ) : (
                <div className="relative" ref={dropRef}>
                    <div className="relative">
                        <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input ref={inputRef} value={query}
                               onChange={e => { setQuery(e.target.value); runSearch(e.target.value) }}
                               onFocus={() => { if (!open) runSearch(query) }}
                               placeholder={t('searchProduct')}
                               className="pl-8 h-9 text-sm" />
                    </div>
                    {open && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md overflow-hidden">
                            {busy
                                ? <p className="px-3 py-2 text-xs text-muted-foreground text-center">{t('searching')}</p>
                                : results.length === 0
                                    ? <p className="px-3 py-2 text-xs text-muted-foreground text-center">{t('skuNotFound')}</p>
                                    : <div className="max-h-48 overflow-y-auto">
                                        {results.map(sku => {
                                            const taken = allSelected.includes(sku.id)
                                            return (
                                                <button key={sku.id} type="button" disabled={taken}
                                                        onClick={() => selectSku(sku)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-b last:border-b-0">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm truncate">{sku.product_name || sku.name}</p>
                                                        <p className="text-xs text-muted-foreground">{sku.sku_code}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                            }
                        </div>
                    )}
                </div>
            )}
            <div className="flex items-center gap-1 rounded-md border px-2 h-9">
                <Input type="number" min="1" step="1" value={Math.round(Number(row.quantity) || 1)}
                       onChange={e => onUpdate({ quantity: Math.max(1, Math.round(Number(e.target.value))) })}
                       className="border-0 p-0 h-auto text-sm text-right shadow-none focus-visible:ring-0 w-full" />
                <span className="text-xs text-muted-foreground flex-shrink-0">pcs</span>
            </div>
            <button type="button" onClick={onRemove}
                    className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <IconX size={14} />
            </button>
        </div>
    )
}
