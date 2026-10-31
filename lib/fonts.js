import { Fraunces, Noto_Sans_Armenian, Noto_Serif_Armenian, Prompt, Rubik } from 'next/font/google';

// Latin brand fonts. No metric-matched fallback: it would be a system font that also has
// Armenian/Cyrillic letters and would win over the proper fonts below.
const display = Fraunces({ subsets: ['latin'], axes: ['SOFT', 'WONK', 'opsz'], variable: '--font-display', adjustFontFallback: false, fallback: [] });
const sans = Prompt({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-sans', adjustFontFallback: false, fallback: [] });
// Armenian and Cyrillic letters: only downloaded when a page actually contains them.
const armSans = Noto_Sans_Armenian({ subsets: ['armenian'], variable: '--font-arm-sans', adjustFontFallback: false, fallback: [] });
const armSerif = Noto_Serif_Armenian({ subsets: ['armenian'], variable: '--font-arm-serif', adjustFontFallback: false, fallback: [] });
const cyr = Rubik({ subsets: ['cyrillic'], variable: '--font-cyr', adjustFontFallback: false, fallback: [] });

export const fontVars = [display, sans, armSans, armSerif, cyr].map((f) => f.variable).join(' ');
