# JKCanopy

Bilingual (English / Bahasa Melayu) system for **JKCanopy** — Arabic canopy rental for events in **Kluang, Johor, Malaysia**.

Two parts in one app:

- **Public website** (`/`) — gallery, layout suggestions, and a booking calculator that sends enquiries via WhatsApp. No backend, free to host.
- **Management system** (`/system`) — login-protected admin for bookings, quotations, workers, payments, calendar, and items. Backed by Supabase.

## Run locally

```bash
npm install
npm run dev      # start dev server (open the printed localhost URL)
npm run build    # production build into /dist
npm run preview  # preview the production build
```

- Website: `http://localhost:5173/`
- System login: `http://localhost:5173/system/login`

---

## Phase 1 — Public website

### Features

- **Gallery** filterable by theme colour
- **Layout suggestions** — 2D diagrams based on canopy count (from `canopy layout.pptx`)
- **Booking calculator** — live estimated price
- **WhatsApp booking** — opens `wa.me` pre-filled to **+60 17-779 9290**
- **Bilingual** — EN / BM toggle (defaults to Bahasa Melayu)

### Where to edit things

| What | File |
|------|------|
| Website prices (placeholder) | `src/data/pricing.js` |
| Theme colours | `src/data/themeColours.js` |
| Gallery photos | `src/data/gallery.js` (images in `public/gallery/`) |
| Layout suggestions | `src/data/layouts.js` |
| WhatsApp number | `src/utils/whatsapp.js` |
| Translations (EN/BM) | `src/i18n/translations.js` |

To add real gallery photos: put the file in `public/gallery/`, then set that item's `image` in `src/data/gallery.js` to `"/gallery/your-file.jpg"`.

---

## Phase 2 — Management system (Supabase)

### One-time Supabase setup

1. **Create the database tables.** In the Supabase dashboard, open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates all tables, security rules, the auto booking-number (`JK-2026-0001`), and seeds four starter items.

2. **Create login users** for your dad, sister, and you. In the dashboard go to **Authentication → Users → Add user**, set an email + password for each. (Email confirmation can be turned off under **Authentication → Providers → Email** so logins work immediately.)

3. **Connect the app.** Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```
   The publishable (anon) key is safe in the frontend — data is protected by Row Level Security, so only logged-in users can read or write.

### Modules

| Module | What it does |
|--------|--------------|
| **Dashboard** | Upcoming events, pending payments, month revenue |
| **New Booking** | 2-step registry: details → auto quotation → confirm. Auto booking ID. |
| **Booking List** | Assign workers, update payment status (Unpaid → Deposit → Balance → Settled) |
| **Quotations** | List all quotations, print / save as PDF |
| **Calendar** | Month view of event dates; click an event to add it to Google Calendar |
| **Workers** | Worker registry (name, IC, bank details) |
| **Payment Slips** | Record worker payments, print / save as PDF |
| **Items** | Item registry (name, category, price) — drives quotation pricing |

### How pricing works

Quotations are calculated from the **Items** table (single source of truth), matched by category (`canopy`, `round_table`, `long_table`, `chair`). Update prices in the Items module and every new quotation uses them. The seeded prices are placeholders — edit them to your real rates.

### Calendar sync for your family

The calendar shows all event dates. Clicking an event opens an **Add to Google Calendar** link. The simplest way to keep your dad and sister in sync: create one shared Google Calendar, add events to it, and have them subscribe on their phones. (Fully automated two-way sync would need Google OAuth — a later enhancement.)

### PDF printing

Quotations and payment slips open a clean print window; use your browser's **Save as PDF** in the print dialog. No extra software needed.

---

## Deploy (free, no expiry) — Cloudflare Pages

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a project connected to the repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Environment variables** (Settings → Environment variables): add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the `.env` file is gitignored, so these must be set in the dashboard).
5. Deploy.

SPA routing (`/system/...`) is handled by `public/_redirects`, which Cloudflare Pages and Netlify both read. Netlify uses the same build command and publish directory.

## Security notes

- Never commit the database connection string (`postgresql://...`) or the service-role key. Only the publishable/anon key belongs in the frontend.
- `.env` is gitignored on purpose.

## Tech

React + Vite + Tailwind CSS + React Router. Supabase (Postgres + Auth) for the management system. The public website works with no backend.
