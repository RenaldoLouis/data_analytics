'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import LoadingScreen from "@/components/ui/loadingScreen"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
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
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID")
const parseNum = (s) => parseFloat(String(s).replace(/[^\d.]/g, "")) || 0

// ─── Donut Chart (pure SVG) ───────────────────────────────────────────────────
function DonutChart({ data, noDataLabel }) {
    const total = data.reduce((s, d) => s + d.value, 0)
    if (total === 0)
        return (
            <div className="flex items-center justify-center h-36 text-muted-foreground text-sm">
                {noDataLabel}
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
                className={`flex flex-row items-start gap-3 px-5 pt-5 pb-5 ${collapsible ? "cursor-pointer select-none" : ""}`}
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
    const t = useTranslations("calculatorpage")

    const [namaProduk, setNamaProduk] = useState("")
    const [jumlahProduk, setJumlahProduk] = useState("1")
    const [bahans, setBahans] = useState([{ id: 1, nama: "", jumlah: 0, satuan: "kg", harga: 0 }])
    const SATUAN = ["kg", "gram", "liter", "ml", "butir", "buah", "pcs", "lusin", "meter", "lembar"]

    const [isBorongan, setIsBorongan] = useState(false)
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
    const totalBahan = useMemo(() => bahans.reduce((s, b) => s + b.jumlah * b.harga, 0), [bahans])

    const totalTenaga = useMemo(() => {
        if (!isBorongan)
            return parseNum(upahPerHari) * parseNum(jumlahPekerja) * parseNum(jumlahHari)
        return parseNum(upahBorongan)
    }, [isBorongan, upahPerHari, jumlahPekerja, jumlahHari, upahBorongan])

    const totalOverhead = useMemo(
        () => parseNum(listrik) + parseNum(gas) + parseNum(sewa) + parseNum(penyusutan) +
            biayaLainnya.reduce((s, b) => s + parseNum(b.nilai), 0),
        [listrik, gas, sewa, penyusutan, biayaLainnya]
    )

    const totalTambahan = useMemo(() => parseNum(kemasan) + parseNum(ongkir), [kemasan, ongkir])

    const totalProduksi = totalBahan + totalTenaga + totalOverhead + totalTambahan
    const qty = parseNum(jumlahProduk) || 1
    const hpp = totalProduksi / qty
    const margin = parseNum(marginPct) / 100
    const hargaJual = margin >= 1 ? hpp : hpp / (1 - margin)
    const profit = hargaJual - hpp

    const chartData = [
        { label: t("bahanBaku"), value: totalBahan, color: "var(--chart-1)" },
        { label: t("tenagaKerja"), value: totalTenaga, color: "var(--chart-2)" },
        { label: t("overhead"), value: totalOverhead, color: "var(--chart-3)" },
        { label: t("biayaTambahan"), value: totalTambahan, color: "var(--chart-4)" },
    ]

    const addBahan = () =>
        setBahans((p) => [...p, { id: Date.now(), nama: "", jumlah: 0, satuan: "kg", harga: 0 }])
    const removeBahan = (id) => setBahans((p) => p.filter((b) => b.id !== id))
    const updateBahan = (id, field, val) =>
        setBahans((p) => p.map((b) => (b.id === id ? { ...b, [field]: val } : b)))

    const resetAll = () => {
        setNamaProduk(""); setJumlahProduk("1")
        setBahans([{ id: 1, nama: "", jumlah: 0, satuan: "kg", harga: 0 }])
        setIsBorongan(false); setUpahPerHari("0"); setJumlahPekerja("1")
        setJumlahHari("1"); setUpahBorongan("0")
        setListrik("0"); setGas("0"); setSewa("0"); setPenyusutan("0")
        setBiayaLainnya([]); setKemasan("0"); setOngkir("0")
        setMarginPct("20"); setHargaJualOpen(false)
    }

    return (
        <>
            {isLoading && <LoadingScreen />}

            <div className="flex justify-between items-center px-4 lg:px-6">
                <H3 className="text-xl font-bold">{t("title")}</H3>
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
                            icon={<IconPackage size={18} />}
                            title={t("informasiProduk")}
                            subtitle={t("informasiProdukSubtitle")}
                        >
                            <div className="mt-3 flex flex-col gap-3">
                                <div className="grid gap-1.5">
                                    <Label>{t("namaProduk")}</Label>
                                    <Input
                                        type="text"
                                        value={namaProduk}
                                        onChange={(e) => setNamaProduk(e.target.value)}
                                        placeholder={t("namaProdukPlaceholder")}
                                    />
                                </div>
                                <FieldInput
                                    label={t("jumlahProduk")}
                                    value={jumlahProduk}
                                    onChange={setJumlahProduk}
                                    suffix={t("unit")}
                                    placeholder="50"
                                />
                            </div>
                        </SectionCard>

                        {/* Biaya Bahan Baku */}
                        <SectionCard
                            icon={<IconShoppingCart size={18} />}
                            title={t("biayaBahan")}
                            subtitle={t("biayaBahanSubtitle")}
                        >
                            <div className="mt-3">
                                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2 mb-2">
                                    {[t("namaBahan"), t("jumlah"), t("satuan"), t("hargaSatuan"), ""].map((h) => (
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
                                                    placeholder={t("namaBahan")}
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
                                    <IconPlus size={15} /> {t("tambahBahan")}
                                </Button>

                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium text-card-foreground">{t("totalBahanBaku")}</span>
                                    <span className="text-sm font-semibold text-primary">{fmt(totalBahan)}</span>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Biaya Tenaga Kerja */}
                        <SectionCard
                            icon={<IconUsers size={18} />}
                            title={t("biayaTenaga")}
                            subtitle={t("biayaTenagaSubtitle")}
                        >
                            <div className="mt-3 flex flex-col gap-3">
                                {/* Switch: Upah Harian ↔ Upah Borongan */}
                                <div className="flex items-center gap-3">
                                    <Label
                                        htmlFor="upah-mode"
                                        className={!isBorongan ? "font-medium text-foreground" : "text-muted-foreground"}
                                    >
                                        {t("upahHarian")}
                                    </Label>
                                    <Switch
                                        id="upah-mode"
                                        checked={isBorongan}
                                        onCheckedChange={setIsBorongan}
                                    />
                                    <Label
                                        htmlFor="upah-mode"
                                        className={isBorongan ? "font-medium text-foreground" : "text-muted-foreground"}
                                    >
                                        {t("upahBorongan")}
                                    </Label>
                                </div>

                                {!isBorongan ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <FieldInput label={t("upahPerHari")} value={upahPerHari} onChange={setUpahPerHari} prefix="Rp" />
                                        <FieldInput label={t("jumlahPekerja")} value={jumlahPekerja} onChange={setJumlahPekerja} suffix={t("orang")} />
                                        <FieldInput label={t("jumlahHari")} value={jumlahHari} onChange={setJumlahHari} suffix={t("hari")} />
                                    </div>
                                ) : (
                                    <FieldInput label={t("totalUpahBorongan")} value={upahBorongan} onChange={setUpahBorongan} prefix="Rp" />
                                )}

                                <div className="pt-3 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium text-card-foreground">{t("totalTenagaKerja")}</span>
                                    <span className="text-sm font-semibold text-primary">{fmt(totalTenaga)}</span>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Biaya Overhead */}
                        <SectionCard
                            icon={<IconTool size={18} />}
                            title={t("biayaOverhead")}
                            subtitle={t("biayaOverheadSubtitle")}
                            collapsible
                            defaultOpen
                        >
                            <div className="mt-3 flex flex-col gap-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FieldInput label={t("listrik")} value={listrik} onChange={setListrik} prefix="Rp" />
                                    <FieldInput label={t("gas")} value={gas} onChange={setGas} prefix="Rp" />
                                    <FieldInput label={t("sewaTempat")} value={sewa} onChange={setSewa} prefix="Rp" />
                                    <FieldInput label={t("penyusutan")} value={penyusutan} onChange={setPenyusutan} prefix="Rp" />
                                </div>

                                {biayaLainnya.map((item) => (
                                    <div key={item.id} className="flex gap-2">
                                        <Input
                                            type="text"
                                            value={item.nama}
                                            onChange={(e) =>
                                                setBiayaLainnya((p) => p.map((b) => b.id === item.id ? { ...b, nama: e.target.value } : b))
                                            }
                                            placeholder={t("namaBiaya")}
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
                                    <IconPlus size={15} /> {t("biayaLainnya")}
                                </Button>

                                <div className="pt-3 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium text-card-foreground">{t("totalOverhead")}</span>
                                    <span className="text-sm font-semibold text-primary">{fmt(totalOverhead)}</span>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Biaya Tambahan */}
                        <SectionCard
                            icon={<IconCurrencyDollar size={18} />}
                            title={t("biayaTambahan")}
                            subtitle={t("biayaTambahanSubtitle")}
                            collapsible
                            defaultOpen
                        >
                            <div className="mt-3 flex flex-col gap-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FieldInput label={t("kemasan")} value={kemasan} onChange={setKemasan} prefix="Rp" />
                                    <FieldInput label={t("ongkir")} value={ongkir} onChange={setOngkir} prefix="Rp" />
                                </div>
                                <div className="pt-3 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium text-card-foreground">{t("totalTambahan")}</span>
                                    <span className="text-sm font-semibold text-primary">{fmt(totalTambahan)}</span>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── Right Column ── */}
                    <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-6">

                        <Card className="py-0 gap-0">
                            <CardHeader className="flex flex-row items-center gap-2 px-5 pt-5 pb-4">
                                <IconChartDonut size={17} className="text-primary" />
                                <p className="font-semibold text-sm text-card-foreground">{t("ringkasanBiaya")}</p>
                            </CardHeader>
                            <CardContent className="px-5 pb-5">
                                <div className="flex justify-center mb-4">
                                    <DonutChart data={chartData} noDataLabel={t("noData")} />
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
                                    <span className="text-sm font-semibold text-card-foreground">{t("totalProduksi")}</span>
                                    <span className="text-sm font-bold text-card-foreground">{fmt(totalProduksi)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1 mb-3">
                                    <span className="text-xs text-muted-foreground">{t("jumlahProdukLabel")}</span>
                                    <span className="text-xs text-muted-foreground">{parseNum(jumlahProduk)} {t("unit")}</span>
                                </div>

                                <div className="rounded-xl p-4 bg-primary text-primary-foreground text-center">
                                    <p className="text-xs opacity-80 mb-1">🔥 {t("hppPerUnit")}</p>
                                    <p className="text-2xl font-bold">{fmt(hpp)}</p>
                                    <p className="text-xs opacity-70 mt-0.5">{t("perUnit")}</p>
                                </div>

                                <button
                                    onClick={() => setHargaJualOpen((o) => !o)}
                                    className="mt-3 w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-2 border-t"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <IconBulb size={13} /> {t("hitungHargaJual")}
                                    </span>
                                    {hargaJualOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                                </button>

                                {hargaJualOpen && (
                                    <div className="mt-2 flex flex-col gap-3">
                                        <FieldInput
                                            label={t("targetMargin")}
                                            value={marginPct}
                                            onChange={setMarginPct}
                                            suffix="%"
                                            placeholder="20"
                                        />
                                        <div className="bg-muted rounded-lg p-3 flex flex-col gap-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{t("hargaJualRekomendasi")}</span>
                                                <span className="font-semibold text-foreground">{fmt(hargaJual)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{t("profitPerUnit")}</span>
                                                <span className="font-semibold text-foreground">{fmt(profit)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{t("totalProfit")} ({parseNum(jumlahProduk)} {t("unit")})</span>
                                                <span className="font-semibold text-foreground">{fmt(profit * qty)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Button className="w-full" onClick={() => setIsLoading(true)}>
                            <IconDeviceFloppy size={16} /> {t("simpan")}
                        </Button>
                        <Button variant="outline" className="w-full" onClick={resetAll}>
                            <IconRefresh size={16} /> {t("reset")}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}