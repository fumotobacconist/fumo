import { ImageResponse } from 'next/og';

// Home-screen icon for iPhones (they ignore SVG favicons): the leaf mark from app/icon.svg on white.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="#111111" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="44" stroke-width="7" fill="#ffe600"/><path d="M27 76 C 22 48, 44 22, 76 24 C 78 54, 56 80, 27 76 Z" stroke-width="4.2" fill="#e8892b"/><path d="M29 74 Q 50 52, 70 30" stroke-width="3"/><path d="M44 56 L36 48 M50 50 L42 40 M56 44 L50 33 M44 56 L54 60 M50 50 L61 53 M56 44 L67 45" stroke-width="2.4"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <img src={`data:image/svg+xml;base64,${Buffer.from(MARK).toString('base64')}`} width={150} height={150} alt="" />
      </div>
    ),
    size
  );
}
