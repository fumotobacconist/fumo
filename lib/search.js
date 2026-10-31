// Product search: ranked, typo-tolerant, works across languages.
// Every product field is weighted (name/brand matter most); each typed word is matched exactly,
// as a prefix ("xro" → "xros"), inside a word, or with a small typo ("xors", "vaporeso").
import { displayName } from './site.js';

const norm = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

// Splits words and also letter/number joins, so "xros6" and "xros 6" meet.
const tokenize = (s) => {
  const out = [];
  for (const w of norm(s).split(' ')) {
    if (!w) continue;
    out.push(w);
    const parts = w.split(/(?<=\p{L})(?=\p{N})|(?<=\p{N})(?=\p{L})/u);
    if (parts.length > 1) out.push(...parts);
  }
  return out;
};

// Edit distance where swapping two neighbouring letters ("xors" → "xros") counts as one typo.
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      if (d[i][j] < best) best = d[i][j];
    }
    if (best > max) return max + 1;
  }
  return d[a.length][b.length];
}

// How well one typed word matches one word in the product (0–1).
function wordMatch(q, w) {
  if (w === q) return 1;
  if (w.startsWith(q)) return q.length >= 2 ? 0.85 : 0.5;
  if (q.length >= 3 && w.includes(q)) return 0.6;
  if (q.length >= 4) {
    const max = q.length >= 8 ? 2 : 1;
    if (editDistance(q, w, max) <= max) return 0.5;
    if (q.length >= 5 && w.length > q.length && editDistance(q, w.slice(0, q.length), max) <= max) return 0.45; // typo in a prefix
  }
  return 0;
}

const FIELD_WEIGHTS = {
  name: 10, brand: 8, category: 5, badge: 4, subtitle: 4, notes: 3, specs: 2, description: 1,
};

function fieldsOf(p) {
  const tr = Object.values(p.translations || {});
  const pickTr = (k) => tr.map((t) => t?.[k]).filter(Boolean).join(' ');
  return {
    name: `${displayName(p)} ${p.name}`,
    brand: p.brand_name || '',
    category: [p.category_name, p.parent_name, ...(p.extra_categories || []).map((c) => c.name),
      ...Object.values(p.category_tr || {}).map((t) => t?.name), ...Object.values(p.parent_tr || {}).map((t) => t?.name)].filter(Boolean).join(' '),
    badge: `${p.badge || ''} ${Object.values(p.badge_tr || {}).map((t) => t?.name).filter(Boolean).join(' ')}`,
    subtitle: `${p.subtitle || ''} ${pickTr('subtitle')}`,
    notes: `${p.notes || ''} ${pickTr('notes')}`,
    specs: [p.weight, p.size, p.strength, p.nicotine, pickTr('weight'), pickTr('size'), pickTr('strength'), pickTr('nicotine')].filter(Boolean).join(' '),
    description: `${p.description || ''} ${pickTr('description')}`,
  };
}

// Builds a reusable index; call once per product list.
export function buildIndex(products) {
  return products.map((p) => {
    const f = fieldsOf(p);
    const fields = Object.entries(f).map(([k, text]) => ({ weight: FIELD_WEIGHTS[k], words: [...new Set(tokenize(text))], compact: norm(text).replace(/ /g, '') }));
    return { p, fields, name: norm(f.name), compactName: norm(f.name).replace(/ /g, '') };
  });
}

/** Ranked products for a query. Every word must match something; if nothing does, the closest partial matches are returned. */
export function searchProducts(index, query, limit = Infinity) {
  const q = norm(query);
  const words = [...new Set(tokenize(query))].filter((w) => !/^\p{L}$/u.test(w) || tokenize(query).length === 1);
  if (!words.length) return [];
  const compactQ = q.replace(/ /g, '');

  const scored = index.map((entry) => {
    let total = 0;
    let matched = 0;
    for (const w of words) {
      let best = 0;
      for (const field of entry.fields) {
        let m = 0;
        for (const fw of field.words) {
          const s = wordMatch(w, fw);
          if (s > m) m = s;
          if (m === 1) break;
        }
        if (!m && w.length >= 3 && field.compact.includes(w)) m = 0.55;
        if (m * field.weight > best) best = m * field.weight;
      }
      if (best > 0) matched++;
      total += best;
    }
    // Whole-phrase bonuses: "xros 6 mini" in the name beats scattered word hits.
    if (q && entry.name.includes(q)) total += 6;
    if (q && entry.name.startsWith(q)) total += 3;
    if (compactQ.length >= 3 && entry.compactName.includes(compactQ)) total += 4;
    return { entry, total, matched };
  });

  let hits = scored.filter((s) => s.matched === words.length && s.total > 0);
  if (!hits.length) hits = scored.filter((s) => s.matched >= Math.ceil(words.length / 2) && s.total > 0);
  return hits
    .sort((a, b) => b.total - a.total || a.entry.p.name.localeCompare(b.entry.p.name))
    .slice(0, limit)
    .map((s) => s.entry.p);
}
