'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import ProductCard from './ProductCard';

const PAGE = 24;

// Long product lists: render a page at a time; the next page loads when the visitor nears the end.
export default function PagedGrid({ products, brand }) {
  const t = useTranslations('shop');
  const [count, setCount] = useState(PAGE);
  const sentinel = useRef(null);
  const more = count < products.length;

  useEffect(() => {
    if (!more || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setCount((c) => c + PAGE), { rootMargin: '600px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [more, count]);

  return (
    <>
      <div className="grid">
        {products.slice(0, count).map((p) => <ProductCard key={p.id} p={p} brand={brand} />)}
      </div>
      {more && (
        <div ref={sentinel} className="load-more">
          <button type="button" className="btn light" onClick={() => setCount((c) => c + PAGE)}>{t('loadMore')}</button>
        </div>
      )}
    </>
  );
}
