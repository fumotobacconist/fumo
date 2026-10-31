import { NextResponse } from 'next/server';
import { getBrands, query } from '@/lib/db';
import { brandFields, brandSlug } from '@/lib/brands';
import { handler } from '@/lib/api';

export const PUT = handler(async (req, { params }) => {
  const id = Number((await params).id);
  const body = await req.json();
  const b = brandFields(body);
  // The web address follows the name, so renaming a brand also renames its page.
  const slug = await brandSlug(b.name, id);
  await query('UPDATE brands SET name = $1, slug = $2, logo = $3, description = $4, sort_order = $5, translations = $6, visible = $7 WHERE id = $8', [b.name, slug, b.logo, b.description, b.sort_order, b.translations, b.visible, id]);
  return NextResponse.json(await getBrands());
});

export const DELETE = handler(async (_req, { params }) => {
  await query('DELETE FROM brands WHERE id = $1', [Number((await params).id)]);
  return NextResponse.json(await getBrands());
});
