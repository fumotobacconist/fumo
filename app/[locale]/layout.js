import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { fontVars } from '@/lib/fonts';
import { siteFor } from '@/lib/l10n';
import Chrome from '@/components/site/Chrome';
import Footer from '@/components/site/Footer';
import AgeGate from '@/components/site/AgeGate';
import '../globals.css';

export const dynamic = 'force-dynamic';
export const viewport = { themeColor: '#ffffff' };

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { seo } = await siteFor(locale);
  return { title: seo.title, description: seo.description };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const site = await siteFor(locale);
  const b = site.brand;
  // Colours are validated as hex on save, so they are safe to inline.
  const theme = `:root{--accent:${b.accent};--accent2:${b.accent2};--ink:${b.ink};--bg:${b.bg};--tile:${b.tile}}`;
  return (
    <html lang={locale} className={fontVars}>
      <body>
        <NextIntlClientProvider>
          <style dangerouslySetInnerHTML={{ __html: theme }} />
          {site.age_gate.enabled && <AgeGate g={site.age_gate} />}
          <Chrome site={site} />
          <main className="page">{children}</main>
          <Footer site={site} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
