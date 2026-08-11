create table if not exists public.case_first_results (
  case_id text not null check (char_length(case_id) between 3 and 160),
  player_key_hash text not null check (player_key_hash ~ '^[a-f0-9]{64}$'),
  elapsed_seconds integer not null check (elapsed_seconds between 1 and 21600),
  hints_used smallint not null check (hints_used between 0 and 10),
  attempts smallint not null check (attempts between 1 and 20),
  first_answer_correct boolean not null default false,
  completed_at timestamptz not null default now(),
  primary key (case_id, player_key_hash)
);

create index if not exists case_first_results_rank_idx
  on public.case_first_results (
    case_id,
    first_answer_correct desc,
    hints_used asc,
    attempts asc,
    elapsed_seconds asc
  );

alter table public.case_first_results enable row level security;
revoke all on table public.case_first_results from anon, authenticated;

create or replace function public.get_case_first_result_stats(
  p_case_id text,
  p_player_key_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.case_first_results%rowtype;
  v_total bigint := 0;
  v_better bigint := 0;
  v_clean bigint := 0;
  v_first_try bigint := 0;
  v_no_hint bigint := 0;
  v_median numeric := 0;
  v_rank integer := 1;
  v_top_percent integer := 100;
begin
  select *
    into v_player
    from public.case_first_results
   where case_id = p_case_id
     and player_key_hash = p_player_key_hash;

  if not found then
    return null;
  end if;

  select
    count(*),
    count(*) filter (where first_answer_correct and attempts = 1 and hints_used = 0),
    count(*) filter (where attempts = 1),
    count(*) filter (where hints_used = 0),
    coalesce(percentile_cont(0.5) within group (order by elapsed_seconds), 0)
  into v_total, v_clean, v_first_try, v_no_hint, v_median
  from public.case_first_results
  where case_id = p_case_id;

  select count(*)
    into v_better
    from public.case_first_results r
   where r.case_id = p_case_id
     and (
       (case when r.first_answer_correct then 0 else 1 end),
       r.hints_used,
       r.attempts,
       r.elapsed_seconds
     ) < (
       (case when v_player.first_answer_correct then 0 else 1 end),
       v_player.hints_used,
       v_player.attempts,
       v_player.elapsed_seconds
     );

  v_rank := greatest(1, (v_better + 1)::integer);
  if v_total > 0 then
    v_top_percent := greatest(1, least(100, ceil(v_rank * 100.0 / v_total)::integer));
  end if;

  return jsonb_build_object(
    'caseId', p_case_id,
    'totalPlayers', v_total,
    'rank', v_rank,
    'topPercent', v_top_percent,
    'sampleSufficient', v_total >= 20,
    'cleanRatePct', round((v_clean * 100.0 / greatest(v_total, 1))::numeric, 1),
    'firstTryRatePct', round((v_first_try * 100.0 / greatest(v_total, 1))::numeric, 1),
    'noHintRatePct', round((v_no_hint * 100.0 / greatest(v_total, 1))::numeric, 1),
    'medianSeconds', round(v_median)::integer,
    'player', jsonb_build_object(
      'elapsedSeconds', v_player.elapsed_seconds,
      'hintsUsed', v_player.hints_used,
      'attempts', v_player.attempts,
      'firstAnswerCorrect', v_player.first_answer_correct,
      'completedAt', v_player.completed_at
    )
  );
end;
$$;

revoke all on function public.get_case_first_result_stats(text, text) from public, anon, authenticated;
grant execute on function public.get_case_first_result_stats(text, text) to service_role;
