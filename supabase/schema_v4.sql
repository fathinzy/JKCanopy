-- ============================================================
-- JKCanopy - Schema v4 migration
-- Bookings become line-item based: each booking has a list of items
-- chosen from the Item Registry, each with its own qty and unit price.
-- Safe to run once in Supabase SQL Editor (idempotent).
--
-- Run schema.sql, schema_v2.sql, schema_v3.sql first.
-- ============================================================

create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  name text not null,            -- snapshot of item name at time of booking
  category text not null default 'other',
  qty numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  amount numeric(10,2) not null default 0,   -- qty * unit_price
  created_at timestamptz not null default now()
);

alter table public.booking_items enable row level security;

drop policy if exists "auth all" on public.booking_items;
create policy "auth all" on public.booking_items
  for all to authenticated using (true) with check (true);

create index if not exists idx_bi_booking on public.booking_items (booking_id);
create index if not exists idx_bi_category on public.booking_items (category);

-- The bookings table keeps its canopies/round_tables/long_tables/chairs columns
-- for backward compatibility, but new bookings no longer rely on them. The
-- dashboard now counts canopies from booking_items where category = 'canopy'.
