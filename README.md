# JKCanopy — Event Rental Business Platform

A full-stack web platform I built to run a real family business: **JKCanopy**, an Arabic-canopy rental company serving events in Kluang, Johor, Malaysia. It combines a public marketing website with a private, role-gated management system for day-to-day operations.

**Live demo:** https://jkcanopy.pages.dev
**Public site:** `/` &nbsp;•&nbsp; **Management system:** `/system` (login required)

> Built to solve an actual problem — my father runs the business on paper and phone calls. This replaces the paperwork: online enquiries, bookings, quotations, worker payroll, and a shared event calendar.

---

## The problem it solves

The business was run entirely through WhatsApp messages, a notebook of bookings, and manual price calculations. That caused:

- **Missed / double bookings** — no shared view of which dates are taken.
- **Slow, error-prone quotes** — prices added up by hand for every enquiry.
- **Payment confusion** — deposits and balances tracked from memory.
- **Payroll headaches** — working out what each worker is owed each month.

The platform digitises all of this while staying **free to run** (a hard requirement for a small business).

---

## What it does

### Public website (no login)
- **Gallery** filterable by event theme colour.
- **Layout suggestions** — 2D top-down diagrams generated from canopy count.
- **Booking calculator** with a live price estimate.
- **WhatsApp booking** — the enquiry is pre-filled into a `wa.me` link, so a customer sends it straight to the business. Zero backend cost.
- **Bilingual** — English / Bahasa Melayu, defaulting to Malay for local customers.

### Management system (login required)
- **Dashboard** — KPI cards (upcoming events, pending payments, revenue, total bookings) plus charts. A single **year → month → day drill-down** filter reshapes every chart's time axis.
- **Bookings** — a 2-step registry (line items → quotation) with auto-generated IDs (`JK-2026-0001`), inline editing, search and status filters.
- **Payment ledger** — record a deposit then follow-up payments until the balance hits zero; the payment status updates itself.
- **Quotations & payment slips** — generated as printable / PDF-ready documents.
- **Workers & payroll** — worker registry, per-job assignment (with a one-tap WhatsApp job message to the worker), multi-job payment slips, and a **monthly payment report**.
- **Calendar** — month view of event dates with one-click "Add to Google Calendar".
- **Item registry** — the single source of truth for pricing that drives every quotation.

Fully responsive — designed to be used on a phone in the field, not just a desktop.

---

## Architecture

```
                    ┌─────────────────────────────┐
   Customer  ─────► │   Public website  (  /  )   │
   (browser)        │   static, no backend        │
                    └──────────────┬──────────────┘
                                   │  wa.me deep link
                                   ▼
                              WhatsApp

   Owner /          ┌─────────────────────────────┐        ┌──────────────────┐
   staff    ─────►  │  Management SPA ( /system )  │ ─────► │     Supabase      │
   (phone)          │  React + React Router        │  HTTPS │  Postgres + Auth  │
                    │  auth-gated routes           │ ◄───── │  Row Level Sec.   │
                    └─────────────────────────────┘        └──────────────────┘

        Hosting: Cloudflare Pages (static SPA, global CDN, free tier)
```

**One codebase, two audiences.** Public routes are open; everything under `/system` is wrapped in an auth guard. Both share the same design system and i18n.

**Client → managed backend.** The React SPA talks directly to Supabase. There is no custom server to maintain — auth, database, and row-level authorization are handled by Supabase, keeping the moving parts (and the cost) low.

---

## Key technical decisions & trade-offs

These are the choices I'd want to talk through in an interview:

| Decision | Why | Trade-off considered |
|----------|-----|----------------------|
| **Supabase over a custom Node/Express + DB** | Managed Postgres, auth, and row-level security out of the box; free tier with no time limit. Right-sized for a 2–3 person business. | Less control than a bespoke backend, but far less to build, secure, and maintain. |
| **Cloudflare Pages over AWS S3/EC2** | Free hosting with **no 12-month expiry** (unlike AWS free tier), global CDN, git-push deploys. | Static hosting only — fine, because the app is a client-side SPA. |
| **WhatsApp deep links instead of a booking backend** | The business already lives on WhatsApp; `wa.me` links need no server and cost nothing. | Not a fully automated booking pipeline — a deliberate MVP choice to ship value fast and stay free. |
| **Row Level Security as the real security boundary** | The anon/publishable key is safe to ship in the frontend *because* RLS enforces "authenticated users only" at the database. Security doesn't depend on hiding a key. | Requires careful RLS policies rather than trusting the client. |
| **Items table as the single source of pricing truth** | Change a price once; every future quotation reflects it. Line items snapshot the price at booking time so history stays accurate. | Slightly more schema, but avoids scattered hard-coded prices. |
| **Payment *ledger* instead of a single "paid" field** | Real deposits + instalments; status is *derived* from the sum of payments, so it can't drift out of sync. | An extra table, but the data models reality correctly. |
| **Browser print-to-PDF instead of a PDF library** | No dependency, works everywhere, keeps the bundle smaller. | Less pixel-perfect control than a dedicated PDF renderer — acceptable for quotations/slips. |
| **Incremental, additive schema migrations** (`schema.sql` → `v4`) | Each change ships as its own idempotent, safe-to-re-run migration against a live database. | Mirrors how real schema evolution is managed in production. |

