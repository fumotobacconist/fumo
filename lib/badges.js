import { query, slugify } from './db';
import { cleanTranslations } from './i18n-content';

export function badgeFields(input) {
  const name = String(input.name || '').trim().toUpperCase().slice(0, 40);
  if (!name) throw new Error('Badge name is required');
  const color = String(input.color || 'accent').trim();
  if (!['accent', 'accent2'].includes(color) && !/^#[0-9a-f]{3,8}$/i.test(color)) throw new Error('Invalid badge colour');
  return { name, color, sort_order: Number(input.sort_order) || 0, visible: input.visible === undefined || input.visible ? 1 : 0, translations: JSON.stringify(cleanTranslations(input.translations, ['name'])) };
}

export async function badgeSlug(name, selfId = 0) {
  const slug = slugify(name).slice(0, 60);
  if ((await query('SELECT 1 FROM badges WHERE slug = $1 AND id <> $2', [slug, selfId])).length) throw new Error(`A badge called “${name}” already exists`);
  return slug;
}
