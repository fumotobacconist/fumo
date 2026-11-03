import { cache } from 'react';
import { LINK, catalogue } from './seed-data';
import { PAGE_TEXT, PRODUCT_TEXT, cleanTranslations } from './i18n-content';
import { DEFAULT_SITE, RESERVED_SLUGS, brandPath, categoryPath, mergeSite, productPath, sanitizeSite, slugify } from './site';

/* ---------- driver: Neon in production, embedded Postgres (PGlite) for local dev ---------- */

let driverPromise;
function driver() {
  return (driverPromise ||= (async () => {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (url) {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(url);
      return {
        query: (text, params = []) => sql.query(text, params),
        batch: (items) => sql.transaction(items.map(([t, p = []]) => sql.query(t, p))),
      };
    }
    if (process.env.VERCEL) throw new Error('DATABASE_URL is not set — connect a Neon database to the Vercel project');
    const { PGlite } = await import('@electric-sql/pglite');
    const dir = process.env.LOCAL_DB_DIR || './.local-data/pg';
    (await import('node:fs')).mkdirSync(dir, { recursive: true });
    const pg = await PGlite.create(dir);
    return {
      query: async (text, params = []) => (await pg.query(text, params)).rows,
      batch: (items) => pg.transaction(async (tx) => {
        const out = [];
        for (const [t, p = []] of items) out.push((await tx.query(t, p)).rows);
        return out;
      }),
    };
  })().catch((e) => {
    driverPromise = undefined;
    throw e;
  }));
}

/* ---------- schema ---------- */

let ready;
// Creates/updates tables on first use, so a fresh database needs no manual setup.
function ensureSchema() {
  return (ready ||= (async () => {
    const db = await driver();
    await db.batch([
      [`CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL DEFAULT 0
      )`],
      [`ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT ''`],
      [`ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`],
      [`CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        description TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        weight TEXT NOT NULL DEFAULT '',
        strength TEXT NOT NULL DEFAULT '',
        price TEXT NOT NULL DEFAULT '',
        badge TEXT NOT NULL DEFAULT '',
        image TEXT NOT NULL DEFAULT '',
        redirect_url TEXT NOT NULL DEFAULT '',
        button_label TEXT NOT NULL DEFAULT '',
        featured INTEGER NOT NULL DEFAULT 0,
        visible INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        clicks INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`],
      [`ALTER TABLE products ADD COLUMN IF NOT EXISTS image2 TEXT NOT NULL DEFAULT ''`],
      [`ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price TEXT NOT NULL DEFAULT ''`],
      [`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '')`],
      [`CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT 'accent',
        sort_order INTEGER NOT NULL DEFAULT 0,
        translations JSONB NOT NULL DEFAULT '{}'::jsonb
      )`],
      [`CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0
      )`],
      [`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL`],
      [`ALTER TABLE products ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb`],
      [`ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle TEXT NOT NULL DEFAULT ''`],
      [`ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT NOT NULL DEFAULT ''`],
      [`ALTER TABLE products ADD COLUMN IF NOT EXISTS nicotine TEXT NOT NULL DEFAULT ''`],
      [`ALTER TABLE categories ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb`],
      [`ALTER TABLE brands ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb`],
      [`ALTER TABLE brands ADD COLUMN IF NOT EXISTS visible INTEGER NOT NULL DEFAULT 1`],
      [`ALTER TABLE badges ADD COLUMN IF NOT EXISTS visible INTEGER NOT NULL DEFAULT 1`],
      [`CREATE TABLE IF NOT EXISTS product_categories (
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (product_id, category_id)
      )`],
      [`CREATE TABLE IF NOT EXISTS pages (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        sections TEXT NOT NULL DEFAULT '[]',
        show_title INTEGER NOT NULL DEFAULT 1,
        published INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`],
      [`ALTER TABLE pages ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb`],
      // Failed admin logins per IP, shared by every server instance (see app/api/admin/login).
      [`CREATE TABLE IF NOT EXISTS login_attempts (
        ip TEXT PRIMARY KEY,
        fails INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`],
    ]);
    // A ready-to-fill "Find a store" draft, created once.
    const page = await db.query(`INSERT INTO settings (key, value) VALUES ('pages_seeded', '1') ON CONFLICT (key) DO NOTHING RETURNING key`);
    if (page.length) {
      await db.query(
        `INSERT INTO pages (slug, title, description, sections, published) VALUES ($1, $2, $3, $4, 0) ON CONFLICT (slug) DO NOTHING`,
        ['find-a-store', 'Find a store', 'Visit the FUMO store.', JSON.stringify([
          { id: 'intro', type: 'text', enabled: true, heading: '', body: 'Come and try our blends in person — our team is happy to help you pick the right one.' },
          { id: 'stores', type: 'store', enabled: true, title: '', items: [{ name: 'FUMO Store', image: '', address: '', hours: 'Mon–Sun · 11:00–22:00', phone: '', map_link: '', show_map: true }] },
        ])]
      );
    }
    // First run only: the flag row makes sure exactly one instance loads the starter catalogue, once.
    const won = await db.query(`INSERT INTO settings (key, value) VALUES ('catalogue_seeded', '1') ON CONFLICT (key) DO NOTHING RETURNING key`);
    if (won.length) await seed(db);
    // One-time: "Strength" used to double as nicotine ("2.4% nicotine"). Move pure percentages to the new field.
    const split = await db.query(`INSERT INTO settings (key, value) VALUES ('nicotine_split', '1') ON CONFLICT (key) DO NOTHING RETURNING key`);
    if (split.length) {
      await db.query(
        `UPDATE products SET nicotine = trim(regexp_replace(strength, '\\s*nicotine\\s*$', '', 'i')), strength = ''
         WHERE nicotine = '' AND strength ~* '^\\s*[0-9]+([.,][0-9]+)?\\s*%\\s*(nicotine)?\\s*$'`
      );
    }
    // One-time: badges become a managed list (defaults + whatever products already use), and the
    // "New arrivals" / "Bestsellers" links switch from date / featured to the matching badge.
    const badged = await db.query(`INSERT INTO settings (key, value) VALUES ('badges_seeded', '1') ON CONFLICT (key) DO NOTHING RETURNING key`);
    if (badged.length) await seedBadges(db);
  })().catch((e) => {
    ready = undefined;
    throw e;
  }));
}

