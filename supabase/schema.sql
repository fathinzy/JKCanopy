-- ============================================================
-- JKCanopy Management System - Database Schema
-- Run this once in your Supabase project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ============================================================
-- ITEMS  (drives quotation pricing - single source of truth)
-- category: canopy | round_table | long_table | chair | other
-- ============================================================
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'other',
  unit_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- WORKERS
-- ============================================================
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ic text,
  bank_name text,
  bank_acc text,
  phone text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BOOKINGS
-- booking_no is a human-friendly running number: JK-2026-0001
-- status: draft | confirmed | completed | cancelled
-- payment_status: unpaid | deposit | balance | settled
-- ============================================================
create sequence if not exists public.booking_seq start 1;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_no text unique,
  customer_name text not null,
  phone text,
  address text,
  event_date date,
  theme_colour text,
  canopy_colour text default 'white',
  canopies int not null default 0,
  round_tables int not null default 0,
  long_tables int not null default 0,
  chairs int not null default 0,
  status text not null default 'draft',
  payment_status text not null default 'unpaid',
  total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- Assign a booking_no like JK-<year>-<4 digit seq> on insert if not provided.
create or replace function public.set_booking_no()
returns trigger
language plpgsql
as $$
begin
  if new.booking_no is null then
    new.booking_no := 'JK-' || to_char(now(), 'YYYY') || '-' ||
                      lpad(nextval('public.booking_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_booking_no on public.bookings;
create trigger trg_set_booking_no
  before insert on public.bookings
  for each row execute function public.set_booking_no();

-- ============================================================
-- QUOTATIONS  (one per booking; line items stored as JSON)
-- ============================================================
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  line_items jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BOOKING <-> WORKER assignments
-- ============================================================
create table if not exists public.booking_workers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (booking_id, worker_id)
);

-- ============================================================
-- PAYMENT SLIPS  (payment to a worker, optionally for a booking)
-- ============================================================
create table if not exists public.payment_slips (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references public.workers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  amount numeric(10,2) not null default 0,
  paid_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Only authenticated users (your family logins) can access data.
-- ============================================================
alter table public.items           enable row level security;
alter table public.workers         enable row level security;
alter table public.bookings        enable row level security;
alter table public.quotations      enable row level security;
alter table public.booking_workers enable row level security;
alter table public.payment_slips   enable row level security;

-- Helper: create an "authenticated users can do everything" policy per table.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'items','workers','bookings','quotations','booking_workers','payment_slips'
  ]
  loop
    execute format(
      'drop policy if exists "auth all" on public.%I;', tbl);
    execute format(
      'create policy "auth all" on public.%I for all to authenticated using (true) with check (true);',
      tbl);
  end loop;
end $$;

-- ============================================================
-- SEED: starter items (edit prices to your real rates)
-- ============================================================
insert into public.items (name, category, unit_price) values
  ('Canopy',      'canopy',      150.00),
  ('Round Table', 'round_table',  15.00),
  ('Long Table',  'long_table',   12.00),
  ('Chair',       'chair',         2.00)
on conflict do nothing;
