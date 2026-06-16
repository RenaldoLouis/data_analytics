"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Privacy Policy content kept per-locale here (legal copy rarely benefits from the
// generic i18n tooling and would otherwise bloat the shared message files).
const POLICY = {
    id: {
        brand: "SIRIUS BI",
        title: "Kebijakan Privasi",
        updated: "Terakhir diperbarui: 15 Juni 2026",
        intro:
            'Kebijakan Privasi ini menjelaskan bagaimana PT DAYA CIPTA TEKNOLOGI SOLUSI ("kami") mengumpulkan, memproses, dan melindungi informasi Anda saat menggunakan SIRIUS BI. Kami berkomitmen untuk melindungi privasi Anda sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP) Republik Indonesia.',
        sections: [
            {
                title: "1. Data yang Kami Kumpulkan",
                body: [
                    { type: "subheading", text: "1.1 Data Akun" },
                    { type: "text", text: "Saat Anda mendaftar, kami mengumpulkan:" },
                    {
                        type: "list",
                        items: [
                            "Nama lengkap",
                            "Alamat email",
                            "Nomor handphone",
                            "Nama Perusahaan",
                            "Username",
                            "Kata sandi (disimpan dalam bentuk terenkripsi, bukan teks biasa)",
                            "Informasi profil lain yang Anda isi secara sukarela",
                        ],
                    },
                    { type: "subheading", text: "1.2 File Laporan yang Anda Unggah" },
                    { type: "text", text: "Untuk menjalankan kalkulasi P/L, Anda mengunggah:" },
                    { type: "list", items: ["Laporan Income", "Laporan Order"] },
                    { type: "subheading", text: "1.3 Data Teknis" },
                    { type: "text", text: "Secara otomatis, kami juga mengumpulkan:" },
                    {
                        type: "list",
                        items: [
                            "Jenis browser dan sistem operasi",
                            "Waktu dan durasi penggunaan layanan",
                            "Log aktivitas sistem (untuk keperluan keamanan dan debugging)",
                        ],
                    },
                ],
            },
            {
                title: "2. Data yang TIDAK Kami Gunakan dari File Laporan yang Anda Unggah",
                body: [
                    {
                        type: "text",
                        text: "File Laporan yang Anda unggah mungkin mengandung informasi terkait pembeli (buyer). Kami ingin menegaskan dengan jelas bahwa:",
                    },
                    {
                        type: "list",
                        items: [
                            "Kami tidak membaca, tidak memproses, dan tidak menyimpan data pribadi pembeli yang mungkin terdapat dalam laporan, seperti: nama pembeli, username pembeli, alamat pengiriman, atau nomor telepon pembeli.",
                            "Sistem kami hanya mengekstrak data finansial dan transaksional yang diperlukan untuk kalkulasi P/L (misalnya: jumlah pesanan, nilai transaksi, biaya platform, komisi).",
                        ],
                    },
                    {
                        type: "text",
                        text: "Meski demikian, Anda tetap bertanggung jawab untuk memastikan bahwa Anda memiliki hak untuk mengunggah laporan tersebut.",
                    },
                ],
            },
            {
                title: "3. Bagaimana Kami Menggunakan Data Anda",
                body: [
                    {
                        type: "list",
                        items: [
                            "Data akun — Autentikasi, pengelolaan akun, dan komunikasi layanan.",
                            "File Laporan yang Anda unggah — Menjalankan kalkulasi P/L dan menampilkan hasilnya kepada Anda.",
                            "Data teknis — Keamanan sistem, analisis performa, dan perbaikan layanan.",
                        ],
                    },
                    { type: "subheading", text: "Kami tidak menggunakan data Anda untuk:" },
                    {
                        type: "list",
                        items: [
                            "Iklan atau pemasaran pihak ketiga",
                            "Profiling komersial",
                            "Dijual atau dibagikan kepada pihak ketiga tanpa sepengetahuan Anda",
                        ],
                    },
                ],
            },
            {
                title: "4. Keamanan Data",
                body: [
                    {
                        type: "text",
                        text: "Kami menerapkan langkah-langkah keamanan teknis dan organisasional yang wajar untuk melindungi data Anda, antara lain:",
                    },
                    {
                        type: "list",
                        items: [
                            "Enkripsi data dalam transmisi menggunakan protokol HTTPS/TLS",
                            "Enkripsi kata sandi dengan metode hashing yang aman",
                            "Akses ke data dibatasi hanya untuk personel yang berwenang",
                            "Pemantauan keamanan sistem secara berkala",
                        ],
                    },
                    {
                        type: "text",
                        text: "Namun, tidak ada sistem yang sepenuhnya bebas risiko. Kami tidak dapat menjamin keamanan absolut atas data yang dikirimkan melalui internet.",
                    },
                ],
            },
            {
                title: "5. Berbagi Data dengan Pihak Ketiga",
                body: [
                    {
                        type: "text",
                        text: "Kami tidak menjual data Anda kepada pihak ketiga. Data Anda hanya dapat dibagikan dalam kondisi berikut:",
                    },
                    {
                        type: "list",
                        items: [
                            "Penyedia layanan teknis (misalnya: layanan hosting/cloud) yang kami gunakan untuk menjalankan infrastruktur — mereka terikat perjanjian kerahasiaan.",
                            "Kewajiban hukum — jika diwajibkan oleh hukum, putusan pengadilan, atau permintaan otoritas pemerintah yang berwenang di Indonesia.",
                            "Perlindungan hak — jika diperlukan untuk melindungi hak, properti, atau keselamatan kami, pengguna lain, atau publik.",
                        ],
                    },
                ],
            },
            {
                title: "6. Hak-Hak Anda Sebagai Subjek Data",
                body: [
                    {
                        type: "text",
                        text: "Sesuai UU PDP No. 27 Tahun 2022, Anda memiliki hak sebagai berikut:",
                    },
                    {
                        type: "list",
                        items: [
                            "Hak Mengakses — Meminta salinan data pribadi yang kami miliki tentang Anda.",
                            "Hak Mengoreksi — Meminta perbaikan data yang tidak akurat atau tidak lengkap.",
                            "Hak Menghapus — Meminta penghapusan data pribadi Anda, termasuk penutupan akun.",
                            "Hak Menarik Persetujuan — Menarik persetujuan Anda untuk pemrosesan data sewaktu-waktu, dengan catatan hal ini dapat mempengaruhi kemampuan kami memberikan layanan.",
                            "Hak Mengajukan Keberatan — Mengajukan keberatan atas pemrosesan data Anda untuk tujuan tertentu.",
                        ],
                    },
                    {
                        type: "text",
                        text: "Untuk menggunakan hak-hak di atas, silakan hubungi kami melalui kontak yang tercantum di bagian akhir dokumen ini. Kami akan merespons dalam 1–3 hari kerja sesuai ketentuan yang berlaku.",
                    },
                ],
            },
            {
                title: "7. Cookie dan Teknologi Pelacak",
                body: [
                    { type: "text", text: "Layanan kami mungkin menggunakan cookie atau teknologi serupa untuk:" },
                    {
                        type: "list",
                        items: [
                            "Menjaga sesi login Anda tetap aktif",
                            "Mengingat preferensi Anda",
                            "Menganalisis performa layanan secara agregat dan anonim",
                        ],
                    },
                    {
                        type: "text",
                        text: "Anda dapat mengatur browser Anda untuk menolak cookie, namun beberapa fitur layanan mungkin tidak berfungsi dengan baik.",
                    },
                ],
            },
            {
                title: "8. Batasan Tanggung Jawab",
                body: [
                    {
                        type: "text",
                        text: "Sejauh diizinkan oleh hukum yang berlaku, Platform tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan layanan, termasuk namun tidak terbatas pada:",
                    },
                    {
                        type: "list",
                        items: [
                            "Kesalahan interpretasi hasil analisis",
                            "Keputusan bisnis atau finansial pengguna",
                            "Kehilangan profit atau peluang usaha",
                            "Ketidaksesuaian data akibat perubahan sistem marketplace",
                        ],
                    },
                    { type: "text", text: "Penggunaan Platform sepenuhnya merupakan keputusan pengguna." },
                ],
            },
            {
                title: "9. Pengguna di Bawah Umur",
                body: [
                    {
                        type: "text",
                        text: "Layanan ini tidak ditujukan untuk individu yang berusia di bawah 18 tahun. Kami tidak secara sengaja mengumpulkan data pribadi dari anak di bawah umur. Jika Anda mengetahui bahwa seorang anak telah mendaftar tanpa izin orang tua/wali, silakan hubungi kami untuk segera kami tindaklanjuti.",
                    },
                ],
            },
            {
                title: "10. Perubahan Kebijakan Privasi",
                body: [
                    {
                        type: "text",
                        text: "Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Jika ada perubahan yang bersifat material, kami akan memberitahu Anda melalui email atau pengumuman di dalam aplikasi sebelum perubahan berlaku. Penggunaan layanan yang berlanjut setelah pembaruan dianggap sebagai persetujuan Anda terhadap kebijakan yang baru.",
                    },
                ],
            },
        ],
        contactTitle: "11. Hubungi Kami",
        contactIntro:
            "Jika Anda memiliki pertanyaan, permintaan, atau keluhan mengenai Kebijakan Privasi ini, silakan hubungi:",
        contact: {
            company: "PT DAYA CIPTA TEKNOLOGI SOLUSI",
            attn: "Attn: Tim Technology Development",
            email: "solution@dayaciptatech.com",
            website: "https://dayaciptatech.com/",
            address: "Karawaci Office Park Blok H12, Tangerang 15139",
        },
        footnote:
            "Kebijakan Privasi ini merupakan satu kesatuan dengan Syarat dan Ketentuan Penggunaan SIRIUS BI.",
        closeLabel: "Tutup",
        readingLabel: "Progres membaca",
        contentLabel: "Isi Kebijakan Privasi",
    },
    en: {
        brand: "SIRIUS BI",
        title: "Privacy Policy",
        updated: "Last updated: 15 June 2026",
        intro:
            'This Privacy Policy explains how PT DAYA CIPTA TEKNOLOGI SOLUSI ("we") collect, process, and protect your information when you use SIRIUS BI. We are committed to protecting your privacy in accordance with Law No. 27 of 2022 on Personal Data Protection (UU PDP) of the Republic of Indonesia.',
        sections: [
            {
                title: "1. Data We Collect",
                body: [
                    { type: "subheading", text: "1.1 Account Data" },
                    { type: "text", text: "When you register, we collect:" },
                    {
                        type: "list",
                        items: [
                            "Full name",
                            "Email address",
                            "Mobile phone number",
                            "Company name",
                            "Username",
                            "Password (stored encrypted, never as plain text)",
                            "Other profile information you provide voluntarily",
                        ],
                    },
                    { type: "subheading", text: "1.2 Report Files You Upload" },
                    { type: "text", text: "To run P/L calculations, you upload:" },
                    { type: "list", items: ["Income Report", "Order Report"] },
                    { type: "subheading", text: "1.3 Technical Data" },
                    { type: "text", text: "Automatically, we also collect:" },
                    {
                        type: "list",
                        items: [
                            "Browser type and operating system",
                            "Time and duration of service usage",
                            "System activity logs (for security and debugging purposes)",
                        ],
                    },
                ],
            },
            {
                title: "2. Data We Do NOT Use From the Report Files You Upload",
                body: [
                    {
                        type: "text",
                        text: "The report files you upload may contain buyer-related information. We want to clearly state that:",
                    },
                    {
                        type: "list",
                        items: [
                            "We do not read, process, or store buyers' personal data that may appear in the reports, such as: buyer name, buyer username, shipping address, or buyer phone number.",
                            "Our system only extracts the financial and transactional data needed for P/L calculations (e.g. number of orders, transaction value, platform fees, commission).",
                        ],
                    },
                    {
                        type: "text",
                        text: "Nevertheless, you remain responsible for ensuring that you have the right to upload those reports.",
                    },
                ],
            },
            {
                title: "3. How We Use Your Data",
                body: [
                    {
                        type: "list",
                        items: [
                            "Account data — Authentication, account management, and service communication.",
                            "Report files you upload — Running P/L calculations and displaying the results to you.",
                            "Technical data — System security, performance analysis, and service improvement.",
                        ],
                    },
                    { type: "subheading", text: "We do not use your data for:" },
                    {
                        type: "list",
                        items: [
                            "Third-party advertising or marketing",
                            "Commercial profiling",
                            "Being sold or shared with third parties without your knowledge",
                        ],
                    },
                ],
            },
            {
                title: "4. Data Security",
                body: [
                    {
                        type: "text",
                        text: "We implement reasonable technical and organizational security measures to protect your data, including:",
                    },
                    {
                        type: "list",
                        items: [
                            "Encryption of data in transit using HTTPS/TLS protocols",
                            "Password encryption using secure hashing methods",
                            "Data access restricted to authorized personnel only",
                            "Periodic system security monitoring",
                        ],
                    },
                    {
                        type: "text",
                        text: "However, no system is entirely free of risk. We cannot guarantee absolute security of data transmitted over the internet.",
                    },
                ],
            },
            {
                title: "5. Sharing Data With Third Parties",
                body: [
                    {
                        type: "text",
                        text: "We do not sell your data to third parties. Your data may only be shared under the following conditions:",
                    },
                    {
                        type: "list",
                        items: [
                            "Technical service providers (e.g. hosting/cloud services) we use to run our infrastructure — they are bound by confidentiality agreements.",
                            "Legal obligations — if required by law, a court order, or a request from a competent government authority in Indonesia.",
                            "Protection of rights — if necessary to protect the rights, property, or safety of us, other users, or the public.",
                        ],
                    },
                ],
            },
            {
                title: "6. Your Rights as a Data Subject",
                body: [
                    { type: "text", text: "In accordance with UU PDP No. 27 of 2022, you have the following rights:" },
                    {
                        type: "list",
                        items: [
                            "Right to Access — Request a copy of the personal data we hold about you.",
                            "Right to Rectify — Request correction of inaccurate or incomplete data.",
                            "Right to Erase — Request deletion of your personal data, including account closure.",
                            "Right to Withdraw Consent — Withdraw your consent to data processing at any time, noting this may affect our ability to provide the service.",
                            "Right to Object — Object to the processing of your data for certain purposes.",
                        ],
                    },
                    {
                        type: "text",
                        text: "To exercise the rights above, please contact us via the contact details at the end of this document. We will respond within 1–3 business days as applicable.",
                    },
                ],
            },
            {
                title: "7. Cookies and Tracking Technologies",
                body: [
                    { type: "text", text: "Our service may use cookies or similar technologies to:" },
                    {
                        type: "list",
                        items: [
                            "Keep your login session active",
                            "Remember your preferences",
                            "Analyze service performance in aggregate and anonymous form",
                        ],
                    },
                    {
                        type: "text",
                        text: "You can configure your browser to reject cookies, but some service features may not function properly.",
                    },
                ],
            },
            {
                title: "8. Limitation of Liability",
                body: [
                    {
                        type: "text",
                        text: "To the extent permitted by applicable law, the Platform is not liable for any direct or indirect losses arising from use of the service, including but not limited to:",
                    },
                    {
                        type: "list",
                        items: [
                            "Misinterpretation of analysis results",
                            "Users' business or financial decisions",
                            "Loss of profit or business opportunities",
                            "Data discrepancies due to marketplace system changes",
                        ],
                    },
                    { type: "text", text: "Use of the Platform is entirely the user's decision." },
                ],
            },
            {
                title: "9. Underage Users",
                body: [
                    {
                        type: "text",
                        text: "This service is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors. If you become aware that a child has registered without parental/guardian consent, please contact us so we can follow up promptly.",
                    },
                ],
            },
            {
                title: "10. Changes to This Privacy Policy",
                body: [
                    {
                        type: "text",
                        text: "We may update this Privacy Policy from time to time. If there are material changes, we will notify you via email or an in-app announcement before the changes take effect. Continued use of the service after an update is considered your acceptance of the new policy.",
                    },
                ],
            },
        ],
        contactTitle: "11. Contact Us",
        contactIntro:
            "If you have any questions, requests, or complaints regarding this Privacy Policy, please contact:",
        contact: {
            company: "PT DAYA CIPTA TEKNOLOGI SOLUSI",
            attn: "Attn: Technology Development Team",
            email: "solution@dayaciptatech.com",
            website: "https://dayaciptatech.com/",
            address: "Karawaci Office Park Blok H12, Tangerang 15139",
        },
        footnote:
            "This Privacy Policy forms an integral part of the SIRIUS BI Terms and Conditions of Use.",
        closeLabel: "Close",
        readingLabel: "Reading progress",
        contentLabel: "Privacy Policy content",
    },
};

