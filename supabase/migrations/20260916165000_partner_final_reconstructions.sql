create table if not exists public.partner_final_reconstructions (
  room_id uuid primary key references public.duel_rooms(id) on delete cascade,
  case_id text not null,
  submitted_by text not null check (submitted_by in ('investigator','analyst')),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  attempts integer not null default 1 check (attempts >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_final_reconstructions_case_id_idx
  on public.partner_final_reconstructions(case_id);

alter table public.partner_final_reconstructions enable row level security;
revoke all on table public.partner_final_reconstructions from anon, authenticated;
