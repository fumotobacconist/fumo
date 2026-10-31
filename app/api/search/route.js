import { NextResponse } from 'next/server';
import { productsFor } from '@/lib/l10n';
import { buildIndex, searchProducts } from '@/lib/search';
import { displayName, productPath } from '@/lib/site';
import { DEFAULT_LOCALE, LOCALES, localePath } from '@/i18n/config';

// Live search suggestions for the search box: /api/search?q=xros&locale=hy
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().slice(0, 80);
  const locale = LOCALES.includes(searchParams.get('locale')) ? searchParams.get('locale') : DEFAULT_LOCALE;
  if (!q) return NextResponse.json({ total: 0, items: [] });
  const results = searchProducts(buildIndex(await productsFor(locale)), q);
  return NextResponse.json(
    {
      total: results.length,
      items: results.slice(0, 6).map((p) => ({
        id: p.id,
        name: displayName(p),
        path: localePath(productPath(p), locale),
        image: p.image || '',
        price: p.price || '',
        sub: p.subtitle || p.notes || p.category_name || '',
      })),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  );
}
