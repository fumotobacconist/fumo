import { NextResponse } from 'next/server';
import { getBadges, query } from '@/lib/db';
import { badgeFields, badgeSlug } from '@/lib/badges';
import { handler } from '@/lib/api';

export const GET = handler(async () => NextResponse.json(await getBadges()));

export const POST = handler(async (req) => {
  const b = badgeFields(await req.json());
  const slug = await badgeSlug(b.name);
  await query('INSERT INTO badges (name, slug, color, sort_order, translations) VALUES ($1, $2, $3, $4, $5)', [b.name, slug, b.color, b.sort_order, b.translations]);
  return NextResponse.json({ name: b.name, badges: await getBadges() });
});
