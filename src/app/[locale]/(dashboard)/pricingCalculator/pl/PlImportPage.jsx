'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H3 } from "@/components/ui/typography"
import { IconArrowLeft, IconHistory } from "@tabler/icons-react"
import { fmt } from "./plLib"

// ─── Sample data (replace with API data) ─────────────────────────────────────
const SAMPLE_ORDERS = [
    { no_pesanan: "2604197JPRCHRJ", status: "MATCHED", produk: "Album foto mini", qty: 1, harga_asli: 7000, diskon_penjual: 0, channel_fees: 2125, net_ongkir: 0, settlement: 4875 },
    { no_pesanan: "260423JYPFXX00", status: "MATCHED", produk: "Album foto mini", qty: 1, harga_asli: 17000, diskon_penjual: 0, channel_fees: 3375, net_ongkir: 0, settlement: 13625 },
]

const SAMPLE_SKU = [
    { sku: "Album foto mini", qty: 2, gross_gmv: 24000, diskon_penjual: 0, channel_fees: 5500, net_ongkir: 0, settlement: 18500, cogs: 10000, contribution: 8500 },
]

const AUDIT_SECTIONS = [
    {
        title: "Revenue",
        rows: [
            { label: "Harga Asli (sebelum diskon)", field: "gross_revenue", value: 24000, type: "blue" },
            { label: "Voucher Ditanggung Shopee", field: "platform_discount", value: 4800, type: "info" },
            { label: "Total Pengembalian", field: "refund_amount", value: 0, type: "muted" },
        ],
    },
    {
        title: "Diskon ditanggung penjual",
        rows: [
            { label: "Voucher disponsori Penjual", field: "seller_voucher_1", value: 0, type: "muted" },
            { label: "Voucher co-fund disponsori Penjual", field: "seller_voucher_2", value: 0, type: "muted" },
            { label: "Cashback Koin disponsori Penjual", field: "seller_voucher_3", value: 0, type: "muted" },
            { label: "Cashback Koin co-fund disponsori Penjual", field: "seller_voucher_4", value: 0, type: "muted" },
        ],
        subtotal: { label: "Total Diskon Penjual", field: "seller_voucher (sum)", value: 0, type: "muted" },
    },
    {
        title: "Channel fees",
        rows: [
            { label: "Biaya Admin (Komisi)", field: "commission_fee", value: 2280, type: "red" },
            { label: "Biaya Layanan", field: "service_fee", value: 720, type: "red" },
            { label: "Biaya Proses Pesanan", field: "processing_fee", value: 2500, type: "red" },
            { label: "Biaya Transaksi", field: "transaction_fee", value: 0, type: "muted" },
            { label: "Biaya Kampanye", field: "campaign_fee", value: 0, type: "muted" },
            { label: "Komisi Afiliasi", field: "affiliate_commission", value: 0, type: "muted" },
        ],
        subtotal: { label: "Total Channel Fees", field: "channel_fees (sum)", value: 5500, type: "red" },
    },
    {
        title: "Ongkos kirim",
        rows: [
            { label: "Ongkir Dibayar Pembeli", field: "buyer_shipping_paid", value: 0, type: "muted", note: "gratis ongkir" },
            { label: "Gratis Ongkir (Subsidi Shopee)", field: "shopee_shipping_subsidy", value: 14500, type: "blue" },
            { label: "Ongkir ke Jasa Kirim", field: "shipping_to_carrier", value: 14500, type: "red" },
            { label: "Promo Ongkir Penjual", field: "seller_shipping_promo", value: 0, type: "muted" },
        ],
        subtotal: { label: "Net Ongkir", field: "net_shipping (sum)", value: 0, type: "muted", note: "Shopee tanggung" },
    },
]

const NOT_SHOWN = [
    { label: "Voucher Ditanggung Shopee", badge: "Tier 2 - Opsional", badgeType: "tier2" },
    { label: "Nama Penerima", badge: "PII - UU PDP", badgeType: "pii" },
    { label: "No. Telepon, Alamat", badge: "PII - UU PDP", badgeType: "pii" },
    { label: "Catatan Pembeli, Username", badge: "PII - UU PDP", badgeType: "pii" },
]

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const CHANNELS = ["Shopee", "Tokopedia"]
const SKUS = ["Semua SKU", "Album foto mini", "Stiker custom"]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fullMonthRange(monthIdx, year) {
    const mm = String(monthIdx + 1).padStart(2, "0")
    const dd = String(MONTH_DAYS[monthIdx]).padStart(2, "0")
    return { from: `01/${mm}/${year}`, to: `${dd}/${mm}/${year}` }
}

