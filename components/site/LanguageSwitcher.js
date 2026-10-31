'use client';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { LOCALES, LOCALE_NAMES, LOCALE_SHORT } from '@/i18n/config';
import Dropdown from './Dropdown';

// Same page in another language. `full` shows names ("Հայերեն"), otherwise short codes.
export default function LanguageSwitcher({ full = false, className = '', onPick }) {
  const locale = useLocale();
  const pathname = usePathname(); // without the language prefix
  const search = useSearchParams().toString();
  const href = search ? `${pathname}?${search}` : pathname;
  return (
    <nav className={`lang ${className}`} aria-label="Language">
      {LOCALES.map((l) => (
        <Link key={l} href={href} locale={l} lang={l} hrefLang={l} onClick={onPick} className={l === locale ? 'on' : ''} aria-current={l === locale ? 'true' : undefined}>
          {full ? LOCALE_NAMES[l] : LOCALE_SHORT[l]}
        </Link>
      ))}
    </nav>
  );
}

// Dropdown version for the header and the age check: current language with a chevron, all three underneath.
export function LanguageMenu({ className = '', align }) {
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const href = search ? `${pathname}?${search}` : pathname;
  return (
    <Dropdown className={`lang-menu ${className}`} align={align} button={LOCALE_SHORT[locale]} label={`Language: ${LOCALE_NAMES[locale]}`}>
      {(close) =>
        LOCALES.map((l) => (
          <li key={l}>
            <Link href={href} locale={l} lang={l} hrefLang={l} title={LOCALE_NAMES[l]} onClick={close} className={l === locale ? 'on' : ''} aria-current={l === locale ? 'true' : undefined}>
              {LOCALE_SHORT[l]}
            </Link>
          </li>
        ))
      }
    </Dropdown>
  );
}
