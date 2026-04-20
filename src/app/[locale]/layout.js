import { backend } from "@/lib/backendClient";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist, Geist_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
import { cookies } from "next/headers"; // Import cookies
import { notFound, redirect } from "next/navigation";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
});

export const metadata = {
  title: "Sirius",
  description: "Data Visualization Tools",
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Verify session on every page render
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (accessToken) {
    try {
      await backend.post('/auth/authenticate', {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      redirect('/next-api/authenticate/session-expired');
    }
  }

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${ibmPlexSans.variable} font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}