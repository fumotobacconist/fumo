import { NextResponse } from 'next/server';
import { handler } from '@/lib/api';
import { clientUploads, saveFile } from '@/lib/storage';

// Tells the admin which upload path is available.
export const GET = handler(async () => NextResponse.json({ client: clientUploads() }));

export const POST = handler(async (req) => {
  const file = (await req.formData()).get('file');
  if (!file || typeof file === 'string') throw new Error('No file');
  return NextResponse.json({ url: await saveFile(file) });
});
