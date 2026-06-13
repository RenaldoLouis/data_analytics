'use client'

import AddSKUModal from "../pl/AddSKUModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
    IconArrowsSort,
    IconSortAscending,
    IconSortDescending,
    IconPencil,
    IconPlus,
    IconSearch,
    IconTrash,
    IconX,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

const SKELETON_ROWS = 5
const SKELETON_COLS = 10

// Clickable column header that toggles sorting (asc → desc → none)
function SortableHeader({ column, label }) {
    const sorted = column.getIsSorted()
    return (
        <button
            type="button"
            className="flex items-center gap-1.5 select-none hover:text-foreground transition-colors"
            onClick={() => column.toggleSorting(sorted === 'asc')}
        >
            {label}
            {sorted === 'asc'
                ? <IconSortAscending size={15} className="text-foreground" />
                : sorted === 'desc'
                    ? <IconSortDescending size={15} className="text-foreground" />
                    : <IconArrowsSort size={15} className="text-muted-foreground/50" />}
        </button>
    )
}

export default function SkuList() {
    const t = useTranslations('skupage')
    const [skus, setSkus] = useState([])
    const [categories, setCategories] = useState([])
    const [subCategories, setSubCategories] = useState([])
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [isMutating, setIsMutating] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSku, setEditingSku] = useState(null)
    const [isFetch, setIsFetch] = useState(false)
    const [deletingSku, setDeletingSku] = useState(null)
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [globalFilter, setGlobalFilter] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [sorting, setSorting] = useState([])
    const searchInputRef = useRef(null)
    const mobileSearchInputRef = useRef(null)

    useEffect(() => {
        const fetchData = async () => {
            setIsPageLoading(true)
            const [skusRes, categoriesRes, subCategoriesRes] = await Promise.all([
                services.sku.getSkus(),
                services.sku.getCategories(),
                services.sku.getSubCategories(),
            ])
            setSkus(skusRes?.data?.data ?? skusRes?.data ?? [])
            setCategories(categoriesRes?.data?.data ?? categoriesRes?.data ?? [])
            setSubCategories(subCategoriesRes?.data?.data ?? subCategoriesRes?.data ?? [])
            setIsPageLoading(false)
        }
        fetchData()
    }, [isFetch])

    const categoryMap = useMemo(
        () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
        [categories]
    )

    const subCategoryMap = useMemo(
        () => Object.fromEntries(subCategories.map((s) => [s.id, s.name])),
        [subCategories]
    )

    const categoryOptions = useMemo(() => categories, [categories])

    // Reset to first page whenever the search query changes
    useEffect(() => {
        setPagination(p => ({ ...p, pageIndex: 0 }))
    }, [globalFilter])

    // Focus the visible search input when it's opened (desktop inline or mobile row)
    useEffect(() => {
        if (!isSearchOpen) return
        const el = window.matchMedia('(min-width: 640px)').matches
            ? searchInputRef.current
            : mobileSearchInputRef.current
        el?.focus()
    }, [isSearchOpen])

    const toggleSearch = () => {
        if (isSearchOpen) {
            setIsSearchOpen(false)
            setGlobalFilter('')
        } else {
            setIsSearchOpen(true)
        }
    }

    const globalFilterFn = useCallback((row, _columnId, filterValue) => {
        const q = String(filterValue ?? '').trim().toLowerCase()
        if (!q) return true
        const r = row.original
        const haystack = [
            r.sku_code,
            r.product_name,
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(q)
    }, [])

    const handleSkuSubmit = async (data) => {
        const payload = {
            sku_type:          data.sku_type ?? 'single',
            sku_code:          data.sku_code,
            product_name:      data.product_name || null,
            category_id:       data.category_id,
            subcategory_id:    data.sub_category_id || null,
            brand:             data.brand || null,
            variant:           data.variant || null,
            size:              data.size || null,
            // COGS: single = manual input, bundle = auto-computed from component COGS × qty
            cogs_per_unit:     data.sku_type === 'single'
                ? (parseFloat(data.cogs_per_unit) || 0)
                : (data.bundle_components ?? []).reduce(
                    (sum, c) => sum + (parseFloat(c.cogs_per_unit) || 0) * (Math.round(Number(c.quantity) || 1)),
                    0
                  ),
            length:            parseFloat(data.length) || null,
            width:             parseFloat(data.width) || null,
            height:            parseFloat(data.height) || null,
            weight:            parseFloat(data.weight) || null,
            sku_image:         data.image_url || null,
            sku_barcode:       data.barcode_url || null,
            status:            data.status || undefined,
            channel_aliases:   data.channel_aliases ?? { shopee: [] },
            bundle_components: data.sku_type === 'bundle'
                ? (data.bundle_components ?? []).map(c => ({
                    component_sku_id: c.id ?? c.component_sku_id,
                    quantity: Math.round(Number(c.quantity) || 1),
                })).filter(c => c.component_sku_id)
                : [],
        }
        const res = editingSku
            ? await services.sku.updateSku(editingSku.id, payload)
            : await services.sku.createSku(payload)
        if (res?.success) {
            toast(editingSku ? t('updateSuccess') : t('createSuccess'))
            setIsFetch(prev => !prev)
            return true
        } else {
            const msg = res?.error?.data?.message || (editingSku ? t('updateFailed') : t('createFailed'))
            toast.error(msg)
            return false
        }
    }

    const confirmDelete = async () => {
        if (!deletingSku) return
        setDeletingSku(null)
        setIsMutating(true)
        const res = await services.sku.deleteSku(deletingSku.id)
        if (res?.success) {
            toast(t('deleteSuccess'))
            setIsFetch((prev) => !prev)
        } else {
            toast(t('deleteFailed'))
        }
        setIsMutating(false)
    }

    const columns = useMemo(() => [
        {
            accessorKey: 'sku_code',
            header: ({ column }) => <SortableHeader column={column} label={t('skuCode')} />,
            cell: ({ row }) => (
                <span className="font-medium">{row.original.sku_code}</span>
            ),
        },
        {
            accessorKey: 'sku_type',
            header: ({ column }) => <SortableHeader column={column} label={t('skuType')} />,
            cell: ({ row }) => {
                const type = row.original.sku_type ?? 'single'
                return (
                    <Badge variant={type === 'bundle' ? 'default' : 'secondary'} className="capitalize">
                        {type}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'product_name',
            header: ({ column }) => <SortableHeader column={column} label={t('productName')} />,
            cell: ({ row }) => row.original.product_name || '-',
        },
        {
            id: 'category_id',
            accessorFn: (row) => categoryMap[row.category_id] || '',
            header: ({ column }) => <SortableHeader column={column} label={t('category')} />,
            cell: ({ row }) => categoryMap[row.original.category_id] || '-',
        },
        {
            id: 'subcategory_id',
            accessorFn: (row) => subCategoryMap[row.subcategory_id] || '',
            header: ({ column }) => <SortableHeader column={column} label={t('subCategory')} />,
            cell: ({ row }) => subCategoryMap[row.original.subcategory_id] || '-',
        },
        {
            accessorKey: 'brand',
            header: ({ column }) => <SortableHeader column={column} label={t('brand')} />,
            cell: ({ row }) => row.original.brand || '-',
        },
        {
            accessorKey: 'variant',
            header: ({ column }) => <SortableHeader column={column} label={t('variant')} />,
            cell: ({ row }) => row.original.variant || '-',
        },
        {
            accessorKey: 'size',
            header: ({ column }) => <SortableHeader column={column} label={t('size')} />,
            cell: ({ row }) => row.original.size || '-',
        },
        {
            accessorKey: 'status',
            header: ({ column }) => <SortableHeader column={column} label={t('status')} />,
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <IconPencil
                        size={16}
                        className="cursor-pointer text-blue-500 hover:text-blue-700 transition-colors"
                        onClick={() => {
                            setEditingSku(row.original)
                            setIsModalOpen(true)
                        }}
                    />
                    <IconTrash
                        size={16}
                        className="cursor-pointer text-red-500 hover:text-red-700 transition-colors"
                        onClick={() => setDeletingSku(row.original)}
                    />
                </div>
            ),
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [categoryMap, subCategoryMap, t])

    const table = useReactTable({
        data: skus,
        columns,
        state: { pagination, globalFilter, sorting },
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        globalFilterFn,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <>
            {isMutating && <LoadingScreen />}

            <div className="space-y-4">
                <div className="flex justify-between items-center px-4 lg:px-6 gap-2">
                    <H3 className="text-xl font-bold truncate">{t("title")}</H3>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Desktop: inline expanding search (smooth fixed-width animation) */}
                        <div
                            className={`hidden sm:block overflow-hidden transition-all duration-200 ${
                                isSearchOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'
                            }`}
                        >
                            <div className="relative">
                                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input
                                    ref={searchInputRef}
                                    className="pl-9"
                                    placeholder={t('searchPlaceholder')}
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    disabled={isPageLoading}
                                />
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={toggleSearch}
                            disabled={isPageLoading}
                        >
                            {isSearchOpen ? <IconX size={16} /> : <IconSearch size={16} />}
                        </Button>
                        <Button
                            className="shrink-0"
                            onClick={() => { setEditingSku(null); setIsModalOpen(true) }}
                            disabled={isPageLoading}
                        >
                            <IconPlus size={16} />
                            <span className="hidden sm:inline">{t('addNew')}</span>
                        </Button>
                    </div>
                </div>

                {/* Mobile: full-width search row that slides down (smooth max-height animation) */}
                <div
                    className={`sm:hidden px-4 overflow-hidden transition-all duration-200 ${
                        isSearchOpen ? 'max-h-16 opacity-100 mt-1' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="relative">
                        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            ref={mobileSearchInputRef}
                            className="pl-9"
                            placeholder={t('searchPlaceholder')}
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            disabled={isPageLoading}
                        />
                    </div>
                </div>

                <div className="px-4 lg:px-6">
                    <Separator />
                </div>

                <div className="px-4 lg:px-6 py-4 space-y-4">
                    <div className="overflow-hidden rounded-lg border">
                        {isPageLoading ? (
                            <Table>
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    <TableRow>
                                        {Array.from({ length: SKELETON_COLS }).map((_, i) => (
                                            <TableHead key={i}>
                                                <Skeleton className="h-4 w-20" />
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
                                        <TableRow key={rowIdx}>
                                            {Array.from({ length: SKELETON_COLS }).map((_, colIdx) => (
                                                <TableCell key={colIdx}>
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id} colSpan={header.colSpan}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                                                {globalFilter ? t('noSearchResults') : t('noData')}
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
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to first page</span>
                                    <IconChevronsLeft />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="size-8"
                                    size="icon"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <IconChevronLeft />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="size-8"
                                    size="icon"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to next page</span>
                                    <IconChevronRight />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="hidden size-8 lg:flex"
                                    size="icon"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to last page</span>
                                    <IconChevronsRight />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AddSKUModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingSku={editingSku}
                categoryOptions={categoryOptions}
                onSubmit={handleSkuSubmit}
            />

            <Dialog open={!!deletingSku} onOpenChange={(open) => { if (!open) setDeletingSku(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteConfirmDesc', { name: deletingSku?.sku_code || deletingSku?.product_name || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingSku(null)}>
                            {t('deleteCancel')}
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            {t('deleteConfirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
