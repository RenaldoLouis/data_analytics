'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { IconSearch } from "@tabler/icons-react"

export default function SkuSelectionModal({ t, skuModalOpen, setSkuModalOpen, skuSearch, setSkuSearch, isSkusLoading, filteredSkus, currentSku, selectSku, onCreateNew }) {
    return (
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
                        <div className="flex flex-col items-center gap-3 py-8">
                            <p className="text-center text-sm text-muted-foreground">{t('noSkusFound')}</p>
                            {onCreateNew && (
                                <button
                                    type="button"
                                    onClick={onCreateNew}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    + {t('createNewSku')}
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredSkus.map(sku => {
                            const isSelected = currentSku?.id === sku.id
                            return (
                                <button
                                    key={sku.id}
                                    type="button"
                                    onClick={() => selectSku(sku)}
                                    className={`w-full text-left rounded-md border p-3 transition-colors space-y-0.5 ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'}`}
                                >
                                    <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{sku.product_name || '-'}</p>
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
                {onCreateNew && filteredSkus.length > 0 && (
                    <div className="px-4 py-3 border-t flex-shrink-0">
                        <button
                            type="button"
                            onClick={onCreateNew}
                            className="w-full text-sm font-medium text-primary hover:underline text-center"
                        >
                            + {t('createNewSku')}
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
