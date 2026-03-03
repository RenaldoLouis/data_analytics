'use client'

import ModalSkuForm from "@/components/ModalSkuForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import services from "@/services"
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconPencil,
    IconPlus,
    IconTrash,
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
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

const SKELETON_ROWS = 5
const SKELETON_COLS = 9

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
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

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

    const handleDelete = async (skuId) => {
        setIsMutating(true)
        const res = await services.sku.deleteSku(skuId)
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
            header: t('skuCode'),
            cell: ({ row }) => (
                <span className="font-medium">{row.original.sku_code}</span>
            ),
        },
        {
            accessorKey: 'product_name',
            header: t('productName'),
            cell: ({ row }) => row.original.product_name || '-',
        },
        {
            accessorKey: 'category_id',
            header: t('category'),
            cell: ({ row }) => categoryMap[row.original.category_id] || '-',
        },
        {
            accessorKey: 'subcategory_id',
            header: t('subCategory'),
            cell: ({ row }) => subCategoryMap[row.original.subcategory_id] || '-',
        },
        {
            accessorKey: 'brand',
            header: t('brand'),
            cell: ({ row }) => row.original.brand || '-',
        },
        {
            accessorKey: 'variant',
            header: t('variant'),
            cell: ({ row }) => row.original.variant || '-',
        },
        {
            accessorKey: 'size',
            header: t('size'),
            cell: ({ row }) => row.original.size || '-',
        },
        {
            accessorKey: 'status',
            header: t('status'),
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
                        onClick={() => handleDelete(row.original.id)}
                    />
                </div>
            ),
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [categoryMap, subCategoryMap, t])

    const table = useReactTable({
        data: skus,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <>
            {isMutating && <LoadingScreen />}

            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                    <Button
                        onClick={() => { setEditingSku(null); setIsModalOpen(true) }}
                        disabled={isPageLoading}
                    >
                        <IconPlus size={16} />
                        {t('addNew')}
                    </Button>
                </div>

                <Separator />

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
                                            {t('noData')}
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

            <ModalSkuForm
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                editingSku={editingSku}
                onSuccess={() => { setIsModalOpen(false); setIsFetch((prev) => !prev) }}
            />
        </>
    )
}