const DEFAULT_BADGES = [
  ['NEW', 'accent'], ['BESTSELLER', 'accent'], ['COMING SOON', '#9fd6ff'],
  ['LIMITED', 'accent2'], ['PREMIUM', 'accent2'], ['SALE', '#ff6b6b'],
];

async function seedBadges(db) {
  const used = (await db.query(`SELECT DISTINCT upper(trim(badge)) AS name FROM products WHERE trim(badge) <> ''`)).map((r) => r.name);
  const names = [...DEFAULT_BADGES.map(([n]) => n), ...used.filter((n) => !DEFAULT_BADGES.some(([d]) => d === n))];
  let i = 0;
  for (const name of names) {
    const color = DEFAULT_BADGES.find(([n]) => n === name)?.[1] || (/limited|premium|signature/i.test(name) ? 'accent2' : 'accent');
    await db.query('INSERT INTO badges (name, slug, color, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING', [name, slugify(name), color, i++]);
  }
  await db.query(`UPDATE products SET badge = upper(trim(badge)) WHERE badge <> upper(trim(badge))`);
  const [row] = await db.query(`SELECT value FROM settings WHERE key = 'site'`);
  if (row?.value) {
    const next = row.value.split('"/c/all?sort=new"').join('"/c/all?badge=new"').split('"/c/all?featured=1"').join('"/c/all?badge=bestseller"');
    if (next !== row.value) await db.query(`UPDATE settings SET value = $1 WHERE key = 'site'`, [next]);
  }
}

