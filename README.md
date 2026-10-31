# FUMO — website + admin panel

A minimal, white storefront in the spirit of ripndip.com, with an admin panel that edits every
part of the site. There is no checkout: each product has its own **redirect URL** and the buy
button sends visitors there (clicks are counted).

**Stack:** Next.js 15 · React 19 · Framer Motion · Postgres (Neon on Vercel, embedded PGlite
locally) · Vercel Blob for uploads.

## What the admin (`/admin`) can change

| Tab | What it controls |
| --- | --- |
| Products | Add / edit / hide / delete, main + hover photo (image, GIF or video), price, old price, badge, notes, specs, redirect URL, button text, featured, order |
| Categories | Name, order, tile image. Each category has a page at `/c/<slug>` |
| Homepage | Sections in any order: hero banner, product grids, category tiles, promo banner, scrolling text, text block, image / video, store locations, photo gallery. Show, hide, reorder, add, delete |
| Pages | New pages at their own address (e.g. `/find-a-store`), built from the same blocks as the homepage plus **Store locations** (photo, address, hours, phone, directions, Google map) and **Photo gallery**. Start from a template, keep as draft and preview, publish, and add a link to any menu in one click |
| Header & menu | Announcement bar (rotating messages, colours), header links, sidebar **section 1** (big bold links), sidebar image tiles, sidebar **section 2** (small links with icons) |
| Footer | Background colour, background **video / GIF / image**, drifting animated layers (built-in smoke or your own PNG/GIF), mascot peeking over the top, link columns, call to action, warning, copyright, small links |
| Brand & theme | Logo, all theme colours, SEO title/description, product-page button text, 18+ age gate texts |

Site edits are drafted in the browser and go live with **Publish changes**.

## Languages (English, Armenian, Russian)

Built with [next-intl](https://next-intl.dev). English is the default at plain addresses;
Armenian lives under `/hy/…` and Russian under `/ru/…`. Visitors switch with the language menu
in the header and the sidebar.

- **Fixed site text** (buttons, labels, “not found”…) is in [messages/](messages) — `en.json`,
  `hy.json`, `ru.json`.
- **Everything the owner edits** is translated in the admin: pick **Editing language** in the
  admin sidebar, then fill in the fields tagged ՀԱՅ / РУ. Empty fields fall back to English.
  Prices, links, colours and photos are shared by all languages; product and brand names stay
  as entered.
- Armenian and Cyrillic letters use Noto Sans/Serif Armenian and Rubik; they’re only downloaded
  on pages that contain those letters.

## Run locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD and SESSION_SECRET
npm run dev                  # http://localhost:3000 · admin: /admin
```

Without `DATABASE_URL` the app uses an embedded Postgres in `.local-data/` and stores uploads
there too, so nothing else is needed for development. On first run the tables are created,
the starter catalogue ([lib/seed-data.js](lib/seed-data.js)) is loaded once, and a draft
“Find a store” page is created for the owner to fill in.

## Deploy (Vercel)

```bash
npx vercel@latest deploy --prod
```

The project needs a **Neon** database and a **public Blob** store connected under *Storage*
(the code reads `FUMO_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`), plus
`ADMIN_PASSWORD` and `SESSION_SECRET`. Existing data is migrated automatically on first load.

### Large uploads (videos)

Vercel limits requests through the server to 4.5 MB, so by default uploads are capped at 4 MB.
To upload bigger videos straight from the browser to Blob, open the Blob store in the Vercel
dashboard, copy its `BLOB_READ_WRITE_TOKEN`, add it to the project's environment variables and
redeploy. The admin switches to direct uploads automatically. You can also paste a link to a
video hosted elsewhere into any media field.

## Buy links

`/go/<id>` counts the click and 302-redirects to the product's URL. Only `http(s)` links are
accepted for products; site links may also be paths (`/c/all`), anchors (`#contact`),
`mailto:` or `tel:`. Colours are validated as hex before they reach the page.
