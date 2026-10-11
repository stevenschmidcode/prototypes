import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav, DesktopHeader } from "@/components/layout/app-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { EmbedBridge } from "@/components/layout/embed-bridge";
import { ServiceWorkerRegistration } from "@/components/layout/service-worker-registration";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/client";
import { INTL_LOCALE, LOCALES, localizePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Beide Sprachen werden als statische Shell vorgerendert */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.meta.title, template: "%s · baden." },
    description: t.meta.description,
    applicationName: "baden.",
    appleWebApp: { capable: true, title: "baden.", statusBarStyle: "default" },
    icons: { apple: "/icons/apple-touch-icon.png" },
    formatDetection: { telephone: false },
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [INTL_LOCALE[l], localizePath(l, "/")])),
    },
    openGraph: {
      type: "website",
      locale: INTL_LOCALE[locale].replace("-", "_"),
      siteName: "baden.",
      title: t.meta.title,
      description: t.meta.ogDescription,
    },
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#f8f7f3",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  return (
    <html lang={INTL_LOCALE[locale]} className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} dict={t}>
          <a
            href="#inhalt"
            className="sr-only z-50 rounded-md bg-forest px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {t.common.skipToContent}
          </a>
          <FavoritesProvider>
            <DesktopHeader />
            <main id="inhalt" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <BottomNav />
          </FavoritesProvider>
          <Toaster position="top-center" />
          <ServiceWorkerRegistration />
          <EmbedBridge />
        </I18nProvider>
      </body>
    </html>
  );
}
