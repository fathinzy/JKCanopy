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

   Then run [`supabase/schema_v2.sql`](supabase/schema_v2.sql) the same way. This adds deposit tracking and the multi-job payment-slip support used by the newer Booking List, Payment Slips, and Dashboard features. It is safe to run once (or again — it only adds what is missing).

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
| **Dashboard** | Filter by year/month (drills down: all years → yearly, one year → monthly, one month → daily). Clickable cards for upcoming events, pending payment, revenue, total bookings. Charts for revenue, canopy orders, worker salary, and jobs assigned. |
| **New Booking** | 2-step registry: details → auto quotation → confirm. Auto booking ID. |
| **Booking List** | Search by booking no/customer, filter by payment and booking status. Tap a booking to edit everything, record deposit (shows balance), assign workers (sends a WhatsApp job message to the worker), and set status (Confirmed / Completed / Cancelled). Cancelled bookings drop off the calendar. |
| **Quotations** | List all quotations, print / save as PDF |
| **Calendar** | Month view of event dates (cancelled bookings excluded); click an event to add it to Google Calendar |
| **Workers** | Worker registry (name, IC, phone, bank details). Phone is needed for WhatsApp job messages. |
| **Payment Slips** | Pick a worker, see their completed unpaid jobs, select multiple and key in the amount for each, then generate one slip. Paid jobs disappear from the list. Print / save as PDF. |
| **Items** | Item registry (name, category, price) — drives quotation pricing |

The whole system is responsive and works on phones and tablets.

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
