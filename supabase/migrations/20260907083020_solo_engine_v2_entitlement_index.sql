-- Cover the entitlement FK for ON DELETE SET NULL maintenance and entitlement-scoped resume lookups.
create index if not exists solo_case_sessions_entitlement_idx
  on public.solo_case_sessions (entitlement_id)
  where entitlement_id is not null;
