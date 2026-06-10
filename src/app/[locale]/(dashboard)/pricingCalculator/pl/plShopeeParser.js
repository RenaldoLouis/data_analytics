import * as XLSX from 'xlsx'

// ─── Column patterns (lowercase fragments) ────────────────────────────────────
// Covers Shopee Income Report (Laporan Keuangan) and Order Report (Laporan Pesanan).
const COL_INCOME = {
    orderNo:        ['no. pesanan', 'order id', 'no pesanan'],
    originalPrice:  ['harga asli produk', 'harga awal produk', 'harga awal', 'harga asli', 'original price'],
    sellingPrice:   ['harga setelah diskon', 'discounted price', 'selling price', 'harga jual'],
    orderStatus:    ['status pesanan', 'order status'],
    // Seller-funded discounts
    voucher:        ['voucher disponsor oleh penjual', 'voucher dispons', 'diskon dari voucher penjual', 'seller voucher', 'voucher penjual'],
    voucherCofund:  ['voucher co-fund disponsor', 'voucher co-fund', 'diskon dari voucher shopee', 'shopee voucher'],
    coin:           ['cashback koin dispons', 'koin shopee yang digunakan', 'koin yang digunakan'],
    coinCofund:     ['cashback koin co-fund', 'koin co-fund'],
    totalDiscount:  ['total diskon produk', 'total diskon', 'total discount'],
    refundAmount:   ['jumlah pengembalian dana', 'pengembalian dana ke pembeli', 'refund amount'],
    // Channel fees — Shopee income report naming:
    //   "Biaya Administrasi"           = main commission/admin fee (% of order)
    //   "Biaya Layanan"                = platform service fee
    //   "Biaya Proses Pesanan"         = order processing fee (fixed per order)
    //   "Biaya Program Hemat Biaya Kirim" = shipping savings program fee
    //   "Biaya Kampanye"               = campaign fee
    //   "Biaya Komisi AMS"             = AMS affiliate commission (usually 0)
    // NOTE: commissionFee must NOT match "Biaya Komisi AMS" — that column appears
    //       before "Biaya Administrasi" in the xlsx so we use the most specific pattern.
    commissionFee:  ['biaya administrasi', 'commission fee', 'admin fee'],
    serviceFee:     ['biaya layanan', 'service fee'],
    processingFee:  ['biaya proses pesanan', 'biaya administrasi pembayaran', 'payment admin', 'processing fee'],
    transactionFee: ['biaya transaksi', 'transaction fee'],
    programFee:     ['biaya program hemat', 'program hemat biaya kirim'],
    campaignFee:    ['biaya kampanye', 'campaign fee'],
    affiliateFee:   ['biaya komisi ams', 'komisi afiliasi', 'affiliate commission', 'biaya afiliasi'],
    // Shipping
    shippingSubsidy: ['gratis ongkir dari shopee', 'gratis ongkir', 'subsidi ongkir', 'shipping subsidy'],
    actualShipping:  ['ongkir yang diteruskan', 'diteruskan oleh shopee', 'biaya ongkir yang ditanggung penjual', 'ongkos kirim aktual', 'actual shipping'],
    buyerShipping:   ['ongkir dibayar pembeli', 'ongkos kirim dibayar pembeli', 'buyer shipping'],
    // Settlement — "Total Penghasilan" is the net payout to the seller
    settlement:      ['total penghasilan', 'total pemasukan', 'jumlah pemasukan', 'settlement amount', 'total diterima'],
}

