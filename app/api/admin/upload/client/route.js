import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { TYPES, blobToken } from '@/lib/storage';

// Issues short-lived tokens so the admin browser uploads large files (videos) straight to Blob.
// Protected by middleware like every /api/admin route.
export async function POST(req) {
  try {
    const body = await req.json();
    const result = await handleUpload({
      request: req,
      body,
      token: blobToken(),
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: Object.keys(TYPES),
        maximumSizeInBytes: 200 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
