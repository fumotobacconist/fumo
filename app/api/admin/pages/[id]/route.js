import { NextResponse } from 'next/server';
import { query, updatePage } from '@/lib/db';
import { handler } from '@/lib/api';

export const PUT = handler(async (req, { params }) => {
  const p = await updatePage(Number((await params).id), await req.json());
  return p ? NextResponse.json(p) : NextResponse.json({ error: 'Not found' }, { status: 404 });
});

export const DELETE = handler(async (_req, { params }) => {
  await query('DELETE FROM pages WHERE id = $1', [Number((await params).id)]);
  return NextResponse.json({ ok: true });
});
