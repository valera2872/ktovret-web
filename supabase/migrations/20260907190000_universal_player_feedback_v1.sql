alter table public.case_reviews
  add column if not exists liked_tags text[] not null default '{}',
  add column if not exists disliked_tags text[] not null default '{}',
  add column if not exists more_cases_interest text,
  add column if not exists feedback_context jsonb not null default '{}'::jsonb,
  add column if not exists feedback_version text not null default 'v1';

-- Free-text feedback is optional in the universal survey. Preserve the 2000-char ceiling.
do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.case_reviews'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%comment%'
  loop
    execute format('alter table public.case_reviews drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.case_reviews
  add constraint case_reviews_comment_length_check
  check (char_length(btrim(comment)) between 0 and 2000);

do $$ begin
  alter table public.case_reviews
    add constraint case_reviews_more_cases_interest_check
    check (more_cases_interest is null or more_cases_interest in ('yes','maybe','no'));
exception when duplicate_object then null;
end $$;

comment on column public.case_reviews.liked_tags is 'Structured positive feedback from the post-case survey.';
comment on column public.case_reviews.disliked_tags is 'Structured friction/negative feedback from the post-case survey.';
comment on column public.case_reviews.more_cases_interest is 'Whether the player wants more investigations: yes/maybe/no.';
comment on column public.case_reviews.feedback_context is 'Non-PII context such as mode/path/client feedback version.';
