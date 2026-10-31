import { NextResponse } from 'next/server';
import { batch, getBadges, query } from '@/lib/db';
import { badgeFields, badgeSlug } from '@/lib/badges';
import { handler } from '@/lib/api';

export const PUT = handler(async (req, { params }) => {
  const id = Number((await params).id);
  const b = badgeFields(await req.json());
  const [old] = await query('SELECT name FROM badges WHERE id = $1', [id]);
  if (!old) throw new Error('Badge not found');
  const slug = await badgeSlug(b.name, id);
  await batch([
    ['UPDATE badges SET name = $1, slug = $2, color = $3, sort_order = $4, translations = $5, visible = $6 WHERE id = $7', [b.name, slug, b.color, b.sort_order, b.translations, b.visible, id]],
    // Renaming a badge renames it on its products too.
    ['UPDATE products SET badge = $1 WHERE upper(trim(badge)) = $2', [b.name, old.name]],
  ]);
  return NextResponse.json(await getBadges());
});

export const DELETE = handler(async (_req, { params }) => {
  const id = Number((await params).id);
  const [old] = await query('SELECT name FROM badges WHERE id = $1', [id]);
  if (old) {
    await batch([
      ['DELETE FROM badges WHERE id = $1', [id]],
      ['UPDATE products SET badge = $1 WHERE upper(trim(badge)) = $2', ['', old.name]],
    ]);
  }
  return NextResponse.json(await getBadges());
});
