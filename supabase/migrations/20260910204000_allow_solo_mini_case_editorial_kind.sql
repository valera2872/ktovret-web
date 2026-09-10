alter table public.puzzle_editorial_queue
  drop constraint if exists puzzle_editorial_queue_kind_check;

alter table public.puzzle_editorial_queue
  add constraint puzzle_editorial_queue_kind_check
  check (
    kind = any (
      array[
        'quick'::text,
        'expert'::text,
        'who_lied_case'::text,
        'solo_mini_case'::text
      ]
    )
  );
