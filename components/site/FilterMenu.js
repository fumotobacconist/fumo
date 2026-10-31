'use client';
import Link from './L';
import Dropdown from './Dropdown';

// One filter as a dropdown: "Brand ⌄" (or "Brand: Zippo ⌄" when one is picked) over a list of links.
export default function FilterMenu({ label, items }) {
  const current = items.find((i) => i.on && !i.all);
  return (
    <Dropdown className={`filter ${current ? 'set' : ''}`} align="left" label={label} button={<span>{label}{current && <b>: {current.label}</b>}</span>}>
      {(close) =>
        items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} onClick={close} className={`${i.on ? 'on' : ''} ${i.indent ? 'sub' : ''}`} aria-current={i.on ? 'true' : undefined} scroll={false}>
              {i.label}
            </Link>
          </li>
        ))
      }
    </Dropdown>
  );
}
