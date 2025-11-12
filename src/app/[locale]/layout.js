import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist, Geist_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
import { notFound } from "next/navigation";
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
  weight: ['400', '500', '600', '700'], // Specify the weights you'll use
  variable: '--font-ibm-plex-sans', // This is the CSS variable name
});


export const metadata = {
  title: "Daya Cipta Tech",
  description: "Data Visualization Tools",
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Providing all messages to the client side
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
