// Server helpers for the shop filter dropdowns (see FilterMenu).

// "All" plus one link per option for a ?param= filter; keeps the other query params.
export function paramItems({ allLabel = 'All', options, active, base, param, params = {} }) {
  const href = (value) => {
    const q = new URLSearchParams(Object.entries(params).filter(([k, v]) => typeof v === 'string' && v && k !== param));
    if (value) q.set(param, value);
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  };
  return [
    { href: href(''), label: allLabel, on: !active, all: true },
    ...options.map((o) => ({ href: href(o.value), label: o.label, on: active === o.value })),
  ];
}

// Distinct brands among a list of products, for the brand filter.
export function brandOptions(products) {
  const seen = new Map();
  for (const p of products) if (p.brand_slug && !seen.has(p.brand_slug)) seen.set(p.brand_slug, p.brand_name);
  return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}
