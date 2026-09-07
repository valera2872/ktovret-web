alter table public.case_reviews
  alter column comment set default '';

alter table public.case_reviews
  drop constraint if exists case_reviews_comment_check;

alter table public.case_reviews
  add constraint case_reviews_comment_check
  check (char_length(btrim(comment)) between 0 and 2000);

alter table public.case_reviews
  add column if not exists liked_tags text[] not null default '{}',
  add column if not exists improvement_tags text[] not null default '{}',
  add column if not exists want_more text null,
  add column if not exists case_kind text not null default 'short',
  add column if not exists mode text null,
  add column if not exists feedback_version smallint not null default 2,
  add column if not exists source_path text null,
  add column if not exists completion_verified boolean not null default false;

alter table public.case_reviews
  drop constraint if exists case_reviews_want_more_check,
  add constraint case_reviews_want_more_check check (want_more is null or want_more in ('yes','maybe','no')),
  drop constraint if exists case_reviews_case_kind_check,
  add constraint case_reviews_case_kind_check check (case_kind in ('short','premium','ai','custom')),
  drop constraint if exists case_reviews_mode_check,
  add constraint case_reviews_mode_check check (mode is null or mode in ('solo','partner','party','ai','text','live')),
  drop constraint if exists case_reviews_feedback_version_check,
  add constraint case_reviews_feedback_version_check check (feedback_version between 1 and 20),
  drop constraint if exists case_reviews_source_path_check,
  add constraint case_reviews_source_path_check check (source_path is null or (left(source_path,1)='/' and char_length(source_path) <= 300)),
  drop constraint if exists case_reviews_liked_tags_check,
  add constraint case_reviews_liked_tags_check check (cardinality(liked_tags) <= 12),
  drop constraint if exists case_reviews_improvement_tags_check,
  add constraint case_reviews_improvement_tags_check check (cardinality(improvement_tags) <= 12);

create index if not exists case_reviews_product_feedback_idx
  on public.case_reviews (case_id, created_at desc)
  where case_id not like 'audit_review_%';

create index if not exists case_reviews_rating_idx
  on public.case_reviews (rating, created_at desc)
  where case_id not like 'audit_review_%';