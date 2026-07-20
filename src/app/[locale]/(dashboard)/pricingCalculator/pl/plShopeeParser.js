import * as XLSX from 'xlsx'
import { classifyOrderRow } from './plLib'

// ─── Column patterns (lowercase fragments) ────────────────────────────────────
// Covers Shopee Income Report (Laporan Keuangan) and Order Report (Laporan Pesanan).
const COL_INCOME = {
    orderNo:        ['no. pesanan', 'order id', 'no pesanan'],
    originalPrice:  ['harga asli produk', 'harga awal produk', 'harga awal', 'harga asli', 'original price'],
    sellingPrice:   ['harga setelah diskon', 'discounted price', 'selling price', 'harga jual'],
    orderStatus:    ['status pesanan', 'order status'],
    // Seller-funded discounts
    voucher:        ['voucher ditanggung penjual', 'voucher disponsor oleh penjual', 'voucher dispons', 'diskon dari voucher penjual', 'seller voucher', 'voucher penjual'],
    // "Diskon dari Seller / Penjual" (col U) - distinct seller-funded discount (Improvement B).
    sellerDiscount: ['diskon dari seller', 'diskon seller'],
    voucherCofund:  ['voucher co-fund disponsor', 'voucher co-fund', 'diskon dari voucher shopee', 'shopee voucher'],
    coin:           ['cashback koin dispons', 'koin shopee yang digunakan', 'koin yang digunakan'],
    coinCofund:     ['cashback koin co-fund', 'koin co-fund'],
    totalDiscount:  ['total diskon produk', 'total diskon', 'total discount'],
    // "Pengembalian Dana (Produk)" (col J) - buyer refund on returns.
    refundAmount:   ['jumlah pengembalian dana', 'pengembalian dana ke pembeli', 'pengembalian dana', 'refund amount'],
    // Channel fees - Shopee income report naming:
    //   "Biaya Administrasi"           = main commission/admin fee (% of order)
    //   "Biaya Layanan"                = platform service fee
    //   "Biaya Proses Pesanan"         = order processing fee (fixed per order)
    //   "Biaya Program Hemat Biaya Kirim" = shipping savings program fee
    //   "Biaya Kampanye"               = campaign fee
    //   "Biaya Komisi AMS"             = AMS affiliate commission (usually 0)
    // NOTE: commissionFee must NOT match "Biaya Komisi AMS" - that column appears
    //       before "Biaya Administrasi" in the xlsx so we use the most specific pattern.
    commissionFee:  ['biaya administrasi', 'commission fee', 'admin fee'],
    serviceFee:     ['biaya layanan', 'service fee'],
    processingFee:  ['biaya proses pesanan', 'biaya proses pembayaran', 'biaya administrasi pembayaran', 'payment admin', 'processing fee'],
    transactionFee: ['biaya transaksi', 'transaction fee'],
    programFee:     ['biaya program hemat', 'program hemat biaya kirim'],
    campaignFee:    ['biaya kampanye', 'campaign fee'],
    affiliateFee:   ['biaya komisi ams', 'komisi afiliasi', 'affiliate commission', 'biaya afiliasi'],
    // Shipping
    shippingSubsidy: ['gratis ongkir dari shopee', 'gratis ongkir', 'subsidi ongkir', 'shipping subsidy'],
    // Courier cost (col S "Biaya Pengiriman ke Kurir" / "Ongkir yang Diterimakan ke Kurir").
    actualShipping:  ['biaya pengiriman ke kurir', 'pengiriman ke kurir', 'ongkir ke kurir', 'ongkir yang diteruskan', 'ongkir yang diterimakan ke kurir', 'diterimakan ke kurir', 'diteruskan oleh shopee', 'biaya ongkir yang ditanggung penjual', 'ongkos kirim aktual', 'actual shipping'],
    // Buyer-paid shipping (col P "Ongkos Kirim Dibayar/Berbayar Pembeli").
    buyerShipping:   ['ongkos kirim dibayar pembeli', 'ongkos kirim berbayar pembeli', 'ongkir berbayar pembeli', 'ongkir dibayar pembeli', 'ongkos kirim yang dibayar pembeli', 'buyer shipping'],
    // Settlement - "Total Penghasilan" is the net payout to the seller
    settlement:      ['total penghasilan', 'total pemasukan', 'jumlah pemasukan', 'settlement amount', 'total diterima'],
}

