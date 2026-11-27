-- P-001 private AI memory: bound to paid Solo sessions, not accessible to anon/authenticated.
CREATE TABLE public.p001_ai_dialogue_turns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_key text NOT NULL REFERENCES public.solo_case_sessions(session_key) ON DELETE CASCADE,
  entitlement_id uuid NOT NULL REFERENCES public.access_entitlements(id) ON DELETE CASCADE,
  case_id text NOT NULL DEFAULT 'P-001' CHECK (case_id = 'P-001'),
  character_id text NOT NULL CHECK (character_id IN ('ingrid','lund','kraus','voss','richter','vestad')),
  turn_id uuid NOT NULL,
  question text NOT NULL CHECK (char_length(question) BETWEEN 1 AND 700),
  answer text NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 1200),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT p001_ai_turns_idempotency UNIQUE (session_key, turn_id)
);
CREATE INDEX p001_ai_turns_history_idx ON public.p001_ai_dialogue_turns (session_key, character_id, id DESC);
ALTER TABLE public.p001_ai_dialogue_turns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.p001_ai_dialogue_turns FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.p001_ai_dialogue_turns TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.p001_ai_dialogue_turns_id_seq TO service_role;