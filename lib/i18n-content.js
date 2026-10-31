// Turns stored content into one language. Missing translations fall back to English.
import { CONTENT_LOCALE, LOCALES } from '@/i18n/config';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

// A translated text field is stored as { en: '…', hy: '…', ru: '…' } instead of a plain string.
export const isLocalized = (v) => isObj(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => LOCALES.includes(k));

export function pick(v, locale) {
  if (!isLocalized(v)) return v;
  return (v[locale] && String(v[locale]).trim()) ? v[locale] : v[CONTENT_LOCALE] ?? Object.values(v).find(Boolean) ?? '';
}

// Walks any settings object / section list and resolves every translated field.
export function localizeDeep(value, locale) {
  if (Array.isArray(value)) return value.map((v) => localizeDeep(v, locale));
  if (isLocalized(value)) return pick(value, locale);
  if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localizeDeep(v, locale)]));
  return value;
}

// Per-row translations: { hy: { field: '…' }, ru: { … } }.
const tr = (translations, locale, field, fallback) => {
  const v = locale === CONTENT_LOCALE ? null : translations?.[locale]?.[field];
  return v && String(v).trim() ? v : fallback;
};

export const PRODUCT_TEXT = ['subtitle', 'notes', 'description', 'badge', 'button_label', 'weight', 'size', 'strength', 'nicotine'];
export const CATEGORY_TEXT = ['name'];
export const BRAND_TEXT = ['description'];
export const PAGE_TEXT = ['title', 'description'];

export function localizeProduct(p, locale) {
  if (locale === CONTENT_LOCALE) return p;
  const out = { ...p };
  for (const f of PRODUCT_TEXT) out[f] = tr(p.translations, locale, f, p[f]);
  out.badge = tr(p.badge_tr, locale, 'name', out.badge);
  out.category_name = tr(p.category_tr, locale, 'name', p.category_name);
  out.parent_name = tr(p.parent_tr, locale, 'name', p.parent_name);
  out.extra_categories = (p.extra_categories || []).map((c) => ({ ...c, name: tr(c.translations, locale, 'name', c.name) }));
  return out;
}

export function localizeCategory(c, locale) {
  if (locale === CONTENT_LOCALE) return c;
  return { ...c, name: tr(c.translations, locale, 'name', c.name), parent_name: tr(c.parent_tr, locale, 'name', c.parent_name) };
}

export function localizeBadge(b, locale) {
  if (locale === CONTENT_LOCALE) return b;
  return { ...b, name: tr(b.translations, locale, 'name', b.name) };
}

export function localizeBrand(b, locale) {
  if (locale === CONTENT_LOCALE) return b;
  return { ...b, description: tr(b.translations, locale, 'description', b.description) };
}

export function localizePage(p, locale) {
  if (!p) return p;
  return {
    ...p,
    title: tr(p.translations, locale, 'title', p.title),
    description: tr(p.translations, locale, 'description', p.description),
    sections: localizeDeep(p.sections, locale),
  };
}

// Cleans a translations object coming from the admin: only known languages and fields, strings only.
export function cleanTranslations(input, fields) {
  const out = {};
  if (!isObj(input)) return out;
  for (const l of LOCALES) {
    if (l === CONTENT_LOCALE || !isObj(input[l])) continue;
    const row = {};
    for (const f of fields) {
      const v = String(input[l][f] ?? '').trim().slice(0, 5000);
      if (v) row[f] = v;
    }
    if (Object.keys(row).length) out[l] = row;
  }
  return out;
}
