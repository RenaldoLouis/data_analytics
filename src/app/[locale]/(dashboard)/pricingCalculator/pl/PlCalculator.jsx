'use client'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import LoadingScreen from "@/components/ui/loadingScreen"
import { useSidebar } from "@/components/ui/sidebar"
import { H3 } from "@/components/ui/typography"
import services from "@/services"
import { IconArrowLeft } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
    MONTH_LABELS, DISCOUNT_PCT_KEYS, DISCOUNT_AMT_KEYS,
    num, toAmt, toRate,
    makeProduct, mapMonthlyRecordToFormData, buildMonthlyPayloadFromData, computeSkuMetrics,
} from "./plLib"
import SetupPhase from "./SetupPhase"
import MonthlyInputSection from "./MonthlyInputSection"
import ResultsSection from "./ResultsSection"
import SkuDetailModal from "./SkuDetailModal"
import SkuSelectionModal from "./SkuSelectionModal"

export default function PlCalculator({ onBack, onSaveComplete, editId, brandOnly = false, startAtMonthly = false }) {
    const t = useTranslations('plpage')
    const { open: sidebarOpen } = useSidebar()

    const DISCOUNT_LABELS = [
        t('discountVoucher'), t('discountSubsidy'), t('discountFlash'),
        t('discountAffiliate'), t('discountBundling'), t('discountLoyalty'),
    ]

    // ── Setup step state ─────────────────────────────────────────────────────
    const [setupStep, setSetupStep] = useState(1)
    const [completedSetupSteps, setCompletedSetupSteps] = useState([])
    const [setupDone, setSetupDone] = useState(startAtMonthly)

    const doneSetupStep = (n) => {
        setCompletedSetupSteps(prev => [...new Set([...prev, n])])
        if (n < 3) setSetupStep(n + 1)
        else {
            if (!selectedSku && products.length > 0) setSelectedSku(products[0].id)
            setSetupDone(true)
        }
    }
    const getStepStatus = (n) => ({
        isDone: completedSetupSteps.includes(n),
        isActive: setupStep === n,
        isLocked: !completedSetupSteps.includes(n) && setupStep < n,
    })
    const handleStepOpen = (n) => {
        if (!getStepStatus(n).isLocked) setSetupStep(n)
    }

    // ── Setup state ──────────────────────────────────────────────────────────
    const [setup, setSetup] = useState({ brand_name: '', category: '', enabler: '' })
    const setS = (field, value) => setSetup(prev => ({ ...prev, [field]: value }))

    // ── Channels ─────────────────────────────────────────────────────────────
    const [channels, setChannels] = useState([])
    const [mallStatus, setMallStatus] = useState({})
    const [channelActive, setChannelActive] = useState({})
    const [tagInput, setTagInput] = useState('')
    const addChannel = (val) => {
        val = val.trim().replace(',', '')
        if (!val || channels.includes(val)) return
        setChannels(prev => [...prev, val])
        setMallStatus(prev => ({ ...prev, [val]: false }))
        setChannelActive(prev => ({ ...prev, [val]: true }))
    }
    const removeChannel = (ch) => {
        setChannels(prev => prev.filter(c => c !== ch))
        setMallStatus(prev => { const n = { ...prev }; delete n[ch]; return n })
        setChannelActive(prev => { const n = { ...prev }; delete n[ch]; return n })
    }

    // ── Channel fees ─────────────────────────────────────────────────────────
    const [channelFees, setChannelFees] = useState({})
    const getChFee = (ch, key) =>
        channelFees[ch]?.[key] ?? ({ comm: '5', mall: '0', pgw: '1.5' }[key])
    const setChFee = (ch, key, value) =>
        setChannelFees(prev => ({ ...prev, [ch]: { ...prev[ch], [key]: value } }))

    // ── Enabler config ───────────────────────────────────────────────────────
    const [enablerConfig, setEnablerConfig] = useState({
        retainer: '', commissionRate: '',
        sof: '', swift: '', live: '', warehouse: '',
        fulfilRate: '12000',
        customFixed: [],
        customVar: [],
    })
    const setEC = (field, value) => setEnablerConfig(prev => ({ ...prev, [field]: value }))

    // ── Products ─────────────────────────────────────────────────────────────
    const [products, setProducts] = useState(() => [makeProduct(0)])
    const [activeIdx, setActiveIdx] = useState(0)
    const p = products[activeIdx]
    const updateP = (field, value) =>
        setProducts(prev => prev.map((item, i) => i === activeIdx ? { ...item, [field]: value } : item))
    const addProduct = () => {
        setProducts(prev => [...prev, makeProduct(prev.length)])
        setActiveIdx(products.length)
    }
    const removeProduct = (index) => {
        if (products.length === 1) return
        setProducts(prev => prev.filter((_, i) => i !== index))
        setActiveIdx(prev => Math.max(0, prev >= index ? prev - 1 : prev))
    }

    // ── SKU modal ────────────────────────────────────────────────────────────
    const [skuModalOpen, setSkuModalOpen] = useState(false)
    const [detailModalSku, setDetailModalSku] = useState(null)
    const [skuList, setSkuList] = useState([])
    const [skuSearch, setSkuSearch] = useState('')
    const [isSkusLoading, setIsSkusLoading] = useState(false)

    const openSkuModal = async () => {
        setSkuModalOpen(true)
        if (skuList.length === 0) {
            setIsSkusLoading(true)
            const res = await services.sku.getSkus()
            setSkuList(res?.data?.data ?? res?.data ?? [])
            setIsSkusLoading(false)
        }
    }
    const selectSku = (sku) => {
        setProducts(prev => prev.map((item, i) =>
            i === activeIdx ? { ...item, sku, name: sku.product_name || sku.sku_code } : item
        ))
        setSkuModalOpen(false)
        setSkuSearch('')
    }
    const usedSkuKeys = useMemo(() => {
        const currentSku = products[activeIdx]?.sku
        return new Set(
            products
                .filter((_, i) => i !== activeIdx)
                .flatMap(p => [p.sku?.id, p.sku?.sku_code, p.sku?.name].filter(Boolean))
                .filter(k => k !== currentSku?.id && k !== currentSku?.sku_code && k !== currentSku?.name)
        )
    }, [products, activeIdx])
    const filteredSkus = useMemo(() =>
        skuList.filter(s =>
            !usedSkuKeys.has(s.id) &&
            !usedSkuKeys.has(s.sku_code) &&
            !usedSkuKeys.has(s.product_name) &&
            (!skuSearch ||
                s.product_name?.toLowerCase().includes(skuSearch.toLowerCase()) ||
                s.sku_code?.toLowerCase().includes(skuSearch.toLowerCase()))
        ), [skuList, skuSearch, usedSkuKeys])

    // ── Monthly P&L state ────────────────────────────────────────────────────
    const [monthlyId, setMonthlyId] = useState(null)
    const [activeYear, setActiveYear] = useState(String(new Date().getFullYear()))
    const [takenMonths, setTakenMonths] = useState([])
    const [isMonthsLoading, setIsMonthsLoading] = useState(false)
    const [moByYear, setMoByYear] = useState({})
    const activeMo = moByYear[activeYear] ?? ''
    const setActiveMo = (m) => setMoByYear(prev => ({ ...prev, [activeYear]: m }))
    const [selectedSku, setSelectedSku] = useState('')
    const skuInitRef = useRef(false)
    const skuDataCacheRef = useRef({})
    const [prefetchedSkuData, setPrefetchedSkuData] = useState({})
    const prevSkuRef = useRef(null)
    const formDataRef = useRef({})
    const contextRef = useRef({})
    const [infoData, setInfoData] = useState({})
    const [discountData, setDiscountData] = useState({})
    const [returnData, setReturnData] = useState({})
    const [shippingData, setShippingData] = useState({})
    const [adsData, setAdsData] = useState({})
    const [claimData, setClaimData] = useState({ support: '', voucher: '', mpFee: '', mpAffiliate: '', campaign: '' })
    const [varData, setVarData] = useState({})
    const [monthlyCommissionRate, setMonthlyCommissionRate] = useState('')
    const [customRows, setCustomRows] = useState([])
    const [bundlingData, setBundlingData] = useState({})
    const [orders, setOrders] = useState('')
    const [secFilled, setSecFilled] = useState({ info: false, discount: false, ret: false, ads: false, fixed: false })
    const markFilled = (sec) => setSecFilled(prev => ({ ...prev, [sec]: true }))

    // ── Active SKU for monthly ───────────────────────────────────────────────
    const activeSku = products.find(prod => prod.id === selectedSku) || products[0] || {}
    const cogsUnit = (parseFloat(activeSku.cogs) || 0) + (parseFloat(activeSku.pkg) || 0)

    // ── Keep refs always current ─────────────────────────────────────────────
    const currentFormData = { infoData, discountData, returnData, shippingData, adsData, claimData, varData, monthlyCommissionRate, customRows, bundlingData, orders, secFilled }
    formDataRef.current = currentFormData
    useEffect(() => {
        if (selectedSku && selectedSku === prevSkuRef.current) {
            skuDataCacheRef.current[selectedSku] = {
                ...skuDataCacheRef.current[selectedSku],
                data: currentFormData,
            }
        }
    })
    useEffect(() => {
        contextRef.current = { brandData, activeMo, activeYear, monthlyId }
    })

    // ── Restore form fields from cached snapshot ─────────────────────────────
    const restoreFromFormData = (d, { includeEnabler = true } = {}) => {
        setInfoData(d.infoData ?? {})
        setDiscountData(d.discountData ?? {})
        setReturnData(d.returnData ?? {})
        setShippingData(d.shippingData ?? {})
        setAdsData(d.adsData ?? {})
        setBundlingData(d.bundlingData ?? {})
        setCustomRows(d.customRows ?? [])
        setSecFilled(d.secFilled ?? { info: false, discount: false, ret: false, ads: false, fixed: false })
        if (includeEnabler) {
            setClaimData(d.claimData ?? { support: '', voucher: '', mpFee: '', mpAffiliate: '', campaign: '' })
            setVarData(d.varData ?? {})
            setMonthlyCommissionRate(d.monthlyCommissionRate ?? '')
            setOrders(d.orders ?? '')
        }
    }

    // ── SKU switch effect ────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedSku) return
        if (!skuInitRef.current) {
            skuInitRef.current = true
            prevSkuRef.current = selectedSku
            return
        }
        const prevSku = prevSkuRef.current
        prevSkuRef.current = selectedSku

        if (prevSku) {
            const prevData = { ...formDataRef.current }
            skuDataCacheRef.current[prevSku] = {
                data: prevData,
                recordId: contextRef.current.monthlyId ?? null,
            }
            setPrefetchedSkuData(prev => ({ ...prev, [prevSku]: prevData }))
        }

        const cached = skuDataCacheRef.current[selectedSku]
        if (cached) {
            restoreFromFormData(cached.data, { includeEnabler: false })
            setMonthlyId(cached.recordId ?? null)
            return
        }

        const { brandData: bd, activeMo: mo, activeYear: yr } = contextRef.current
        if (bd?.id && mo && yr) {
            const periodMonth = String(MONTH_LABELS.indexOf(mo) + 1).padStart(2, '0')
            const periodYear = parseInt(yr)
            services.pl.getMonthlyByPeriod(bd.id, selectedSku, periodMonth, periodYear)
                .then(res => {
                    const mr = res?.data?.data ?? res?.data ?? null
                    if (mr && mr.id) {
                        const chIdToName = Object.fromEntries((bd.channels ?? []).map(ch => [ch.id, ch.name]))
                        const fd = mapMonthlyRecordToFormData(mr, chIdToName)
                        restoreFromFormData(fd, { includeEnabler: false })
                        setMonthlyId(mr.id)
                        skuDataCacheRef.current[selectedSku] = { data: fd, recordId: mr.id }
                        setPrefetchedSkuData(prev => ({ ...prev, [selectedSku]: fd }))
                    } else {
                        restoreFromFormData({}, { includeEnabler: false })
                        setMonthlyId(null)
                    }
                })
                .catch(() => { restoreFromFormData({}); setMonthlyId(null) })
        } else {
            restoreFromFormData({})
            setMonthlyId(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSku])

    // ── Active channels for monthly phase ─────────────────────────────────────
    // Existing P/L: show all channels that have data (even inactive). New P/L: only active channels.
    const plChannels = useMemo(() => {
        if (monthlyId) {
            // existing record — keep channels that have any data entered, plus all active ones
            return channels.filter(ch =>
                channelActive[ch] !== false || parseFloat(infoData[ch]?.vol) > 0
            )
        }
        return channels.filter(ch => channelActive[ch] !== false)
    }, [channels, channelActive, monthlyId, infoData])

    // ── P&L calculations ─────────────────────────────────────────────────────
    const totalDiscountPct = (ch) =>
        DISCOUNT_PCT_KEYS.reduce((s, k) => s + (parseFloat(discountData[ch]?.[k]) || 0), 0)
    const totalDiscountAmt = (ch) =>
        DISCOUNT_AMT_KEYS.reduce((s, k) => s + (parseFloat(discountData[ch]?.[k]) || 0), 0)

    const grossByChannel = plChannels.map(ch => {
        const vol = parseFloat(infoData[ch]?.vol) || 0
        return vol * (parseFloat(activeSku.prices?.[ch]?.price) || 0)
    })
    const grossTotal = grossByChannel.reduce((a, b) => a + b, 0)
    const discByChannel = plChannels.map((ch, i) => grossByChannel[i] * totalDiscountPct(ch) / 100 + totalDiscountAmt(ch))
    const retByChannel = plChannels.map(ch => parseFloat(returnData[ch]?.actual) || 0)
    const shipByChannel = plChannels.map(ch => (parseFloat(shippingData[ch]?.subsidy) || 0) + (parseFloat(shippingData[ch]?.processing) || 0))
    const adsByChannel = plChannels.map((ch, i) => grossByChannel[i] * ((parseFloat(adsData[ch]?.rate) || 0) / 100))
    const netByChannel = plChannels.map((_, i) => grossByChannel[i] - discByChannel[i] - retByChannel[i] - shipByChannel[i] - adsByChannel[i])
    const netTotal = netByChannel.reduce((a, b) => a + b, 0)

    const cogsTotal = plChannels.reduce((s, ch) => {
        const vol = parseFloat(infoData[ch]?.vol) || 0
        const bundCogs = parseFloat(bundlingData[ch]?.cogs) || 0
        const unitsPerBundle = parseFloat(bundlingData[ch]?.units) || 1
        return s + vol * (bundCogs > 0 ? bundCogs : unitsPerBundle * cogsUnit)
    }, 0)
    const commCost = plChannels.reduce((s, ch, i) => s + grossByChannel[i] * (parseFloat(getChFee(ch, 'comm')) / 100), 0)
    const mallCost = plChannels.reduce((s, ch, i) => s + grossByChannel[i] * (parseFloat(getChFee(ch, 'mall')) / 100), 0)
    const pgwCost = plChannels.reduce((s, ch, i) => s + grossByChannel[i] * (parseFloat(getChFee(ch, 'pgw')) / 100), 0)
    const channelCost = commCost + mallCost + pgwCost

    // ── All-SKU gross (enabler commission on total GMV) ──────────────────────
    const namedProducts = products.filter(p => p.name)
    const allSkuGrossForComm = namedProducts.reduce((sum, p) => {
        if (p.id === selectedSku) return sum + grossTotal
        const fd = prefetchedSkuData[p.id] ?? skuDataCacheRef.current[p.id]?.data ?? {}
        const fi = fd.infoData ?? {}
        return sum + plChannels.reduce((s, ch) => s + (parseFloat(fi[ch]?.vol) || 0) * (parseFloat(p.prices?.[ch]?.price) || 0), 0)
    }, 0)

    // ── Enabler cost totals ──────────────────────────────────────────────────
    const retainerVal = parseFloat((enablerConfig.retainer || '').replace(/\./g, '')) || 0
    const sofVal = parseFloat((enablerConfig.sof || '').replace(/\./g, '')) || 0
    const swiftVal = parseFloat((enablerConfig.swift || '').replace(/\./g, '')) || 0
    const liveVal = parseFloat((enablerConfig.live || '').replace(/\./g, '')) || 0
    const warehouseVal = parseFloat((enablerConfig.warehouse || '').replace(/\./g, '')) || 0
    const commissionVal = allSkuGrossForComm * ((parseFloat(monthlyCommissionRate) || 0) / 100)
    const fulfilRate = parseFloat((enablerConfig.fulfilRate || '').replace(/\./g, '').replace(',', '.')) || 12000
    const fulfilTotal = (parseFloat(orders) || 0) * fulfilRate
    const claimTotal = Object.values(claimData).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    const customFixedTotal = enablerConfig.customFixed.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)
    const enablerFixedTotal = retainerVal + sofVal + swiftVal + liveVal + warehouseVal + customFixedTotal
    const customVarTotal = Object.values(varData).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    const enablerVarTotal = commissionVal + fulfilTotal + claimTotal + customVarTotal
    const enablerTotal = enablerFixedTotal + enablerVarTotal
    const fixedTotal = customRows.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)

    // ── All-SKU aggregated metrics ───────────────────────────────────────────
    const allSkuMetrics = namedProducts.map(p => {
        if (p.id === selectedSku) {
            const gp = netTotal - cogsTotal
            const op = gp - channelCost - fixedTotal
            return {
                sku: p, grossTotal, netTotal, cogsTotal, channelCost, fixedCost: fixedTotal,
                grossProfit: gp, operatingProfit: op,
                grossMarginPct: netTotal > 0 ? (gp / netTotal) * 100 : 0,
                operatingMarginPct: netTotal > 0 ? (op / netTotal) * 100 : 0,
                grossByCh: grossByChannel, discByCh: discByChannel, retByCh: retByChannel,
                shipByCh: shipByChannel, adsByCh: adsByChannel, netByCh: netByChannel
            }
        }
        const cachedData = prefetchedSkuData[p.id] ?? skuDataCacheRef.current[p.id]?.data ?? {}
        return { sku: p, ...computeSkuMetrics(cachedData, p, plChannels, getChFee) }
    })
    const allSkuGrossTotal = allSkuMetrics.reduce((s, m) => s + m.grossTotal, 0)
    const allSkuNetTotal = allSkuMetrics.reduce((s, m) => s + m.netTotal, 0)
    const allSkuGrossProfit = allSkuMetrics.reduce((s, m) => s + m.grossProfit, 0)
    const allSkuFixedTotal = allSkuMetrics.reduce((s, m) => s + m.fixedCost, 0)
    const allSkuOpProfit = allSkuMetrics.reduce((s, m) => s + m.operatingProfit, 0)
    const finalMonthlyPL = allSkuOpProfit - enablerTotal
    const finalMonthlyPLPct = allSkuNetTotal > 0 ? (finalMonthlyPL / allSkuNetTotal) * 100 : 0
    const finalPlColor = finalMonthlyPL < 0 ? 'text-red-600' : 'text-green-700'

    // ── Detail modal data ────────────────────────────────────────────────────
    const skuDetailData = detailModalSku
        ? allSkuMetrics.find(m => m.sku.id === detailModalSku.id) ?? null
        : null

    // ── Save / loading state ─────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false)
    const [isPageLoading, setIsPageLoading] = useState(!!(editId || startAtMonthly))
    const [brandData, setBrandData] = useState(null)

    const channelMap = useMemo(() => Object.fromEntries((brandData?.channels ?? []).map(ch => [ch.name, ch.id])), [brandData])

    const errMsg = (msg, fallback) =>
        typeof msg === 'string' ? msg : msg ? JSON.stringify(msg) : fallback

    // ── Payload builders ─────────────────────────────────────────────────────
    const payloadCtx = { channels: plChannels, channelMap, activeMo, activeYear, claimData, varData, monthlyCommissionRate, orders }

    const buildMonthlyPayload = (resolvedBrandId, resolvedChannels) =>
        buildMonthlyPayloadFromData(
            { infoData, discountData, returnData, shippingData, adsData, bundlingData, customRows, claimData, varData, monthlyCommissionRate, orders },
            activeSku, selectedSku, resolvedBrandId, resolvedChannels, payloadCtx
        )

    // ── Pre-fill on edit ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!editId && !startAtMonthly) return
        const load = async () => {
            let brandId = null
            let monthlyRecord = null

            if (editId && brandOnly) {
                brandId = editId
            } else if (editId) {
                const monthlyRes = await services.pl.getMonthlyById(editId)
                const m = monthlyRes?.data?.data ?? monthlyRes?.data
                if (!m) { setIsPageLoading(false); return }
                monthlyRecord = m
                setMonthlyId(m.id ?? editId)
                const skuId = m.sku_id ?? m.sku?.id
                if (skuId) setSelectedSku(skuId)
                if (m.period_month && m.period_year) {
                    const yr = String(m.period_year)
                    const mo = MONTH_LABELS[parseInt(m.period_month) - 1] ?? ''
                    setActiveYear(yr)
                    setMoByYear(prev => ({ ...prev, [yr]: mo }))
                }
                brandId = m.brand_id ?? m.brand?.id
            } else if (startAtMonthly) {
                const listRes = await services.pl.getBrands()
                const raw = listRes?.data?.data ?? listRes?.data ?? null
                const brands = Array.isArray(raw) ? raw : (raw ? [raw] : [])
                if (!brands.length) {
                    // Fresh account: no brands yet. Toast and bounce back to the list.
                    toast.error(t('errorNoBrandProfile'), { id: 'pl-no-brand-profile' })
                    setIsPageLoading(false)
                    onBack?.()
                    return
                }
                brandId = brands[0].id
            }

            if (!brandId) { setIsPageLoading(false); return }
            const res = await services.pl.getBrands()
            const raw = res?.data?.data ?? res?.data ?? null
            const brandList = Array.isArray(raw) ? raw : (raw ? [raw] : [])
            const d = brandList.find(b => b.id === brandId) ?? brandList[0]
            if (!d) { setIsPageLoading(false); return }

            setSetup({ brand_name: d.name || '', category: d.category || '', enabler: d.enabler_name || '' })

            const chs = [...(d.channels || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            const chIdToName = Object.fromEntries(chs.map(ch => [ch.id, ch.name]))
            setChannels(chs.map(ch => ch.name))
            setMallStatus(Object.fromEntries(chs.map(ch => [ch.name, ch.is_mall || false])))
            setChannelActive(Object.fromEntries(chs.map(ch => [ch.name, ch.is_active !== false])))
            setChannelFees(Object.fromEntries(chs.map(ch => [ch.name, {
                comm: toRate(ch.fee_config?.commission_rate),
                mall: toRate(ch.fee_config?.mall_fee_rate),
                pgw: toRate(ch.fee_config?.pgw_rate),
            }])))

            const ec = d.enabler_fee_config
            if (ec) {
                setEnablerConfig({
                    retainer: toAmt(ec.retainer_amount),
                    commissionRate: toRate(ec.commission_gmv_rate),
                    sof: toAmt(ec.store_operation_fee),
                    swift: toAmt(ec.platform_fee),
                    live: toAmt(ec.live_commerce_cost),
                    warehouse: toAmt(ec.warehouse_cost),
                    fulfilRate: toAmt(ec.fulfillment_per_order) || '12000',
                    customFixed: (ec.custom_fixed_components || []).map((r, i) => ({ id: i, name: r.name, val: toAmt(r.amount) })),
                    customVar: (ec.custom_var_components || []).map((r, i) => ({ id: i, name: r.name, val: toAmt(r.amount) })),
                })
            }

            if (d.skus?.length) {
                const mappedSkus = d.skus.map((sku, i) => ({
                    id: sku.id || i,
                    name: sku.name || '',
                    sku,
                    cogs: toAmt(sku.cogs_per_unit),
                    pkg: toAmt(sku.packaging_cost),
                    prices: Object.fromEntries(
                        (sku.channel_prices || [])
                            .map(cp => {
                                const chName = cp.channel_name || chIdToName[cp.channel_id] || ''
                                return [chName, { price: toAmt(cp.selling_price), discount: toRate(cp.default_discount_pct) }]
                            })
                            .filter(([k]) => k)
                    ),
                }))
                setProducts(mappedSkus)
                setActiveIdx(0)
                if (startAtMonthly && !monthlyRecord && mappedSkus[0]?.id) {
                    setSelectedSku(mappedSkus[0].id)
                }
            }

            if (monthlyRecord) {
                const fd = mapMonthlyRecordToFormData(monthlyRecord, chIdToName)
                setInfoData(fd.infoData)
                setAdsData(fd.adsData)
                setDiscountData(fd.discountData)
                setReturnData(fd.returnData)
                setShippingData(fd.shippingData)
                setClaimData(fd.claimData)
                setVarData(fd.varData ?? {})
                setMonthlyCommissionRate(fd.monthlyCommissionRate ?? '')
                setBundlingData(fd.bundlingData ?? {})
                if (fd.orders) setOrders(fd.orders)
                if (fd.customRows?.length) setCustomRows(fd.customRows)
                setSecFilled(fd.secFilled)
            }

            setBrandData(d)
            setCompletedSetupSteps([1, 2, 3])
            setSetupStep(1)
            setSetupDone(startAtMonthly)

            // Pre-fetch monthly data for other SKUs
            if (monthlyRecord && d.skus?.length > 1) {
                const periodMonth = String(parseInt(monthlyRecord.period_month)).padStart(2, '0')
                const periodYear = Number(monthlyRecord.period_year)
                const currentSkuId = monthlyRecord.sku_id ?? monthlyRecord.sku?.id
                const otherSkuIds = d.skus.filter(s => s.id !== currentSkuId).map(s => s.id)

                if (otherSkuIds.length) {
                    try {
                        const results = await Promise.allSettled(
                            otherSkuIds.map(skuId =>
                                services.pl.getMonthlyByPeriod(d.id, skuId, periodMonth, periodYear)
                            )
                        )
                        const fetched = {}
                        results.forEach((r, i) => {
                            if (r.status !== 'fulfilled') return
                            const raw = r.value
                            const mr = raw?.data ?? raw ?? null
                            if (!mr || !mr.id) return
                            const fd = mapMonthlyRecordToFormData(mr, chIdToName)
                            fetched[otherSkuIds[i]] = fd
                            skuDataCacheRef.current[otherSkuIds[i]] = { data: fd, recordId: mr.id }
                        })
                        if (Object.keys(fetched).length) {
                            setPrefetchedSkuData(prev => ({ ...prev, ...fetched }))
                        }
                    } catch (e) { /* best-effort */ }
                }
            }

            setIsPageLoading(false)
        }
        load().catch(() => setIsPageLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, startAtMonthly])

    // ── Taken months loader ──────────────────────────────────────────────────
    useEffect(() => {
        if (!startAtMonthly || !brandData?.id || !activeYear) return
        const load = async () => {
            setIsMonthsLoading(true)
            try {
                const res = await services.pl.getTakenMonths(brandData.id, activeYear)
                const rows = res?.data?.data ?? res?.data ?? []
                const currentMonthlyId = contextRef.current.monthlyId
                const { activeMo } = contextRef.current
                const editingMonthCode = currentMonthlyId && activeMo
                    ? String(MONTH_LABELS.indexOf(activeMo) + 1).padStart(2, '0')
                    : null
                const taken = rows.filter(r =>
                    editingMonthCode ? r.period_month !== editingMonthCode : r.id !== currentMonthlyId
                ).map(r => r.period_month)
                setTakenMonths(taken)
                setMoByYear(prev => {
                    const cur = prev[activeYear] ?? ''
                    if (!cur) return prev
                    const moCode = String(MONTH_LABELS.indexOf(cur) + 1).padStart(2, '0')
                    return taken.includes(moCode) ? { ...prev, [activeYear]: '' } : prev
                })
            } finally {
                setIsMonthsLoading(false)
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeYear, brandData?.id, startAtMonthly])

    // ── Save handler ─────────────────────────────────────────────────────────
    const handleSaveChanges = async () => {
        if (!brandOnly) {
            if (!activeMo) return toast.error(t('selectMonthFirst'))
            if (!activeYear) return toast.error(t('selectYearFirst'))
            if (!selectedSku) return toast.error(t('selectSkuFirst'))
        }

        setIsSaving(true)
        try {
            // ── Flow 1: brandOnly ────────────────────────────────────────────
            if (brandOnly) {
                const skusPayload = products.filter(p => p.name).map(p => ({
                    name: p.name,
                    cogs_per_unit: num(p.cogs),
                    packaging_cost: num(p.pkg),
                    is_active: true,
                    channel_prices: channels.map(ch => ({
                        channel_name: ch,
                        selling_price: parseFloat(p.prices?.[ch]?.price) || 0,
                        default_discount_pct: (parseFloat(p.prices?.[ch]?.discount) || 0) / 100,
                    })),
                }))
                const brandPayload = {
                    name: setup.brand_name, category: setup.category,
                    ...(setup.enabler && { enabler_name: setup.enabler }),
                    via_enabler: !!setup.enabler, ecom_model: 'MARKETPLACE', status: 'active',
                    channels: channels.map((ch, i) => ({
                        name: ch, is_mall: mallStatus[ch] ?? false, is_active: channelActive[ch] !== false, sort_order: i + 1,
                        fee_config: {
                            commission_rate: parseFloat(getChFee(ch, 'comm')) / 100,
                            mall_fee_rate: parseFloat(getChFee(ch, 'mall')) / 100,
                            pgw_rate: parseFloat(getChFee(ch, 'pgw')) / 100,
                        },
                    })),
                    ...(skusPayload.length && { skus: skusPayload }),
                    enabler_fee_config: {
                        retainer_amount: retainerVal, store_operation_fee: sofVal,
                        platform_fee: swiftVal, live_commerce_cost: liveVal, warehouse_cost: warehouseVal,
                        commission_gmv_rate: (parseFloat(enablerConfig.commissionRate) || 0) / 100,
                        fulfillment_per_order: fulfilRate,
                        custom_fixed_components: enablerConfig.customFixed.map(r => ({ name: r.name, amount: parseFloat(r.val) || 0 })),
                        custom_var_components: enablerConfig.customVar.map(r => ({ name: r.name, amount: parseFloat(r.val) || 0 })),
                    },
                }
                const bId = brandData?.id ?? editId
                const res = bId
                    ? await services.pl.updatePl(bId, brandPayload)
                    : await services.pl.createPl(brandPayload)
                if (!res?.success) return toast.error(errMsg(res?.message, t('saveBrandError')))
                const saved = res.data?.data ?? res.data ?? null
                setBrandData(saved)
                toast.success(t('saveBrandSuccess'))
                if (onSaveComplete) onSaveComplete(saved?.id ?? bId)
                return
            }

            // ── Flow 2: startAtMonthly ───────────────────────────────────────
            if (startAtMonthly) {
                if (!brandData?.id) return toast.error(t('errorBrandRequired'))
                const bId = brandData.id
                const bChs = brandData.channels ?? []
                const periodMonth = String(MONTH_LABELS.indexOf(activeMo) + 1).padStart(2, '0')
                const periodYear = parseInt(activeYear)

                const payload = buildMonthlyPayload(bId, bChs)
                let resolvedMonthlyId = monthlyId
                if (!resolvedMonthlyId) {
                    const chk = await services.pl.getMonthlyByPeriod(bId, selectedSku, periodMonth, periodYear)
                    const existing = chk?.data?.data ?? chk?.data ?? null
                    if (existing?.id) { resolvedMonthlyId = existing.id; setMonthlyId(existing.id) }
                }
                const res = resolvedMonthlyId
                    ? await services.pl.updateMonthly(resolvedMonthlyId, payload)
                    : await services.pl.createMonthly(payload)
                if (res?.success) {
                    if (!resolvedMonthlyId) {
                        const newId = res.data?.data?.id ?? res.data?.id
                        if (newId) setMonthlyId(newId)
                    }
                } else {
                    toast.error(errMsg(res?.message, t('saveError')))
                    return
                }

                // Save other SKUs with cached data
                const otherSkus = products.filter(p => p.id !== selectedSku && p.name)
                const otherSaves = []
                for (const op of otherSkus) {
                    const cached = skuDataCacheRef.current[op.id]?.data ?? prefetchedSkuData[op.id]
                    if (!cached) continue
                    const hasVol = Object.values(cached.infoData ?? {}).some(d => parseFloat(d?.vol) > 0)
                    if (!hasVol) continue
                    const otherPayload = buildMonthlyPayloadFromData(cached, op, op.id, bId, bChs, payloadCtx)
                    const cachedRecordId = skuDataCacheRef.current[op.id]?.recordId ?? null
                    let otherId = cachedRecordId
                    if (!otherId) {
                        const chk = await services.pl.getMonthlyByPeriod(bId, op.id, periodMonth, periodYear)
                        const existing = chk?.data?.data ?? chk?.data ?? null
                        if (existing?.id) otherId = existing.id
                    }
                    otherSaves.push(otherId
                        ? services.pl.updateMonthly(otherId, otherPayload)
                        : services.pl.createMonthly(otherPayload))
                }
                if (otherSaves.length) await Promise.allSettled(otherSaves)
                toast.success(t('saveSuccess'))
                return
            }

            // ── Flow 3: Full setup (new brand + monthly) ─────────────────────
            const skusPayload = products.filter(p => p.name).map(p => ({
                name: p.name, cogs_per_unit: num(p.cogs), packaging_cost: num(p.pkg), is_active: true,
                channel_prices: channels.map(ch => ({
                    channel_name: ch,
                    selling_price: parseFloat(p.prices?.[ch]?.price) || 0,
                    default_discount_pct: (parseFloat(p.prices?.[ch]?.discount) || 0) / 100,
                })),
            }))
            const brandPayload = {
                name: setup.brand_name, category: setup.category,
                ...(setup.enabler && { enabler_name: setup.enabler }),
                via_enabler: !!setup.enabler, ecom_model: 'MARKETPLACE', status: 'active',
                channels: channels.map((ch, i) => ({
                    name: ch, is_mall: mallStatus[ch] ?? false, is_active: channelActive[ch] !== false, sort_order: i + 1,
                    fee_config: {
                        commission_rate: parseFloat(getChFee(ch, 'comm')) / 100,
                        mall_fee_rate: parseFloat(getChFee(ch, 'mall')) / 100,
                        pgw_rate: parseFloat(getChFee(ch, 'pgw')) / 100,
                    },
                })),
                ...(skusPayload.length && { skus: skusPayload }),
                ...(setup.enabler && {
                    enabler_fee_config: {
                        retainer_amount: retainerVal, store_operation_fee: sofVal,
                        platform_fee: swiftVal, live_commerce_cost: liveVal, warehouse_cost: warehouseVal,
                        commission_gmv_rate: (parseFloat(enablerConfig.commissionRate) || 0) / 100,
                        fulfillment_per_order: fulfilRate,
                        custom_fixed_components: enablerConfig.customFixed.map(r => ({ name: r.name, amount: parseFloat(r.val) || 0 })),
                        custom_var_components: enablerConfig.customVar.map(r => ({ name: r.name, amount: parseFloat(r.val) || 0 })),
                    },
                }),
            }
            const bIdFull = brandData?.id ?? editId
            const brandRes = bIdFull
                ? await services.pl.updatePl(bIdFull, brandPayload)
                : await services.pl.createPl(brandPayload)
            if (!brandRes?.success) return toast.error(errMsg(brandRes?.message, t('saveError')))
            const saved = brandRes.data?.data ?? brandRes.data ?? null
            setBrandData(saved)

            const payload = buildMonthlyPayload(saved.id, saved.channels ?? [])
            const monthlyRes = await services.pl.createMonthly(payload)

            const otherSkus = products.filter(p => p.id !== selectedSku && p.name)
            const otherSaves = []
            for (const op of otherSkus) {
                const cached = skuDataCacheRef.current[op.id]?.data ?? prefetchedSkuData[op.id]
                if (!cached) continue
                const hasVol = Object.values(cached.infoData ?? {}).some(d => parseFloat(d?.vol) > 0)
                if (!hasVol) continue
                otherSaves.push(services.pl.createMonthly(
                    buildMonthlyPayloadFromData(cached, op, op.id, saved.id, saved.channels ?? [], payloadCtx)
                ))
            }
            if (otherSaves.length) await Promise.allSettled(otherSaves)

            if (monthlyRes?.success) toast.success(t('saveSuccess'))
            else toast.error(errMsg(monthlyRes?.message, t('saveError')))
        } catch {
            toast.error(t('saveError'))
        } finally {
            setIsSaving(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    if (isPageLoading) return <LoadingScreen />

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                                <IconArrowLeft size={16} />
                            </Button>
                        )}
                        <H3 className="text-xl font-bold">{brandOnly ? t('colBrand') : editId ? t('editTitle') : t('title')}</H3>
                    </div>
                </div>
                <div className="px-4 lg:px-6"><Separator /></div>

                <div className="px-4 lg:px-6 py-4 pb-20 space-y-4">

                    {/* SETUP PHASE */}
                    {!setupDone && (
                        <SetupPhase
                            setupStep={setupStep} completedSetupSteps={completedSetupSteps}
                            handleStepOpen={handleStepOpen} doneSetupStep={doneSetupStep} getStepStatus={getStepStatus}
                            setup={setup} setS={setS}
                            channels={channels} tagInput={tagInput} setTagInput={setTagInput}
                            addChannel={addChannel} removeChannel={removeChannel}
                            channelActive={channelActive} setChannelActive={setChannelActive}
                            getChFee={getChFee} setChFee={setChFee}
                            enablerConfig={enablerConfig} setEC={setEC}
                            products={products} activeIdx={activeIdx} setActiveIdx={setActiveIdx}
                            addProduct={addProduct} removeProduct={removeProduct} updateP={updateP} p={p}
                            openSkuModal={openSkuModal}
                            handleSaveChanges={handleSaveChanges} brandOnly={brandOnly}
                            t={t}
                        />
                    )}

                    {/* MONTHLY P&L PHASE */}
                    {setupDone && !brandOnly && (
                        <>
                            <MonthlyInputSection
                                t={t}
                                setup={setup} channels={plChannels} setSetupDone={setSetupDone}
                                activeYear={activeYear} setActiveYear={setActiveYear}
                                activeMo={activeMo} setActiveMo={setActiveMo}
                                isMonthsLoading={isMonthsLoading} takenMonths={takenMonths}
                                enablerConfig={enablerConfig} enablerFixedTotal={enablerFixedTotal}
                                monthlyCommissionRate={monthlyCommissionRate} setMonthlyCommissionRate={setMonthlyCommissionRate}
                                varData={varData} setVarData={setVarData} customVarTotal={customVarTotal}
                                products={products} selectedSku={selectedSku} setSelectedSku={setSelectedSku} activeSku={activeSku}
                                infoData={infoData} setInfoData={setInfoData}
                                discountData={discountData} setDiscountData={setDiscountData}
                                returnData={returnData} setReturnData={setReturnData}
                                shippingData={shippingData} setShippingData={setShippingData}
                                adsData={adsData} setAdsData={setAdsData}
                                bundlingData={bundlingData} setBundlingData={setBundlingData}
                                customRows={customRows} setCustomRows={setCustomRows}
                                secFilled={secFilled} markFilled={markFilled}
                                grossByChannel={grossByChannel} discByChannel={discByChannel}
                                retByChannel={retByChannel} adsByChannel={adsByChannel}
                                totalDiscountPct={totalDiscountPct} fixedTotal={fixedTotal}
                                getChFee={getChFee}
                                DISCOUNT_LABELS={DISCOUNT_LABELS}
                            />

                            <ResultsSection
                                t={t} channels={plChannels}
                                allSkuMetrics={allSkuMetrics} namedProducts={namedProducts} selectedSku={selectedSku}
                                allSkuGrossTotal={allSkuGrossTotal} allSkuNetTotal={allSkuNetTotal}
                                allSkuGrossProfit={allSkuGrossProfit} allSkuFixedTotal={allSkuFixedTotal} allSkuOpProfit={allSkuOpProfit}
                                enablerFixedTotal={enablerFixedTotal} enablerVarTotal={enablerVarTotal}
                                finalMonthlyPL={finalMonthlyPL} finalMonthlyPLPct={finalMonthlyPLPct}
                                finalPlColor={finalPlColor}
                                setDetailModalSku={setDetailModalSku}
                            />
                        </>
                    )}

                </div>
            </div>

            {/* Fixed Footer */}
            {setupDone && !brandOnly && (
                <div
                    className="fixed bottom-0 right-0 z-10 border-t bg-background transition-[left] duration-200 ease-linear"
                    style={{ left: sidebarOpen ? 'var(--sidebar-width)' : '0' }}
                >
                    <div className="flex justify-end px-4 lg:px-6 py-3">
                        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? t('saving') : t('saveChanges')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <SkuDetailModal
                t={t} channels={plChannels}
                detailModalSku={detailModalSku} setDetailModalSku={setDetailModalSku}
                skuDetailData={skuDetailData}
            />
            <SkuSelectionModal
                t={t}
                skuModalOpen={skuModalOpen} setSkuModalOpen={setSkuModalOpen}
                skuSearch={skuSearch} setSkuSearch={setSkuSearch}
                isSkusLoading={isSkusLoading} filteredSkus={filteredSkus}
                currentSku={p.sku} selectSku={selectSku}
            />
        </>
    )
}
