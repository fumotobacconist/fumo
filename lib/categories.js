import { query, slugify } from './db';

// Validates a parent choice: one level of nesting only, never itself.
export async function checkParent(parentId, selfId = null) {
  if (!parentId) return null;
  const id = Number(parentId);
  if (id === selfId) throw new Error('A category can’t be inside itself');
  const [parent] = await query('SELECT id, parent_id FROM categories WHERE id = $1', [id]);
  if (!parent) throw new Error('Parent category not found');
  if (parent.parent_id) throw new Error('Subcategories can only go one level deep — pick a top-level category');
  if (selfId && (await query('SELECT 1 FROM categories WHERE parent_id = $1', [selfId])).length) {
    throw new Error('This category has its own subcategories, so it can’t become a subcategory');
  }
  return id;
}

export async function uniqueSlug(wanted, selfId = 0) {
  const base = slugify(wanted).slice(0, 60);
  if (base === 'all') throw new Error('“all” is reserved — pick another name');
  let slug = base;
  for (let n = 2; (await query('SELECT 1 FROM categories WHERE slug = $1 AND id <> $2', [slug, selfId])).length; n++) slug = `${base}-${n}`;
  return slug;
}
