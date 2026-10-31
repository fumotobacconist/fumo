import Link from '@/components/site/L';
import { LeafO } from '../Logo';
import Media from './Media';

// Built-in drifting smoke layers (used until the owner uploads their own layer images).
function puffs(seed, count, w, h, rMin, rMax) {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  let out = '';
  for (let i = 0; i < count; i++) {
    const cx = Math.round(rnd() * w), cy = Math.round(rnd() * h), r = Math.round(rMin + rnd() * (rMax - rMin));
    // a cloud = a few overlapping circles on a flat base
    out += `<g><circle cx='${cx}' cy='${cy}' r='${r}'/><circle cx='${cx + r * 0.9}' cy='${cy + r * 0.25}' r='${r * 0.75}'/><circle cx='${cx - r * 0.9}' cy='${cy + r * 0.3}' r='${r * 0.65}'/><rect x='${cx - r * 1.5}' y='${cy + r * 0.3}' width='${r * 3.1}' height='${r * 0.7}' rx='${r * 0.35}'/></g>`;
    // wrap clouds that cross the right edge so the tile repeats seamlessly
    if (cx + r * 1.7 > w) out += `<g transform='translate(-${w} 0)'><circle cx='${cx}' cy='${cy}' r='${r}'/><circle cx='${cx + r * 0.9}' cy='${cy + r * 0.25}' r='${r * 0.75}'/><circle cx='${cx - r * 0.9}' cy='${cy + r * 0.3}' r='${r * 0.65}'/><rect x='${cx - r * 1.5}' y='${cy + r * 0.3}' width='${r * 3.1}' height='${r * 0.7}' rx='${r * 0.35}'/></g>`;
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' fill='white'>${out}</svg>`)}")`;
}

const BUILTIN = {
  'smoke-a': { image: puffs(7, 7, 1400, 900, 26, 54), w: 1400 },
  'smoke-b': { image: puffs(42, 5, 1000, 900, 14, 30), w: 1000 },
};

const ext = (href) => (/^https?:/i.test(href || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {});

export default function Footer({ site }) {
  const f = site.footer;
  return (
    <footer className="footer" id="contact" style={{ color: f.color }}>
      <div className="footer-mascot">
        {f.mascot ? <Media src={f.mascot} alt="" /> : <LeafO draw style={{ width: '100%', height: 'auto', display: 'block' }} />}
      </div>
      <div className="footer-clip" style={{ background: f.bg, borderTop: '1.5px solid var(--ink)' }}>
        {f.media && <Media src={f.media} className="bg-media" style={{ opacity: f.media_opacity ?? 1 }} />}
        {(f.layers || []).filter((l) => l.image).map((l, i) => {
          const b = l.image.startsWith('builtin:') ? BUILTIN[l.image.slice(8)] : null;
          if (l.image.startsWith('builtin:') && !b) return null;
          return (
            <div
              key={i}
              className={b ? 'layer' : 'layer custom'}
              style={{
                backgroundImage: b ? b.image : `url("${l.image}")`,
                ...(b ? { backgroundSize: `${b.w}px auto`, '--w': `-${b.w}px` } : {}),
                opacity: l.opacity ?? 1,
                '--speed': `${Math.max(5, Number(l.speed) || 60)}s`,
              }}
            />
          );
        })}

        <div className="footer-grid">
          {f.columns.filter((c) => c.title || c.links?.length).map((c, i) => (
            <div key={i}>
              {c.title && <h3 className="d">{c.title}</h3>}
              <ul>
                {(c.links || []).filter((l) => l.label).map((l, j) => (
                  <li key={j}><Link href={l.href || '#'} {...ext(l.href)}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          {f.cta?.enabled && (
            <div className="footer-cta">
              {f.cta.title && <h3 className="d">{f.cta.title}</h3>}
              {f.cta.text && <p>{f.cta.text}</p>}
              {f.cta.button_label && f.cta.button_link && (
                <a className="btn" href={f.cta.button_link} {...ext(f.cta.button_link)}>{f.cta.button_label}</a>
              )}
            </div>
          )}
        </div>

        <div className="footer-bottom">
          {f.warning && <p className="warning">⚠ {f.warning}</p>}
          {f.bottom_links?.some((l) => l.label) && (
            <div className="footer-links">
              {f.bottom_links.filter((l) => l.label).map((l, i) => <Link key={i} href={l.href || '#'} {...ext(l.href)}>{l.label}</Link>)}
            </div>
          )}
          {f.copyright && <p className="copy">{f.copyright.replace('©', `© ${new Date().getFullYear()}`)}</p>}
        </div>
      </div>
    </footer>
  );
}