const COL_ORDER = {
    orderNo:        ['no. pesanan', 'order id', 'no pesanan'],
    productName:    ['nama produk', 'product name', 'nama barang'],
    quantity:       ['jumlah produk di pesan', 'jumlah produk dipesan', 'jumlah produk dibeli', 'jumlah produk', 'kuantitas produk', 'quantity', 'qty', 'jumlah'],
    // Returned units (Bug 2) - goods physically returned by the buyer. Patterns are
    // specific so they don't collide with "Jumlah" (qty) or the "Dikembalikan" timestamp.
    returnedQty:    ['jumlah produk dikembalikan', 'jumlah dikembalikan', 'kuantitas dikembalikan', 'kuantitas pengembalian', 'jumlah retur', 'returned quantity', 'qty returned'],
    sellingPrice:   ['harga setelah diskon', 'discounted price', 'harga jual'],
    originalPrice:  ['harga awal', 'harga asli', 'original price'],
    orderStatus:    ['status pesanan', 'order status'],
    platformVoucher:['voucher ditanggung shopee', 'diskon dari shopee', 'voucher shopee', 'shopee voucher'],
    sellerVoucher:  ['voucher ditanggung penjual', 'diskon dari penjual', 'voucher penjual'],
    buyerPaid:      ['dibayar pembeli', 'total pembayaran pembeli'],
    settlement:     ['total pembayaran', 'settlement amount'],
}

function matchCol(headers, patterns) {
    return headers.findIndex(h =>
        patterns.some(p => String(h ?? '').toLowerCase().trim().includes(p))
    )
}

function findHeaderRow(rows, identifiers) {
    for (let i = 0; i < Math.min(30, rows.length); i++) {
        const rowStr = rows[i].map(c => String(c ?? '').toLowerCase().trim())
        if (identifiers.some(id => rowStr.some(c => c === id || c.includes(id)))) return i
    }
    return 0
}