async function seed(db) {
  let ci = 0;
  for (const [cat, items] of Object.entries(catalogue)) {
    const [{ id }] = await db.query(
      'INSERT INTO categories (name, slug, sort_order) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [cat, slugify(cat), ci++]
    );
    await db.batch(
      items.map((p, i) => [
        `INSERT INTO products (name, category_id, badge, notes, subtitle, weight, strength, price, description, featured, sort_order, redirect_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        // Hookah blends list flavours; other categories list cut / specs, which is a subtitle.
        [p[0], id, p[1], cat === 'Hookah Tobacco' ? p[2] : '', cat === 'Hookah Tobacco' ? '' : p[2], p[3], p[4], p[5], p[6], p[7], i, LINK],
      ])
    );
  }
}

export async function query(text, params = []) {
  await ensureSchema();
  return (await driver()).query(text, params);
}

export async function batch(items) {
  await ensureSchema();
  return (await driver()).batch(items);
}

/* ---------- site document ---------- */

// Settings saved by the first version of the site, carried over the first time the new layout loads.
function fromLegacy(old) {
  const s = structuredClone(DEFAULT_SITE);
  if (old.instagram_url) {
    s.footer.cta.button_link = old.instagram_url;
    s.footer.columns[2].links[0].href = old.instagram_url;
    s.sidebar.secondary[0].href = old.instagram_url;
  }
  if (old.whatsapp_url) {
    s.footer.columns[2].links[1].href = old.whatsapp_url;
    s.sidebar.secondary[1].href = old.whatsapp_url;
  }
  if (old.warning_text) s.footer.warning = old.warning_text;
  if (old.default_buy_label) s.product_page.buy_label = old.default_buy_label;
  if (old.age_gate === '0') s.age_gate.enabled = false;
  if (old.hero_tagline) s.home.sections[0].heading = old.hero_tagline.replace(/\.$/, '');
  return s;
}

export const getSite = cache(async () => {
  const rows = await query('SELECT key, value FROM settings');
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  let stored = null;
  try {
    stored = map.site ? JSON.parse(map.site) : null;
  } catch {}
  return mergeSite(DEFAULT_SITE, stored || fromLegacy(map));
});

export async function saveSite(input) {
  const clean = sanitizeSite(mergeSite(DEFAULT_SITE, input));
  await query(`INSERT INTO settings (key, value) VALUES ('site', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [JSON.stringify(clean)]);
  return clean;
}

/* ---------- custom pages ---------- */

const parsePage = (p) => p && { ...p, sections: (() => { try { return JSON.parse(p.sections); } catch { return []; } })() };

export async function getPages() {
  return (await query('SELECT * FROM pages ORDER BY title')).map(parsePage);
}

export const getPageBySlug = cache(async (slug) => parsePage((await query('SELECT * FROM pages WHERE slug = $1', [slug]))[0]));

export function cleanSlug(v) {
  const slug = slugify(v).slice(0, 80);
  if (RESERVED_SLUGS.includes(slug)) throw new Error(`“/${slug}” is used by the website itself — pick another address`);
  return slug;
}

function normalizePage(input) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Page title is required');
  return {
    title,
    slug: cleanSlug(input.slug || title),
    description: String(input.description || '').trim().slice(0, 300),
    sections: JSON.stringify(sanitizeSite(Array.isArray(input.sections) ? input.sections : [])),
    show_title: input.show_title === false || input.show_title === 0 ? 0 : 1,
    published: input.published ? 1 : 0,
    translations: JSON.stringify(cleanTranslations(input.translations, PAGE_TEXT)),
  };
}

async function slugTaken(slug, id = 0) {
  return (await query('SELECT 1 FROM pages WHERE slug = $1 AND id <> $2', [slug, id])).length > 0;
}

export async function createPage(input) {
  const p = normalizePage(input);
  if (await slugTaken(p.slug)) throw new Error(`A page at /${p.slug} already exists`);
  const [row] = await query(
    'INSERT INTO pages (title, slug, description, sections, show_title, published, translations) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [p.title, p.slug, p.description, p.sections, p.show_title, p.published, p.translations]
  );
  return parsePage(row);
}

export async function updatePage(id, input) {
  const p = normalizePage(input);
  if (await slugTaken(p.slug, id)) throw new Error(`A page at /${p.slug} already exists`);
  const [row] = await query(
    'UPDATE pages SET title = $2, slug = $3, description = $4, sections = $5, show_title = $6, published = $7, translations = $8, updated_at = now() WHERE id = $1 RETURNING *',
    [id, p.title, p.slug, p.description, p.sections, p.show_title, p.published, p.translations]
  );
  return parsePage(row);
}

/* ---------- catalogue ---------- */

// SQL condition: product p is in category `cat` — as its main or an extra category, directly or via a subcategory.
const IN_CATEGORY = (cat) => `(
  p.category_id IN (SELECT id FROM categories WHERE id = ${cat} OR parent_id = ${cat})
  OR EXISTS (SELECT 1 FROM product_categories x JOIN categories xc ON xc.id = x.category_id
             WHERE x.product_id = p.id AND (xc.id = ${cat} OR xc.parent_id = ${cat}))
)`;

// A product is on the site when it is visible itself and neither its brand nor its badge is hidden.
export const SHOWN = `(p.visible = 1
  AND NOT EXISTS (SELECT 1 FROM brands hb WHERE hb.id = p.brand_id AND hb.visible = 0)
  AND NOT EXISTS (SELECT 1 FROM badges hd WHERE hd.name = upper(trim(p.badge)) AND trim(p.badge) <> '' AND hd.visible = 0))`;

// Categories have at most one level of nesting: top-level categories and their subcategories.
// Counts and cover photos include products in subcategories.
export const getCategories = cache(async () => {
  const rows = await query(
    `SELECT c.*, pc.slug AS parent_slug, pc.name AS parent_name, pc.translations AS parent_tr,
       (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id) AS own_count,
       (SELECT COUNT(*)::int FROM products p WHERE ${IN_CATEGORY('c.id')}) AS product_count,
       (SELECT p.image FROM products p WHERE ${IN_CATEGORY('c.id')} AND ${SHOWN} AND p.image <> ''
          ORDER BY p.featured DESC, p.sort_order LIMIT 1) AS cover
     FROM categories c LEFT JOIN categories pc ON pc.id = c.parent_id
     ORDER BY COALESCE(pc.sort_order, c.sort_order), COALESCE(pc.id, c.id), c.parent_id NULLS FIRST, c.sort_order, c.id`
  );
  return rows.map((c) => ({ ...c, path: categoryPath(c) }));
});

const PRODUCT_SELECT = `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
    pc.name AS parent_name, pc.slug AS parent_slug, pc.id AS parent_id,
    c.translations AS category_tr, pc.translations AS parent_tr,
    b.name AS brand_name, b.slug AS brand_slug, b.visible AS brand_visible,
    bd.slug AS badge_slug, bd.visible AS badge_visible, bd.color AS badge_color, bd.translations AS badge_tr,
    (SELECT COALESCE(json_agg(json_build_object('id', xc.id, 'name', xc.name, 'slug', xc.slug, 'parent_slug', xp.slug, 'translations', xc.translations) ORDER BY xc.id), '[]'::json)
       FROM product_categories x JOIN categories xc ON xc.id = x.category_id LEFT JOIN categories xp ON xp.id = xc.parent_id
       WHERE x.product_id = p.id) AS extra_categories
  FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN categories pc ON pc.id = c.parent_id
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN badges bd ON bd.name = upper(trim(p.badge)) AND trim(p.badge) <> ''`;

export const getBadges = cache(() =>
  query(
    `SELECT bd.*, (SELECT COUNT(*)::int FROM products p WHERE upper(trim(p.badge)) = bd.name) AS product_count
     FROM badges bd ORDER BY bd.sort_order, bd.name`
  )
);

export const getBrands = cache(async () => {
  const rows = await query(
    `SELECT b.*, (SELECT COUNT(*)::int FROM products p WHERE p.brand_id = b.id) AS product_count,
       (SELECT COUNT(*)::int FROM products p WHERE p.brand_id = b.id AND ${SHOWN}) AS visible_count,
       (SELECT p.image FROM products p WHERE p.brand_id = b.id AND ${SHOWN} AND p.image <> '' ORDER BY p.featured DESC, p.sort_order LIMIT 1) AS cover
     FROM brands b ORDER BY b.sort_order, b.name`
  );
  return rows.map((b) => ({ ...b, path: brandPath(b) }));
});

export const getProducts = cache(({ includeHidden = false } = {}) =>
  query(`${PRODUCT_SELECT} ${includeHidden ? '' : `WHERE ${SHOWN}`} ORDER BY COALESCE(pc.sort_order, c.sort_order) NULLS LAST, c.sort_order, p.sort_order, p.id`)
);

export async function getProduct(id) {
  const [p] = await query(`${PRODUCT_SELECT} WHERE p.id = $1 AND ${SHOWN}`, [id]);
  return p || null;
}

export { brandPath, categoryPath, productPath, slugify };

// Only http(s) links are allowed so a product button can never run script.
export function cleanUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

const cleanImage = (u) => (/^\/media\/[\w.-]+$/.test(String(u || '')) ? u : cleanUrl(u));

const PRODUCT_FIELDS = ['name', 'category_id', 'brand_id', 'translations', 'description', 'subtitle', 'notes', 'weight', 'size', 'strength', 'nicotine', 'price', 'compare_price', 'badge', 'image', 'image2', 'redirect_url', 'button_label', 'featured', 'visible', 'sort_order'];

export function normalizeProduct(input) {
  const p = {};
  for (const f of PRODUCT_FIELDS) if (f in input) p[f] = input[f];
  if ('name' in p) {
    p.name = String(p.name || '').trim();
    if (!p.name) throw new Error('Name is required');
  }
  if ('redirect_url' in p) {
    const u = cleanUrl(p.redirect_url);
    if (u === null) throw new Error('Redirect URL must start with http:// or https://');
    p.redirect_url = u;
  }
  for (const f of ['image', 'image2']) {
    if (!(f in p)) continue;
    const img = cleanImage(p[f]);
    if (img === null) throw new Error('Invalid image');
    p[f] = img;
  }
  if ('category_id' in p) p.category_id = p.category_id ? Number(p.category_id) : null;
  if ('brand_id' in p) p.brand_id = p.brand_id ? Number(p.brand_id) : null;
  if ('translations' in p) p.translations = JSON.stringify(cleanTranslations(p.translations, PRODUCT_TEXT));
  for (const f of ['featured', 'visible']) if (f in p) p[f] = p[f] ? 1 : 0;
  if ('sort_order' in p) p.sort_order = Number(p.sort_order) || 0;
  for (const f of ['description', 'subtitle', 'notes', 'weight', 'size', 'strength', 'nicotine', 'price', 'compare_price', 'badge', 'button_label']) if (f in p) p[f] = String(p[f] ?? '').trim();
  if ('badge' in p) p.badge = p.badge.toUpperCase();
  return p;
}

// Replaces a product's extra categories (never including its main category).
async function setExtraCategories(productId, ids, mainId) {
  if (!Array.isArray(ids)) return;
  const clean = [...new Set(ids.map(Number).filter((n) => Number.isInteger(n) && n > 0 && n !== Number(mainId)))];
  await batch([
    ['DELETE FROM product_categories WHERE product_id = $1', [productId]],
    ...clean.map((cid) => ['INSERT INTO product_categories (product_id, category_id) SELECT $1, id FROM categories WHERE id = $2 ON CONFLICT DO NOTHING', [productId, cid]]),
  ]);
}

export async function createProduct(input) {
  const p = normalizeProduct({ visible: 1, ...input });
  if (!p.name) throw new Error('Name is required');
  const keys = Object.keys(p);
  const [row] = await query(
    `INSERT INTO products (${keys.join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`,
    keys.map((k) => p[k])
  );
  await setExtraCategories(row.id, input.extra_category_ids, row.category_id);
  return row;
}

export async function updateProduct(id, input) {
  const p = normalizeProduct(input);
  const keys = Object.keys(p);
  const [row] = keys.length
    ? await query(`UPDATE products SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...keys.map((k) => p[k])])
    : await query('SELECT * FROM products WHERE id = $1', [id]);
  if (row) await setExtraCategories(id, input.extra_category_ids, row.category_id);
  return row;
}

export { cleanImage };
