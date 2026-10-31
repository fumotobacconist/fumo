import { NextResponse } from 'next/server';
import { SHOWN, query } from '@/lib/db';

// Product "Buy" buttons point here: count the click, then send the visitor to the product's link.
export async function GET(req, { params }) {
  const id = parseInt((await params).id, 10);
  if (!Number.isFinite(id)) return NextResponse.redirect(new URL('/', req.url), 302);
  const [p] = await query(
    `UPDATE products p SET clicks = clicks + 1 WHERE p.id = $1 AND ${SHOWN} AND p.redirect_url <> '' RETURNING p.redirect_url`,
    [id]
  );
  return NextResponse.redirect(p ? p.redirect_url : new URL('/', req.url), 302);
}
