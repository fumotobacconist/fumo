import { Link as LocaleLink } from '@/i18n/navigation';

// Link for storefront content: internal paths get the visitor's language prefix (/en/…, /ru/…);
// external links, anchors, mailto/tel and the /go buy redirect are left as-is.
export default function L({ href = '#', ...rest }) {
  const h = typeof href === 'string' ? href : '';
  if (!h.startsWith('/') || h.startsWith('//') || h.startsWith('/go/') || h.startsWith('/media/')) return <a href={h || '#'} {...rest} />;
  return <LocaleLink href={h} {...rest} />;
}
