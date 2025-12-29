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

  // --- PRO STRATEGY: VERIFY SESSION HERE ---
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Only verify if a token exists. 
  // If no token exists, Middleware has already handled the "Protected Route" check.
  if (token) {
    try {
      const res = await fetch(`${process.env.BACKEND_URL}/auth/authenticate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store' // Ensure we don't cache auth checks
      });

      // If token is invalid (401/403), we must clear it to stop the loop.
      if (!res.ok) {
        // We cannot delete cookies in a Server Component directly.
        // So we redirect to our helper route which deletes the cookie and sends to login.
        redirect('/next-api/authenticate/session-expired');
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Optional: If backend is completely down, do you want to logout user?
      // Usually keeping them logged in but showing an error state in the page is safer 
      // to avoid mass logouts during server blips. 
      // But if you want strict security:
      redirect('/next-api/authenticate/session-expired');
    }
  }
  // -----------------------------------------

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