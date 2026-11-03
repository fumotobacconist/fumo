import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { TYPES, blobToken } from '@/lib/storage';
import { isAdmin } from '@/lib/api';

// Issues short-lived tokens so the admin browser uploads large files (videos) straight to Blob.
// Only a logged-in admin gets a token; Blob's "upload completed" callback carries no cookie and
// is verified by handleUpload's signature check instead.
export async function POST(req) {
  try {
    const body = await req.json();
    if (body?.type !== 'blob.upload-completed' && !(await isAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
