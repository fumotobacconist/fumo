import Link from '@/components/site/L';
import Media, { SIZES } from './Media';
import PackArt from './PackArt';
import PagedGrid from './PagedGrid';
import { badgeColor, displayName, productPath } from '@/lib/site';

const alt2 = (b) => /limited|premium|signature|sale/i.test(b);

export default function ProductCard({ p, brand }) {
  const name = displayName(p);
  return (
    <Link href={productPath(p)} className="card">
      <div className="card-media">
        {p.badge && <span className={`badge ${!p.badge_color && alt2(p.badge) ? 'alt2' : ''}`} style={p.badge_color ? { background: badgeColor(p.badge_color) } : undefined}>{p.badge}</span>}
        {p.image ? (
          <>
            <Media src={p.image} alt={name} className={p.image2 ? 'has-alt' : undefined} sizes={SIZES.card} />
            {p.image2 && <Media src={p.image2} alt="" className="alt" sizes={SIZES.card} />}
          </>
        ) : (
          <PackArt name={p.name} sub={p.weight || p.size} brand={p.brand_name || brand} />
        )}
      </div>
      <div className="card-info">
        <h3 className="card-title">{name}</h3>
        {(p.subtitle || p.notes) && <p className="card-sub">{p.subtitle || p.notes}</p>}
        {p.price && <p className="card-price">{p.compare_price && <s>{p.compare_price}</s>}{p.price}</p>}
      </div>
    </Link>
  );
}

// Only what a card needs, so long lists send less data to the browser.
const CARD_FIELDS = ['id', 'name', 'brand_name', 'image', 'image2', 'price', 'compare_price', 'badge', 'badge_color', 'subtitle', 'notes', 'weight', 'size'];
const slim = (p) => Object.fromEntries(CARD_FIELDS.map((k) => [k, p[k] ?? null]));

export function ProductGrid({ products, brand }) {
  if (products.length > 24) return <PagedGrid products={products.map(slim)} brand={brand} />;
  return (
    <div className="grid">
      {products.map((p) => <ProductCard key={p.id} p={p} brand={brand} />)}
    </div>
  );
}
