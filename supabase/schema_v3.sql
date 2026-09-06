-- ============================================================
-- JKCanopy - Schema v3 migration
-- Adds a payment ledger: one row per payment received against a booking
-- (deposit + any follow-up payments until the balance is 0).
-- Safe to run once in Supabase SQL Editor (idempotent).
--
-- Run schema.sql and schema_v2.sql first if you have not already.
-- ============================================================

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  paid_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

alter table public.booking_payments enable row level security;

drop policy if exists "auth all" on public.booking_payments;
create policy "auth all" on public.booking_payments
  for all to authenticated using (true) with check (true);

create index if not exists idx_bp_booking on public.booking_payments (booking_id);

-- Migrate any existing deposit_paid values into the ledger as a first payment,
-- so older bookings keep their recorded deposit. Only runs where a deposit was
-- recorded and no payment rows exist yet for that booking.
insert into public.booking_payments (booking_id, amount, paid_at, note)
select b.id, b.deposit_paid, coalesce(b.created_at::date, current_date), 'Deposit'
from public.bookings b
where coalesce(b.deposit_paid, 0) > 0
  and not exists (
    select 1 from public.booking_payments p where p.booking_id = b.id
  );
