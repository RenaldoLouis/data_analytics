// ─── Constants ────────────────────────────────────────────────────────────────
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export const DISCOUNT_COLS = [
    { key: 'voucher', currency: true },
    { key: 'subsidy', currency: false },
    { key: 'flash', currency: true },
    { key: 'affiliate', currency: false },
    { key: 'bundling', currency: false },
    { key: 'loyalty', currency: false },
]
export const DISCOUNT_KEYS = DISCOUNT_COLS.map(c => c.key)
export const DISCOUNT_PCT_KEYS = DISCOUNT_COLS.filter(c => !c.currency).map(c => c.key)
export const DISCOUNT_AMT_KEYS = DISCOUNT_COLS.filter(c => c.currency).map(c => c.key)

// ─── Formatters / parsers ─────────────────────────────────────────────────────
export const fmt = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID')
export const pct = (n) => (isFinite(n) ? n.toFixed(1) : '0.0') + '%'
export const num = (s) => parseFloat(String(s).replace(/[^\d.]/g, '')) || 0

export const fmtCurrency = (v) => {
    if (v === '' || v == null) return ''
    const n = parseInt(String(v).replace(/\D/g, ''), 10)
    return isNaN(n) ? '' : n.toLocaleString('id-ID')
}
export const parseCurrency = (v) => String(v).replace(/\D/g, '')

export const toAmt = (v) => v != null && v !== '' ? String(Math.round(parseFloat(v))) : ''
export const toRate = (v, scale = 100) => v != null ? String(parseFloat((parseFloat(v) * scale).toFixed(4))) : '0'

export function getChColor(code, label) {
    const key = (label || code || "").toLowerCase()
    if (key.includes("shopee")) return { bg: "#fff7f0", color: "#c83200" }
    if (key.includes("tokopedia")) return { bg: "#f0fff4", color: "#1a6e42" }
    if (key.includes("tiktok")) return { bg: "#f0f8ff", color: "#0a4a8c" }
    if (key.includes("lazada")) return { bg: "#f5f0ff", color: "#4a1fcc" }
    return { bg: "#f5f5f5", color: "#555" }
}

export function makeProduct(index) {
    return { id: Date.now() + index, name: '', sku: null, cogs: '', pkg: '', prices: {} }
}

// ─── Map a monthly DB record to form-state shape ──────────────────────────────
export function mapMonthlyRecordToFormData(mr, chIdToName) {
    const data = {
        infoData: {},
        discountData: {},
        returnData: {},
        shippingData: {},
        adsData: {},
        claimData: { support: '', voucher: '', mpFee: '', mpAffiliate: '', campaign: '' },
        varData: {},
        monthlyCommissionRate: '',
        customRows: [],
        bundlingData: {},
        orders: '',
        secFilled: { info: false, discount: false, ret: false, ads: false, fixed: false },
    }
    if (mr.sales?.length) {
        mr.sales.forEach(s => {
            const ch = chIdToName[s.channel_id]
            if (!ch) return
            data.infoData[ch] = { vol: s.units_sold != null ? String(s.units_sold) : '' }
            data.adsData[ch] = { rate: s.ads_spend_rate != null ? toRate(s.ads_spend_rate) : '0' }
        })
    }
    if (mr.discounts?.length) {
        mr.discounts.forEach(d => {
            const ch = chIdToName[d.channel_id]
            if (!ch) return
            data.discountData[ch] = {
                voucher: d.voucher_amount != null ? toAmt(d.voucher_amount) : '',
                subsidy: toRate(d.subsidy_pct),
                flash: d.flash_sale_amount != null ? toAmt(d.flash_sale_amount) : '',
                affiliate: toRate(d.affiliate_pct),
                bundling: toRate(d.bundling_pct),
                loyalty: toRate(d.loyalty_pct),
            }
        })
    }
    if (mr.returns?.length) {
        mr.returns.forEach(r => {
            const ch = chIdToName[r.channel_id]
            if (!ch) return
            data.returnData[ch] = {
                units: r.return_units != null ? String(r.return_units) : '',
                actual: r.actual_refund_amount != null ? toAmt(r.actual_refund_amount) : '',
            }
        })
    }
    if (mr.shippings?.length) {
        mr.shippings.forEach(o => {
            const ch = chIdToName[o.channel_id]
            if (!ch) return
            data.shippingData[ch] = {
                subsidy: o.shipping_subsidy != null ? toAmt(o.shipping_subsidy) : '',
                processing: o.processing_fee != null ? toAmt(o.processing_fee) : '',
            }
        })
    }
    if (mr.enabler_var) {
        const ev = mr.enabler_var
        data.claimData = {
            support: ev.claim_support != null ? toAmt(ev.claim_support) : '',
            voucher: ev.claim_voucher != null ? toAmt(ev.claim_voucher) : '',
            mpFee: ev.claim_mp_fee != null ? toAmt(ev.claim_mp_fee) : '',
            mpAffiliate: ev.mp_affiliate != null ? toAmt(ev.mp_affiliate) : '',
            campaign: ev.campaign_ads_fee != null ? toAmt(ev.campaign_ads_fee) : '',
        }
        if (ev.order_count != null) data.orders = String(ev.order_count)
        if (ev.commission_gmv_rate != null) data.monthlyCommissionRate = toRate(ev.commission_gmv_rate)
        if (ev.custom_var_items && typeof ev.custom_var_items === 'object') {
            data.varData = Object.fromEntries(
                Object.entries(ev.custom_var_items).map(([k, v]) => [k, toAmt(v)])
            )
        }
    }
    if (mr.fixed_costs?.length) {
        data.customRows = mr.fixed_costs
            .filter(fc => fc.item_name)
            .map((fc, i) => ({ id: i, name: fc.item_name, val: toAmt(fc.amount) }))
    }
    if (mr.cogs_overrides?.length) {
        mr.cogs_overrides.forEach(co => {
            const ch = chIdToName[co.channel_id]
            if (!ch) return
            data.bundlingData[ch] = {
                cogs: co.cogs_bundling != null ? toAmt(co.cogs_bundling) : '',
                units: co.units_per_bundle != null ? String(co.units_per_bundle) : '',
            }
        })
    }
    const hasVal = (v) => v != null && v !== '' && v !== '0' && parseFloat(v) > 0
    data.secFilled = {
        info: Object.values(data.infoData).some(d => hasVal(d?.vol)),
        discount: Object.values(data.discountData).some(d => DISCOUNT_KEYS.some(k => hasVal(d?.[k]))),
        ret: false,
        ads: Object.values(data.adsData).some(d => hasVal(d?.rate)),
        fixed: data.customRows.some(r => r.name && hasVal(r.val)),
    }
    return data
}

