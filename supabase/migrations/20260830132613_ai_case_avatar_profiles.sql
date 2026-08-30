create table public.ai_case_avatar_profiles (
  case_id text not null,
  suspect_id text not null,
  status text not null default 'draft',
  provider text not null default 'liveavatar',
  avatar_id text not null,
  tts_voice text not null,
  tts_instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (case_id, suspect_id),
  constraint ai_case_avatar_profiles_case_id_chk check (case_id ~ '^[A-Za-z0-9_:-]{3,160}$'),
  constraint ai_case_avatar_profiles_suspect_id_chk check (suspect_id ~ '^[A-Za-z0-9_:-]{1,80}$'),
  constraint ai_case_avatar_profiles_status_chk check (status in ('draft','published','retired')),
  constraint ai_case_avatar_profiles_provider_chk check (provider in ('liveavatar')),
  constraint ai_case_avatar_profiles_avatar_id_chk check (char_length(avatar_id) between 1 and 256),
  constraint ai_case_avatar_profiles_tts_voice_chk check (char_length(tts_voice) between 1 and 80),
  constraint ai_case_avatar_profiles_tts_instructions_chk check (char_length(tts_instructions) <= 1600)
);

alter table public.ai_case_avatar_profiles enable row level security;
revoke all on table public.ai_case_avatar_profiles from anon, authenticated;
grant select, insert, update, delete on table public.ai_case_avatar_profiles to service_role;

comment on table public.ai_case_avatar_profiles is 'Server-only LiveAvatar and TTS identity mapping for paid AI cases. No anon/authenticated access.';
