import { NextResponse } from 'next/server';
import { createProduct, getProducts } from '@/lib/db';
import { handler } from '@/lib/api';

export const GET = handler(async () => NextResponse.json(await getProducts({ includeHidden: true })));
export const POST = handler(async (req) => NextResponse.json(await createProduct(await req.json())));