// ─── Build monthly payload from explicit form data ────────────────────────────
export function buildMonthlyPayloadFromData(fd, product, skuId, resolvedBrandId, resolvedChannels, { channels, channelMap, activeMo, activeYear, claimData: fallbackClaim, varData: fallbackVar, monthlyCommissionRate: fallbackCommRate, orders: fallbackOrders }) {
    const chId = (ch) => resolvedChannels.find(c => c.name === ch)?.id ?? channelMap[ch]
    const periodMonth = String(MONTH_LABELS.indexOf(activeMo) + 1).padStart(2, '0')
    const periodYear = parseInt(activeYear)
    const fi = fd.infoData ?? {}
    const fdisc = fd.discountData ?? {}
    const fr = fd.returnData ?? {}
    const fo = fd.shippingData ?? {}
    const fa = fd.adsData ?? {}
    const fb = fd.bundlingData ?? {}
    const fc = fd.customRows ?? []
    const grossByCh = channels.map(ch =>
        (parseFloat(fi[ch]?.vol) || 0) * (parseFloat(product?.prices?.[ch]?.price) || 0))
    const discPctFn = (ch) => DISCOUNT_PCT_KEYS.reduce((s, k) => s + (parseFloat(fdisc[ch]?.[k]) || 0), 0)
    const discAmtFn = (ch) => DISCOUNT_AMT_KEYS.reduce((s, k) => s + (parseFloat(fdisc[ch]?.[k]) || 0), 0)
    const discByCh = channels.map((ch, i) => grossByCh[i] * discPctFn(ch) / 100 + discAmtFn(ch))
    return {
        brand_id: resolvedBrandId,
        sku_id: skuId,
        period_month: periodMonth,
        period_year: periodYear,
        status: 'DRAFT',
        sales: channels.map((ch, i) => ({
            channel_id: chId(ch),
            units_sold: parseFloat(fi[ch]?.vol) || 0,
            actual_selling_price: parseFloat(product?.prices?.[ch]?.price) || 0,
            ads_spend_rate: (parseFloat(fa[ch]?.rate) || 0) / 100,
            ads_spend_amount: grossByCh[i] * ((parseFloat(fa[ch]?.rate) || 0) / 100),
        })),
        discounts: channels.map((ch, i) => ({
            channel_id: chId(ch),
            voucher_pct: 0,
            voucher_amount: parseFloat(fdisc[ch]?.voucher) || 0,
            subsidy_pct: (parseFloat(fdisc[ch]?.subsidy) || 0) / 100,
            flash_sale_pct: 0,
            flash_sale_amount: parseFloat(fdisc[ch]?.flash) || 0,
            coin_pct: 0,
            affiliate_pct: (parseFloat(fdisc[ch]?.affiliate) || 0) / 100,
            bundling_pct: (parseFloat(fdisc[ch]?.bundling) || 0) / 100,
            loyalty_pct: (parseFloat(fdisc[ch]?.loyalty) || 0) / 100,
            total_discount_pct: discPctFn(ch) / 100,
            discount_amount: discByCh[i],
        })),
        returns: channels.map(ch => ({
            channel_id: chId(ch),
            return_rate_pct: 0,
            return_units: parseFloat(fr[ch]?.units) || 0,
            estimated_return_value: 0,
            actual_refund_amount: parseFloat(fr[ch]?.actual) || 0,
        })),
        shippings: channels.map(ch => ({
            channel_id: chId(ch),
            shipping_subsidy: parseFloat(fo[ch]?.subsidy) || 0,
            actual_shipping_cost: 0,
            processing_fee: parseFloat(fo[ch]?.processing) || 0,
            weight_diff_kg: 0,
        })),
        enabler_var: {
            commission_gmv_rate: (parseFloat(fd.monthlyCommissionRate ?? fallbackCommRate) || 0) / 100,
            order_count: parseFloat(fd.orders ?? fallbackOrders) || 0,
            claim_support: parseFloat((fd.claimData ?? fallbackClaim).support) || 0,
            claim_voucher: parseFloat((fd.claimData ?? fallbackClaim).voucher) || 0,
            claim_mp_fee: parseFloat((fd.claimData ?? fallbackClaim).mpFee) || 0,
            mp_affiliate: parseFloat((fd.claimData ?? fallbackClaim).mpAffiliate) || 0,
            campaign_ads_fee: parseFloat((fd.claimData ?? fallbackClaim).campaign) || 0,
            custom_var_items: Object.fromEntries(
                Object.entries(fd.varData ?? fallbackVar).map(([k, v]) => [k, parseFloat(v) || 0])
            ),
        },
        fixed_costs: fc
            .filter(r => r.name && parseFloat(r.val) > 0)
            .map(r => ({ item_name: r.name, amount: parseFloat(r.val) || 0 })),
        cogs_overrides: channels.map(ch => ({
            channel_id: chId(ch),
            cogs_override: null,
            packaging_override: null,
            cogs_bundling: parseFloat(fb[ch]?.cogs) || null,
            units_per_bundle: parseFloat(fb[ch]?.units) || null,
        })),
    }
}

