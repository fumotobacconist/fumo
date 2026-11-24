// Shrinks every photo the database links to (longest side 1800px, WebP), uploads the result to this
// project's Blob store and points the database at it. Photos still in another store are copied over
// even when they can't be made smaller. Original files are left untouched.
//
//   node --env-file=.env.move scripts/shrink-images.mjs          # dry run: sizes before / after
//   node --env-file=.env.move scripts/shrink-images.mjs --apply  # upload and update links
//
// .env.move needs DATABASE_URL and BLOB_READ_WRITE_TOKEN (this project's store).
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';
import sharp from 'sharp';

const apply = process.argv.includes('--apply');
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!url || !token) throw new Error('Set DATABASE_URL and BLOB_READ_WRITE_TOKEN');

const MAX_SIDE = 1800;
const sql = neon(url);
// The store id is the part of the token after vercel_blob_rw_; its files live on <id>.public.blob…
const ownHost = `${token.split('_')[3].toLowerCase()}.public.blob.vercel-storage.com`;
const BLOB_URL = /https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"'\\)<>]+/gi;
const PHOTO = /\.(jpe?g|png|webp|avif)$/i;

const columns = await sql.query(
  `SELECT table_name, column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND data_type IN ('text', 'character varying')`
);
const found = new Set();
for (const { table_name: t, column_name: c } of columns) {
  const rows = await sql.query(`SELECT "${c}" AS v FROM "${t}" WHERE "${c}" LIKE '%.public.blob.vercel-storage.com/%'`);
  for (const { v } of rows) for (const m of v.match(BLOB_URL) || []) if (PHOTO.test(new URL(m).pathname)) found.add(m);
}
console.log(`${found.size} photos linked${apply ? '' : ' (dry run)'}`);

const kb = (n) => `${Math.round(n / 1024)} KB`;
let before = 0, after = 0, changed = 0, n = 0;
for (const old of found) {
  n++;
  const res = await fetch(old);
  if (!res.ok) { console.warn(`  ${n}. skip ${old}: ${res.status}`); continue; }
  const original = Buffer.from(await res.arrayBuffer());
  let body = original;
  let type = res.headers.get('content-type') || undefined;
  try {
    const small = await sharp(original).rotate().resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    if (small.length < original.length * 0.9) { body = small; type = 'image/webp'; }
  } catch (e) {
    console.warn(`  ${n}. can't read ${old}: ${e.message}`);
  }
  const foreign = new URL(old).host !== ownHost;
  before += original.length;
  after += body.length;
  if (body === original && !foreign) continue; // already small and already in this store
  changed++;
  console.log(`  ${n}. ${kb(original.length)} → ${kb(body.length)}${foreign ? ' (copied to this store)' : ''}`);
  if (!apply) continue;
  const name = decodeURIComponent(new URL(old).pathname.slice(1)).replace(/\.[^.]+$/, '');
  const blob = await put(`${name}.${type === 'image/webp' ? 'webp' : old.split('.').pop()}`, body, {
    access: 'public', contentType: type, addRandomSuffix: true, token,
  });
  for (const { table_name: t, column_name: c } of columns) {
    await sql.query(`UPDATE "${t}" SET "${c}" = replace("${c}", $1, $2) WHERE "${c}" LIKE '%' || $1 || '%'`, [old, blob.url]);
  }
}

if (apply && changed) {
  // Tell the running site its cached data is stale.
  await sql.query(
    `INSERT INTO settings (key, value) VALUES ('content_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [Date.now().toString(36)]
  );
}
console.log(`${changed} of ${found.size} photos ${apply ? 'updated' : 'would change'}; total ${kb(before)} → ${kb(after)}`);
if (!apply) console.log('Run again with --apply to upload and update the links.');
