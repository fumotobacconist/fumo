'use client';
// Crops transparent space around a logo so its height setting matches what you actually see.
// SVGs keep being vectors (only the viewBox changes); PNG / WebP are re-encoded as PNG.

const PAD = 0.02; // keep a hair of breathing room, as a share of the visible size

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the image'));
    img.src = src;
  });
}

// Bounding box of non-transparent pixels, or null if the image is empty / unreadable.
function visibleBounds(img, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null; // canvas tainted by an external resource inside the image
  }
  let top = h, left = w, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  return { canvas, left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function trimSvg(file) {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.nodeName.toLowerCase() !== 'svg') return file;

  let vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some((n) => !Number.isFinite(n)) || vb[2] <= 0 || vb[3] <= 0) {
    const w = parseFloat(svg.getAttribute('width')), h = parseFloat(svg.getAttribute('height'));
    if (!(w > 0 && h > 0)) return file;
    vb = [0, 0, w, h];
  }
  const [vx, vy, vw, vh] = vb;
  // Render the whole viewBox at a fixed size so pixels map straight back to SVG units.
  svg.setAttribute('viewBox', vb.join(' '));
  svg.setAttribute('preserveAspectRatio', 'none');
  const scale = 1600 / Math.max(vw, vh);
  const pw = Math.max(1, Math.round(vw * scale)), ph = Math.max(1, Math.round(vh * scale));
  svg.setAttribute('width', pw);
  svg.setAttribute('height', ph);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  let b;
  try {
    b = visibleBounds(await loadImage(url), pw, ph);
  } finally {
    URL.revokeObjectURL(url);
  }
  if (!b) return file;

  const sx = vw / pw, sy = vh / ph;
  const padX = b.width * sx * PAD, padY = b.height * sy * PAD;
  const nx = vx + b.left * sx - padX, ny = vy + b.top * sy - padY;
  const nw = b.width * sx + padX * 2, nh = b.height * sy + padY * 2;
  if (nw >= vw * 0.97 && nh >= vh * 0.97) return file; // nothing worth trimming

  const round = (n) => Math.round(n * 1000) / 1000;
  svg.setAttribute('viewBox', [nx, ny, nw, nh].map(round).join(' '));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  // Natural size in the trimmed proportions; the site sets the real height.
  svg.setAttribute('width', round(nw));
  svg.setAttribute('height', round(nh));
  return new File([new XMLSerializer().serializeToString(svg)], file.name.replace(/\.svg$/i, '') + '-trimmed.svg', { type: 'image/svg+xml' });
}

async function trimRaster(file) {
  const url = URL.createObjectURL(file);
  let img;
  try {
    img = await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  const b = visibleBounds(img, img.naturalWidth, img.naturalHeight);
  if (!b || (b.width >= img.naturalWidth * 0.97 && b.height >= img.naturalHeight * 0.97)) return file;
  const padX = Math.round(b.width * PAD), padY = Math.round(b.height * PAD);
  const x = Math.max(0, b.left - padX), y = Math.max(0, b.top - padY);
  const w = Math.min(img.naturalWidth - x, b.width + padX * 2), h = Math.min(img.naturalHeight - y, b.height + padY * 2);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d').drawImage(b.canvas, x, y, w, h, 0, 0, w, h);
  const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '-trimmed.png', { type: 'image/png' }) : file;
}

// Returns a trimmed copy of the file, or the original when it can't (or needn't) be trimmed.
// GIFs and videos are left alone so animations survive.
export async function trimImage(file) {
  try {
    if (file.type === 'image/svg+xml') return await trimSvg(file);
    if (/^image\/(png|webp|avif)$/.test(file.type)) return await trimRaster(file);
  } catch {}
  return file;
}

// Downloads an already-uploaded image so it can be trimmed.
export async function fileFromUrl(src) {
  const r = await fetch(src, { cache: 'no-store' });
  if (!r.ok) throw new Error('Could not download the current logo');
  const blob = await r.blob();
  const ext = (src.split('?')[0].split('.').pop() || 'png').toLowerCase();
  const type = blob.type || (ext === 'svg' ? 'image/svg+xml' : `image/${ext}`);
  return new File([blob], `logo.${ext}`, { type });
}
