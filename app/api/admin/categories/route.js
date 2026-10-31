import { NextResponse } from 'next/server';
import { getCategories, query } from '@/lib/db';
import { checkParent, uniqueSlug } from '@/lib/categories';
import { handler } from '@/lib/api';

export const GET = handler(async () => NextResponse.json(await getCategories()));

export const POST = handler(async (req) => {
  const { name, sort_order, parent_id, slug } = await req.json();
  if (!String(name || '').trim()) throw new Error('Name is required');
  const parent = await checkParent(parent_id);
  const finalSlug = await uniqueSlug(slug || name);
  await query('INSERT INTO categories (name, slug, sort_order, parent_id) VALUES ($1, $2, $3, $4)', [name.trim(), finalSlug, Number(sort_order) || 0, parent]);
  return NextResponse.json(await getCategories());
});
