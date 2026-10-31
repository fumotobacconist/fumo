import { NextResponse } from 'next/server';
import { getBrands, query } from '@/lib/db';
import { brandFields, brandSlug } from '@/lib/brands';
import { handler } from '@/lib/api';

export const GET = handler(async () => NextResponse.json(await getBrands()));

export const POST = handler(async (req) => {
  const body = await req.json();
  const b = brandFields(body);
  const slug = await brandSlug(body.slug || b.name);
  const [row] = await query('INSERT INTO brands (name, slug, logo, description, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id', [b.name, slug, b.logo, b.description, b.sort_order]);
  return NextResponse.json({ id: row.id, brands: await getBrands() });
});
