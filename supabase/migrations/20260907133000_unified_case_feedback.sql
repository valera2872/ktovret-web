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
  add column if not exists feedback_version smallint not null default 1,
  add column if not exists source_path text null,
  add column if not exists completion_verified boolean not null default false;

alter table public.case_reviews
  alter column feedback_version set default 2;

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

create or replace view public.case_feedback_overview as
select
  case_id,
  max(case_kind) as case_kind,
  max(mode) as mode,
  count(*)::bigint as response_count,
  round(avg(rating)::numeric, 2) as avg_rating,
  count(*) filter (where difficulty = 'too_easy')::bigint as too_easy_count,
  count(*) filter (where difficulty = 'just_right')::bigint as just_right_count,
  count(*) filter (where difficulty = 'too_hard')::bigint as too_hard_count,
  count(*) filter (where want_more = 'yes')::bigint as want_more_yes_count,
  count(*) filter (where want_more = 'maybe')::bigint as want_more_maybe_count,
  count(*) filter (where want_more = 'no')::bigint as want_more_no_count,
  count(*) filter (where nullif(btrim(comment), '') is not null)::bigint as comment_count,
  max(created_at) as latest_feedback_at
from public.case_reviews
where feedback_version >= 2
  and case_id not like 'audit_review_%'
group by case_id;

create or replace view public.case_feedback_tag_counts as
select case_id, 'liked'::text as tag_kind, tag, count(*)::bigint as response_count
from public.case_reviews r
cross join lateral unnest(r.liked_tags) as tag
where r.feedback_version >= 2
  and r.case_id not like 'audit_review_%'
group by case_id, tag
union all
select case_id, 'improve'::text as tag_kind, tag, count(*)::bigint as response_count
from public.case_reviews r
cross join lateral unnest(r.improvement_tags) as tag
where r.feedback_version >= 2
  and r.case_id not like 'audit_review_%'
group by case_id, tag;

comment on view public.case_feedback_overview is 'Mystery Logic internal post-case survey summary; excludes legacy/audit rows.';
comment on view public.case_feedback_tag_counts is 'Mystery Logic internal liked/improvement tag frequencies; excludes legacy/audit rows.';