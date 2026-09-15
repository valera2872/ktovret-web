-- Generic atomic gate checkpoint for Partner V2.
-- The Edge Function computes correctness from server-only case rules, then this
-- RPC stores the player's attempt and unlocks the next shared chapter only when
-- both roles have a correct submission for the same checkpoint.

create or replace function public.partner_v2_submit_gate_checkpoint(
  p_room_id uuid,
  p_player_id uuid,
  p_role text,
  p_checkpoint_key text,
  p_value jsonb,
  p_is_correct boolean,
  p_shared_key text,
  p_unlock_chapter integer,
  p_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.partner_v2_room_state%rowtype;
  v_private jsonb;
  v_existing jsonb;
  v_other_correct boolean;
  v_both_correct boolean;
  v_next_chapter integer;
  v_checkpoint_path text[];
begin
  if p_role not in ('creator', 'guest') then
    return jsonb_build_object('ok', false, 'error', 'invalid_role');
  end if;

  if p_checkpoint_key !~ '^[a-z0-9_]{3,64}$' or p_shared_key !~ '^[A-Za-z0-9_]{3,64}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_checkpoint');
  end if;

  if p_unlock_chapter < 1 or p_unlock_chapter > 20 then
    return jsonb_build_object('ok', false, 'error', 'invalid_chapter');
  end if;

  select * into v_state
  from public.partner_v2_room_state
  where room_id = p_room_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'partner_state_missing');
  end if;

  if v_state.revision <> p_expected_revision then
    return jsonb_build_object(
      'ok', false,
      'error', 'state_conflict',
      'currentRevision', v_state.revision
    );
  end if;

  select private_state into v_private
  from public.partner_v2_player_state
  where room_id = p_room_id and player_id = p_player_id and role = p_role
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'player_state_missing');
  end if;

  v_existing := coalesce(v_private->'checkpoints'->p_checkpoint_key, '{}'::jsonb);

  if coalesce((v_existing->>'correct')::boolean, false) then
    return jsonb_build_object(
      'ok', true,
      'revision', v_state.revision,
      'chapter', v_state.chapter,
      'idempotent', true,
      'correct', true,
      'sharedUnlocked', coalesce((v_state.shared_state->>p_shared_key)::boolean, false)
    );
  end if;

  v_checkpoint_path := array['checkpoints', p_checkpoint_key];

  update public.partner_v2_player_state
  set private_state = jsonb_set(
        private_state,
        v_checkpoint_path,
        jsonb_build_object(
          'value', p_value,
          'correct', p_is_correct,
          'submittedAt', now()
        ),
        true
      ),
      revision = revision + 1,
      updated_at = now()
  where room_id = p_room_id and player_id = p_player_id and role = p_role;

  if p_is_correct then
    select exists (
      select 1
      from public.partner_v2_player_state
      where room_id = p_room_id
        and role <> p_role
        and coalesce((private_state->'checkpoints'->p_checkpoint_key->>'correct')::boolean, false)
    ) into v_other_correct;
  else
    v_other_correct := false;
  end if;

  v_both_correct := p_is_correct and v_other_correct;
  v_next_chapter := case when v_both_correct then greatest(v_state.chapter, p_unlock_chapter) else v_state.chapter end;

  update public.partner_v2_room_state
  set chapter = v_next_chapter,
      revision = revision + 1,
      shared_state = case
        when v_both_correct then jsonb_set(shared_state, array[p_shared_key], 'true'::jsonb, true)
        else shared_state
      end,
      updated_at = now()
  where room_id = p_room_id
  returning * into v_state;

  return jsonb_build_object(
    'ok', true,
    'correct', p_is_correct,
    'revision', v_state.revision,
    'chapter', v_state.chapter,
    'sharedUnlocked', coalesce((v_state.shared_state->>p_shared_key)::boolean, false)
  );
end;
$$;

revoke all on function public.partner_v2_submit_gate_checkpoint(uuid, uuid, text, text, jsonb, boolean, text, integer, bigint) from public, anon, authenticated;
grant execute on function public.partner_v2_submit_gate_checkpoint(uuid, uuid, text, text, jsonb, boolean, text, integer, bigint) to service_role;
