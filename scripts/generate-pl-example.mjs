// Run: npm run generate-pl  (from the data_analytics folder)
// Generates public/templates/pl_example.xlsx with sample data.

import * as XLSX from 'xlsx'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.join(__dirname, '../public/templates/pl_example.xlsx')

const S = {
    BASIC_INFO:   '>> BASIC INFO <<',
    BUNDLING:     '>> COGS / HPP <<',
    RETURNS:      '>> RETURN RATE <<',
    DISCOUNTS:    '>> SELLER DISCOUNT <<',
    SHIPPING:     '>> SHIPPING <<',
    ADS_SPEND:    '>> ADS SPEND <<',
    FIXED_COSTS:  '>> FIXED COSTS <<',
}

// ── Sample configuration ────────────────────────────────────────────────────
const channels = ['bbac', 'bacd', 'vacd']

const skus = [
    {
        name: 'ROBOT Case',
        basicInfo:  { bbac: [150], bacd: [80], vacd: [200] },
        adsSpend:   { bbac: [5], bacd: [3], vacd: [8] },
        discounts:  { bbac: [50000, 2, 0, 3, 0, 1], bacd: [30000, 1.5, 0, 2, 0, 0], vacd: [0, 3, 100000, 5, 0, 0] },
        returns:    { bbac: [3, 51000], bacd: [1, 18000], vacd: [5, 125000] },
        shipping:   { bbac: [15000, 0], bacd: [12000, 0], vacd: [0, 5000] },
        bundling:   {},
        fixedCosts: [['Gaji Tim', 5000000], ['Biaya Konten', 1500000], ['Sewa Studio', 2000000]],
    },
    {
        name: 'ROBOT Charger',
        basicInfo:  { bbac: [90], bacd: [60], vacd: [130] },
        adsSpend:   { bbac: [4], bacd: [3], vacd: [6] },
        discounts:  { bbac: [25000, 1, 0, 2, 0, 0], bacd: [15000, 1, 0, 1.5, 0, 0], vacd: [0, 2, 50000, 4, 0, 0] },
        returns:    { bbac: [2, 36000], bacd: [1, 18000], vacd: [3, 75000] },
        shipping:   { bbac: [12000, 0], bacd: [10000, 0], vacd: [0, 4000] },
        bundling:   { bbac: [35000, 2], bacd: [], vacd: [] },
        fixedCosts: [['Biaya Packaging Khusus', 750000], ['Biaya Sample', 500000]],
    },
    {
        name: '99 SKU',
        basicInfo:  { bbac: [60], bacd: [40], vacd: [80] },
        adsSpend:   { bbac: [3], bacd: [2], vacd: [5] },
        discounts:  { bbac: [10000, 1, 0, 1.5, 0, 0], bacd: [5000, 1, 0, 1, 0, 0], vacd: [0, 2, 20000, 3, 0, 0] },
        returns:    { bbac: [1, 25000], bacd: [0, 0], vacd: [2, 50000] },
        shipping:   { bbac: [8000, 0], bacd: [8000, 0], vacd: [0, 3000] },
        bundling:   {},
        fixedCosts: [['Influencer Fee', 2000000]],
    },
]

// ── Sheet builder ───────────────────────────────────────────────────────────
function buildSheet(sku) {
    const rows = []
    const r = (...cells) => rows.push(cells)
    const blank = () => rows.push([])

    r(`Monthly P&L — SKU: ${sku.name}`)
    r('Instructions: Fill in the input columns only. Do not change section headers or channel names.')
    blank()

    r(S.BASIC_INFO)
    r('Channel', 'Units Sold')
    for (const ch of channels) r(ch, ...(sku.basicInfo[ch] ?? ['']))
    blank()

    r(S.BUNDLING)
    r('Channel', 'Bundling COGS/set (Rp)', 'Units per Bundle')
    for (const ch of channels) r(ch, ...(sku.bundling[ch] ?? ['', '']))
    blank()

    r(S.RETURNS)
    r('Channel', 'Unit Returns', 'Actual Refund (Rp)')
    for (const ch of channels) r(ch, ...(sku.returns[ch] ?? ['', '']))
    blank()

    r(S.DISCOUNTS)
    r('Channel', 'Voucher (Rp)', 'Subsidy (%)', 'Flash Sale (Rp)', 'Affiliate (%)', 'Bundling (%)', 'Member (%)')
    for (const ch of channels) r(ch, ...(sku.discounts[ch] ?? ['', '', '', '', '', '']))
    blank()

    r(S.SHIPPING)
    r('Channel', 'Shipping Subsidy (Rp)', 'Processing Fee (Rp)')
    for (const ch of channels) r(ch, ...(sku.shipping[ch] ?? ['', '']))
    blank()

    r(S.ADS_SPEND)
    r('Channel', 'Ads Rate (% GMV)')
    for (const ch of channels) r(ch, ...(sku.adsSpend[ch] ?? ['']))
    blank()

    r(S.FIXED_COSTS)
    r('Cost Name', 'Amount (Rp)')
    for (const [name, amt] of sku.fixedCosts) r(name, amt)
    for (let i = sku.fixedCosts.length; i < 10; i++) r('', '')

    return rows
}

// ── Build workbook ──────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new()
const COLS = [{ wch: 38 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }]

skus.forEach((sku) => {
    const rows = buildSheet(sku)
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = COLS
    XLSX.utils.book_append_sheet(wb, ws, sku.name.slice(0, 31))
})

XLSX.writeFile(wb, OUTPUT_PATH)
console.log(`✓ Generated ${OUTPUT_PATH}`)
