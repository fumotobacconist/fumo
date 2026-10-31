import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const TYPES = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
};
export const LOCAL_DIR = path.resolve(process.env.LOCAL_DB_DIR ? path.dirname(process.env.LOCAL_DB_DIR) : './.local-data', 'media');

// The store's read-write token. FUMO_* is the public store connected with the "FUMO" prefix;
// BLOB_* is Vercel's default prefix. Without a token, Blob falls back to OIDC with BLOB_STORE_ID.
export const blobToken = () => process.env.FUMO_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || undefined;
const blobAuth = () => (blobToken() ? { token: blobToken() } : {});
const blobConfigured = () => !!(blobToken() || process.env.BLOB_STORE_ID);
// Browser-to-Blob uploads (no 4.5 MB limit) need a read-write token.
export const clientUploads = () => !!blobToken();
export const SERVER_MAX = 4 * 1024 * 1024;

export async function saveFile(file) {
  const ext = TYPES[file.type];
  if (!ext) throw new Error('Use JPG, PNG, SVG, WebP, GIF, AVIF, MP4 or WebM');
  if (file.size > SERVER_MAX) throw new Error('File must be under 4 MB (or paste a link to a hosted file)');
  if (blobConfigured()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`site/file.${ext}`, file, { access: 'public', contentType: file.type, addRandomSuffix: true, ...blobAuth() });
    return blob.url;
  }
  if (process.env.VERCEL) throw new Error('Blob storage is not connected to this project');
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(5).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(LOCAL_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${name}`;
}

export async function removeFile(url) {
  if (!url) return;
  if (url.includes('.blob.vercel-storage.com') && blobConfigured()) {
    const { del } = await import('@vercel/blob');
    await del(url, blobAuth()).catch(() => {});
  }
}
