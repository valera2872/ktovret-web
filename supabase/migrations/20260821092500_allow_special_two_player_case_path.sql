-- Keep duel room paths constrained while allowing the dedicated asymmetric
-- two-player investigation outside the ordinary /ru/cases/ catalogue.
alter table public.duel_rooms
  drop constraint if exists duel_rooms_case_path_format;

alter table public.duel_rooms
  add constraint duel_rooms_case_path_format check (
    case_path ~ '^/ru/cases/[a-z0-9-]+/$'
    or case_path = '/detektivnye-igry-dlya-dvoih/2317/'
  );
