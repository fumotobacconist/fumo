// Copies every image/video the database links to in another Blob store into this project's store,
// then points the database at the copies. The old files are left untouched.
//
//   node --env-file=.env.move scripts/move-images.mjs          # dry run: lists what would move
//   node --env-file=.env.move scripts/move-images.mjs --apply  # copies files and updates links
//
// .env.move needs DATABASE_URL and BLOB_READ_WRITE_TOKEN (the NEW store's token).
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';

const apply = process.argv.includes('--apply');
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!url || !token) throw new Error('Set DATABASE_URL and BLOB_READ_WRITE_TOKEN');

const sql = neon(url);
// The store id is the part of the token after vercel_blob_rw_; its files live on <id>.public.blob…
const newHost = `${token.split('_')[3].toLowerCase()}.public.blob.vercel-storage.com`;
const BLOB_URL = /https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"'\\)<>]+/gi;

// Every text column in the app's tables.
const columns = await sql.query(
  `SELECT table_name, column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND data_type IN ('text', 'character varying')`
);

const found = new Set();
for (const { table_name: t, column_name: c } of columns) {
  const rows = await sql.query(`SELECT "${c}" AS v FROM "${t}" WHERE "${c}" LIKE '%.public.blob.vercel-storage.com/%'`);
  for (const { v } of rows) for (const m of v.match(BLOB_URL) || []) found.add(m);
}
const toMove = [...found].filter((u) => new URL(u).host !== newHost);
console.log(`${found.size} linked files, ${toMove.length} in another store${apply ? '' : ' (dry run)'}`);

let moved = 0;
for (const old of toMove) {
  if (!apply) { console.log('  ', old); continue; }
  const res = await fetch(old);
  if (!res.ok) { console.warn(`  skip ${old}: ${res.status}`); continue; }
  const type = res.headers.get('content-type') || undefined;
  const pathname = decodeURIComponent(new URL(old).pathname.slice(1));
  const blob = await put(pathname, Buffer.from(await res.arrayBuffer()), {
    access: 'public', contentType: type, addRandomSuffix: false, allowOverwrite: true, token,
  });
  for (const { table_name: t, column_name: c } of columns) {
    await sql.query(`UPDATE "${t}" SET "${c}" = replace("${c}", $1, $2) WHERE "${c}" LIKE '%' || $1 || '%'`, [old, blob.url]);
  }
  console.log(`  ${++moved}/${toMove.length} ${pathname}`);
}

if (apply && moved) {
  // Tell the running site its cached data is stale.
  await sql.query(
    `INSERT INTO settings (key, value) VALUES ('content_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [Date.now().toString(36)]
  );
}
console.log(apply ? `Done: ${moved} moved.` : 'Run again with --apply to copy them.');
