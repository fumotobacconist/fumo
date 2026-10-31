import fs from 'node:fs/promises';
import path from 'node:path';
import { LOCAL_DIR, TYPES } from '@/lib/storage';

const MIME = Object.fromEntries(Object.entries(TYPES).map(([m, e]) => [e, m]));

// Local development only: serves files uploaded while Blob storage isn't configured.
export async function GET(_req, { params }) {
  const name = path.basename((await params).file);
  const type = MIME[name.split('.').pop()];
  if (!type) return new Response('Not found', { status: 404 });
  try {
    const data = await fs.readFile(path.join(LOCAL_DIR, name));
    return new Response(data, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Uploaded SVGs may contain script; never let it run if the file is opened directly.
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
