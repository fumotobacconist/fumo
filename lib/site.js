// The whole editable website (except products/categories) lives in one JSON document.
// Stored values are merged over these defaults, so new fields always have a value.

export const SECTION_TYPES = {
  hero: 'Hero banner',
  products: 'Product grid',
  collections: 'Category tiles',
  banner: 'Promo banner',
  marquee: 'Scrolling text',
  text: 'Text block',
  media: 'Image / video',
  store: 'Store locations',
  gallery: 'Photo gallery',
  brands: 'Brand tiles',
  stories: 'Image & text rows',
};

// Default content for a newly added section of each type.
export const NEW_SECTION = {
  hero: { heading: 'New headline', subheading: '', button_label: 'Shop now', button_link: '/c/all', media: '', bg: '#ffe600', color: '#111111', height: 'medium' },
  products: { title: 'Products', source: 'all', limit: 8 },
  collections: { title: 'Shop by category', items: [] },
  banner: { heading: 'Big news!', text: '', button_label: 'Shop now', button_link: '/c/all', media: '', bg: '#e8892b', color: '#111111' },
  marquee: { items: ['FUMO'], bg: '#111111', color: '#ffe600' },
  text: { heading: 'Our story', body: '' },
  media: { media: '', caption: '', link: '' },
  store: { title: '', items: [{ name: 'FUMO Store', image: '', address: '', hours: '', phone: '', map_link: '', show_map: true }] },
  gallery: { title: '', columns: 3, items: [] },
  brands: { title: 'Shop by brand' },
  stories: { title: '', items: [{ title: 'A story worth telling', text: 'Write a few lines here…', image: '', button_label: '', link: '' }] },
};