function Block({ block }) {
    if (block.type === "subheading") {
        return (
            <h4 className="mt-5 text-sm font-semibold tracking-tight text-gray-800">
                {block.text}
            </h4>
        );
    }
    if (block.type === "list") {
        return (
            <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-gray-600 marker:text-gray-400">
                {block.items.map((item, i) => (
                    <li key={i} className="pl-1">{item}</li>
                ))}
            </ul>
        );
    }
    return <p className="text-[13px] leading-relaxed text-gray-600">{block.text}</p>;
}

export default function PrivacyPolicyModal({ open, onOpenChange }) {
    const locale = useLocale();
    const c = POLICY[locale] ?? POLICY.id;

    const scrollRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [atTop, setAtTop] = useState(true);
    const [atBottom, setAtBottom] = useState(true);

    const recompute = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        if (max <= 1) {
            // Content fits without scrolling — no progress/fades needed.
            setProgress(0);
            setAtTop(true);
            setAtBottom(true);
            return;
        }
        const top = el.scrollTop;
        setProgress(Math.min(100, Math.max(0, (top / max) * 100)));
        setAtTop(top <= 1);
        setAtBottom(top >= max - 1);
    }, []);

    // Measure once the dialog has mounted its content, and on resize / locale change.
    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(recompute);
        window.addEventListener("resize", recompute);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", recompute);
        };
    }, [open, locale, recompute]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 md:max-h-[85vh] md:max-w-2xl">
                {/* Reading progress indicator */}
                <div
                    className="absolute inset-x-0 top-0 z-30 h-1 bg-blue-100"
                    role="progressbar"
                    aria-label={c.readingLabel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                >
                    <div
                        className="h-full bg-blue-600 transition-[width] duration-150 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Sticky header */}
                <DialogHeader className="shrink-0 gap-0 border-b border-gray-100 px-6 pb-5 pt-6 pr-14 text-left">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">
                                {c.brand}
                            </p>
                            <DialogTitle className="text-xl font-bold leading-tight text-gray-900">
                                {c.title}
                            </DialogTitle>
                        </div>
                    </div>
                    <span className="mt-2.5 inline-flex w-fit items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                        {c.updated}
                    </span>
                </DialogHeader>

                {/* Scrollable content area with fade affordances */}
                <div className="relative min-h-0">
                    {/* Top fade */}
                    <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ${atTop ? "opacity-0" : "opacity-100"}`}
                    />

                    <div
                        ref={scrollRef}
                        onScroll={recompute}
                        tabIndex={0}
                        role="region"
                        aria-label={c.contentLabel}
                        className="max-h-[60vh] space-y-4 overflow-y-auto scroll-smooth px-6 py-6 outline-none [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
                    >
                        <p className="text-[13px] leading-relaxed text-gray-600">{c.intro}</p>

                        {c.sections.map((section, i) => (
                            <section
                                key={i}
                                className="space-y-2.5 border-t border-gray-100 pt-4"
                                aria-label={section.title}
                            >
                                <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
                                    {section.title}
                                </h3>
                                {section.body.map((block, j) => (
                                    <Block key={j} block={block} />
                                ))}
                            </section>
                        ))}

                        {/* Contact */}
                        <section className="space-y-2.5 border-t border-gray-100 pt-4" aria-label={c.contactTitle}>
                            <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">{c.contactTitle}</h3>
                            <p className="text-[13px] leading-relaxed text-gray-600">{c.contactIntro}</p>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-[13px] leading-relaxed text-gray-700">
                                <p className="font-semibold text-gray-900">{c.contact.company}</p>
                                <p className="text-gray-600">{c.contact.attn}</p>
                                <p className="mt-1">
                                    <a href={`mailto:${c.contact.email}`} className="text-blue-600 hover:underline">
                                        {c.contact.email}
                                    </a>
                                </p>
                                <p>
                                    <a
                                        href={c.contact.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {c.contact.website}
                                    </a>
                                </p>
                                <p className="text-gray-600">{c.contact.address}</p>
                            </div>
                        </section>

                        <p className="border-t border-gray-100 pt-5 text-center text-xs italic leading-relaxed text-gray-500">
                            {c.footnote}
                        </p>
                    </div>

                    {/* Bottom fade */}
                    <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ${atBottom ? "opacity-0" : "opacity-100"}`}
                    />
                </div>

                {/* Sticky footer */}
                <div className="flex shrink-0 justify-end border-t border-gray-100 bg-white px-6 py-4">
                    <Button variant="secondary" onClick={() => onOpenChange(false)} className="min-w-24">
                        {c.closeLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
