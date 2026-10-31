import { NextResponse } from 'next/server';
import { cleanImage, getCategories, query } from '@/lib/db';
import { handler } from '@/lib/api';
import { checkParent } from '@/lib/categories';
import { CATEGORY_TEXT, cleanTranslations } from '@/lib/i18n-content';

export const PUT = handler(async (req, { params }) => {
  const { id } = await params;
  const { name, sort_order, image, parent_id, translations } = await req.json();
  if (!String(name || '').trim()) throw new Error('Name is required');
  const img = cleanImage(image);
  if (img === null) throw new Error('Invalid image');
  const parent = await checkParent(parent_id, Number(id));
  const tr = JSON.stringify(cleanTranslations(translations, CATEGORY_TEXT));
  await query('UPDATE categories SET name = $1, sort_order = $2, image = $3, parent_id = $4, translations = $5 WHERE id = $6', [name.trim(), Number(sort_order) || 0, img, parent, tr, Number(id)]);
  return NextResponse.json(await getCategories());
});

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  await query('DELETE FROM categories WHERE id = $1', [Number(id)]);
  return NextResponse.json(await getCategories());
});
