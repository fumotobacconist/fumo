// Storefront data in the visitor's language (English fallback for anything not translated).
import { getBadges, getBrands, getCategories, getPageBySlug, getProducts, getSite, query } from './db';
import { localizeBadge, localizeBrand, localizeCategory, localizeDeep, localizePage, localizeProduct } from './i18n-content';

// Each server keeps catalogue/site data in memory. Admin saves bump `content_version` in the
// database (lib/api.js); servers check that one number at most every 2 seconds and reload when it
// changes — so edits show up almost immediately on every server, and visitors skip the heavy queries.
const memo = { version: null, checkedAt: 0, data: new Map() };
const CHECK_EVERY = 2000;

async function syncVersion() {
  if (Date.now() - memo.checkedAt < CHECK_EVERY) return;
  const [row] = await query(`SELECT value FROM settings WHERE key = 'content_version'`);
  const v = row?.value || '0';
  memo.checkedAt = Date.now();
  if (v !== memo.version) {
    memo.version = v;
    memo.data.clear();
  }
}

export async function bumpContentVersion() {
  await query(`INSERT INTO settings (key, value) VALUES ('content_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [Date.now().toString(36)]);
  memo.checkedAt = 0; // this server re-checks on its next request
}

const cached = (fn, key) => async (...args) => {
  await syncVersion();
  const k = key + JSON.stringify(args);
  if (!memo.data.has(k)) memo.data.set(k, fn(...args).catch((e) => { memo.data.delete(k); throw e; }));
  return memo.data.get(k);
};

const site = cached(() => getSite(), 'site');
const products = cached(() => getProducts(), 'products');
const categories = cached(() => getCategories(), 'categories');
const brands = cached(() => getBrands(), 'brands');
const badges = cached(() => getBadges(), 'badges');
const page = cached((slug) => getPageBySlug(slug), 'page');

export const siteFor = async (locale) => localizeDeep(await site(), locale);
export const productsFor = async (locale) => (await products()).map((p) => localizeProduct(p, locale));
export const productFor = async (id, locale) => {
  const p = (await products()).find((x) => x.id === id);
  return p ? localizeProduct(p, locale) : null;
};
export const categoriesFor = async (locale) => (await categories()).map((c) => localizeCategory(c, locale));
// Hidden brands and badges disappear from the storefront together with their products.
export const brandsFor = async (locale) => (await brands()).filter((b) => b.visible !== 0).map((b) => localizeBrand(b, locale));
export const badgesFor = async (locale) => (await badges()).filter((b) => b.visible !== 0).map((b) => localizeBadge(b, locale));
export const pageFor = async (slug, locale) => localizePage(await page(slug), locale);
