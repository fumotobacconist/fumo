import { NextResponse } from 'next/server';
import { query, updateProduct } from '@/lib/db';
import { handler } from '@/lib/api';
import { removeFile } from '@/lib/storage';

export const PUT = handler(async (req, { params }) => {
  const { id } = await params;
  const p = await updateProduct(Number(id), await req.json());
  return p ? NextResponse.json(p) : NextResponse.json({ error: 'Not found' }, { status: 404 });
});

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  const [p] = await query('DELETE FROM products WHERE id = $1 RETURNING image, image2', [Number(id)]);
  // Duplicated products share photos — only delete files nothing else uses.
  const unused = async (url) => url && !(await query('SELECT 1 FROM products WHERE image = $1 OR image2 = $1 LIMIT 1', [url])).length;
  if (p) await Promise.all([p.image, p.image2].map(async (url) => (await unused(url)) && removeFile(url)));
  return NextResponse.json({ ok: true });
});
