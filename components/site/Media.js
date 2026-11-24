import Image from 'next/image';
import { isVideo } from '@/lib/site';

// Photos with a `sizes` hint use next/image for layout and loading priority; files are served as
// uploaded (images.unoptimized), already shrunk by the admin. GIFs/SVGs and videos are plain tags.
const OPTIMIZABLE = /\.(jpe?g|png|webp|avif)(\?|$)/i;

export const SIZES = {
  card: '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 320px',
  tile: '(max-width: 900px) 50vw, 25vw',
  half: '(max-width: 800px) 100vw, 50vw',
  full: '100vw',
  side: '200px',
};

export default function Media({ src, alt = '', className, style, eager, sizes, priority }) {
  if (!src || src.startsWith('builtin:')) return null;
  if (isVideo(src)) return <video className={className} style={style} src={src} autoPlay muted loop playsInline preload="metadata" aria-label={alt || undefined} />;
  if (sizes && OPTIMIZABLE.test(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} style={style} priority={priority} quality={80} />;
  }
  return <img className={className} style={style} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}