// Page addresses that belong to the app itself.
export const RESERVED_SLUGS = ['en', 'hy', 'ru', 'admin', 'api', 'b', 'c', 'p', 'go', 'media', 'search', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml'];

export const DEFAULT_SITE = {
  brand: {
    name: 'FUMO',
    logo: '', // empty = built-in FUMO wordmark
    logo_height: 58, // px, desktop
    logo_height_mobile: 46, // px, phones
    logo_offset: 0, // px; positive pushes the logo down over the header line
    accent: '#ffe600',
    accent2: '#e8892b',
    ink: '#111111',
    bg: '#ffffff',
    tile: '#f2f2f2',
  },
  seo: {
    title: 'FUMO — Premium Tobacco & Blends',
    description: 'Premium hookah tobacco, pipe blends and accessories. Where every draw tells a story.',
  },
  announcement: {
    enabled: true,
    messages: ['Premium tobacco & blends · Order via Instagram or WhatsApp', 'For adults 18+ only'],
    link: '',
    bg: '#111111',
    color: '#ffe600',
  },
  header: {
    shop_label: 'Shop', // the button that opens the sidebar
    nav: [
      { label: 'Hookah', href: '/c/hookah-tobacco' },
      { label: 'Pipe', href: '/c/pipe-tobacco' },
      { label: 'Accessories', href: '/c/accessories' },
      { label: 'New', href: '/c/all?badge=new' },
      { label: 'Bestsellers', href: '/c/all?badge=bestseller' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  sidebar: {
    search_placeholder: 'L👀king for something?',
    primary: [
      { label: 'New arrivals', href: '/c/all?badge=new' },
      { label: 'Hookah tobacco', href: '/c/hookah-tobacco' },
      { label: 'Pipe tobacco', href: '/c/pipe-tobacco' },
      { label: 'Accessories', href: '/c/accessories' },
      { label: 'Bestsellers', href: '/c/all?badge=bestseller' },
      { label: 'Shop all', href: '/c/all' },
    ],
    tiles: [
      { label: 'Hookah', image: '', href: '/c/hookah-tobacco' },
      { label: 'Bundles', image: '', href: '/c/accessories' },
    ],
    secondary: [
      { label: 'Order on Instagram', href: 'https://www.instagram.com/', icon: 'instagram' },
      { label: 'Chat on WhatsApp', href: 'https://wa.me/', icon: 'chat' },
      { label: 'Wholesale inquiries', href: '#contact', icon: 'box' },
      { label: 'Find us', href: '#contact', icon: 'pin' },
    ],
  },
  home: {
    sections: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        heading: 'Where every draw tells a story',
        subheading: 'Premium hookah tobacco, pipe blends & accessories',
        button_label: 'Shop blends',
        button_link: '/c/all',
        media: '',
        bg: '#ffe600',
        color: '#111111',
        height: 'medium',
      },
      { id: 'fresh', type: 'products', enabled: true, title: 'Fresh drops', source: 'featured', limit: 8 },
      { id: 'ticker', type: 'marquee', enabled: true, items: ['Hookah', 'Pipe', 'Accessories', 'Since day one', '18+ only'], bg: '#111111', color: '#ffe600' },
      { id: 'cats', type: 'collections', enabled: true, title: 'Shop by category', items: [] },
      {
        id: 'bundle',
        type: 'banner',
        enabled: true,
        heading: 'Starter bundle!',
        text: 'Hookah, coals, hose and a 250g blend — everything for your first FUMO session.',
        button_label: 'Shop now',
        button_link: '/c/accessories',
        media: '',
        bg: '#e8892b',
        color: '#111111',
      },
      { id: 'all', type: 'products', enabled: true, title: 'All blends', source: 'all', limit: 12 },
    ],
  },
  product_page: {
    buy_label: 'Buy now',
    note: 'You will be redirected to our official store to complete your order.',
  },
  footer: {
    bg: '#ffe600',
    color: '#111111',
    media: '', // background video / gif / image
    media_opacity: 1,
    layers: [
      { image: 'builtin:smoke-a', speed: 70, opacity: 0.9 },
      { image: 'builtin:smoke-b', speed: 45, opacity: 0.75 },
    ],
    mascot: '', // image peeking over the top edge; empty = FUMO leaf
    columns: [
      { title: 'Shop', links: [
        { label: 'Hookah tobacco', href: '/c/hookah-tobacco' },
        { label: 'Pipe tobacco', href: '/c/pipe-tobacco' },
        { label: 'Accessories', href: '/c/accessories' },
        { label: 'Shop all', href: '/c/all' },
      ] },
      { title: 'Support', links: [
        { label: 'How to order', href: '#contact' },
        { label: 'Wholesale', href: '#contact' },
        { label: 'Contact', href: '#contact' },
      ] },
      { title: 'Follow us', links: [
        { label: '@fumo.am Instagram', href: 'https://www.instagram.com/' },
        { label: 'WhatsApp', href: 'https://wa.me/' },
      ] },
    ],
    cta: {
      enabled: true,
      title: 'Stay in the smoke',
      text: 'New blends, restocks and limited drops — follow us so you never miss one.',
      button_label: 'Follow on Instagram',
      button_link: 'https://www.instagram.com/',
    },
    warning: 'This product contains tobacco. Smoking is harmful to health. For adults 18+ only.',
    copyright: '© FUMO. All rights reserved.',
    bottom_links: [],
  },
  age_gate: {
    enabled: true,
    title: 'Are you 18 or older?',
    text: 'This website contains tobacco products and is intended for adults only.',
    yes: 'Yes, I am 18+',
    no: 'No, leave',
    no_link: 'https://www.google.com', // where visitors go after answering “No”
  },
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function mergeSite(defaults, stored) {
  if (!isObj(stored)) return structuredClone(defaults);
  const out = {};
  for (const k of new Set([...Object.keys(defaults), ...Object.keys(stored)])) {
    const d = defaults[k];
    const s = stored[k];
    if (s === undefined) out[k] = structuredClone(d);
    else if (isObj(d) && isObj(s)) out[k] = mergeSite(d, s);
    else out[k] = s;
  }
  return out;
}

// Link fields: site paths, anchors, http(s), mailto/tel. Media fields: uploaded files or http(s).
const LINK_KEY = /(^|_)(href|link)$/;
const MEDIA_KEY = /^(logo|image|media|mascot)$/;
const COLOR_KEY = /^(bg|color|accent|accent2|ink|tile)$/;

export function checkLink(v) {
  const s = String(v ?? '').trim();
  if (!s || s.startsWith('#') || (s.startsWith('/') && !s.startsWith('//'))) return s;
  if (/^(mailto:|tel:)/i.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch {}
  return null;
}

export function checkMedia(v) {
  const s = String(v ?? '').trim();
  if (!s || s.startsWith('builtin:') || /^\/media\/[\w.-]+$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString();
  } catch {}
  return null;
}

// Validates every link, media and colour field anywhere in the document.
export function sanitizeSite(value, path = 'site') {
  if (Array.isArray(value)) return value.slice(0, 100).map((v, i) => sanitizeSite(v, `${path}[${i}]`));
  if (!isObj(value)) return typeof value === 'string' ? value.slice(0, 5000) : value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string' && LINK_KEY.test(k)) {
      const c = checkLink(v);
      if (c === null) throw new Error(`Invalid link “${v}” — use a full https:// address or a path like /c/all`);
      out[k] = c;
    } else if (typeof v === 'string' && MEDIA_KEY.test(k)) {
      const c = checkMedia(v);
      if (c === null) throw new Error(`Invalid media address “${v}”`);
      out[k] = c;
    } else if (typeof v === 'string' && COLOR_KEY.test(k)) {
      if (v && !/^#[0-9a-f]{3,8}$/i.test(v)) throw new Error(`Invalid colour “${v}” — use a hex value like #ffe600`);
      out[k] = v;
    } else {
      out[k] = sanitizeSite(v, `${path}.${k}`);
    }
  }
  return out;
}

export const isVideo = (src) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src || '');

export function slugify(s) {
  return (
    String(s)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

// Name shown to shoppers: brand + product name ("The Bulldog" + "Grinder Metal 3-Part"),
// unless the product name already starts with the brand.
export function displayName(p) {
  const name = String(p.name || '').trim();
  const brand = String(p.brand_name || '').trim();
  if (!brand || name.toLowerCase().startsWith(brand.toLowerCase())) return name;
  return `${brand} ${name}`;
}

export const productPath = (p) => `/p/${p.id}-${slugify(displayName(p))}`;
export const brandPath = (b) => `/b/${b.slug}`;

// Category address: /c/parent/child for subcategories, /c/slug otherwise.
export const categoryPath = (c) => (c.parent_slug ? `/c/${c.parent_slug}/${c.slug}` : `/c/${c.slug}`);

// Does a product belong to this category?
// (main category, any extra category, or a subcategory of one of those)
export const inCategory = (p, slug) =>
  p.category_slug === slug || p.parent_slug === slug || (p.extra_categories || []).some((c) => c.slug === slug || c.parent_slug === slug);

// Badge colour: 'accent' / 'accent2' follow the theme; anything else is a hex value.
export const badgeColor = (c) => (c === 'accent2' ? 'var(--accent2)' : c && c.startsWith('#') ? c : 'var(--accent)');
