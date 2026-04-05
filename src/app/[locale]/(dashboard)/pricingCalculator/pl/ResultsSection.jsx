'use client'

import { IconPresentationAnalytics } from "@tabler/icons-react"
import { fmt } from "./plLib"
import { ChTh, SectionCard } from "./PlComponents"

export default function ResultsSection({
    t, channels,
    // metrics
    allSkuMetrics, namedProducts, selectedSku,
    allSkuGrossTotal, allSkuNetTotal, allSkuGrossProfit, allSkuFixedTotal, allSkuOpProfit,
    enablerFixedTotal, enablerVarTotal,
    finalMonthlyPL, finalMonthlyPLPct, finalPlColor,
    // modal
    setDetailModalSku,
}) {
    if (channels.length === 0) return null

    return (
        <SectionCard
            icon={<IconPresentationAnalytics size={18} />}
            title={t('calculationResultsTitle')}
            subtitle={t('calculationResultsSubtitle')}
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
                                <ChTh>{t('colGrossProfit')}</ChTh>
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
                                    <td className="py-2.5 px-2 text-right text-xs tabular-nums">
                                        <span className={`font-semibold ${m.grossProfit < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(m.grossProfit)}</span>
                                        <span className="text-[10px] font-normal text-muted-foreground ml-1">({m.grossMarginPct.toFixed(1)}%)</span>
                                    </td>
                                    <td className="py-2.5 px-2 text-right text-xs tabular-nums text-red-600">
                                        {m.fixedCost > 0 ? `− ${fmt(m.fixedCost)}` : <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="py-2.5 px-2 pr-4 text-right text-xs tabular-nums">
                                        <span className={`font-semibold ${m.operatingProfit < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(m.operatingProfit)}</span>
                                        <span className="text-[10px] font-normal text-muted-foreground ml-1">({m.operatingMarginPct.toFixed(1)}%)</span>
                                    </td>
                                </tr>
                            ))}
                            {namedProducts.length > 1 && (
                                <tr className="border-t bg-muted/40">
                                    <td className="py-2.5 pl-4 text-xs font-semibold">{t('totalRow')}</td>
                                    <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums">{fmt(allSkuGrossTotal)}</td>
                                    <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums">{fmt(allSkuNetTotal)}</td>
                                    <td className="py-2.5 px-2 text-right text-xs font-semibold tabular-nums">
                                        <span className={allSkuGrossProfit < 0 ? 'text-red-600' : 'text-green-700'}>{fmt(allSkuGrossProfit)}</span>
                                    </td>
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
                    <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${finalMonthlyPL >= 0 ? 'bg-green-600' : 'bg-red-500'}`} />
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
    )
}
