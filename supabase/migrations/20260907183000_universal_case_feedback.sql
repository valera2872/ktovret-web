alter table public.case_reviews
  drop constraint if exists case_reviews_comment_check;

alter table public.case_reviews
  add constraint case_reviews_comment_check
  check (char_length(btrim(comment)) <= 2000);

alter table public.case_reviews
  add column if not exists liked_tags text[] not null default '{}',
  add column if not exists improve_tags text[] not null default '{}',
  add column if not exists more_intent text,
  add column if not exists experience_mode text,
  add column if not exists feedback_source text not null default 'legacy_review',
  add column if not exists feedback_version smallint not null default 1;

alter table public.case_reviews
  drop constraint if exists case_reviews_more_intent_check;

alter table public.case_reviews
  add constraint case_reviews_more_intent_check
  check (more_intent is null or more_intent in ('yes','maybe','no'));

alter table public.case_reviews
  drop constraint if exists case_reviews_experience_mode_check;

alter table public.case_reviews
  add constraint case_reviews_experience_mode_check
  check (
    experience_mode is null or experience_mode in
      ('short','solo','partner','party','ai_text','ai_live','other')
  );

create index if not exists case_reviews_feedback_source_created_idx
  on public.case_reviews (feedback_source, created_at desc);
