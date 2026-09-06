-- ============================================================
-- JKCanopy - Schema v2 migration
-- Adds: deposit tracking on bookings, and a link table so one
-- payment slip can cover multiple worker jobs (each with its own amount).
-- Safe to run once in Supabase SQL Editor (idempotent).
-- ============================================================

-- ---------- Bookings: deposit tracking ----------
alter table public.bookings
  add column if not exists deposit_paid numeric(10,2) not null default 0;

-- ---------- Payment slip <-> booking link (multi-job slips) ----------
-- Each row is one completed job included in a payment slip, with the
-- amount the admin decided to pay the worker for that specific job.
create table if not exists public.payment_slip_bookings (
  id uuid primary key default gen_random_uuid(),
  slip_id uuid references public.payment_slips(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (slip_id, booking_id)
);

alter table public.payment_slip_bookings enable row level security;

drop policy if exists "auth all" on public.payment_slip_bookings;
create policy "auth all" on public.payment_slip_bookings
  for all to authenticated using (true) with check (true);

-- Helpful index for "which completed jobs has this worker already been paid for".
create index if not exists idx_psb_booking on public.payment_slip_bookings (booking_id);
create index if not exists idx_psb_slip on public.payment_slip_bookings (slip_id);

-- Index to speed up worker-assignment lookups.
create index if not exists idx_bw_worker on public.booking_workers (worker_id);
create index if not exists idx_bw_booking on public.booking_workers (booking_id);
