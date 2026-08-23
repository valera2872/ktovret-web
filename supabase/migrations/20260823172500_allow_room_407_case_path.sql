-- Allow the second curated two-player case while preserving the strict path allowlist.
alter table public.duel_rooms
  drop constraint if exists duel_rooms_case_path_format;

alter table public.duel_rooms
  add constraint duel_rooms_case_path_format check (
    case_path ~ '^/ru/cases/[a-z0-9-]+/$'
    or case_path in (
      '/detektivnye-igry-dlya-dvoih/2317/',
      '/detektivnye-igry-dlya-dvoih/407/'
    )
  );
