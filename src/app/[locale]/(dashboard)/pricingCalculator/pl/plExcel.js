import * as XLSX from 'xlsx'

// Section markers — names match the website accordion titles
export const PL_EXCEL_SECTIONS = {
    BASIC_INFO:    '>> BASIC INFO <<',
    BUNDLING:      '>> COGS / HPP <<',
    RETURNS:       '>> RETURN RATE <<',
    DISCOUNTS:     '>> SELLER DISCOUNT <<',
    SHIPPING:      '>> SHIPPING <<',
    ADS_SPEND:     '>> ADS SPEND <<',
    FIXED_COSTS:   '>> FIXED COSTS <<',
}

const ALL_MARKERS = new Set(Object.values(PL_EXCEL_SECTIONS))

const SHEET_COLS = [
    { wch: 38 }, { wch: 22 }, { wch: 20 },
    { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
]

function toSheetName(name) {
    return name.replace(/[\\/*?:[\]]/g, '_').slice(0, 31)
}

// ── Template builder (blank inputs) ──────────────────────────────────────────

function buildSkuRows(channels, skuName, product = {}) {
    const rows = []
    const push = (...cells) => rows.push(cells)
    const blank = () => rows.push([])

    push(`Monthly P&L — SKU: ${skuName}`)
    push('Instructions: Fill in the input columns only. Do not change section headers or channel names.')
    blank()

    push(PL_EXCEL_SECTIONS.BASIC_INFO)
    push('Channel', 'Units Sold')
    for (const ch of channels) push(ch, '')
    blank()

    push(PL_EXCEL_SECTIONS.BUNDLING)
    push('Channel', 'Bundling COGS/set (Rp)', 'Units per Bundle')
    for (const ch of channels) push(ch, '', '')
    blank()

    push(PL_EXCEL_SECTIONS.RETURNS)
    push('Channel', 'Unit Returns', 'Actual Refund (Rp)')
    for (const ch of channels) push(ch, '', '')
    blank()

    push(PL_EXCEL_SECTIONS.DISCOUNTS)
    push('Channel', 'Voucher (Rp)', 'Subsidy (%)', 'Flash Sale (Rp)', 'Affiliate (%)', 'Bundling (%)', 'Member (%)')
    for (const ch of channels) push(ch, '', '', '', '', '', '')
    blank()

    push(PL_EXCEL_SECTIONS.SHIPPING)
    push('Channel', 'Shipping Subsidy (Rp)', 'Processing Fee (Rp)')
    for (const ch of channels) push(ch, '', '')
    blank()

    push(PL_EXCEL_SECTIONS.ADS_SPEND)
    push('Channel', 'Ads Rate (% GMV)')
    for (const ch of channels) push(ch, '')
    blank()

    push(PL_EXCEL_SECTIONS.FIXED_COSTS)
    push('Cost Name', 'Amount (Rp)')
    for (let i = 0; i < 10; i++) push('', '')

    return rows
}

export function generatePlTemplate(channels, products = []) {
    const wb = XLSX.utils.book_new()
    const skuList = products.filter(p => p.name)
    if (skuList.length === 0) skuList.push({ name: 'SKU 1' })

    skuList.forEach((product) => {
        const rows = buildSkuRows(channels, product.name, product)
        const ws = XLSX.utils.aoa_to_sheet(rows)
        ws['!cols'] = SHEET_COLS
        XLSX.utils.book_append_sheet(wb, ws, toSheetName(product.name))
    })

    return wb
}

// ── Export (filled data → workbook) ──────────────────────────────────────────

const toNum = (v) => { const n = parseFloat(String(v ?? '')); return isNaN(n) ? '' : n }

function buildFilledRows(channels, skuName, formData, product = {}) {
    const rows = []
    const push = (...cells) => rows.push(cells)
    const blank = () => rows.push([])
    const { infoData = {}, adsData = {}, discountData = {}, returnData = {},
        shippingData = {}, bundlingData = {}, customRows = [] } = formData

    push(`Monthly P&L — SKU: ${skuName}`)
    push('Exported data. Import this file on any month to pre-fill all fields.')
    blank()

    push(PL_EXCEL_SECTIONS.BASIC_INFO)
    push('Channel', 'Units Sold')
    for (const ch of channels) push(ch, toNum(infoData[ch]?.vol))
    blank()

    push(PL_EXCEL_SECTIONS.BUNDLING)
    push('Channel', 'Bundling COGS/set (Rp)', 'Units per Bundle')
    for (const ch of channels) push(ch, toNum(bundlingData[ch]?.cogs), toNum(bundlingData[ch]?.units))
    blank()

    push(PL_EXCEL_SECTIONS.RETURNS)
    push('Channel', 'Unit Returns', 'Actual Refund (Rp)')
    for (const ch of channels) push(ch, toNum(returnData[ch]?.units), toNum(returnData[ch]?.actual))
    blank()

    push(PL_EXCEL_SECTIONS.DISCOUNTS)
    push('Channel', 'Voucher (Rp)', 'Subsidy (%)', 'Flash Sale (Rp)', 'Affiliate (%)', 'Bundling (%)', 'Member (%)')
    for (const ch of channels) push(ch,
        toNum(discountData[ch]?.voucher), toNum(discountData[ch]?.subsidy),
        toNum(discountData[ch]?.flash),   toNum(discountData[ch]?.affiliate),
        toNum(discountData[ch]?.bundling), toNum(discountData[ch]?.loyalty))
    blank()

    push(PL_EXCEL_SECTIONS.SHIPPING)
    push('Channel', 'Shipping Subsidy (Rp)', 'Processing Fee (Rp)')
    for (const ch of channels) push(ch, toNum(shippingData[ch]?.subsidy), toNum(shippingData[ch]?.processing))
    blank()

    push(PL_EXCEL_SECTIONS.ADS_SPEND)
    push('Channel', 'Ads Rate (% GMV)')
    for (const ch of channels) push(ch, toNum(adsData[ch]?.rate))
    blank()

    push(PL_EXCEL_SECTIONS.FIXED_COSTS)
    push('Cost Name', 'Amount (Rp)')
    const filledRows = customRows.filter(r => r.name)
    for (const r of filledRows) push(r.name, toNum(r.val))
    for (let i = filledRows.length; i < 10; i++) push('', '')

    return rows
}

export function exportPlToExcel(channels, skuDataList = []) {
    const wb = XLSX.utils.book_new()
    skuDataList.forEach(({ name, cogs, pkg, formData }) => {
        const rows = buildFilledRows(channels, name, formData ?? {}, { cogs, pkg })
        const ws = XLSX.utils.aoa_to_sheet(rows)
        ws['!cols'] = SHEET_COLS
        XLSX.utils.book_append_sheet(wb, ws, toSheetName(name))
    })
    return wb
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

function indexSections(raw) {
    const idx = {}
    raw.forEach((row, i) => {
        const cell = String(row[0] || '').trim()
        if (ALL_MARKERS.has(cell)) idx[cell] = i
    })
    return idx
}

const str = (v) => String(v ?? '').trim()

function readTable(raw, sectionIdx, key) {
    const start = sectionIdx[key]
    if (start == null) return []
    const out = []
    for (let r = start + 2; r < raw.length; r++) {
        const row = raw[r]
        const cell = str(row[0])
        if (!cell || ALL_MARKERS.has(cell)) break
        out.push(row)
    }
    return out
}

function readKV(raw, sectionIdx, key) {
    const start = sectionIdx[key]
    if (start == null) return []
    const out = []
    for (let r = start + 1; r < raw.length; r++) {
        const row = raw[r]
        const label = str(row[0])
        if (!label || ALL_MARKERS.has(label)) break
        out.push([label, str(row[1])])
    }
    return out
}

function resolveChannel(name, channels) {
    const lower = name.toLowerCase()
    return channels.find(ch => ch.toLowerCase() === lower) ?? null
}

function parseSkuSheet(raw, channels, sectionIdx) {
    // A. Basic Info
    const infoData = {}
    readTable(raw, sectionIdx, PL_EXCEL_SECTIONS.BASIC_INFO).forEach(row => {
        const ch = resolveChannel(str(row[0]), channels)
        if (!ch) return
        infoData[ch] = { vol: str(row[1]) }
    })

    // D. Seller Discount
    const discountData = {}
    readTable(raw, sectionIdx, PL_EXCEL_SECTIONS.DISCOUNTS).forEach(row => {
        const ch = resolveChannel(str(row[0]), channels)
        if (!ch) return
        discountData[ch] = {
            voucher: str(row[1]), subsidy: str(row[2]), flash: str(row[3]),
            affiliate: str(row[4]), bundling: str(row[5]), loyalty: str(row[6]),
        }
    })

    // C. Return Rate
    const returnData = {}
    readTable(raw, sectionIdx, PL_EXCEL_SECTIONS.RETURNS).forEach(row => {
        const ch = resolveChannel(str(row[0]), channels)
        if (!ch) return
        returnData[ch] = { units: str(row[1]), actual: str(row[2]) }
    })

    // E. Shipping
    const shippingData = {}
    readTable(raw, sectionIdx, PL_EXCEL_SECTIONS.SHIPPING).forEach(row => {
        const ch = resolveChannel(str(row[0]), channels)
        if (!ch) return
        shippingData[ch] = { subsidy: str(row[1]), processing: str(row[2]) }
    })

    // F. Ads Spend
    const adsData = {}
    readTable(raw, sectionIdx, PL_EXCEL_SECTIONS.ADS_SPEND).forEach(row => {
        const ch = resolveChannel(str(row[0]), channels)
        if (!ch) return
        adsData[ch] = { rate: str(row[1]) }
    })

    // B. Bundling COGS
    const bundlingData = {}
    readTable(raw, sectionIdx, PL_EXCEL_SECTIONS.BUNDLING).forEach(row => {
        const ch = resolveChannel(str(row[0]), channels)
        if (!ch) return
        bundlingData[ch] = { cogs: str(row[1]), units: str(row[2]) }
    })

    // H. Fixed Costs
    const customRows = readTable(raw, sectionIdx, PL_EXCEL_SECTIONS.FIXED_COSTS)
        .filter(row => str(row[0]))
        .map((row, i) => ({ id: Date.now() + i, name: str(row[0]), val: str(row[1]) }))

    const hasVal = (v) => v != null && v !== '' && parseFloat(v) > 0
    const secFilled = {
        info:     Object.values(infoData).some(d => hasVal(d?.vol)),
        discount: Object.values(discountData).some(d => Object.values(d).some(v => hasVal(v))),
        ret:      false,
        ads:      Object.values(adsData).some(d => hasVal(d?.rate)),
        fixed:    customRows.some(r => r.name && hasVal(r.val)),
    }

    return { infoData, adsData, discountData, returnData, shippingData, bundlingData, customRows, secFilled }
}

export function parsePlImport(workbook, channels) {
    const skuSheets = []

    workbook.SheetNames.forEach((sheetName) => {
        const ws = workbook.Sheets[sheetName]
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        const sectionIdx = indexSections(raw)
        skuSheets.push({ sheetName, formData: parseSkuSheet(raw, channels, sectionIdx) })
    })

    return { skuSheets }
}