// Magnitude parser - always positive (for discounts/fees that are inherently positive).
function n(v) {
    return Math.abs(parseFloat(String(v ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0)
}

// Signed parser - preserves the sign from the report (for settlement & shipping,
// where Shopee uses negatives for refund payouts / courier costs). See Bug #3.
function ns(v) {
    return parseFloat(String(v ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0
}

// Cancelled order: never completed, no money moved → excluded from everything.
function isCancelled(status) {
    const s = String(status ?? '').toLowerCase()
    return s.includes('batal') || s.includes('cancel')
}

// Refunded order ("Pengembalian Dana"): completed then returned. Goods go back to
// warehouse (no QTY/COGS) but settlement keeps the negative platform-fee loss.
// NOTE: "pengembalian" does NOT contain the substring "kembali", so it must be
// matched explicitly - this was the root cause of Bug #1.
function isRefund(status) {
    const s = String(status ?? '').toLowerCase()
    return s.includes('pengembalian') || s.includes('dikembalikan') ||
        s.includes('kembali') || s.includes('refund') || s.includes('retur')
}

// Excluded from sales (QTY / COGS / Net GMV): cancelled or refunded.
function isExcluded(status) {
    return isCancelled(status) || isRefund(status)
}

// ─── Parse order report ──────────────────────────────────────────────────────
function parseOrderReport(rawRows) {
    const headerIdx = findHeaderRow(rawRows, ['no. pesanan', 'nama produk', 'status pesanan'])
    const headers   = rawRows[headerIdx] ?? []
    const ci = Object.fromEntries(
        Object.keys(COL_ORDER).map(k => [k, matchCol(headers, COL_ORDER[k])])
    )
    const dataRows = rawRows.slice(headerIdx + 1).filter(row =>
        row && row.some(c => c != null && c !== '')
    )

    const productMap    = new Map()  // product_name → {units, price_sum, gmv}
    const orderRows     = []          // one row per order line (all orders, including cancelled)
    let platformVoucher = 0
    // Whether this order report actually carries a returned-quantity column. Drives
    // COGS on refunds (Improvement B): without it, refunds are restockable (no COGS).
    const hasReturnedQty = ci.returnedQty >= 0

    for (const row of dataRows) {
        const status  = ci.orderStatus  >= 0 ? row[ci.orderStatus]  : null
        const orderNo = ci.orderNo      >= 0 ? String(row[ci.orderNo] ?? '').trim() : ''
        const name    = ci.productName  >= 0 ? String(row[ci.productName] ?? '').trim() : ''

        if (!name || name === 'null') continue

        const qty   = ci.quantity >= 0 ? (n(row[ci.quantity]) || 1) : 1
        const qtyReturned = ci.returnedQty >= 0 ? n(row[ci.returnedQty]) : 0
        const price = ci.originalPrice >= 0 ? n(row[ci.originalPrice])
            : ci.sellingPrice  >= 0 ? n(row[ci.sellingPrice]) : 0
        const cancelled = status != null && isCancelled(status)
        const refunded  = status != null && isRefund(status)
        // "excluded" drives QTY/COGS downstream - true for both cancelled and refunded.
        const excluded  = cancelled || refunded

        // Collect every order line (all statuses)
        orderRows.push({
            order_no:     orderNo,
            product_name: name,
            qty,
            qty_returned: qtyReturned,   // Bug 2: units physically returned by buyer
            returned_qty_known: hasReturnedQty,  // false → refunds restockable (no COGS)
            price,
            gmv:          qty * price,
            status:       status ? String(status) : '',
            excluded,
            refunded,
        })

        if (cancelled) continue   // cancelled orders contribute nothing at all

        if (!productMap.has(name)) {
            productMap.set(name, { units_sold: 0, price_sum: 0, gross_gmv: 0, refund_gmv: 0 })
        }
        const p = productMap.get(name)
        // Gross GMV = all non-cancelled (Selesai + refund) - "semua status".
        p.gross_gmv += qty * price
        if (refunded) {
            // Refunded value tracked separately; no QTY/COGS (goods returned). Bug #1.
            p.refund_gmv += qty * price
        } else {
            // Completed sale → counts toward QTY/COGS.
            p.units_sold += qty
            p.price_sum  += price
            if (ci.platformVoucher >= 0) platformVoucher += n(row[ci.platformVoucher])
        }
    }

    return { productMap, platformVoucher, orderRows }
}

// ─── Parse income report ─────────────────────────────────────────────────────
// validOrderNos: when an Order report is uploaded, the set of its order numbers.
// Income rows whose order_no is NOT in that set are ANOMALY (Improvement A) - they
// are excluded from all P&L totals and collected separately for review.
function parseIncomeReport(rawRows, validOrderNos = null) {
    const headerIdx = findHeaderRow(rawRows, ['no. pesanan', 'harga asli produk', 'waktu pesanan dibuat'])
    const headers   = rawRows[headerIdx] ?? []
    const ci = Object.fromEntries(
        Object.keys(COL_INCOME).map(k => [k, matchCol(headers, COL_INCOME[k])])
    )
    const dataRows = rawRows.slice(headerIdx + 1).filter(row =>
        row && row.some(c => c != null && c !== '')
    )

    let matchedOrders = 0, excludedOrders = 0
    const anomalies = []
    const totals = {
        grossGmv: 0, voucher: 0, sellerDiscount: 0, voucherCofund: 0, totalDiscount: 0,
        coin: 0, coinCofund: 0, refundAmount: 0,
        commissionFee: 0, serviceFee: 0, processingFee: 0,
        transactionFee: 0, programFee: 0, campaignFee: 0, affiliateFee: 0,
        shippingSubsidy: 0, actualShipping: 0, buyerShipping: 0, settlement: 0,
    }
    const productMap = new Map()
    const orderRows = []

    for (const row of dataRows) {
        const firstCell = String(row[0] ?? '').toLowerCase().trim()
        if (firstCell === 'no.' || firstCell === 'no') continue

        const status = ci.orderStatus >= 0 ? row[ci.orderStatus] : null
        // Only truly cancelled orders are dropped from the income report. Refunded
        // ("Pengembalian Dana") orders are KEPT so their negative settlement (platform
        // fee loss) is included - see Bug #3.
        if (status != null && isCancelled(status)) {
            excludedOrders++
            orderRows.push({
                orderNo:       ci.orderNo >= 0 ? String(row[ci.orderNo] ?? '').trim() : '',
                status:        String(status),
                grossGmv:      0, sellerDiscount: 0, feeTotal: 0, netShipping: 0, settlement: 0,
                excluded:      true,
            })
            continue
        }

        // ANOMALY (Improvement A): in Income but no matching Order → exclude from P&L.
        const incOrderNo = ci.orderNo >= 0 ? String(row[ci.orderNo] ?? '').trim() : ''
        if (validOrderNos && incOrderNo && !validOrderNos.has(incOrderNo)) {
            anomalies.push({
                order_no:   incOrderNo,
                status:     status ? String(status) : '',
                settlement: ci.settlement >= 0 ? Math.round(ns(row[ci.settlement])) : 0,
            })
            continue
        }

        // Use original price (harga asli) for gross GMV - seller receives full original
        // price and is reimbursed for platform vouchers; only seller-funded vouchers reduce income.
        const price = ci.originalPrice >= 0 ? n(row[ci.originalPrice])
            : ci.sellingPrice  >= 0 ? n(row[ci.sellingPrice]) : 0

        totals.grossGmv += price
        // Settlement is SIGNED - refund orders have a negative payout (Bug #3).
        if (ci.settlement >= 0) totals.settlement += ns(row[ci.settlement])

        // All accumulated as magnitudes. Net shipping = buyer (+) - courier (-) is computed
        // from these magnitudes below, matching the per-order calculation (Bug #2).
        for (const key of ['voucher','sellerDiscount','voucherCofund','totalDiscount','coin','coinCofund',
                           'refundAmount','commissionFee','serviceFee','processingFee',
                           'transactionFee','programFee','campaignFee','affiliateFee',
                           'shippingSubsidy','actualShipping','buyerShipping']) {
            if (ci[key] >= 0) totals[key] += n(row[ci[key]])
        }

        // Seller Discount per order = sum of seller-funded discount columns only.
        const rowDiscount = ['voucher','sellerDiscount','voucherCofund','coin','coinCofund']
            .reduce((s, k) => s + (ci[k] >= 0 ? n(row[ci[k]]) : 0), 0)
        const rowFeeTotal = ['commissionFee','serviceFee','processingFee','transactionFee','programFee','campaignFee','affiliateFee']
            .reduce((s, k) => s + (ci[k] >= 0 ? n(row[ci[k]]) : 0), 0)
        // Per-order channel-fee breakdown (snake_case keys mirror the stored shipping
        // fee columns) - surfaced in the expandable "Channel Fees" detail row.
        const rowFeeBreakdown = {
            commission_fee:       ci.commissionFee  >= 0 ? n(row[ci.commissionFee])  : 0,
            service_fee:          ci.serviceFee     >= 0 ? n(row[ci.serviceFee])     : 0,
            processing_fee:       ci.processingFee  >= 0 ? n(row[ci.processingFee])  : 0,
            transaction_fee:      ci.transactionFee >= 0 ? n(row[ci.transactionFee]) : 0,
            program_fee:          ci.programFee     >= 0 ? n(row[ci.programFee])     : 0,
            campaign_fee:         ci.campaignFee    >= 0 ? n(row[ci.campaignFee])    : 0,
            affiliate_commission: ci.affiliateFee   >= 0 ? n(row[ci.affiliateFee])   : 0,
        }
        // Net shipping per order = buyer-paid shipping (+) + courier cost (-) ≈ 0 (Bug #2).
        const rowBuyerShipping   = ci.buyerShipping  >= 0 ? n(row[ci.buyerShipping])  : 0
        const rowActualShipping  = ci.actualShipping  >= 0 ? n(row[ci.actualShipping])  : 0
        orderRows.push({
            orderNo:       ci.orderNo >= 0 ? String(row[ci.orderNo] ?? '').trim() : '',
            status:        status ? String(status) : 'Selesai',
            grossGmv:      price,
            sellerDiscount: rowDiscount,
            feeTotal:      rowFeeTotal,
            feeBreakdown:  rowFeeBreakdown,
            netShipping:   rowBuyerShipping - rowActualShipping,
            settlement:    ci.settlement >= 0 ? ns(row[ci.settlement]) : 0,
            excluded:      false,
        })
        matchedOrders++
    }

    return { totals, matchedOrders, excludedOrders, productMap, orderRows, anomalies }
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function parseShopeeReports(incomeFile, orderFile) {
    const readFile = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = reject
        reader.onload = (e) => {
            try {
                const wb  = XLSX.read(e.target.result, { type: 'binary' })
                const ws  = wb.Sheets[wb.SheetNames[0]]
                resolve(XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }))
            } catch (err) { reject(err) }
        }
        reader.readAsBinaryString(file)
    })

    return Promise.all([
        readFile(incomeFile),
        orderFile ? readFile(orderFile) : Promise.resolve(null),
    ]).then(([incomeRows, orderFileRows]) => {
        // Parse the Order report first so the Income parser can flag anomalies
        // (Income rows with no matching order) and exclude them from P&L totals.
        const order = orderFileRows ? parseOrderReport(orderFileRows) : { productMap: new Map(), platformVoucher: 0, orderRows: [] }
        const validOrderNos = orderFileRows
            ? new Set(order.orderRows.map(r => r.order_no?.trim()).filter(Boolean))
            : null
        let incomeResult = parseIncomeReport(incomeRows, validOrderNos)
        // If NOTHING matched, the two files are different exports (order IDs differ),
        // not anomalies - reparse with full totals and drop the anomaly flags so the
        // existing "order numbers don't match" fallback still shows gross.
        if (validOrderNos && incomeResult.matchedOrders === 0 && order.orderRows.length > 0) {
            incomeResult = parseIncomeReport(incomeRows, null)
            incomeResult.anomalies = []
        }
        const { totals, matchedOrders, excludedOrders, orderRows, anomalies } = incomeResult

        // Build income lookup by order_no for enriching order report rows
        const incomeByOrderNo = new Map()
        for (const r of orderRows) {
            if (r.orderNo) incomeByOrderNo.set(r.orderNo.trim(), r)
        }

        // Enrich order report rows with financial data from income report
        const enrichedOrderReportRows = order.orderRows.map(r => {
            const inc = incomeByOrderNo.get(r.order_no?.trim()) ?? null
            const base = {
                order_no:        r.order_no,
                product_name:    r.product_name,
                qty:             r.qty,
                qty_returned:    r.qty_returned ?? 0,   // Bug 2
                returned_qty_known: r.returned_qty_known ?? false,  // Improvement B
                price:           r.price,
                gmv:             r.gmv,
                status:          r.status,
                excluded:        r.excluded,
                refunded:        r.refunded ?? false,    // refund order ("Pengembalian Dana")
                income_matched:  inc !== null,          // flag: was income report row found?
                seller_discount: inc !== null ? (inc.sellerDiscount ?? 0) : null,
                fee_total:       inc !== null ? (inc.feeTotal       ?? 0) : null,
                // Per-order channel-fee breakdown for the expandable detail row.
                fee_breakdown:   inc !== null ? (inc.feeBreakdown   ?? null) : null,
                net_shipping:    inc !== null ? (inc.netShipping    ?? 0) : null,
                settlement:      inc !== null ? (inc.settlement     ?? 0) : null,
            }
            return { ...base, classification: classifyOrderRow(base) }  // Improvement A
        })
        const anyIncomeMatch = enrichedOrderReportRows.some(r => r.income_matched)

        // ── Improvement A: classification summary ──────────────────────────────────
        // `anomalies` already detected by parseIncomeReport (Income rows with no order).
        // Distinct-order counts per classification (rows are per product line).
        const distinctOrders = (cls) => new Set(
            enrichedOrderReportRows.filter(r => r.classification === cls).map(r => r.order_no?.trim()).filter(Boolean)
        ).size
        const sumGmv = (cls) => enrichedOrderReportRows
            .filter(r => r.classification === cls)
            .reduce((s, r) => s + (r.gmv || 0), 0)

        const classificationSummary = {
            settled_count:       distinctOrders('SETTLED'),
            pending_count:       distinctOrders('PENDING'),
            cross_period_count:  distinctOrders('CROSS_PERIOD'),
            anomaly_count:       anomalies.length,
            pending_gmv:         Math.round(sumGmv('PENDING')),
            cross_period_gmv:    Math.round(sumGmv('CROSS_PERIOD')),
            anomaly_settlement:  Math.round(anomalies.reduce((s, a) => s + (a.settlement || 0), 0)),
        }

        // Improvement A: P&L is SETTLED-only. Rebuild the per-product map from order
        // lines that matched an Income row, so PENDING/CROSS_PERIOD orders are excluded
        // from revenue/COGS. For fully-matched data this is identical to order.productMap.
        // When NO order line matched (order IDs differ between files) we fall back to the
        // full order.productMap to preserve the existing "show gross, fees as -" behavior.
        const settledMap = new Map()
        for (const r of enrichedOrderReportRows) {
            if (r.classification !== 'SETTLED') continue
            if (!settledMap.has(r.product_name)) {
                settledMap.set(r.product_name, { units_sold: 0, price_sum: 0, gross_gmv: 0, refund_gmv: 0 })
            }
            const p = settledMap.get(r.product_name)
            p.gross_gmv += r.gmv || 0
            if (r.refunded) p.refund_gmv += r.gmv || 0
            else { p.units_sold += r.qty || 0; p.price_sum += r.price || 0 }
        }
        const effectiveProductMap = anyIncomeMatch ? settledMap : order.productMap

        // Build sales from order report (product names) + income report (values)
        let sales
        if (effectiveProductMap.size > 0) {
            sales = Array.from(effectiveProductMap.entries()).map(([name, p]) => ({
                sku:                  name,
                units_sold:           Math.round(p.units_sold),          // Selesai only (Bug #1)
                actual_selling_price: p.units_sold > 0 ? Math.round(p.price_sum / p.units_sold) : 0,
                gross_gmv:            Math.round(p.gross_gmv),            // all status (Selesai + refund)
                refund_gmv:           Math.round(p.refund_gmv ?? 0),      // refunded value (Improv. B)
                settlement:           0, // settlement is aggregate, not per-product from order report
            }))
            // distribute aggregate settlement proportionally by GMV
            const totalGmv = sales.reduce((s, p) => s + p.gross_gmv, 0)
            if (totalGmv > 0) {
                sales.forEach(p => {
                    p.settlement = Math.round(totals.settlement * p.gross_gmv / totalGmv)
                })
            }
        } else {
            // No order report - use income aggregate
            sales = [{
                sku:                  'Shopee Sales',
                units_sold:           matchedOrders,
                actual_selling_price: matchedOrders > 0 ? Math.round(totals.grossGmv / matchedOrders) : 0,
                gross_gmv:            Math.round(totals.grossGmv),
                refund_gmv:           0,
                settlement:           Math.round(totals.settlement),
            }]
        }

        // Seller Discount = sum of seller-funded discount columns only (excludes Shopee-funded
        // discounts that may be embedded in "Total Diskon Produk").
        const effectiveVouch = totals.voucher
        const effectiveTotal = totals.voucher + totals.sellerDiscount + totals.voucherCofund + totals.coin + totals.coinCofund

        const feeTotal = totals.commissionFee + totals.serviceFee + totals.processingFee +
            totals.transactionFee + totals.programFee + totals.campaignFee + totals.affiliateFee

        // Gross GMV = all non-cancelled orders (Selesai + refund). Net GMV = Selesai only.
        const grossGmv  = sales.reduce((s, p) => s + p.gross_gmv, 0)
        const refundGmv = sales.reduce((s, p) => s + (p.refund_gmv ?? 0), 0)
        const netGmv    = grossGmv - refundGmv
        const refundRate = grossGmv > 0 ? refundGmv / grossGmv : 0

        // Net shipping = buyer-paid shipping (+) + courier cost (-) ≈ 0 (Bug #2).
        const netShipping   = totals.buyerShipping - totals.actualShipping
        const settlementCalc = grossGmv - effectiveTotal - feeTotal + netShipping - totals.refundAmount

        return {
            channel:          'Shopee',
            matched_orders:   matchedOrders,
            excluded_orders:  excludedOrders,
            sales,
            gross_gmv_all:    Math.round(grossGmv),     // all orders (Selesai + refund)
            net_gmv:          Math.round(netGmv),        // Selesai only
            refund_gmv:       Math.round(refundGmv),     // refunded value
            refund_rate:      refundRate,                // refund_gmv / gross_gmv_all
            platform_discount: Math.round(order.platformVoucher),
            discounts: [
                { tKey: 'shopeeImportDiscountVoucher',       value: Math.round(effectiveVouch) },
                { tKey: 'shopeeImportDiscountSeller',        value: Math.round(totals.sellerDiscount) },
                { tKey: 'shopeeImportDiscountVoucherCofund', value: Math.round(totals.voucherCofund) },
                { tKey: 'shopeeImportDiscountCoin',          value: Math.round(totals.coin) },
                { tKey: 'shopeeImportDiscountCoinCofund',    value: Math.round(totals.coinCofund) },
            ],
            discount_total:  Math.round(effectiveTotal),
            refund_amount:   Math.round(totals.refundAmount),
            channel_fees: [
                { tKey: 'shopeeImportFeeCommission',  field: 'commission_fee',       value: Math.round(totals.commissionFee) },
                { tKey: 'shopeeImportFeeService',     field: 'service_fee',          value: Math.round(totals.serviceFee) },
                { tKey: 'shopeeImportFeeProcessing',  field: 'processing_fee',       value: Math.round(totals.processingFee) },
                { tKey: 'shopeeImportFeeTransaction', field: 'transaction_fee',      value: Math.round(totals.transactionFee) },
                { tKey: 'shopeeImportFeeProgram',     field: 'program_fee',          value: Math.round(totals.programFee) },
                { tKey: 'shopeeImportFeeCampaign',    field: 'campaign_fee',         value: Math.round(totals.campaignFee) },
                { tKey: 'shopeeImportFeeAffiliate',   field: 'affiliate_commission', value: Math.round(totals.affiliateFee) },
            ],
            channel_fees_total:   Math.round(feeTotal),
            // ── July 2026 improvements - structural, Rp 0 until Aug 2026 ──────────────
            // Ads comes from a separate Shopee Ads report (not the income/order files);
            // PPh Final 0,5% (PMK 37/2025) is conditional on taxpayer type + YTD omzet;
            // seller-funded affiliate needs a dedicated column. All 0 for July's data.
            ads_spend:            0,
            pph_final:            0,
            affiliate_seller:     0,
            buyer_shipping_paid:  Math.round(totals.buyerShipping),
            shipping_subsidy:     Math.round(totals.shippingSubsidy),
            actual_shipping_cost: Math.round(totals.actualShipping),
            net_shipping:         Math.round(netShipping),
            settlement_report:    Math.round(totals.settlement),
            settlement_calc:      Math.round(settlementCalc),
            delta:                Math.round(totals.settlement - settlementCalc),
            order_rows:              orderRows,                // income report rows (matched only)
            order_report_rows:       enrichedOrderReportRows, // order report rows enriched with financial data
            order_numbers_matched:   anyIncomeMatch,           // false = order IDs don't match between files
            classification:          classificationSummary,    // Improvement A: counts + info GMV
            anomalies,                                          // Improvement A: income rows with no order match
        }
    })
}

// Keep old single-file export for backwards compatibility
export function parseShopeeIncomeReport(file) {
    return parseShopeeReports(file, null)
}
