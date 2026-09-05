# JKCanopy Website (Phase 1)

Public bilingual (English / Bahasa Melayu) website for **JKCanopy** — Arabic canopy rental for events in **Kluang, Johor, Malaysia**.

Booking is handled through WhatsApp (no backend, free to host). A future phase will add the internal management system.

## Features

- **Gallery** filterable by theme colour (shows past events done in each colour)
- **Layout suggestions** — 2D top-down diagrams based on the number of canopies (from `canopy layout.pptx`)
- **Booking calculator** — customer picks canopies, tables, chairs, colours; sees a live estimated price
- **WhatsApp booking** — the Confirm button opens WhatsApp with a pre-filled booking summary sent to **+60 17-779 9290**
- **Bilingual** — EN / BM toggle in the header (defaults to Bahasa Melayu)

## Run locally

```bash
npm install
npm run dev      # start dev server (open the printed localhost URL)
npm run build    # production build into /dist
npm run preview  # preview the production build
```

## How the WhatsApp booking works

When a customer taps **Send Booking via WhatsApp**, the site opens a `wa.me` link with the
booking details pre-filled as a message. The customer sends it from their own WhatsApp.
No server or paid service is needed. The number lives in `src/utils/whatsapp.js`.

## Where to edit things

| What | File |
|------|------|
| Prices (placeholder) | `src/data/pricing.js` |
| Theme colours | `src/data/themeColours.js` |
| Gallery photos | `src/data/gallery.js` (put images in `public/gallery/`) |
| Layout suggestions | `src/data/layouts.js` |
| WhatsApp number | `src/utils/whatsapp.js` |
| Translations (EN/BM) | `src/i18n/translations.js` |

### Adding real gallery photos

1. Put the image file in `public/gallery/` (e.g. `public/gallery/wedding-maroon.jpg`).
2. In `src/data/gallery.js`, set that item's `image` to `"/gallery/wedding-maroon.jpg"` and its `theme` to the matching colour id.

### Updating prices

Prices in `src/data/pricing.js` are **placeholders**. Edit the numbers (per canopy, per table, per chair, colour surcharge) to your real rates. In Phase 2 these will come from the management system's Item Registry instead.

## Deploy (free, no expiry) — Cloudflare Pages

1. Push this folder to a GitHub repository.
2. In Cloudflare Pages, create a project connected to the repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Cloudflare Pages is free with no 12-month limit.

Netlify and GitHub Pages work the same way (build command `npm run build`, publish `dist`).

## Tech

React + Vite + Tailwind CSS. Static site — no backend.
