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
import { Skeleton } from "@/components/ui/skeleton"
import services from "@/services"
import { IconBarcode, IconPhoto, IconUpload, IconX } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const INITIAL_FORM = {
    sku_code: '',
    product_name: '',
    category_id: '',
    subcategory_id: '',
    brand: '',
    variant: '',
    size: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    sku_image: '',
    sku_barcode: '',
}

export default function ModalSkuForm({ open, onOpenChange, editingSku, onSuccess }) {
    const t = useTranslations('skupage')
    const [form, setForm] = useState(INITIAL_FORM)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [categories, setCategories] = useState([])
    const [subCategories, setSubCategories] = useState([])
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
    const [isSubCategoriesLoading, setIsSubCategoriesLoading] = useState(false)
    const [imageErrors, setImageErrors] = useState({ sku_image: false, sku_barcode: false })
    const fileRefs = { sku_image: useRef(null), sku_barcode: useRef(null) }

    const handleFileUpload = (field, file) => {
        if (!file) return
        const reader = new FileReader()
        reader.onload = (e) => {
            handleChange(field, e.target.result)
        }
        reader.readAsDataURL(file)
    }

    // Fetch categories when modal opens
    useEffect(() => {
        if (!open) return

        const initForm = editingSku
            ? {
                sku_code: editingSku.sku_code || '',
                product_name: editingSku.product_name || '',
                category_id: editingSku.category_id || '',
                subcategory_id: editingSku.subcategory_id || '',
                brand: editingSku.brand || '',
                variant: editingSku.variant || '',
                size: editingSku.size || '',
                length: editingSku.length ?? '',
                width: editingSku.width ?? '',
                height: editingSku.height ?? '',
                weight: editingSku.weight ?? '',
                sku_image: editingSku.sku_image || '',
                sku_barcode: editingSku.sku_barcode || '',
            }
            : INITIAL_FORM

        setForm(initForm)
        setSubCategories([])
        setImageErrors({ sku_image: false, sku_barcode: false })

        const fetchCategories = async () => {
            setIsCategoriesLoading(true)
            const res = await services.sku.getCategories()
            setCategories(res?.data?.data ?? res?.data ?? [])
            setIsCategoriesLoading(false)
        }
        fetchCategories()

        if (initForm.category_id) {
            const fetchSubCategories = async () => {
                setIsSubCategoriesLoading(true)
                const res = await services.sku.getCategoryById(initForm.category_id)
                const subs = res?.data?.sub_categories ?? []
                setSubCategories(subs)
                setIsSubCategoriesLoading(false)
            }
            fetchSubCategories()
        }
    }, [open, editingSku])

    // Fetch subcategories when category changes
    useEffect(() => {
        if (!form.category_id) {
            setSubCategories([])
            return
        }
        const fetchSubCategories = async () => {
            setIsSubCategoriesLoading(true)
            const res = await services.sku.getCategoryById(form.category_id)
            const subs = res?.data?.sub_categories ?? []
            setSubCategories(subs)
            setIsSubCategoriesLoading(false)
        }
        fetchSubCategories()
    }, [form.category_id])

    const handleChange = (field, value) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value }
            if (field === 'category_id') next.subcategory_id = ''
            return next
        })
        if (field === 'sku_image' || field === 'sku_barcode') {
            setImageErrors((prev) => ({ ...prev, [field]: false }))
        }
    }

    const handleSubmit = async () => {
        if (!form.sku_code.trim()) {
            toast(t('skuCodeRequired'))
            return
        }
        if (!form.category_id) {
            toast(t('categoryRequired'))
            return
        }
        if (!form.brand.trim()) {
            toast(t('brandRequired'))
            return
        }

        const payload = {
            sku_code: form.sku_code,
            category_id: form.category_id,
            brand: form.brand,
            length: parseFloat(form.length),
            width: parseFloat(form.width),
            height: parseFloat(form.height),
            weight: parseFloat(form.weight),
            ...(form.subcategory_id && { subcategory_id: form.subcategory_id }),
            ...(form.product_name && { product_name: form.product_name }),
            ...(form.variant && { variant: form.variant }),
            ...(form.size && { size: form.size }),
            ...(editingSku
                ? { sku_image: form.sku_image || null, sku_barcode: form.sku_barcode || null }
                : {
                    ...(form.sku_image && { sku_image: form.sku_image }),
                    ...(form.sku_barcode && { sku_barcode: form.sku_barcode }),
                }),
        }

        setIsSubmitting(true)
        const res = editingSku
            ? await services.sku.updateSku(editingSku.id, payload)
            : await services.sku.createSku(payload)

        if (res?.success) {
            toast(editingSku ? t('updateSuccess') : t('createSuccess'))
            onSuccess()
        } else {
            toast(editingSku ? t('updateFailed') : t('createFailed'))
        }
        setIsSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{editingSku ? t('editSku') : t('addNew')}</DialogTitle>
                </DialogHeader>

                <div className="my-3">
                    <Separator />
                </div>

                <div className="space-y-4 py-2 pb-16">
                    {/* SKU Code & Product Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>
                                {t('skuCode')} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder={t('skuCodePlaceholder')}
                                value={form.sku_code}
                                onChange={(e) => handleChange('sku_code', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('productName')}</Label>
                            <Input
                                placeholder={t('productNamePlaceholder')}
                                value={form.product_name}
                                onChange={(e) => handleChange('product_name', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Category & Sub Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>
                                {t('category')} <span className="text-destructive">*</span>
                            </Label>
                            {isCategoriesLoading ? (
                                <Skeleton className="h-9 w-full" />
                            ) : (
                                <Select
                                    value={form.category_id}
                                    onValueChange={(v) => handleChange('category_id', v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('selectCategory')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>{t('subCategory')}</Label>
                            {isSubCategoriesLoading ? (
                                <Skeleton className="h-9 w-full" />
                            ) : (
                                <Select
                                    value={form.subcategory_id}
                                    onValueChange={(v) => handleChange('subcategory_id', v)}
                                    disabled={!form.category_id}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('selectSubCategory')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subCategories.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {/* Brand / Variant / Size */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label>{t('brand')} <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder={t('brandPlaceholder')}
                                value={form.brand}
                                onChange={(e) => handleChange('brand', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('variant')}</Label>
                            <Input
                                placeholder={t('variantPlaceholder')}
                                value={form.variant}
                                onChange={(e) => handleChange('variant', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('size')}</Label>
                            <Input
                                placeholder={t('sizePlaceholder')}
                                value={form.size}
                                onChange={(e) => handleChange('size', e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Dimensions */}
                    <p className="text-sm font-medium text-muted-foreground">{t('dimensions')}</p>
                    <div className="grid grid-cols-4 gap-4">
                        {['length', 'width', 'height', 'weight'].map((field) => (
                            <div key={field} className="space-y-1">
                                <Label>{t(field)}</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={form[field]}
                                    onChange={(e) => handleChange(field, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <Separator />

                    {/* Image & Barcode */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { field: 'sku_image', label: t('skuImage'), Icon: IconPhoto },
                            { field: 'sku_barcode', label: t('skuBarcode'), Icon: IconBarcode },
                        ].map(({ field, label, Icon }) => (
                            <div key={field} className="space-y-2">
                                <Label>{label}</Label>
                                {/* Hidden file input */}
                                <input
                                    ref={fileRefs[field]}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(field, e.target.files?.[0])}
                                    onClick={(e) => { e.target.value = '' }}
                                />
                                <div
                                    className="relative flex items-center justify-center h-40 rounded-lg border bg-muted overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                                    onClick={() => !form[field] && fileRefs[field].current?.click()}
                                >
                                    {form[field] && !imageErrors[field] ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={form[field]}
                                                alt={label}
                                                className="w-full h-full object-contain"
                                                onError={() => setImageErrors((prev) => ({ ...prev, [field]: true }))}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); fileRefs[field].current?.click() }}
                                                    className="flex items-center justify-center h-8 w-8 rounded-full bg-white/90 text-foreground hover:bg-white transition-colors"
                                                >
                                                    <IconUpload size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleChange(field, '') }}
                                                    className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                                                >
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

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
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
