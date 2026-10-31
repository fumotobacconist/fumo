'use client';
// Removes a plain background (white studio shots etc.) from a product photo, in the browser.
// The background is flood-filled from the image edges, so same-coloured details *inside*
// the product (white lettering, highlights) are kept. Output: transparent, trimmed PNG.

const MAX = 1800; // longest side of the processed image

export async function loadForEditing(src) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Could not open the image'));
    i.src = src;
  });
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  try {
    return { w, h, pixels: ctx.getImageData(0, 0, w, h) };
  } catch {
    throw new Error('This image is stored somewhere that doesn’t allow editing. Upload the file again, then try.');
  }
}

// Average colour of the border pixels that look alike (the background).
function backgroundColour(d, w, h) {
  const samples = [];
  const take = (x, y) => {
    const i = (y * w + x) * 4;
    if (d[i + 3] > 200) samples.push([d[i], d[i + 1], d[i + 2]]);
  };
  const step = Math.max(1, Math.floor((w + h) / 400));
  for (let x = 0; x < w; x += step) { take(x, 0); take(x, h - 1); }
  for (let y = 0; y < h; y += step) { take(0, y); take(w - 1, y); }
  if (!samples.length) return null;
  // Median per channel is robust to a few product pixels touching the edge.
  const med = (k) => samples.map((s) => s[k]).sort((a, b) => a - b)[samples.length >> 1];
  return [med(0), med(1), med(2)];
}

/**
 * strength 1–100: how different from the background a pixel may be and still be removed.
 * Returns { imageData, removed } where removed is the share of pixels made transparent.
 */
export function removeBackground({ w, h, pixels }, strength = 30) {
  const src = pixels.data;
  const out = new ImageData(new Uint8ClampedArray(src), w, h);
  const d = out.data;
  const bg = backgroundColour(src, w, h);
  if (!bg) return { imageData: out, removed: 0 };

  const tol = 8 + strength * 1.6; // colour distance treated as background
  const soft = tol * 1.6; // edge pixels up to here become partly transparent
  const dist = (i) => Math.hypot(src[i] - bg[0], src[i + 1] - bg[1], src[i + 2] - bg[2]);

  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const p = y * w + x;
    if (seen[p]) return;
    seen[p] = 1;
    if (src[p * 4 + 3] < 10 || dist(p * 4) <= tol) stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  const bgMask = new Uint8Array(w * h);
  let removed = 0;
  while (stack.length) {
    const p = stack.pop();
    bgMask[p] = 1;
    d[p * 4 + 3] = 0;
    removed++;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  // Soften the cut: pixels next to removed background fade out by how close they are to it.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (bgMask[p]) continue;
      const near = (x > 0 && bgMask[p - 1]) || (x < w - 1 && bgMask[p + 1]) || (y > 0 && bgMask[p - w]) || (y < h - 1 && bgMask[p + w]);
      if (!near) continue;
      const k = dist(p * 4);
      if (k < soft) d[p * 4 + 3] = Math.round(src[p * 4 + 3] * Math.min(1, (k - tol) / (soft - tol) + 0.15));
    }
  }
  return { imageData: out, removed: removed / (w * h) };
}

// Crops to the visible pixels (+ a little padding) and encodes a PNG file.
export async function toTrimmedPng(imageData, name = 'photo') {
  const { width: w, height: h, data } = imageData;
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
  if (right < 0) throw new Error('Everything was removed — lower the strength');
  const pad = Math.round(Math.max(right - left, bottom - top) * 0.03);
  left = Math.max(0, left - pad); top = Math.max(0, top - pad);
  right = Math.min(w - 1, right + pad); bottom = Math.min(h - 1, bottom + pad);
  const full = document.createElement('canvas');
  full.width = w;
  full.height = h;
  full.getContext('2d').putImageData(imageData, 0, 0);
  const out = document.createElement('canvas');
  out.width = right - left + 1;
  out.height = bottom - top + 1;
  out.getContext('2d').drawImage(full, left, top, out.width, out.height, 0, 0, out.width, out.height);
  const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Could not create the image');
  return new File([blob], `${name}-no-bg.png`, { type: 'image/png' });
}
