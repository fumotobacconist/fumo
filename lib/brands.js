import { cleanImage, query, slugify } from './db';
import { BRAND_TEXT, cleanTranslations } from './i18n-content';

export async function brandSlug(wanted, selfId = 0) {
  const base = slugify(wanted).slice(0, 60);
  let slug = base;
  for (let n = 2; (await query('SELECT 1 FROM brands WHERE slug = $1 AND id <> $2', [slug, selfId])).length; n++) slug = `${base}-${n}`;
  return slug;
}

export function brandFields(input) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Brand name is required');
  const logo = cleanImage(input.logo || '');
  if (logo === null) throw new Error('Invalid logo');
  return {
    name,
    logo,
    description: String(input.description || '').trim().slice(0, 2000),
    sort_order: Number(input.sort_order) || 0,
    visible: input.visible === undefined || input.visible ? 1 : 0,
    translations: JSON.stringify(cleanTranslations(input.translations, BRAND_TEXT)),
  };
}
