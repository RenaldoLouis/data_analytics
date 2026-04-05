'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { fmt } from "./plLib"
import { ChBadge, ChTh } from "./PlComponents"

export default function SkuDetailModal({ t, channels, detailModalSku, setDetailModalSku, skuDetailData }) {
    if (!skuDetailData) return (
        <Dialog open={!!detailModalSku} onOpenChange={open => !open && setDetailModalSku(null)}>
            <DialogContent className="w-full md:w-[90vw] md:max-w-5xl flex flex-col gap-0 p-0 overflow-hidden h-[92vh] md:h-auto md:max-h-[88vh]">
                <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b flex-shrink-0">
                    <DialogTitle>{detailModalSku?.name}</DialogTitle>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )

    const d = skuDetailData
    const gpColor = d.grossProfit < 0 ? 'text-red-600' : 'text-green-700'
    const opColor = d.operatingProfit < 0 ? 'text-red-600' : 'text-green-700'

    return (
        <Dialog open={!!detailModalSku} onOpenChange={open => !open && setDetailModalSku(null)}>
            <DialogContent className="w-full md:w-[90vw] md:max-w-5xl flex flex-col gap-0 p-0 overflow-hidden h-[92vh] md:h-auto md:max-h-[88vh]">
                <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b flex-shrink-0">
                    <DialogTitle>{detailModalSku?.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('skuDetailModalSubtitle')}</p>
                </DialogHeader>
                <div className="overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
                    {/* 3 summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Gross GMV */}
                        <div className="rounded-lg border overflow-hidden">
                            <div className="px-4 py-3 border-b flex items-center gap-2">
                                <span className="w-2 h-2 rounded-sm bg-blue-500 flex-shrink-0" />
                                <span className="text-sm font-semibold">{t('grossGmvCardTitle')}</span>
                            </div>
                            <div className="p-4">
                                <p className="text-xl font-semibold tabular-nums mb-0.5">{fmt(d.grossTotal)}</p>
                                <p className="text-xs text-muted-foreground mb-3">{t('grossGmvCardDesc')}</p>
                                <div className="space-y-2 border-t pt-3">
                                    {channels.map((ch, i) => (
                                        <div key={ch} className="flex justify-between items-center">
                                            <ChBadge code={ch} label={ch} />
                                            <span className="text-xs tabular-nums">{fmt(d.grossByCh[i])}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Net GMV */}
                        <div className="rounded-lg border overflow-hidden">
                            <div className="px-4 py-3 border-b flex items-center gap-2">
                                <span className="w-2 h-2 rounded-sm bg-green-600 flex-shrink-0" />
                                <span className="text-sm font-semibold">{t('netGmvCardTitle')}</span>
                            </div>
                            <div className="p-4">
                                <p className="text-xl font-semibold tabular-nums mb-0.5">{fmt(d.netTotal)}</p>
                                <p className="text-xs text-muted-foreground mb-3">{t('netGmvCardDesc')}</p>
                                <div className="space-y-2 border-t pt-3">
                                    {channels.map((ch, i) => (
                                        <div key={ch} className="flex justify-between items-center">
                                            <ChBadge code={ch} label={ch} />
                                            <span className={`text-xs tabular-nums font-medium ${d.netByCh[i] < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                {fmt(d.netByCh[i])}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* P&L Summary */}
                        <div className="rounded-lg border overflow-hidden">
                            <div className="px-4 py-3 border-b flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${opColor === 'text-green-700' ? 'bg-green-600' : opColor === 'text-amber-600' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                <span className="text-sm font-semibold">{t('plSummaryCardTitle')}</span>
                            </div>
                            <div className="p-4">
                                <p className={`text-xl font-semibold tabular-nums mb-0.5 ${opColor}`}>{d.operatingMarginPct.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground mb-3">{t('plSummaryCardDesc')}</p>
                                <div className="space-y-1 border-t pt-3">
                                    {[
                                        [t('rowGrossGmv'), fmt(d.grossTotal), ''],
                                        [t('rowDeductDiscount'), fmt(d.discByCh.reduce((a, b) => a + b, 0)), 'd'],
                                        [t('rowDeductReturn'), fmt(d.retByCh.reduce((a, b) => a + b, 0)), 'd'],
                                        [t('rowDeductShipping'), fmt(d.shipByCh.reduce((a, b) => a + b, 0)), 'd'],
                                        [t('rowDeductAds'), fmt(d.adsByCh.reduce((a, b) => a + b, 0)), 'd'],
                                    ].map(([label, val, type]) => (
                                        <div key={label} className="flex justify-between">
                                            <span className="text-xs text-muted-foreground">{label}</span>
                                            <span className={`text-xs tabular-nums ${type === 'd' ? 'text-red-600' : ''}`}>{val}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between border-t pt-1.5 mt-0.5">
                                        <span className="text-xs font-semibold">{t('rowNetRevenue')}</span>
                                        <span className="text-xs font-semibold tabular-nums">{fmt(d.netTotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">{t('rowDeductCogs')}</span>
                                        <span className="text-xs tabular-nums text-red-600">{fmt(d.cogsTotal)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1.5 mt-0.5">
                                        <span className="text-xs font-semibold">{t('rowGrossProfit')}</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className={`text-[10px] tabular-nums ${gpColor}`}>({d.grossMarginPct.toFixed(1)}%)</span>
                                            <span className={`text-xs font-bold tabular-nums ${gpColor}`}>{fmt(d.grossProfit)}</span>
                                        </div>
                                    </div>
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
                            <table className="w-full border-collapse text-sm" style={{ minWidth: 540 }}>
                                <thead>
                                    <tr>
                                        <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[100px]">{t('colChannel')}</th>
                                        <ChTh>{t('colGrossGmv')}</ChTh>
                                        <ChTh>{t('colDiscount')}</ChTh>
                                        <ChTh>{t('colReturn')}</ChTh>
                                        <ChTh>{t('colShipping')}</ChTh>
                                        <ChTh>{t('colAds')}</ChTh>
                                        <ChTh>{t('colNetGmv')}</ChTh>
                                    </tr>
                                </thead>
                                <tbody>
                                    {channels.map((ch, i) => (
                                        <tr key={ch} className="border-t">
                                            <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums">{fmt(d.grossByCh[i])}</td>
                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(d.discByCh[i])}</td>
                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(d.retByCh[i])}</td>
                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(d.shipByCh[i])}</td>
                                            <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">− {fmt(d.adsByCh[i])}</td>
                                            <td className={`py-2.5 px-2 text-right text-xs tabular-nums font-semibold ${d.netByCh[i] < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                {fmt(d.netByCh[i])}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t bg-muted/40">
                                        <td className="py-2.5 text-xs font-semibold">{t('totalRow')}</td>
                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums">{fmt(d.grossTotal)}</td>
                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(d.discByCh.reduce((a, b) => a + b, 0))}</td>
                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(d.retByCh.reduce((a, b) => a + b, 0))}</td>
                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(d.shipByCh.reduce((a, b) => a + b, 0))}</td>
                                        <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums text-red-600">− {fmt(d.adsByCh.reduce((a, b) => a + b, 0))}</td>
                                        <td className={`py-2.5 px-2 text-right text-xs font-bold tabular-nums ${d.netTotal < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                            {fmt(d.netTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
