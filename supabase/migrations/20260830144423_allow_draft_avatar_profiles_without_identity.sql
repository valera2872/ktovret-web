alter table public.ai_case_avatar_profiles
  drop constraint if exists ai_case_avatar_profiles_avatar_id_chk;

alter table public.ai_case_avatar_profiles
  add constraint ai_case_avatar_profiles_avatar_id_chk check (
    (status = 'published' and char_length(avatar_id) between 1 and 256)
    or (status in ('draft','retired') and char_length(avatar_id) between 0 and 256)
  );
