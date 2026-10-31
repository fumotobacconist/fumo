const COLORS = ['var(--accent)', 'var(--accent2)', '#9fd6ff', '#ffb3c7', '#b9f2c4', '#d7c4ff'];

function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Placeholder pack drawn when a product (or tile) has no photo.
export default function PackArt({ name, sub, brand = 'FUMO' }) {
  const h = hash(name);
  return (
    <div className="pack" aria-hidden>
      <div className="pack-box" style={{ background: COLORS[h % COLORS.length], transform: `rotate(${(h % 7) - 3}deg)` }}>
        <span className="pack-dot" style={{ background: COLORS[(h + 2) % COLORS.length] }} />
        <span className="pack-brand" style={{ position: 'relative' }}>{brand}</span>
        <span style={{ position: 'relative' }}>
          <span className="pack-name">{name}</span>
          {sub && <span className="pack-w">{sub}</span>}
        </span>
      </div>
    </div>
  );
}
