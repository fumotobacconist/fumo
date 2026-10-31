import { NextResponse } from 'next/server';
import { createPage, getPages } from '@/lib/db';
import { handler } from '@/lib/api';

export const GET = handler(async () => NextResponse.json(await getPages()));
export const POST = handler(async (req) => NextResponse.json(await createPage(await req.json())));
