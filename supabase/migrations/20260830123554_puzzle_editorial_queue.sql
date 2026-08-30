create table if not exists public.puzzle_editorial_queue (
  puzzle_id text primary key,
  kind text not null check (kind in ('quick','expert')),
  slug text not null,
  title text not null,
  public_route text,
  content jsonb not null default '{}'::jsonb,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  moderation_note text,
  published_before_gate boolean not null default false,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists puzzle_editorial_queue_slug_idx
  on public.puzzle_editorial_queue (kind, slug);
create index if not exists puzzle_editorial_queue_status_idx
  on public.puzzle_editorial_queue (moderation_status, updated_at desc);

alter table public.puzzle_editorial_queue enable row level security;
revoke all on table public.puzzle_editorial_queue from anon, authenticated;
grant select, insert, update, delete on table public.puzzle_editorial_queue to service_role;

comment on table public.puzzle_editorial_queue is
  'Owner-only editorial queue for Mystery Logic puzzles. Public clients have no table access; approved content is exposed only through a narrow Edge Function manifest.';