// ─── Compute P&L metrics for a single SKU ─────────────────────────────────────
export function computeSkuMetrics(formData, sku, channels, getChFee) {
    const { infoData: fi = {}, discountData: fd = {}, returnData: fr = {},
        shippingData: fo = {}, adsData: fa = {}, customRows: fc = [], bundlingData: fb = {} } = formData
    const skuCogsUnit = (parseFloat(sku.cogs) || 0) + (parseFloat(sku.pkg) || 0)
    const gByCh = channels.map(ch => (parseFloat(fi[ch]?.vol) || 0) * (parseFloat(sku.prices?.[ch]?.price) || 0))
    const gTot = gByCh.reduce((a, b) => a + b, 0)
    const dByCh = channels.map((ch, i) =>
        gByCh[i] * DISCOUNT_PCT_KEYS.reduce((s, k) => s + (parseFloat(fd[ch]?.[k]) || 0), 0) / 100
        + DISCOUNT_AMT_KEYS.reduce((s, k) => s + (parseFloat(fd[ch]?.[k]) || 0), 0))
    const rByCh = channels.map(ch => parseFloat(fr[ch]?.actual) || 0)
    const sByCh = channels.map(ch => (parseFloat(fo[ch]?.subsidy) || 0) + (parseFloat(fo[ch]?.processing) || 0))
    const aByCh = channels.map((ch, i) => gByCh[i] * ((parseFloat(fa[ch]?.rate) || 0) / 100))
    const nByCh = channels.map((_, i) => gByCh[i] - dByCh[i] - rByCh[i] - sByCh[i] - aByCh[i])
    const nTot = nByCh.reduce((a, b) => a + b, 0)
    const cogsTot = channels.reduce((s, ch) => {
        const vol = parseFloat(fi[ch]?.vol) || 0
        const bundCogs = parseFloat(fb[ch]?.cogs) || 0
        const unitsPerBundle = parseFloat(fb[ch]?.units) || 1
        return s + vol * (bundCogs > 0 ? bundCogs : unitsPerBundle * skuCogsUnit)
    }, 0)
    const chCost = channels.reduce((s, ch, i) => s + gByCh[i] * (
        (parseFloat(getChFee(ch, 'comm')) + parseFloat(getChFee(ch, 'mall')) + parseFloat(getChFee(ch, 'pgw'))) / 100
    ), 0)
    const fcTot = fc.reduce((s, r) => s + (parseFloat(r.val) || 0), 0)
    const gpTot = nTot - cogsTot
    const opTot = gpTot - chCost - fcTot
    return {
        grossTotal: gTot, netTotal: nTot, cogsTotal: cogsTot, channelCost: chCost,
        fixedCost: fcTot, grossProfit: gpTot, operatingProfit: opTot,
        grossMarginPct: nTot > 0 ? (gpTot / nTot) * 100 : 0,
        operatingMarginPct: nTot > 0 ? (opTot / nTot) * 100 : 0,
        grossByCh: gByCh, discByCh: dByCh, retByCh: rByCh, shipByCh: sByCh, adsByCh: aByCh, netByCh: nByCh
    }
}
