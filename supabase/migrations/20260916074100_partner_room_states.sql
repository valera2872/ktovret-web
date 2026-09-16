-- Shared server-authoritative state for Premium Partner investigations.
-- Access is intentionally service-role only; public clients go through Edge Functions.

create table if not exists public.partner_room_states (
  room_id uuid primary key references public.duel_rooms(id) on delete cascade,
  case_id text not null,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  entitlement_id uuid null references public.access_entitlements(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_room_states_case_id_idx
  on public.partner_room_states(case_id);

create index if not exists partner_room_states_updated_at_idx
  on public.partner_room_states(updated_at desc);

alter table public.partner_room_states enable row level security;
revoke all on table public.partner_room_states from anon, authenticated;
