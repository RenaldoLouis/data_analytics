'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import LoadingScreen from "@/components/ui/loadingScreen"
import { Separator } from "@/components/ui/separator"
import { H3 } from "@/components/ui/typography"
import {
    IconBulb,
    IconChartDonut,
    IconChevronDown,
    IconChevronUp,
    IconCurrencyDollar,
    IconDeviceFloppy,
    IconPackage,
    IconPlus,
    IconRefresh,
    IconShoppingCart,
    IconTool,
    IconTrash,
    IconUsers,
} from "@tabler/icons-react"
import { useMemo, useState } from "react"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID")
const parseNum = (s) => parseFloat(String(s).replace(/[^\d.]/g, "")) || 0

// ─── Donut Chart (pure SVG) ───────────────────────────────────────────────────
function DonutChart({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0)
    if (total === 0)
        return (
            <div className="flex items-center justify-center h-36 text-muted-foreground text-sm">
                Belum ada data
            </div>
        )

    const size = 140, cx = size / 2, cy = size / 2, R = 54, ri = 32
    let cumAngle = -Math.PI / 2

    const slices = data
        .filter((d) => d.value > 0)
        .map((d) => {
            const angle = (d.value / total) * 2 * Math.PI
            const x1 = cx + R * Math.cos(cumAngle)
            const y1 = cy + R * Math.sin(cumAngle)
            cumAngle += angle
            const x2 = cx + R * Math.cos(cumAngle)
            const y2 = cy + R * Math.sin(cumAngle)
            const ix1 = cx + ri * Math.cos(cumAngle - angle)
            const iy1 = cy + ri * Math.sin(cumAngle - angle)
            const ix2 = cx + ri * Math.cos(cumAngle)
            const iy2 = cy + ri * Math.sin(cumAngle)
            const large = angle > Math.PI ? 1 : 0
            return {
                ...d,
                path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ri} ${ri} 0 ${large} 0 ${ix1} ${iy1} Z`,
            }
        })

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((s, i) => (
                <path key={i} d={s.path} fill={s.color} />
            ))}
        </svg>
    )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, children, collapsible = false, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <Card className="gap-0 py-0 overflow-hidden">
            <CardHeader
                className={`flex flex-row items-start gap-3 px-5 pt-5 ${collapsible ? "cursor-pointer select-none" : ""} ${subtitle ? "pb-1" : "pb-5"}`}
                onClick={collapsible ? () => setOpen((o) => !o) : undefined}
            >
                <span className="mt-0.5 text-primary flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground text-sm">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                {collapsible && (
                    <span className="text-muted-foreground mt-0.5">
                        {open ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </span>
                )}
            </CardHeader>
            {(!collapsible || open) && (
                <CardContent className="px-5 pb-5">{children}</CardContent>
            )}
        </Card>
    )
}

// ─── Field Input with optional prefix/suffix ──────────────────────────────────
function FieldInput({ label, value, onChange, prefix, suffix, placeholder = "0" }) {
    return (
        <div className="grid gap-1.5">
            {label && <Label>{label}</Label>}
            <div className="flex items-center border border-input rounded-md overflow-hidden bg-transparent shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all">
                {prefix && (
                    <span className="px-3 text-xs text-muted-foreground border-r border-input bg-muted/50 self-stretch flex items-center whitespace-nowrap">
                        {prefix}
                    </span>
                )}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-3 h-9 text-sm text-foreground outline-none bg-transparent min-w-0"
                />
                {suffix && (
                    <span className="px-3 text-xs text-muted-foreground border-l border-input bg-muted/50 self-stretch flex items-center whitespace-nowrap">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CalculatorHPP({ calculatorId }) {
    const [namaProduk, setNamaProduk] = useState("")
    const [jumlahProduk, setJumlahProduk] = useState("1")

    const [bahans, setBahans] = useState([
        { id: 1, nama: "", jumlah: 0, satuan: "kg", harga: 0 },
    ])
    const SATUAN = ["kg", "gram", "liter", "ml", "butir", "buah", "pcs", "lusin", "meter", "lembar"]

    const [upahMode, setUpahMode] = useState("harian")
    const [upahPerHari, setUpahPerHari] = useState("0")
    const [jumlahPekerja, setJumlahPekerja] = useState("1")
    const [jumlahHari, setJumlahHari] = useState("1")
    const [upahBorongan, setUpahBorongan] = useState("0")

    const [listrik, setListrik] = useState("0")
    const [gas, setGas] = useState("0")
    const [sewa, setSewa] = useState("0")
    const [penyusutan, setPenyusutan] = useState("0")
    const [biayaLainnya, setBiayaLainnya] = useState([])

    const [kemasan, setKemasan] = useState("0")
    const [ongkir, setOngkir] = useState("0")

    const [hargaJualOpen, setHargaJualOpen] = useState(false)
    const [marginPct, setMarginPct] = useState("20")
    const [isLoading, setIsLoading] = useState(false)

    // ─── Calculations ─────────────────────────────────────────────────────────
    const totalBahan = useMemo(
        () => bahans.reduce((s, b) => s + b.jumlah * b.harga, 0),
        [bahans]
    )
    const totalTenaga = useMemo(() => {
        if (upahMode === "harian")
            return parseNum(upahPerHari) * parseNum(jumlahPekerja) * parseNum(jumlahHari)
        return parseNum(upahBorongan)
    }, [upahMode, upahPerHari, jumlahPekerja, jumlahHari, upahBorongan])

    const totalOverhead = useMemo(
        () => parseNum(listrik) + parseNum(gas) + parseNum(sewa) + parseNum(penyusutan) +
            biayaLainnya.reduce((s, b) => s + parseNum(b.nilai), 0),
        [listrik, gas, sewa, penyusutan, biayaLainnya]
    )
    const totalTambahan = useMemo(
        () => parseNum(kemasan) + parseNum(ongkir),
        [kemasan, ongkir]
    )

    const totalProduksi = totalBahan + totalTenaga + totalOverhead + totalTambahan
    const qty = parseNum(jumlahProduk) || 1
    const hpp = totalProduksi / qty
    const margin = parseNum(marginPct) / 100
    const hargaJual = margin >= 1 ? hpp : hpp / (1 - margin)
    const profit = hargaJual - hpp

    const chartData = [
        { label: "Bahan Baku", value: totalBahan, color: "var(--chart-1)" },
        { label: "Tenaga Kerja", value: totalTenaga, color: "var(--chart-2)" },
        { label: "Overhead", value: totalOverhead, color: "var(--chart-3)" },
        { label: "Biaya Tambahan", value: totalTambahan, color: "var(--chart-4)" },
    ]

    const addBahan = () =>
        setBahans((p) => [...p, { id: Date.now(), nama: "", jumlah: 0, satuan: "kg", harga: 0 }])
    const removeBahan = (id) => setBahans((p) => p.filter((b) => b.id !== id))
    const updateBahan = (id, field, val) =>
        setBahans((p) => p.map((b) => (b.id === id ? { ...b, [field]: val } : b)))

    const resetAll = () => {
        setNamaProduk(""); setJumlahProduk("1")
        setBahans([{ id: 1, nama: "", jumlah: 0, satuan: "kg", harga: 0 }])
        setUpahMode("harian"); setUpahPerHari("0"); setJumlahPekerja("1")
        setJumlahHari("1"); setUpahBorongan("0")
        setListrik("0"); setGas("0"); setSewa("0"); setPenyusutan("0")
        setBiayaLainnya([]); setKemasan("0"); setOngkir("0")
        setMarginPct("20"); setHargaJualOpen(false)
    }

    return (
        <>
            {isLoading && <LoadingScreen />}

            <div className="flex justify-between items-center px-4 lg:px-6">
                <H3 className="text-xl font-bold">HPP Calculator</H3>
            </div>
            <div className="px-4 lg:px-6">
                <Separator />
            </div>

            <div className="px-4 lg:px-6 py-4">
                <div className="flex flex-col lg:flex-row gap-5 items-start">

                    {/* ── Left Column ── */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">

                        {/* Informasi Produk */}
                        <SectionCard
                            icon={<IconPackage size={18} className="text-[#2168AB]" />}
                            title="Informasi Produk"
                            subtitle="Isi nama produk dan berapa banyak yang kamu produksi"
                        >
                            <div className="mt-3 flex flex-col gap-3">
                                <div className="grid gap-1.5">
                                    <Label>Nama Produk</Label>
                                    <Input
                                        type="text"
                                        value={namaProduk}
                                        onChange={(e) => setNamaProduk(e.target.value)}
                                        placeholder="Contoh: Kue Brownies Coklat"
                                    />
                                </div>
                                <FieldInput
                                    label="Jumlah Produk Jadi"
                                    value={jumlahProduk}
                                    onChange={setJumlahProduk}
                                    suffix="unit"
                                    placeholder="50"
                                />
                            </div>
                        </SectionCard>

                        {/* Biaya Bahan Baku */}
                        <SectionCard
                            icon={<IconShoppingCart size={18} className="text-[#2168AB]" />}
                            title="Biaya Bahan Baku"
                            subtitle="Daftar semua bahan yang kamu pakai untuk produksi"
                        >
                            <div className="mt-3">
                                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2 mb-2">
                                    {["Nama Bahan", "Jumlah", "Satuan", "Harga/satuan", ""].map((h) => (
                                        <span key={h} className="text-xs text-muted-foreground">{h}</span>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {bahans.map((b) => {
                                        const subtotal = b.jumlah * b.harga
                                        return (
                                            <div
                                                key={b.id}
                                                className="flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none items-start sm:items-center"
                                            >
                                                <Input
                                                    type="text"
                                                    value={b.nama}
                                                    onChange={(e) => updateBahan(b.id, "nama", e.target.value)}
                                                    placeholder="Nama bahan"
                                                />
                                                <Input
                                                    type="number"
                                                    value={b.jumlah || ""}
                                                    onChange={(e) => updateBahan(b.id, "jumlah", parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                />
                                                <select
                                                    value={b.satuan}
                                                    onChange={(e) => updateBahan(b.id, "satuan", e.target.value)}
                                                    className="w-full border border-input rounded-md px-3 h-9 text-sm bg-background text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring transition-all"
                                                >
                                                    {SATUAN.map((s) => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <div className="w-full">
                                                    <div className="flex items-center border border-input rounded-md overflow-hidden bg-transparent shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all">
                                                        <span className="px-2 text-xs text-muted-foreground border-r border-input bg-muted/50 h-9 flex items-center">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={b.harga || ""}
                                                            onChange={(e) => updateBahan(b.id, "harga", parseFloat(e.target.value) || 0)}
                                                            placeholder="0"
                                                            className="flex-1 px-3 h-9 text-sm text-foreground outline-none bg-transparent min-w-0"
                                                        />
                                                    </div>
                                                    {subtotal > 0 && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 text-right">{fmt(subtotal)}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeBahan(b.id)}
                                                    disabled={bahans.length === 1}
                                                    className="self-center size-8"
                                                >
                                                    <IconTrash size={16} />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>

                                <Button variant="ghost" size="sm" onClick={addBahan} className="mt-3 px-0 justify-start">
                                    <IconPlus size={15} /> Tambah Bahan
                                </Button>

                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium text-card-foreground">Total Bahan Baku</span>
                                    <span className="text-sm font-semibold text-primary">{fmt(totalBahan)}</span>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Biaya Tenaga Kerja */}
                        <SectionCard
                            icon={<IconUsers size={18} className="text-[#2168AB]" />}
                            title="Biaya Tenaga Kerja"
                            subtitle="Biaya untuk membayar tenaga kerja produksi"
                        >
                            <div className="mt-3 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm ${upahMode === "harian" ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                        Upah Harian
                                    </span>
                                    <button
                                        onClick={() => setUpahMode(upahMode === "harian" ? "borongan" : "harian")}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${upahMode === "borongan" ? "bg-primary" : "bg-input"}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${upahMode === "borongan" ? "translate-x-5" : "translate-x-0"}`} />
                                    </button>
                                    <span className={`text-sm ${upahMode === "borongan" ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                        Upah Borongan
                                    </span>
                                </div>

                                {upahMode === "harian" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <FieldInput label="Upah per Hari" value={upahPerHari} onChange={setUpahPerHari} prefix="Rp" />
                                        <FieldInput label="Jumlah Pekerja" value={jumlahPekerja} onChange={setJumlahPekerja} suffix="orang" />
                                        <FieldInput label="Jumlah Hari" value={jumlahHari} onChange={setJumlahHari} suffix="hari" />
                                    </div>
                                ) : (
                                    <FieldInput label="Total Upah Borongan" value={upahBorongan} onChange={setUpahBorongan} prefix="Rp" />
                                )}

                                <div className="pt-3 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium text-card-foreground">Total Tenaga Kerja</span>
                                    <span className="text-sm font-semibold text-primary">{fmt(totalTenaga)}</span>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Biaya Overhead */}
                        <SectionCard
                            icon={<IconTool size={18} className="text-[#2168AB]" />}
                            title="Biaya Overhead Produksi"
                            subtitle="Biaya operasional yang mendukung produksi"
                            collapsible
                            defaultOpen
                        >
                            <div className="mt-3 flex flex-col gap-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FieldInput label="Listrik & Air" value={listrik} onChange={setListrik} prefix="Rp" />
                                    <FieldInput label="Gas / BBM" value={gas} onChange={setGas} prefix="Rp" />
                                    <FieldInput label="Sewa Tempat (per bulan)" value={sewa} onChange={setSewa} prefix="Rp" />
                                    <FieldInput label="Penyusutan Alat" value={penyusutan} onChange={setPenyusutan} prefix="Rp" />
                                </div>

                                {biayaLainnya.map((item) => (
                                    <div key={item.id} className="flex gap-2">
                                        <Input
                                            type="text"
                                            value={item.nama}
                                            onChange={(e) =>
                                                setBiayaLainnya((p) => p.map((b) => b.id === item.id ? { ...b, nama: e.target.value } : b))
                                            }
                                            placeholder="Nama biaya"
                                        />
                                        <div className="flex items-center border border-input rounded-md overflow-hidden bg-transparent shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all flex-1">
                                            <span className="px-2 text-xs text-muted-foreground border-r border-input bg-muted/50 h-9 flex items-center">Rp</span>
                                            <input
                                                type="number"
                                                value={item.nilai || ""}
                                                onChange={(e) =>
                                                    setBiayaLainnya((p) => p.map((b) => b.id === item.id ? { ...b, nilai: e.target.value } : b))
                                                }
                                                placeholder="0"
                                                className="flex-1 px-3 h-9 text-sm text-foreground outline-none bg-transparent min-w-0"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setBiayaLainnya((p) => p.filter((b) => b.id !== item.id))}
                                            className="size-9"
                                        >
                                            <IconTrash size={16} />
                                        </Button>
                                    </div>
                                ))}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setBiayaLainnya((p) => [...p, { id: Date.now(), nama: "", nilai: "0" }])}
                                    className="px-0 justify-start w-fit"
                                >
                                    <IconPlus size={15} /> Biaya Lainnya
                                </Button>

                                <div className="pt-3 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium text-card-foreground">Total Overhead</span>
                                    <span className="text-sm font-semibold text-primary">{fmt(totalOverhead)}</span>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Biaya Tambahan */}
                        <SectionCard
                            icon={<IconCurrencyDollar size={18} className="text-[#2168AB]" />}
                            title="Biaya Tambahan (Opsional)"
                            subtitle="Opsional - tambahkan jika ada biaya ini"
                            collapsible
                            defaultOpen
                        >
                            <div className="mt-3 flex flex-col gap-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FieldInput label="Biaya Kemasan" value={kemasan} onChange={setKemasan} prefix="Rp" />
                                    <FieldInput label="Ongkir Bahan Baku" value={ongkir} onChange={setOngkir} prefix="Rp" />
                                </div>
                                <div className="pt-3 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium text-card-foreground">Total Tambahan</span>
                                    <span className="text-sm font-semibold text-primary">{fmt(totalTambahan)}</span>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── Right Column ── */}
                    <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-6">

                        <Card className="py-0 gap-0">
                            <CardHeader className="flex flex-row items-center gap-2 px-5 pt-5 pb-4">
                                <IconChartDonut size={17} className="text-[#2168AB]" />
                                <p className="font-semibold text-sm text-card-foreground">Ringkasan Biaya</p>
                            </CardHeader>
                            <CardContent className="px-5 pb-5">
                                <div className="flex justify-center mb-4 ">
                                    <DonutChart data={chartData} />
                                </div>

                                <div className="flex flex-col gap-2 mb-4">
                                    {chartData.map((d) => (
                                        <div key={d.label} className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                                <span className="text-xs text-muted-foreground">{d.label}</span>
                                            </div>
                                            <span className="text-xs text-foreground">{fmt(d.value)}</span>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="mb-3" />

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-card-foreground">Total Produksi</span>
                                    <span className="text-sm font-bold text-card-foreground">{fmt(totalProduksi)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1 mb-3">
                                    <span className="text-xs text-muted-foreground">Jumlah Produk</span>
                                    <span className="text-xs text-muted-foreground">{parseNum(jumlahProduk)} unit</span>
                                </div>

                                {/* HPP Per Unit — uses primary as accent, only place with intentional gradient */}
                                <div className="rounded-xl p-4 bg-secondary text-primary-foreground text-center">
                                    <p className="text-xs text-muted-foreground mb-1">🔥 HPP Per Unit</p>
                                    <p className="text-2xl text-muted-foreground font-bold">{fmt(hpp)}</p>
                                    <p className="text-xs text-muted-foreground opacity-70 mt-0.5">per unit</p>
                                </div>

                                {/* Hitung Harga Jual */}
                                <button
                                    onClick={() => setHargaJualOpen((o) => !o)}
                                    className="mt-3 w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-2 border-t"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <IconBulb size={13} /> Hitung Harga Jual & Profit
                                    </span>
                                    {hargaJualOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                                </button>

                                {hargaJualOpen && (
                                    <div className="mt-2 flex flex-col gap-3">
                                        <FieldInput
                                            label="Target Margin Profit (%)"
                                            value={marginPct}
                                            onChange={setMarginPct}
                                            suffix="%"
                                            placeholder="20"
                                        />
                                        <div className="bg-muted rounded-lg p-3 flex flex-col gap-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Harga Jual Rekomendasi</span>
                                                <span className="font-semibold text-foreground">{fmt(hargaJual)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Profit per Unit</span>
                                                <span className="font-semibold text-foreground">{fmt(profit)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Total Profit ({parseNum(jumlahProduk)} unit)</span>
                                                <span className="font-semibold text-foreground">{fmt(profit * qty)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-2 w-full">
                            <Button className="w-full" onClick={() => setIsLoading(true)}>
                                <IconDeviceFloppy size={16} /> Simpan Perhitungan
                            </Button>
                            <Button variant="outline" className="w-full" onClick={resetAll}>
                                <IconRefresh size={16} /> Reset Semua
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}