import { NextResponse } from 'next/server';
import { getSite, saveSite } from '@/lib/db';
import { handler } from '@/lib/api';

export const GET = handler(async () => NextResponse.json(await getSite()));
export const PUT = handler(async (req) => NextResponse.json(await saveSite(await req.json())));
