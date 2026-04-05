'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ChBadge, ChInput, FieldInput, InnerCard, ProductTabs, SetupProgress, SetupStepCard, ChTh } from "./PlComponents"

export default function SetupPhase({
    // setup step state
    setupStep, completedSetupSteps, handleStepOpen, doneSetupStep, getStepStatus,
    // brand setup
    setup, setS,
    // channels
    channels, tagInput, setTagInput, addChannel, removeChannel,
    channelActive, setChannelActive,
    // channel fees
    getChFee, setChFee,
    // enabler
    enablerConfig, setEC,
    // products
    products, activeIdx, setActiveIdx, addProduct, removeProduct, updateP, p,
    // SKU
    openSkuModal,
    // save
    handleSaveChanges, brandOnly,
    // translations
    t,
}) {
    const step1 = getStepStatus(1)
    const step2 = getStepStatus(2)
    const step3 = getStepStatus(3)

    return (
        <>
            <SetupProgress
                steps={[t('setupStep1Progress'), t('setupStep2Progress'), t('setupStep3Progress')]}
                currentStep={setupStep}
                completedSteps={completedSetupSteps}
                onStepClick={handleStepOpen}
            />

            {/* ── Step 1: Brand & Channel ─────────────────── */}
            <SetupStepCard
                number={1}
                title={t('step1Title')}
                subtitle={t('step1Subtitle')}
                {...step1}
                onOpen={() => handleStepOpen(1)}
                onNext={() => {
                    if (!setup.brand_name) return toast.error(t('errorBrandRequired'))
                    if (!setup.category) return toast.error(t('errorCategoryRequired'))
                    if (channels.length === 0) return toast.error(t('errorChannelRequired'))
                    doneSetupStep(1)
                }}
                nextLabel={t('nextStep')}
                finishLabel={t('finishSetup')}
                donePillLabel={t('stepStatusDone')}
                activePillLabel={t('stepStatusActive')}
                pendingPillLabel={t('stepStatusPending')}
            >
                <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <FieldInput
                            label={t('brandName')}
                            value={setup.brand_name}
                            onChange={v => setS('brand_name', v)}
                            placeholder={t('brandNamePlaceholder')}
                            type="text"
                        />
                        <div className="grid gap-1">
                            <Label>{t('productCategory')} <span className="text-red-500">*</span></Label>
                            <Input
                                value={setup.category}
                                onChange={e => setS('category', e.target.value)}
                                placeholder={t('selectCategory')}
                            />
                        </div>
                    </div>
                    <Separator />
                    <div className="grid gap-1">
                        <Label>{t('ecommerceEnabler')}</Label>
                        <p className="text-xs text-muted-foreground">{t('enablerSubtitle')}</p>
                        <Input
                            value={setup.enabler}
                            onChange={e => setS('enabler', e.target.value)}
                            placeholder={t('enablerNamePlaceholder')}
                        />
                    </div>
                    <Separator />
                    <div className="grid gap-2">
                        <Label>{t('targetPlatform')}</Label>
                        <p className="text-xs text-muted-foreground">{t('platformSubtitle')}</p>
                        <div
                            className="flex flex-wrap gap-1.5 min-h-10 rounded-md border border-input px-3 py-2 cursor-text"
                            onClick={() => document.getElementById('ch-tag-inp').focus()}
                        >
                            {channels.map(ch => (
                                <span key={ch} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-muted border">
                                    {ch}
                                    <span className="cursor-pointer opacity-50 hover:opacity-100 leading-none" onClick={e => { e.stopPropagation(); removeChannel(ch) }}>×</span>
                                </span>
                            ))}
                            <input
                                id="ch-tag-inp"
                                className="flex-1 min-w-24 text-sm bg-transparent outline-none"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChannel(tagInput); setTagInput('') }
                                    else if (e.key === 'Backspace' && !tagInput && channels.length > 0) removeChannel(channels[channels.length - 1])
                                }}
                                placeholder={channels.length === 0 ? t('addChannelPlaceholder') : ''}
                            />
                        </div>
                    </div>
                    {channels.length > 0 && (
                        <div className="grid gap-2">
                            <Label>{t('channelSettingsTitle')}</Label>
                            {channels.map(ch => (
                                <div key={ch} className={`flex items-center justify-between rounded-md border px-4 py-3 ${channelActive[ch] === false ? 'opacity-50' : ''}`}>
                                    <div>
                                        <p className="text-sm font-medium">{ch}</p>
                                        <p className="text-xs text-muted-foreground">{ch} Official Store / Mall</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">{t('channelActiveLabel')}</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={channelActive[ch] !== false}
                                            onClick={() => setChannelActive(prev => ({ ...prev, [ch]: prev[ch] === false ? true : false }))}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${channelActive[ch] !== false ? 'bg-green-600' : 'bg-input'}`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${channelActive[ch] !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SetupStepCard>

            {/* ── Step 2: Biaya & Enabler ─────────────────── */}
            <SetupStepCard
                number={2}
                title={t('step2Title')}
                subtitle={t('step2Subtitle')}
                {...step2}
                onOpen={() => handleStepOpen(2)}
                onNext={() => doneSetupStep(2)}
                nextLabel={t('nextStep')}
                finishLabel={t('finishSetup')}
                donePillLabel={t('stepStatusDone')}
                activePillLabel={t('stepStatusActive')}
                pendingPillLabel={t('stepStatusPending')}
            >
                <div className="space-y-5">
                    {channels.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                {t('channelFeeTableHeader')}
                            </p>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px]">{t('colChannel')}</th>
                                            <ChTh>{t('commissionPct')}</ChTh>
                                            <ChTh>{t('mallFeePct')}</ChTh>
                                            <ChTh>{t('pgwRatePct')}</ChTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channels.map(ch => (
                                            <tr key={ch} className="border-t">
                                                <td className="px-4 py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                {['comm', 'mall', 'pgw'].map(key => (
                                                    <td key={key} className="py-2.5 px-2 text-right">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={getChFee(ch, key)}
                                                            onChange={e => setChFee(ch, key, e.target.value)}
                                                            className="w-20 text-right text-xs px-2 py-1.5 rounded border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Fixed Cost Enabler */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                            {t('fixedCostEnabler')}{setup.enabler && <span className="font-normal text-primary normal-case tracking-normal ml-1">({setup.enabler})</span>}
                        </p>
                        <div className="space-y-2">
                            {enablerConfig.customFixed.map(r => (
                                <div key={r.id} className="flex items-center gap-2">
                                    <Input
                                        placeholder={t('customFixedPlaceholder')}
                                        value={r.name}
                                        onChange={e => setEC('customFixed', enablerConfig.customFixed.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))}
                                        className="flex-1 h-9 text-sm"
                                    />
                                    <FieldInput value={r.val} onChange={v => setEC('customFixed', enablerConfig.customFixed.map(x => x.id === r.id ? { ...x, val: v } : x))} prefix="Rp" label="" />
                                    <button type="button" onClick={() => setEC('customFixed', enablerConfig.customFixed.filter(x => x.id !== r.id))} className="w-8 h-8 flex items-center justify-center rounded border text-muted-foreground hover:text-destructive text-sm">×</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => setEC('customFixed', [...enablerConfig.customFixed, { id: Date.now(), name: '', val: '' }])} className="text-xs text-primary hover:underline">{t('addFixedRow')}</button>
                        </div>
                    </div>

                    <Separator />

                    {/* Variable Cost Enabler */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                            {t('variableCostEnabler')}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                            <FieldInput label={t('commissionGmvRate')} subtitle={t('autoCalcFromGmv')} value={enablerConfig.commissionRate} onChange={v => setEC('commissionRate', v)} suffix="% GMV" disabled />
                        </div>
                        <div className="space-y-2">
                            {enablerConfig.customVar.map(r => (
                                <div key={r.id} className="flex items-center gap-2">
                                    <Input placeholder={t('customVarPlaceholder')} value={r.name} onChange={e => setEC('customVar', enablerConfig.customVar.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} className="flex-1 h-9 text-sm" />
                                    <FieldInput value={r.val} onChange={() => { }} prefix="Rp" label="" disabled />
                                    <button type="button" onClick={() => setEC('customVar', enablerConfig.customVar.filter(x => x.id !== r.id))} className="w-8 h-8 flex items-center justify-center rounded border text-muted-foreground hover:text-destructive text-sm">×</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => setEC('customVar', [...enablerConfig.customVar, { id: Date.now(), name: '', val: '' }])} className="text-xs text-primary hover:underline">{t('addVarRow')}</button>
                        </div>
                    </div>
                </div>
            </SetupStepCard>

            {/* ── Step 3: Produk & COGS ───────────────────── */}
            <SetupStepCard
                number={3}
                title={t('step3Title')}
                subtitle={t('step3Subtitle')}
                {...step3}
                onOpen={() => handleStepOpen(3)}
                onNext={() => {
                    const named = products.filter(p => p.name)
                    if (named.length === 0) return toast.error(t('errorSkuRequired'))
                    const missingPrice = named.some(p =>
                        channels.some(ch => !(parseFloat(p.prices?.[ch]?.price) > 0))
                    )
                    if (missingPrice) return toast.error(t('errorSkuPriceRequired'))
                    if (brandOnly) handleSaveChanges()
                    else doneSetupStep(3)
                }}
                nextLabel={t('nextStep')}
                finishLabel={brandOnly ? t('saveBrand') : t('finishSetup')}
                donePillLabel={t('stepStatusDone')}
                activePillLabel={t('stepStatusActive')}
                pendingPillLabel={t('stepStatusPending')}
                isLast
            >
                <div className="space-y-4">
                    <ProductTabs
                        products={products}
                        activeIndex={activeIdx}
                        onSelect={setActiveIdx}
                        onAdd={addProduct}
                        onRemove={removeProduct}
                        addLabel={t('addProduct')}
                    />

                    {/* SKU chooser */}
                    <InnerCard title={t('chooseSku')}>
                        {p.sku ? (
                            <div className="space-y-2">
                                <div className="rounded-md border bg-card p-3 space-y-0.5">
                                    <p className="text-sm font-semibold">{p.sku.product_name || p.sku.name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {p.sku.sku_code}
                                        {p.sku.variant && ` · ${p.sku.variant}`}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" className="w-full" onClick={openSkuModal}>
                                    {t('changeSku')}
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={openSkuModal}
                                className="w-full rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/50 transition-colors text-center"
                            >
                                {t('noSkuSelected')}
                            </button>
                        )}
                    </InnerCard>

                    {/* COGS + Packaging */}
                    <div className="grid sm:grid-cols-2 gap-3">
                        <FieldInput label={t('cogsPerUnit')} value={p.cogs} onChange={v => updateP('cogs', v)} prefix="Rp" />
                        <FieldInput label={t('packagingPerUnit')} value={p.pkg} onChange={v => updateP('pkg', v)} prefix="Rp" />
                    </div>

                    {/* Harga jual per channel */}
                    {channels.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('sellingPricePerChannel')}</p>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('colChannel')}</th>
                                            <ChTh>{t('colSellingPriceRp')}</ChTh>
                                            <ChTh>{t('colDefaultDiscountPct')}</ChTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channels.map(ch => (
                                            <tr key={ch} className="border-t">
                                                <td className="px-4 py-2.5"><ChBadge code={ch} label={ch} /></td>
                                                <td className="py-2.5 px-2 text-right">
                                                    <ChInput
                                                        currency
                                                        value={p.prices[ch]?.price ?? ''}
                                                        onChange={v => updateP('prices', { ...p.prices, [ch]: { ...p.prices[ch], price: v } })}
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2 text-right">
                                                    <ChInput
                                                        value={p.prices[ch]?.discount ?? ''}
                                                        onChange={v => updateP('prices', { ...p.prices, [ch]: { ...p.prices[ch], discount: v } })}
                                                        step="0.1"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </SetupStepCard>
        </>
    )
}
