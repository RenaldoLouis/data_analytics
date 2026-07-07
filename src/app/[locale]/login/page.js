'use client';

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, ShieldCheck, Ticket } from "lucide-react";

import LoginForm from "@/components/LoginForm";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
// import { useIsMobile } from "@/hooks/use-mobile"; // (used by the previous login.jpg layout — see commented block at the bottom)

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY "Sirius" login view.
// Keeps the original centered rounded-card container, but the LEFT half of the
// card is replaced with the Sirius marketing panel (instead of the /login.jpg
// background image). The RIGHT half reuses <LoginForm /> unchanged. All copy is
// localized via the `loginpage.mkt*` keys in messages/{en,id}.json.
//
// The original login.jpg layout is preserved, commented out at the BOTTOM of this
// file. To restore it: delete the export default below (and the icon imports) and
// uncomment that block.
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
    const t = useTranslations("loginpage");
    const [termsOpen, setTermsOpen] = useState(false);
    const features = [t("mktFeature1"), t("mktFeature2"), t("mktFeature3"), t("mktFeature4")];

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f3f4f6] lg:py-8">
            <div className="flex w-full lg:w-[90%] lg:max-w-6xl h-screen lg:h-[85vh] lg:max-h-[900px] lg:rounded-[2rem] overflow-hidden lg:shadow-lg bg-white">

                {/* ── Left: Sirius marketing panel (hidden on mobile) ── */}
                <aside
                    className="relative hidden lg:flex lg:w-1/2 flex-col overflow-y-auto px-10 py-10 xl:px-14"
                    style={{ backgroundImage: "linear-gradient(180deg, #F8FAFF 0%, #E6EEFF 100%)" }}
                >
                    {/* Soft radial brand glow, upper-left */}
                    <div className="pointer-events-none absolute -left-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-[#2563EB] opacity-[0.06] blur-3xl" />

                    {/* my-auto (not justify-center) so it centers when it fits but the top
                        stays scrollable/reachable when the content is taller than the panel. */}
                    <div className="relative my-auto w-full max-w-lg">
                        {/* Brand lockup */}
                        <div className="mb-8 flex items-center gap-3.5">
                            <Image src="/logo.svg" alt="Sirius" width={110} height={24} priority />
                            <span className="h-8 w-px bg-slate-300" />
                            <p className="text-sm leading-tight text-slate-500">
                                {t("mktTagline1")}<br />{t("mktTagline2")}
                            </p>
                        </div>

                        {/* Heading */}
                        <h1 className="text-3xl font-bold leading-tight text-slate-900 xl:text-4xl xl:leading-tight">
                            {t("mktHeadingA")}<span className="text-blue-600">{t("mktHeadingHighlight")}</span>
                        </h1>
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-500">{t("mktDesc")}</p>

                        {/* Security block */}
                        <div className="mt-8 flex items-start gap-4">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{t("mktSecTitle")}</p>
                                <p className="mt-1 max-w-sm text-sm text-slate-500">{t("mktSecDesc")}</p>
                                <button
                                    type="button"
                                    onClick={() => setTermsOpen(true)}
                                    className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                                >
                                    {t("mktSecLink")}
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Pricing card */}
                        <div className="mt-7 rounded-2xl border border-slate-200 bg-white/50 p-4">
                            <div className="mb-3.5 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <Ticket className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{t("mktPriceTitle")}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="min-w-[120px]">
                                    <p className="text-sm font-bold text-blue-600">{t("mktTrialTitle")}</p>
                                    <p className="mt-1 text-xs text-slate-500">{t("mktTrialDesc")}</p>
                                </div>

                                <div className="flex items-center gap-5 border-l border-slate-200 pl-4">
                                    <div className="min-w-[112px]">
                                        <p className="text-lg font-bold leading-none text-blue-600">Rp 49.000</p>
                                        <p className="mt-1.5 text-xs font-semibold text-slate-800">{t("mktPriceTag")}</p>
                                        <p className="text-[11px] text-slate-500">{t("mktPriceNote")}</p>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-[11px] text-slate-600">
                                                <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <p className="mt-5 max-w-lg text-[11px] leading-relaxed text-slate-400">{t("mktFine")}</p>
                    </div>
                </aside>

                {/* ── Right: login form (reused, unchanged) ── */}
                <div className="w-full lg:w-1/2 bg-white overflow-y-auto">
                    <div className="flex items-center justify-center min-h-full px-6 sm:px-8 lg:px-12 py-8">
                        <LoginForm />
                    </div>
                </div>
            </div>

            {/* Terms & Conditions / Privacy Policy modal (same as the register page) */}
            <PrivacyPolicyModal open={termsOpen} onOpenChange={setTermsOpen} />
        </main>
    );
}

/*
 * ───────────────────────────────────────────────────────────────────────────
 * PREVIOUS LOGIN LAYOUT (centered rounded card with /login.jpg on the left).
 * Temporarily replaced by the Sirius marketing left panel above. To restore:
 *   1. Delete the export default LoginPage above (and the lucide/Image imports).
 *   2. Uncomment the imports and function below.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * import LoginForm from "@/components/LoginForm";
 * import { useIsMobile } from "@/hooks/use-mobile";
 *
 * export default function LoginPage() {
 *     const isMobile = useIsMobile();
 *
 *     return (
 *         <main className="flex min-h-screen items-center justify-center bg-[#f3f4f6] lg:py-8">
 *             <div className="flex w-full lg:w-[90%] lg:max-w-6xl h-screen lg:h-[85vh] lg:max-h-[900px] lg:rounded-[2rem] overflow-hidden lg:shadow-lg">
 *                 {!isMobile && (
 *                     <div className="w-1/2 bg-white flex items-center justify-center rounded-l-[2rem] overflow-hidden">
 *                         <div className="w-full h-full bg-[url('/login.jpg')] bg-no-repeat bg-cover" />
 *                     </div>
 *                 )}
 *
 *                 (Scrollable container with padding)
 *                 <div className="w-full lg:w-1/2 bg-white overflow-y-auto">
 *                     <div className="flex items-center justify-center min-h-full px-6 sm:px-8 lg:px-12 py-8">
 *                         <LoginForm />
 *                     </div>
 *                 </div>
 *             </div>
 *         </main>
 *     );
 * }
 */
