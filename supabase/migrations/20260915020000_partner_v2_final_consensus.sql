-- Partner V2 final draft persistence. The Edge Function owns case truth; this RPC
-- only stores both players' drafts atomically and reports whether their semantic
-- answers match. Correctness remains server-side in the case registry.

create or replace function public.partner_v2_submit_final_draft(
  p_room_id uuid,
  p_player_id uuid,
  p_role text,
  p_answers jsonb,
  p_evidence_ids jsonb,
  p_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.partner_v2_room_state%rowtype;
  v_other_role text;
  v_other_draft jsonb;
  v_consensus boolean := false;
begin
  if p_role not in ('creator', 'guest') then
    return jsonb_build_object('ok', false, 'error', 'invalid_role');
  end if;

  if jsonb_typeof(p_answers) <> 'object' or jsonb_typeof(p_evidence_ids) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'invalid_final_payload');
  end if;

  perform 1
    from public.partner_v2_room_state
   where room_id = p_room_id
   for update;

  select * into v_state
    from public.partner_v2_room_state
   where room_id = p_room_id;

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

  update public.partner_v2_player_state
     set private_state = jsonb_set(
       private_state,
       '{finalDraft}',
       jsonb_build_object(
         'answers', p_answers,
         'evidenceIds', p_evidence_ids,
         'submittedAt', now()
       ),
       true
     ),
     revision = revision + 1,
     updated_at = now()
   where room_id = p_room_id
     and player_id = p_player_id
     and role = p_role;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'player_state_missing');
  end if;

  v_other_role := case when p_role = 'creator' then 'guest' else 'creator' end;

  select private_state->'finalDraft'
    into v_other_draft
    from public.partner_v2_player_state
   where room_id = p_room_id
     and role = v_other_role;

  if v_other_draft is not null and jsonb_typeof(v_other_draft) = 'object' then
    v_consensus := coalesce(v_other_draft->'answers', '{}'::jsonb) = p_answers;
  end if;

  update public.partner_v2_room_state
     set shared_state = jsonb_set(shared_state, '{finalConsensus}', to_jsonb(v_consensus), true),
         revision = revision + 1,
         updated_at = now()
   where room_id = p_room_id
   returning * into v_state;

  return jsonb_build_object(
    'ok', true,
    'revision', v_state.revision,
    'chapter', v_state.chapter,
    'consensus', v_consensus,
    'otherDraft', v_other_draft
  );
end;
$$;

create or replace function public.partner_v2_mark_solved(
  p_room_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.partner_v2_room_state%rowtype;
begin
  update public.partner_v2_room_state
     set chapter = greatest(chapter, 6),
         shared_state = jsonb_set(
           jsonb_set(shared_state, '{finalConsensus}', 'true'::jsonb, true),
           '{finalSolved}',
           'true'::jsonb,
           true
         ),
         revision = revision + 1,
         updated_at = now()
   where room_id = p_room_id
   returning * into v_state;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'partner_state_missing');
  end if;

  return jsonb_build_object('ok', true, 'revision', v_state.revision, 'chapter', v_state.chapter);
end;
$$;

revoke all on function public.partner_v2_submit_final_draft(uuid, uuid, text, jsonb, jsonb, bigint) from public, anon, authenticated;
revoke all on function public.partner_v2_mark_solved(uuid) from public, anon, authenticated;
grant execute on function public.partner_v2_submit_final_draft(uuid, uuid, text, jsonb, jsonb, bigint) to service_role;
grant execute on function public.partner_v2_mark_solved(uuid) to service_role;