function valueColor(type) {
    if (type === "blue") return "text-blue-700"
    if (type === "red") return "text-red-600"
    if (type === "green") return "text-green-700"
    if (type === "info") return "text-muted-foreground"
    return "text-muted-foreground/50"
}

// ─── Small shared components ──────────────────────────────────────────────────
function StatusPill({ type, children }) {
    const cls = {
        ok: "bg-green-50 text-green-700 border-green-200",
        ex: "bg-muted text-muted-foreground border-border",
        warn: "bg-orange-50 text-orange-700 border-orange-200",
    }[type] ?? "bg-muted text-muted-foreground border-border"
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
            {children}
        </span>
    )
}

function OrderBadge({ status }) {
    const cls = {
        MATCHED: "bg-green-50 text-green-700",
        Dibatalkan: "bg-muted text-muted-foreground",
        "Refund full": "bg-red-50 text-red-700",
    }[status] ?? "bg-muted text-muted-foreground"
    return (
        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
            {status}
        </span>
    )
}

function MetaBadge({ type, children }) {
    const cls = {
        tier2: "bg-orange-50 text-orange-700",
        pii: "bg-red-50 text-red-700",
    }[type] ?? "bg-red-50 text-red-700"
    return (
        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
            {children}
        </span>
    )
}

// ─── Audit section (reusable per revenue/fee/shipping block) ──────────────────
function AuditSection({ section }) {
    return (
        <div className="mb-2">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted px-2.5 py-1.5 rounded-t-md border border-b-0">
                {section.title}
            </div>
            <Table className="border rounded-b-md [&_tr:last-child_td]:border-b-0">
                <TableBody>
                    {section.rows.map((row) => (
                        <TableRow key={row.field}>
                            <TableCell className="text-sm text-muted-foreground w-[38%] py-1.5 px-2.5">{row.label}</TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground/50 py-1.5 px-2.5">{row.field}</TableCell>
                            <TableCell className={`text-right text-sm py-1.5 px-2.5 ${valueColor(row.type)}`}>
                                {fmt(row.value)}
                                {row.note && <span className="text-[10px] text-muted-foreground ml-1">({row.note})</span>}
                            </TableCell>
                        </TableRow>
                    ))}
                    {section.subtotal && (
                        <TableRow className="bg-muted/40">
                            <TableCell className="text-sm font-medium py-1.5 px-2.5 w-[38%]">{section.subtotal.label}</TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground/50 py-1.5 px-2.5">{section.subtotal.field}</TableCell>
                            <TableCell className={`text-right text-sm font-medium py-1.5 px-2.5 ${valueColor(section.subtotal.type)}`}>
                                {fmt(section.subtotal.value)}
                                {section.subtotal.note && <span className="text-[10px] text-muted-foreground ml-1">({section.subtotal.note})</span>}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

// ─── Tab: Preview ─────────────────────────────────────────────────────────────
function PreviewTab() {
    const kpis = [
        { label: "Gross GMV", value: fmt(24000), color: "text-blue-700", sub: "2 pesanan selesai" },
        { label: "Channel Fees", value: fmt(5500), color: "text-red-600", sub: "22,9% dari GMV" },
        { label: "Settlement", value: fmt(18500), color: "text-blue-700", sub: "77,1% dari GMV" },
        { label: "Contribution Margin", value: fmt(8500), color: "text-green-700", sub: "Setelah COGS Rp 10.000" },
    ]
    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {kpis.map((k) => (
                    <Card key={k.label} className="gap-0 py-0">
                        <CardContent className="p-3">
                            <p className="text-[11px] text-muted-foreground mb-1">{k.label}</p>
                            <p className={`text-lg font-medium tabular-nums ${k.color}`}>{k.value}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{k.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <p className="text-xs text-muted-foreground">
                Tabel berikut menampilkan semua field yang diekstrak dari laporan Shopee beserta nama field di database.
                Bandingkan nilai dengan laporan yang kamu unduh untuk memverifikasi akurasi.
            </p>

            {AUDIT_SECTIONS.map((sec) => (
                <AuditSection key={sec.title} section={sec} />
            ))}

            <div className="mb-2">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted px-2.5 py-1.5 rounded-t-md border border-b-0">
                    Tidak ditampilkan
                </div>
                <Table className="border rounded-b-md [&_tr:last-child_td]:border-b-0">
                    <TableBody>
                        {NOT_SHOWN.map((item) => (
                            <TableRow key={item.label}>
                                <TableCell className="text-sm text-muted-foreground w-[38%] py-1.5 px-2.5">{item.label}</TableCell>
                                <TableCell className="font-mono text-[11px] text-muted-foreground/50 py-1.5 px-2.5">-</TableCell>
                                <TableCell className="text-right py-1.5 px-2.5">
                                    <MetaBadge type={item.badgeType}>{item.badge}</MetaBadge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="mb-2">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted px-2.5 py-1.5 rounded-t-md border border-b-0">
                    Validasi settlement
                </div>
                <Table className="border rounded-b-md [&_tr:last-child_td]:border-b-0">
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-sm text-muted-foreground w-[38%] py-1.5 px-2.5">Total Penghasilan (Income Report)</TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground/50 py-1.5 px-2.5">settlement_amount</TableCell>
                            <TableCell className="text-right text-sm text-blue-700 py-1.5 px-2.5">{fmt(18500)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-sm text-muted-foreground w-[38%] py-1.5 px-2.5">GMV - Diskon Penjual - Channel Fees + Net Ongkir</TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground/50 py-1.5 px-2.5">calculated_settlement</TableCell>
                            <TableCell className="text-right text-sm text-blue-700 py-1.5 px-2.5">{fmt(18500)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/40">
                            <TableCell className="text-sm font-medium py-1.5 px-2.5 w-[38%]">Selisih</TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground/50 py-1.5 px-2.5">delta</TableCell>
                            <TableCell className="text-right text-sm font-medium text-green-700 py-1.5 px-2.5">✓ {fmt(0)} - cocok</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

// ─── Tab: Per Pesanan ─────────────────────────────────────────────────────────
function PerPesananTab() {
    const matched = SAMPLE_ORDERS.filter((o) => o.status === "MATCHED")
    const totalGMV = matched.reduce((s, o) => s + o.harga_asli, 0)
    const totalFees = matched.reduce((s, o) => s + o.channel_fees, 0)
    const totalSettle = matched.reduce((s, o) => s + o.settlement, 0)

    return (
        <div className="p-4 space-y-3">
            <div className="overflow-x-auto">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-[11px]">No. Pesanan</TableHead>
                            <TableHead className="text-[11px]">Status</TableHead>
                            <TableHead className="text-[11px]">Produk</TableHead>
                            <TableHead className="text-[11px] text-right">Qty</TableHead>
                            <TableHead className="text-[11px] text-right">Harga Asli</TableHead>
                            <TableHead className="text-[11px] text-right">Diskon Penjual</TableHead>
                            <TableHead className="text-[11px] text-right">Channel Fees</TableHead>
                            <TableHead className="text-[11px] text-right">Net Ongkir</TableHead>
                            <TableHead className="text-[11px] text-right">Settlement</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {SAMPLE_ORDERS.map((o) => (
                            <TableRow key={o.no_pesanan}>
                                <TableCell className="font-mono text-[11px]">{o.no_pesanan}</TableCell>
                                <TableCell><OrderBadge status={o.status} /></TableCell>
                                <TableCell className="text-sm">{o.produk}</TableCell>
                                <TableCell className="text-right text-sm">{o.qty}</TableCell>
                                <TableCell className="text-right text-sm tabular-nums">{o.harga_asli.toLocaleString("id-ID")}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">0</TableCell>
                                <TableCell className="text-right text-sm text-red-600 tabular-nums">{o.channel_fees.toLocaleString("id-ID")}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">0</TableCell>
                                <TableCell className="text-right text-sm text-blue-700 font-medium tabular-nums">{o.settlement.toLocaleString("id-ID")}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="text-xs text-muted-foreground">Total ({matched.length} MATCHED)</TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums">{totalGMV.toLocaleString("id-ID")}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">0</TableCell>
                            <TableCell className="text-right text-sm font-medium text-red-600 tabular-nums">{totalFees.toLocaleString("id-ID")}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">0</TableCell>
                            <TableCell className="text-right text-sm font-medium text-blue-700 tabular-nums">{totalSettle.toLocaleString("id-ID")}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
            <p className="text-[11px] text-muted-foreground">
                Hanya pesanan MATCHED yang masuk kalkulasi P/L. Pesanan Dibatalkan dan Refund Full dikecualikan dari footer.
            </p>
        </div>
    )
}

// ─── Tab: Per SKU ─────────────────────────────────────────────────────────────
function PerSKUTab() {
    return (
        <div className="p-4 space-y-3">
            <div className="text-[11px] text-muted-foreground bg-muted rounded-lg px-3 py-2">
                <strong>Level 2 Allocation:</strong> Untuk pesanan multi-SKU, biaya pesanan (Biaya Proses, dll.) dialokasikan
                proporsional berdasarkan revenue share masing-masing SKU dalam pesanan tersebut.
            </div>
            <div className="overflow-x-auto">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-[11px]">SKU</TableHead>
                            <TableHead className="text-[11px] text-right">Qty Terjual</TableHead>
                            <TableHead className="text-[11px] text-right">Gross GMV</TableHead>
                            <TableHead className="text-[11px] text-right">Diskon Penjual</TableHead>
                            <TableHead className="text-[11px] text-right">Channel Fees</TableHead>
                            <TableHead className="text-[11px] text-right">Net Ongkir</TableHead>
                            <TableHead className="text-[11px] text-right">Settlement</TableHead>
                            <TableHead className="text-[11px] text-right">COGS</TableHead>
                            <TableHead className="text-[11px] text-right">Contribution</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {SAMPLE_SKU.map((s) => (
                            <TableRow key={s.sku}>
                                <TableCell className="text-sm">{s.sku}</TableCell>
                                <TableCell className="text-right text-sm">{s.qty}</TableCell>
                                <TableCell className="text-right text-sm tabular-nums">{s.gross_gmv.toLocaleString("id-ID")}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">0</TableCell>
                                <TableCell className="text-right text-sm text-red-600 tabular-nums">{s.channel_fees.toLocaleString("id-ID")}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">0</TableCell>
                                <TableCell className="text-right text-sm text-blue-700 font-medium tabular-nums">{s.settlement.toLocaleString("id-ID")}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground tabular-nums">{s.cogs.toLocaleString("id-ID")}</TableCell>
                                <TableCell className="text-right text-sm text-green-700 font-medium tabular-nums">{s.contribution.toLocaleString("id-ID")}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} className="text-xs text-muted-foreground">Total</TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums">24.000</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">0</TableCell>
                            <TableCell className="text-right text-sm font-medium text-red-600 tabular-nums">5.500</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">0</TableCell>
                            <TableCell className="text-right text-sm font-medium text-blue-700 tabular-nums">18.500</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground tabular-nums">10.000</TableCell>
                            <TableCell className="text-right text-sm font-medium text-green-700 tabular-nums">8.500</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlImportPage({ onBack }) {
    const [activeCh, setActiveCh] = useState("Shopee")
    const [activeSKU, setActiveSKU] = useState("Semua SKU")
    const [year, setYear] = useState("2026")
    const [monthIdx, setMonthIdx] = useState(3)
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [isCustom, setIsCustom] = useState(false)

    useEffect(() => {
        const range = fullMonthRange(monthIdx, parseInt(year))
        setFromDate(range.from)
        setToDate(range.to)
        setIsCustom(false)
    }, [monthIdx, year])

    function handleDateChange(field, val) {
        if (field === "from") setFromDate(val)
        else setToDate(val)
        const range = fullMonthRange(monthIdx, parseInt(year))
        const newFrom = field === "from" ? val : fromDate
        const newTo = field === "to" ? val : toDate
        setIsCustom(newFrom !== range.from || newTo !== range.to)
    }

    return (
        <div className="space-y-4">

            {/* Page header */}
            <div className="flex justify-between items-center px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                        <IconArrowLeft size={16} />
                    </Button>
                    <H3 className="text-xl font-bold">Import P&L</H3>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <IconHistory size={14} />
                        Riwayat Import
                    </Button>
                    <Button size="sm">Simpan</Button>
                </div>
            </div>

            <div className="px-4 lg:px-6">
                <Separator />
            </div>

            <div className="px-4 lg:px-6">
                <div className="border rounded-lg overflow-hidden">

                    {/* Topbar: brand name + channel switcher */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b">
                        <span className="bg-muted border rounded-lg px-2.5 py-0.5 text-xs font-medium">🏢 Copi</span>
                        {CHANNELS.map((ch) => (
                            <button
                                key={ch}
                                type="button"
                                onClick={() => setActiveCh(ch)}
                                className={`px-2.5 py-1 rounded-full text-xs border cursor-pointer transition-colors ${ch === activeCh
                                        ? "bg-blue-50 border-blue-300 text-blue-700"
                                        : "border-border text-muted-foreground hover:bg-muted/50"
                                    }`}
                            >
                                {ch}
                            </button>
                        ))}
                    </div>

                    {/* Import status banner */}
                    <div className="flex items-center gap-2 flex-wrap px-4 py-2 bg-muted/30 border-b text-xs text-muted-foreground">
                        <span>Import Apr 2026</span>
                        <StatusPill type="ok">✓ 2 pesanan MATCHED</StatusPill>
                        <StatusPill type="ex">○ 0 dikecualikan</StatusPill>
                        <div className="flex-1" />
                        <span className="text-[11px] text-muted-foreground/60">Diperbarui 18 Mei 2026, 09:41</span>
                    </div>

                    {/* Period selector */}
                    <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b">
                        <span className="text-xs text-muted-foreground">Tahun</span>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-20 h-7 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {["2024", "2025", "2026"].map((y) => (
                                    <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <span className="text-xs text-muted-foreground">Bulan</span>
                        <Select value={String(monthIdx)} onValueChange={(v) => setMonthIdx(parseInt(v))}>
                            <SelectTrigger className="w-32 h-7 text-xs">
                                <SelectValue>{MONTHS[monthIdx]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={m} value={String(i)} className="text-xs">{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <span className="text-xs text-muted-foreground">Dari</span>
                        <Input
                            className="w-24 h-7 text-xs"
                            value={fromDate}
                            onChange={(e) => handleDateChange("from", e.target.value)}
                        />
                        <span className="text-muted-foreground/50 text-xs">→</span>
                        <span className="text-xs text-muted-foreground">Sampai</span>
                        <Input
                            className="w-24 h-7 text-xs"
                            value={toDate}
                            onChange={(e) => handleDateChange("to", e.target.value)}
                        />
                        <span className="text-[11px] text-muted-foreground/60">
                            {isCustom ? "Custom" : "Full bulan"}
                        </span>
                        {isCustom && (
                            <button
                                type="button"
                                onClick={() => {
                                    const range = fullMonthRange(monthIdx, parseInt(year))
                                    setFromDate(range.from)
                                    setToDate(range.to)
                                    setIsCustom(false)
                                }}
                                className="text-[11px] text-blue-600 underline cursor-pointer"
                            >
                                Reset ke full bulan
                            </button>
                        )}
                    </div>

                    {/* SKU filter */}
                    <div className="flex items-center gap-1.5 flex-wrap px-4 py-2 border-b">
                        <span className="text-xs text-muted-foreground">SKU:</span>
                        {SKUS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setActiveSKU(s)}
                                className={`px-2.5 py-1 rounded-full text-xs border cursor-pointer transition-colors ${s === activeSKU
                                        ? "bg-blue-50 border-blue-300 text-blue-700"
                                        : "bg-muted border-border text-muted-foreground hover:bg-muted/70"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Upload zones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 border-b">
                        {[
                            { label: "✓ Income Report (Sudah Dilepas) *", name: "Income Sudah Dilepas - example.pdf", size: "36.7 KB · 2 transaksi" },
                            { label: "✓ Laporan Order *", name: "Laporan Order - example.pdf", size: "36.9 KB · 2 pesanan" },
                        ].map((zone) => (
                            <div key={zone.label} className="border border-green-200 rounded-lg p-3 text-center bg-green-50">
                                <p className="text-[11px] font-medium text-muted-foreground mb-1">{zone.label}</p>
                                <p className="text-xs font-medium text-green-700">{zone.name}</p>
                                <p className="text-[11px] text-muted-foreground">{zone.size}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs: Preview / Per Pesanan / Per SKU */}
                    <Tabs defaultValue="preview">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-auto py-0 gap-0">
                            {[
                                { value: "preview", label: "Preview" },
                                { value: "perpesanan", label: "Per Pesanan" },
                                { value: "persku", label: "Per SKU" },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm font-normal data-[state=active]:font-medium data-[state=active]:text-foreground text-muted-foreground"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <TabsContent value="preview" className="mt-0"><PreviewTab /></TabsContent>
                        <TabsContent value="perpesanan" className="mt-0"><PerPesananTab /></TabsContent>
                        <TabsContent value="persku" className="mt-0"><PerSKUTab /></TabsContent>
                    </Tabs>

                    {/* Save bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-t">
                        <span className="text-xs text-muted-foreground flex-1">
                            Data akan disimpan untuk periode {MONTHS[monthIdx]} {year}
                        </span>
                        <Button variant="outline" size="sm" onClick={onBack}>Batal</Button>
                        <Button size="sm">Simpan</Button>
                    </div>

                </div>
            </div>
        </div>
    )
}
