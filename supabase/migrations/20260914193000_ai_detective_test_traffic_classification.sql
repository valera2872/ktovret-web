alter table public.ai_detective_sessions
  add column if not exists is_test boolean generated always as (
    session_id like 'ci-%'
    or session_id like '%-ci-%'
    or session_id ~ '^(easy|medium|hard-(short|full))-[0-9]+-[0-9]+$'
    or session_id ilike '%smoke%'
  ) stored;

alter table public.ai_detective_ai_calls
  add column if not exists is_test boolean generated always as (
    session_id like 'ci-%'
    or session_id like '%-ci-%'
    or session_id ~ '^(easy|medium|hard-(short|full))-[0-9]+-[0-9]+$'
    or session_id ilike '%smoke%'
  ) stored;

create index if not exists ai_detective_sessions_human_created_idx
  on public.ai_detective_sessions(created_at desc)
  where is_test = false;

create index if not exists ai_detective_ai_calls_human_created_idx
  on public.ai_detective_ai_calls(created_at desc)
  where is_test = false;
