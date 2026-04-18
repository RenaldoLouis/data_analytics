'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { IconBuildingStore, IconDownload, IconFileExport, IconFileImport, IconPresentationAnalytics } from "@tabler/icons-react"
import * as XLSX from "xlsx"
import { useRef } from "react"
import { toast } from "sonner"
import { DISCOUNT_COLS, MONTH_LABELS, fmt } from "./plLib"
import { generatePlTemplate, parsePlImport, exportPlToExcel } from "./plExcel"
import { ChBadge, ChInput, PnLAccordion, SectionCard, SetupSummaryCard, ChTh } from "./PlComponents"

export default function MonthlyInputSection({
    t,
    // setup summary
    setup, channels,
    setSetupDone,
    // period
    activeYear, setActiveYear, activeMo, setActiveMo,
    isMonthsLoading, takenMonths,
    // enabler
    enablerConfig, enablerFixedTotal,
    monthlyCommissionRate, setMonthlyCommissionRate,
    varData, setVarData, customVarTotal,
    // SKU selector
    products, selectedSku, setSelectedSku, activeSku,
    // monthly form state
    infoData, setInfoData,
    discountData, setDiscountData,
    returnData, setReturnData,
    shippingData, setShippingData,
    adsData, setAdsData,
    bundlingData, setBundlingData,
    customRows, setCustomRows,
    secFilled, markFilled,
    // calculations
    grossByChannel, discByChannel, retByChannel, adsByChannel,
    totalDiscountPct, fixedTotal,
    getChFee,
    // labels
    DISCOUNT_LABELS,
    // excel import/export
    onImportExcel,
    onExportCurrent,
}) {
    const fileInputRef = useRef(null)

    const handleDownloadTemplate = () => {
        const wb = generatePlTemplate(channels, products)
        XLSX.writeFile(wb, 'pl_monthly_template.xlsx')
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' })
                const parsed = parsePlImport(wb, channels)
                onImportExcel(parsed)
            } catch {
                toast.error(t('importError'))
            }
        }
        reader.onerror = () => toast.error(t('importError'))
        reader.readAsBinaryString(file)
        e.target.value = ''
    }

    return (
        <>
            {/* Setup summary */}
            <SetupSummaryCard
                setup={setup}
                activeChannels={channels.map(ch => ({ code: ch, label: ch }))}
                onEditSetup={() => setSetupDone(false)}
                editLabel={t('editSetup')}
            />

            {/* Period selector */}
            <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{t('periodTitle')} <span className="text-red-500">*</span></p>
                <div className="mb-3">
                    <Label className="text-xs mb-1 block">{t('yearLabel')}</Label>
                    <Select value={activeYear} onValueChange={val => setActiveYear(val)}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder={t('yearLabel')} />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 30 }, (_, i) => {
                                const y = String(new Date().getFullYear() - i)
                                return <SelectItem key={y} value={y}>{y}</SelectItem>
                            })}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {isMonthsLoading
                        ? MONTH_LABELS.map(m => (
                            <Skeleton key={m} className="h-8 w-11 rounded" />
                        ))
                        : MONTH_LABELS.map((m, i) => {
                            const monthCode = String(i + 1).padStart(2, '0')
                            const isTaken = takenMonths.includes(monthCode)
                            return (
                                <button
                                    key={m}
                                    type="button"
                                    disabled={isTaken}
                                    onClick={() => !isTaken && setActiveMo(m)}
                                    className={`h-8 w-11 rounded text-xs font-medium border transition-colors
                                        ${activeMo === m ? 'bg-primary text-primary-foreground border-primary'
                                            : isTaken ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50'
                                                : 'bg-card hover:bg-muted/50'}`}
                                >{m}</button>
                            )
                        })
                    }
                </div>
            </div>

            {/* Monthly Enabler Cost */}
            <SectionCard
                icon={<IconBuildingStore size={18} />}
                title={t('monthlyEnablerCostTitle')}
                subtitle={t('monthlyEnablerCostSubtitle')}
            >
                <div className="-mx-5 -mb-5 mt-5">
                    {/* Fixed Cost section */}
                    <PnLAccordion
                        title={t('enablerFixedTitle')}
                        subtitle={t('enablerFixedSubtitle')}
                        pillVariant="prefilled"
                        pillText={t('pillPrefilled')}
                        defaultOpen
                    >
                        <div className="divide-y">
                            {enablerConfig.customFixed.filter(r => parseFloat(r.val) > 0).map(r => (
                                <div key={r.id} className="flex items-center justify-between py-2.5">
                                    <p className="text-xs font-medium">{r.name || '—'}</p>
                                    <span className="text-xs font-semibold text-teal-700 tabular-nums">{fmt(parseFloat(r.val))}</span>
                                </div>
                            ))}
                            {enablerFixedTotal > 0 ? (
                                <div className="flex justify-between py-2.5">
                                    <span className="text-xs text-muted-foreground">{t('subtotalFixed')}</span>
                                    <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(enablerFixedTotal)})</span>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground py-2 text-center">{t('configureEnablerHint')}</p>
                            )}
                        </div>
                    </PnLAccordion>

                    {/* Variable Cost section */}
                    <PnLAccordion
                        title={t('enablerVarTitle')}
                        subtitle={t('enablerVarSubtitle')}
                        pillVariant={customVarTotal > 0 ? "filled" : "required"}
                        pillText={customVarTotal > 0 ? t('pillFilled') : t('pillRequired')}
                        defaultOpen
                    >
                        <div className="divide-y">
                            <div className="flex items-center justify-between py-2.5">
                                <div className="flex-1">
                                    <p className="text-xs font-medium">{t('commissionGmvLabel')}</p>
                                    <p className="text-[11px] text-muted-foreground">{t('autoCalcFromGmv')}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={monthlyCommissionRate}
                                        onChange={e => setMonthlyCommissionRate(e.target.value)}
                                        placeholder="0"
                                        className={`w-20 text-right text-xs px-2 py-1.5 rounded border outline-none ${(parseFloat(monthlyCommissionRate) || 0) > 0 ? 'border-green-300 bg-green-50 text-green-900' : 'border-orange-300 bg-orange-50'}`}
                                    />
                                    <span className="text-xs text-muted-foreground">% GMV</span>
                                </div>
                            </div>
                            {enablerConfig.customVar.filter(r => r.name).map(r => (
                                <div key={r.id} className="flex items-center justify-between py-2.5">
                                    <p className="text-xs font-medium">{r.name}</p>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs text-muted-foreground">Rp</span>
                                        <ChInput
                                            currency
                                            value={varData[r.name] ?? ''}
                                            onChange={v => setVarData(prev => ({ ...prev, [r.name]: v }))}
                                            highlight={(parseFloat(varData[r.name]) || 0) > 0 ? 'filled' : 'warn'}
                                        />
                                    </div>
                                </div>
                            ))}
                            {enablerConfig.customVar.filter(r => r.name).length === 0 && (
                                <p className="text-xs text-muted-foreground py-2 text-center">{t('configureEnablerHint')}</p>
                            )}
                            {customVarTotal > 0 && (
                                <div className="flex justify-between py-2.5">
                                    <span className="text-xs text-muted-foreground">{t('subtotalVar')}</span>
                                    <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(customVarTotal)})</span>
                                </div>
                            )}
                        </div>
                    </PnLAccordion>
                </div>
            </SectionCard>

            {/* Excel import / export / download template */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <IconDownload size={16} />
                        {t('downloadTemplate')}
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()}>
                        <IconFileImport size={16} />
                        {t('importExcel')}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
                <Button variant="outline" onClick={onExportCurrent}>
                    <IconFileExport size={16} />
                    {t('exportCurrent')}
                </Button>
            </div>

            {/* SKU selector chips */}
            <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('skuTitle')}</p>
                <div className="flex flex-wrap gap-2">
                    {products.filter(p => p.name).map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedSku(p.id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                                ${selectedSku === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                {selectedSku && activeSku.cogs && (
                    <p className="text-xs text-muted-foreground mt-2">COGS: {fmt(parseFloat(activeSku.cogs) || 0)} · Packaging: {fmt(parseFloat(activeSku.pkg) || 0)}</p>
                )}
            </div>

            {/* Monthly P&L accordion card */}
            {channels.length > 0 && (
                <SectionCard
                    icon={<IconPresentationAnalytics size={18} />}
                    title={t('monthlyPnlTitle')}
                    subtitle={t('monthlyPnlSubtitle')}
                >
                    <div className="-mx-5 -mb-5 mt-5">

                        {/* A. Info Dasar */}
                        <PnLAccordion
                            title={t('basicInfoTitle')}
                            subtitle={t('basicInfoSubtitle')}
                            pillVariant={secFilled.info ? "filled" : "required"}
                            pillText={secFilled.info ? t('pillFilled') : t('pillRequired')}
                            defaultOpen
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">{t('colChannel')}</th>
                                            <ChTh>{t('colSellingPrice')}</ChTh>
                                            <ChTh>{t('colUnitsSold')}</ChTh>
                                            <ChTh>{t('colGrossGmv')}</ChTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channels.map((ch, i) => {
                                            const vol = parseFloat(infoData[ch]?.vol) || 0
                                            const prefillPrice = activeSku.prices?.[ch]?.price ?? ''
                                            return (
                                                <tr key={ch} className="border-t">
                                                    <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                    <td className="py-2.5 px-2 text-right">
                                                        <span className="text-xs font-semibold text-teal-700 tabular-nums">
                                                            {prefillPrice ? fmt(parseFloat(prefillPrice) || 0) : '—'}
                                                        </span>
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
                                    <p className="text-xs font-medium">{t('cogsPerUnitRow')}</p>
                                    <span className="text-xs font-semibold text-teal-700 tabular-nums">{activeSku.cogs ? fmt(parseFloat(activeSku.cogs) || 0) : '—'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <div>
                                        <p className="text-xs font-medium">{t('packagingPerUnitRow')}</p>
                                        <p className="text-[11px] text-muted-foreground">{t('packagingDesc')}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-teal-700 tabular-nums">{activeSku.pkg ? fmt(parseFloat(activeSku.pkg) || 0) : '—'}</span>
                                </div>
                                <div className="pt-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('cogsBundlingTitle')}</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('colChannel')}</th>
                                                    <ChTh>{t('colCogsBundling')}</ChTh>
                                                    <ChTh>{t('colUnitsPerBundle')}</ChTh>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {channels.map(ch => (
                                                    <tr key={ch} className="border-t">
                                                        <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                        <td className="py-2.5 px-2 text-right">
                                                            <ChInput
                                                                currency
                                                                value={bundlingData[ch]?.cogs ?? ''}
                                                                onChange={v => setBundlingData(prev => ({ ...prev, [ch]: { ...prev[ch], cogs: v } }))}
                                                            />
                                                        </td>
                                                        <td className="py-2.5 px-2 text-right">
                                                            <ChInput
                                                                value={bundlingData[ch]?.units ?? ''}
                                                                onChange={v => setBundlingData(prev => ({ ...prev, [ch]: { ...prev[ch], units: v } }))}
                                                                placeholder="1"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </PnLAccordion>

                        {/* C. Return Rate */}
                        <PnLAccordion
                            title={t('returnRateTitle')}
                            subtitle={t('returnRateSubtitle')}
                            pillVariant="optional"
                            pillText={t('pillOptional')}
                        >
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[40%] min-w-[120px]">{t('colChannel')}</th>
                                            <ChTh>{t('colUnitReturns')}</ChTh>
                                            <ChTh>{t('colActualRefund')}</ChTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channels.map(ch => (
                                            <tr key={ch} className="border-t">
                                                <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                <td className="py-2.5 px-2 text-right">
                                                    <ChInput
                                                        value={returnData[ch]?.units ?? ''}
                                                        onChange={v => setReturnData(prev => ({ ...prev, [ch]: { ...prev[ch], units: v } }))}
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2 text-right">
                                                    <ChInput
                                                        currency
                                                        value={returnData[ch]?.actual ?? ''}
                                                        onChange={v => setReturnData(prev => ({ ...prev, [ch]: { ...prev[ch], actual: v } }))}
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
                            title={t('sellerDiscountTitle')}
                            subtitle={t('sellerDiscountSubtitle')}
                            pillVariant={secFilled.discount ? "filled" : "required"}
                            pillText={secFilled.discount ? t('pillFilled') : t('pillRequired')}
                        >
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse text-sm" style={{ minWidth: 780 }}>
                                    <thead>
                                        <tr>
                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[100px]">{t('colChannel')}</th>
                                            {DISCOUNT_LABELS.map(h => <ChTh key={h}>{h}</ChTh>)}
                                            <ChTh>{t('colTotalPct')}</ChTh>
                                            <ChTh>{t('colAmount')}</ChTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channels.map((ch, chIdx) => (
                                            <tr key={ch} className="border-t">
                                                <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                {DISCOUNT_COLS.map(({ key: k, currency: isCurrency }) => (
                                                    <td key={k} className="py-2.5 px-1 text-right">
                                                        <ChInput
                                                            currency={isCurrency}
                                                            value={discountData[ch]?.[k] ?? ''}
                                                            onChange={v => {
                                                                setDiscountData(prev => ({ ...prev, [ch]: { ...prev[ch], [k]: v } }))
                                                                if (parseFloat(v) > 0) markFilled('discount')
                                                            }}
                                                            step={isCurrency ? undefined : "0.1"}
                                                            highlight={(parseFloat(discountData[ch]?.[k]) || 0) > 0 ? 'filled' : undefined}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="py-2.5 px-2 text-right">
                                                    <span className="text-xs font-semibold tabular-nums bg-muted px-2 py-1 rounded whitespace-nowrap">
                                                        {totalDiscountPct(ch).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-2 text-right text-xs font-medium tabular-nums">
                                                    {discByChannel[chIdx] > 0 ? fmt(discByChannel[chIdx]) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </PnLAccordion>

                        {/* E. Ongkir */}
                        <PnLAccordion
                            title={t('shippingTitle')}
                            subtitle={t('shippingSubtitle')}
                            pillVariant="optional"
                            pillText={t('pillOptional')}
                        >
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            <th className="text-left pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[40%] min-w-[120px]">{t('colChannel')}</th>
                                            <ChTh>{t('colShippingSubsidy')}</ChTh>
                                            <ChTh>{t('colProcessingFee')}</ChTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channels.map(ch => (
                                            <tr key={ch} className="border-t">
                                                <td className="py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                <td className="py-2.5 px-2 text-right">
                                                    <ChInput
                                                        currency
                                                        value={shippingData[ch]?.subsidy ?? ''}
                                                        onChange={v => setShippingData(prev => ({ ...prev, [ch]: { ...prev[ch], subsidy: v } }))}
                                                        highlight={(parseFloat(shippingData[ch]?.subsidy) || 0) > 0 ? 'filled' : undefined}
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2 text-right">
                                                    <ChInput currency value={shippingData[ch]?.processing ?? ''} onChange={v => setShippingData(prev => ({ ...prev, [ch]: { ...prev[ch], processing: v } }))} />
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
                                            <ChTh>{t('colAmountRp')}</ChTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channels.map((ch, i) => (
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
                                                    {adsByChannel[i] > 0 ? fmt(adsByChannel[i]) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </PnLAccordion>

                        {/* G. Biaya Channel (pre-filled) */}
                        <PnLAccordion
                            title={t('channelFeesTitle')}
                            subtitle={t('channelFeesSubtitle')}
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

                        {/* H. Fixed Cost */}
                        <PnLAccordion
                            title={t('fixedCostTitle')}
                            subtitle={t('fixedCostSubtitle')}
                            pillVariant={secFilled.fixed ? "filled" : "required"}
                            pillText={secFilled.fixed ? t('pillFilled') : t('pillRequired')}
                        >
                            <div className="divide-y mt-2">
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
                                            currency
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
                                <div className="flex items-center justify-between py-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setCustomRows(prev => [...prev, { id: Date.now(), name: '', val: '' }])}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >{t('addCostItem')}</button>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground">{t('totalFixedCost')}</span>
                                        <span className="text-xs font-semibold text-red-600 tabular-nums">({fmt(fixedTotal)})</span>
                                    </div>
                                </div>
                            </div>
                        </PnLAccordion>

                    </div>
                </SectionCard>
            )}
        </>
    )
}