const COL_ORDER = {
    orderNo:        ['no. pesanan', 'order id', 'no pesanan'],
    productName:    ['nama produk', 'product name', 'nama barang'],
    quantity:       ['jumlah produk di pesan', 'jumlah produk dipesan', 'jumlah produk dibeli', 'jumlah produk', 'kuantitas produk', 'quantity', 'qty', 'jumlah'],
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

function n(v) {
    return Math.abs(parseFloat(String(v ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0)
}

function isExcluded(status) {
    const s = String(status ?? '').toLowerCase()
    return s.includes('batal') || s.includes('cancel') || s.includes('kembali') ||
        s.includes('refund') || s.includes('retur')
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

    for (const row of dataRows) {
        const status  = ci.orderStatus  >= 0 ? row[ci.orderStatus]  : null
        const orderNo = ci.orderNo      >= 0 ? String(row[ci.orderNo] ?? '').trim() : ''
        const name    = ci.productName  >= 0 ? String(row[ci.productName] ?? '').trim() : ''

        if (!name || name === 'null') continue

        const qty   = ci.quantity >= 0 ? (n(row[ci.quantity]) || 1) : 1
        const price = ci.originalPrice >= 0 ? n(row[ci.originalPrice])
            : ci.sellingPrice  >= 0 ? n(row[ci.sellingPrice]) : 0
        const excluded = status != null && isExcluded(status)

        // Collect every order line (all statuses)
        orderRows.push({
            order_no:     orderNo,
            product_name: name,
            qty,
            price,
            gmv:          qty * price,
            status:       status ? String(status) : '',
            excluded,
        })

        if (excluded) continue   // excluded orders don't count toward productMap

        if (!productMap.has(name)) {
            productMap.set(name, { units_sold: 0, price_sum: 0, gross_gmv: 0 })
        }
        const p = productMap.get(name)
        p.units_sold += qty
        p.price_sum  += price
        p.gross_gmv  += qty * price

        if (ci.platformVoucher >= 0) platformVoucher += n(row[ci.platformVoucher])
    }

    return { productMap, platformVoucher, orderRows }
}

// ─── Parse income report ─────────────────────────────────────────────────────
function parseIncomeReport(rawRows) {
    const headerIdx = findHeaderRow(rawRows, ['no. pesanan', 'harga asli produk', 'waktu pesanan dibuat'])
    const headers   = rawRows[headerIdx] ?? []
    const ci = Object.fromEntries(
        Object.keys(COL_INCOME).map(k => [k, matchCol(headers, COL_INCOME[k])])
    )
    const dataRows = rawRows.slice(headerIdx + 1).filter(row =>
        row && row.some(c => c != null && c !== '')
    )

    let matchedOrders = 0, excludedOrders = 0
    const totals = {
        grossGmv: 0, voucher: 0, voucherCofund: 0, totalDiscount: 0,
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
        if (status != null && isExcluded(status)) {
            excludedOrders++
            orderRows.push({
                orderNo:       ci.orderNo >= 0 ? String(row[ci.orderNo] ?? '').trim() : '',
                status:        String(status),
                grossGmv:      0, sellerDiscount: 0, feeTotal: 0, netShipping: 0, settlement: 0,
                excluded:      true,
            })
            continue
        }

        // Use original price (harga asli) for gross GMV — seller receives full original
        // price and is reimbursed for platform vouchers; only seller-funded vouchers reduce income.
        const price = ci.originalPrice >= 0 ? n(row[ci.originalPrice])
            : ci.sellingPrice  >= 0 ? n(row[ci.sellingPrice]) : 0

        totals.grossGmv += price
        if (ci.settlement >= 0) totals.settlement += n(row[ci.settlement])

        for (const key of ['voucher','voucherCofund','totalDiscount','coin','coinCofund',
                           'refundAmount','commissionFee','serviceFee','processingFee',
                           'transactionFee','programFee','campaignFee','affiliateFee',
                           'shippingSubsidy','actualShipping','buyerShipping']) {
            if (ci[key] >= 0) totals[key] += n(row[ci[key]])
        }

        // Seller Discount per order = sum of seller-funded discount columns only.
        const rowDiscount = ['voucher','voucherCofund','coin','coinCofund']
            .reduce((s, k) => s + (ci[k] >= 0 ? n(row[ci[k]]) : 0), 0)
        const rowFeeTotal = ['commissionFee','serviceFee','processingFee','transactionFee','programFee','campaignFee','affiliateFee']
            .reduce((s, k) => s + (ci[k] >= 0 ? n(row[ci[k]]) : 0), 0)
        const rowShippingSubsidy  = ci.shippingSubsidy >= 0 ? n(row[ci.shippingSubsidy]) : 0
        const rowActualShipping   = ci.actualShipping  >= 0 ? n(row[ci.actualShipping])  : 0
        orderRows.push({
            orderNo:       ci.orderNo >= 0 ? String(row[ci.orderNo] ?? '').trim() : '',
            status:        status ? String(status) : 'Selesai',
            grossGmv:      price,
            sellerDiscount: rowDiscount,
            feeTotal:      rowFeeTotal,
            netShipping:   rowShippingSubsidy - rowActualShipping,
            settlement:    ci.settlement >= 0 ? n(row[ci.settlement]) : 0,
            excluded:      false,
        })
        matchedOrders++
    }

    return { totals, matchedOrders, excludedOrders, productMap, orderRows }
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
        const { totals, matchedOrders, excludedOrders, orderRows } = parseIncomeReport(incomeRows)
        const order = orderFileRows ? parseOrderReport(orderFileRows) : { productMap: new Map(), platformVoucher: 0, orderRows: [] }

        // Build income lookup by order_no for enriching order report rows
        const incomeByOrderNo = new Map()
        for (const r of orderRows) {
            if (r.orderNo) incomeByOrderNo.set(r.orderNo.trim(), r)
        }

        // Enrich order report rows with financial data from income report
        const enrichedOrderReportRows = order.orderRows.map(r => {
            const inc = incomeByOrderNo.get(r.order_no?.trim()) ?? null
            return {
                order_no:        r.order_no,
                product_name:    r.product_name,
                qty:             r.qty,
                price:           r.price,
                gmv:             r.gmv,
                status:          r.status,
                excluded:        r.excluded,
                income_matched:  inc !== null,          // flag: was income report row found?
                seller_discount: inc !== null ? (inc.sellerDiscount ?? 0) : null,
                fee_total:       inc !== null ? (inc.feeTotal       ?? 0) : null,
                net_shipping:    inc !== null ? (inc.netShipping    ?? 0) : null,
                settlement:      inc !== null ? (inc.settlement     ?? 0) : null,
            }
        })
        const anyIncomeMatch = enrichedOrderReportRows.some(r => r.income_matched)

        // Build sales from order report (product names) + income report (values)
        let sales
        if (order.productMap.size > 0) {
            sales = Array.from(order.productMap.entries()).map(([name, p]) => ({
                sku:                  name,
                units_sold:           Math.round(p.units_sold),
                actual_selling_price: p.units_sold > 0 ? Math.round(p.price_sum / p.units_sold) : 0,
                gross_gmv:            Math.round(p.gross_gmv),
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
            // No order report — use income aggregate
            sales = [{
                sku:                  'Shopee Sales',
                units_sold:           matchedOrders,
                actual_selling_price: matchedOrders > 0 ? Math.round(totals.grossGmv / matchedOrders) : 0,
                gross_gmv:            Math.round(totals.grossGmv),
                settlement:           Math.round(totals.settlement),
            }]
        }

        // Seller Discount = sum of seller-funded discount columns only (excludes Shopee-funded
        // discounts that may be embedded in "Total Diskon Produk").
        const effectiveVouch = totals.voucher
        const effectiveTotal = totals.voucher + totals.voucherCofund + totals.coin + totals.coinCofund

        const feeTotal = totals.commissionFee + totals.serviceFee + totals.processingFee +
            totals.transactionFee + totals.programFee + totals.campaignFee + totals.affiliateFee

        const grossGmv = sales.reduce((s, p) => s + p.gross_gmv, 0)

        // settlement_calc = GMV − seller discounts − channel fees + net shipping − refunds
        const netShipping   = totals.shippingSubsidy - totals.actualShipping
        const settlementCalc = grossGmv - effectiveTotal - feeTotal + netShipping - totals.refundAmount

        return {
            channel:          'Shopee',
            matched_orders:   matchedOrders,
            excluded_orders:  excludedOrders,
            sales,
            platform_discount: Math.round(order.platformVoucher),
            discounts: [
                { tKey: 'shopeeImportDiscountVoucher',       value: Math.round(effectiveVouch) },
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
        }
    })
}

// Keep old single-file export for backwards compatibility
export function parseShopeeIncomeReport(file) {
    return parseShopeeReports(file, null)
}