---

## Data model (Supabase / Postgres)

| Table | Purpose |
|-------|---------|
| `items` | Rental items + unit prices — the pricing source of truth. |
| `bookings` | Core booking record; human-friendly running number via a Postgres sequence + trigger. |
| `booking_items` | Line items per booking (item, qty, unit price snapshot). |
| `quotations` | Quotation snapshot (line items as JSON) linked to a booking. |
| `booking_payments` | Payment ledger — deposit + follow-up payments; drives payment status. |
| `workers` | Worker registry (name, IC, bank details, phone). |
| `booking_workers` | Which workers are assigned to which jobs. |
| `payment_slips` + `payment_slip_bookings` | Worker payroll: one slip can cover multiple completed jobs, each with its own amount. |

**Security:** every table has Row Level Security enabled with an "authenticated users only" policy, so unauthenticated requests are rejected at the database layer. Auto booking numbers (`JK-<year>-<seq>`) are generated by a `BEFORE INSERT` trigger.

---

## Tech stack

- **Frontend:** React 18, React Router 7, Vite 6
- **Styling:** Tailwind CSS (custom brand theme), fully responsive
- **Charts:** Recharts
- **Backend-as-a-service:** Supabase (Postgres, Auth, Row Level Security)
- **Hosting / CI:** Cloudflare Pages (git-push auto-deploy, global CDN)
- **i18n:** lightweight custom React context (EN / BM), no heavy dependency

---

## Engineering highlights

- **Auth-gated SPA routing** — a `ProtectedRoute` wrapper + auth context redirect unauthenticated users to login and preserve the intended destination.
- **Derived state over stored state** — payment status is computed from the payment ledger rather than manually set, eliminating a common source of data drift.
- **Single-source-of-truth pricing** — bookings compose from the item registry; quotations snapshot prices at creation for an accurate paper trail.
- **Time-series drill-down** — one filter (all years → a year → a month) recomputes every chart's bucketing (yearly / monthly / daily) from the same dataset.
- **Idempotent migrations** — SQL migrations are written to run safely against an existing database, including back-filling data from earlier schema versions.
- **Cost-conscious architecture** — the entire stack runs on permanent free tiers, a real constraint for the business.

---

## Running it locally

```bash
npm install
npm run dev      # dev server (Vite) — prints a localhost URL
npm run build    # production build into /dist
npm run preview  # preview the production build
```

- Website: `http://localhost:5173/`
- Management login: `http://localhost:5173/system/login`

### Connect Supabase

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Then run the SQL migrations in order in the Supabase SQL Editor:
`schema.sql` → `schema_v2.sql` → `schema_v3.sql` → `schema_v4.sql`
(each is idempotent — safe to run once, in order).

Create login users under **Authentication → Users**.

### Deploy (Cloudflare Pages)

Connect the GitHub repo, then:
- **Framework preset:** React (Vite)
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

SPA routing is handled by `public/_redirects`. Node version is pinned via `.node-version`.

---

## Security notes

- Only the **publishable (anon) key** is used in the frontend; access is enforced by Row Level Security, not by key secrecy.
- The database connection string and service-role key are never committed. `.env` is gitignored.

---

## Roadmap

- Automated two-way Google Calendar sync (currently one-click add).
- In-app online booking (the public site currently hands off to WhatsApp).
- Code-splitting the charts bundle to trim initial load.
- Role tiers (owner vs. staff) on top of the existing auth.

---

## About this project

I built this end-to-end — product decisions, data modelling, UI, and deployment — to solve a genuine operational problem for a family business, under a real "keep it free" constraint. It reflects how I approach shipping: understand the actual workflow first, model the data to match reality, and choose boring, reliable, cost-appropriate technology.
