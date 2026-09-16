#!/usr/bin/env node

import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const CASE_ID = 'partner:zero-container';
const PRODUCTION_REF = 'orknvuwknvsedjgqcfwc';
const endpoint = String(process.env.PARTNER_V2_ENDPOINT || process.argv[2] || '').trim().replace(/\/$/, '');
const allowProduction = process.env.ALLOW_PRODUCTION === '1';

if (!endpoint) {
  console.error('Usage: PARTNER_V2_ENDPOINT=https://<dev-ref>.supabase.co/functions/v1/coop-case-v2 node scripts/partner-v2-smoke.mjs');
  process.exit(2);
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/coop-case-v2$/i.test(endpoint)) {
  console.error(`Refusing unexpected endpoint: ${endpoint}`);
  process.exit(2);
}

if (endpoint.includes(`https://${PRODUCTION_REF}.supabase.co/`) && !allowProduction) {
  console.error('Refusing to run Partner V2 smoke test against production. Use a Supabase development branch endpoint.');
  console.error('Set ALLOW_PRODUCTION=1 only for an explicitly approved production diagnostic.');
  process.exit(2);
}

const browserKey = () => randomBytes(24).toString('hex');
const creatorKey = browserKey();
const guestKey = browserKey();
let roomCode = '';

const log = (message) => console.log(`[partner-v2-smoke] ${message}`);

const request = async (key, body, expectedStatuses = [200, 201]) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ ...body, browserKey: key }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!expectedStatuses.includes(response.status)) {
    const error = new Error(payload?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
};

const status = (key) => request(key, { action: 'status', code: roomCode }, [200]);

const assertRoleIsolation = (state, expectedRole) => {
  assert.equal(state.ok, true);
  assert.equal(state.room.caseId, CASE_ID);
  assert.equal(state.me.role, expectedRole);
  const ownPrefix = expectedRole === 'creator' ? 'M' : 'G';
  const forbiddenPrefix = expectedRole === 'creator' ? 'G' : 'M';
  const ids = (state.evidence || []).map((item) => String(item.id));
  assert.ok(ids.length > 0, `${expectedRole} should receive evidence`);
  assert.ok(ids.every((id) => id.startsWith(ownPrefix)), `${expectedRole} received non-${ownPrefix} evidence: ${ids.join(', ')}`);
  assert.ok(ids.every((id) => !id.startsWith(forbiddenPrefix)), `${expectedRole} leaked ${forbiddenPrefix} evidence: ${ids.join(', ')}`);
};

const submitCheckpoint = async (key, checkpointId, value, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const fresh = await status(key);
    try {
      return await request(key, {
        action: 'submit_checkpoint',
        code: roomCode,
        checkpointId,
        value,
        clientRevision: fresh.state.revision,
      }, [200]);
    } catch (error) {
      if (error.status === 409 && error.payload?.error === 'state_conflict' && attempt < retries) continue;
      throw error;
    }
  }
  throw new Error(`checkpoint_retry_exhausted:${checkpointId}`);
};

const submitFinal = async (key, answers, evidenceIds, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const fresh = await status(key);
    try {
      return await request(key, {
        action: 'submit_final',
        code: roomCode,
        answers,
        evidenceIds,
        clientRevision: fresh.state.revision,
      }, [200]);
    } catch (error) {
      if (error.status === 409 && error.payload?.error === 'state_conflict' && attempt < retries) continue;
      throw error;
    }
  }
  throw new Error('final_retry_exhausted');
};

const correctFinal = {
  replacement: 'tk0',
  place: 'vector12_loop_b',
  window: '0206_0222',
  method: 'whole_container_swap',
  executor: 'rybakov',
  organizer: 'markova',
};

const run = async () => {
  log(`endpoint ${endpoint}`);
  log('creating room as Маршрут');
  const created = await request(creatorKey, {
    action: 'create',
    caseId: CASE_ID,
    playerName: 'Smoke Route',
  }, [201]);

  roomCode = created.room.code;
  assert.match(roomCode, /^[A-HJ-NP-Z2-9]{8}$/);
  assertRoleIsolation(created, 'creator');
  assert.equal(created.state.chapter, 1);
  assert.equal(created.resolution, null);

  log(`room ${roomCode}: joining second independent client as Груз`);
  const preview = await request(guestKey, { action: 'preview', code: roomCode }, [200]);
  assert.equal(preview.room.caseId, CASE_ID);
  assert.equal(preview.roomFull, false);

  const joined = await request(guestKey, {
    action: 'join',
    code: roomCode,
    playerName: 'Smoke Cargo',
  }, [200]);
  assertRoleIsolation(joined, 'guest');
  assert.equal(joined.bothJoined, true);

  const creatorAfterJoin = await status(creatorKey);
  assert.equal(creatorAfterJoin.bothJoined, true);
  assertRoleIsolation(creatorAfterJoin, 'creator');

  log('starting both clients');
  const creatorStarted = await request(creatorKey, { action: 'start', code: roomCode }, [200]);
  const guestStarted = await request(guestKey, { action: 'start', code: roomCode }, [200]);
  assert.equal(creatorStarted.me.started, true);
  assert.equal(guestStarted.me.started, true);

  log('checkpoint 1: independent initial hypotheses + persisted refresh state');
  const firstCreator = await submitCheckpoint(creatorKey, 'initial_hypothesis', 'during_stop');
  assert.equal(firstCreator.state.chapter, 1);
  assert.equal(firstCreator.me.firstHypothesis, 'during_stop');

  const creatorRefresh = await status(creatorKey);
  assert.equal(creatorRefresh.me.firstHypothesis, 'during_stop');
  assert.equal(creatorRefresh.state.shared.initialHypothesesComplete, false);

  const firstGuest = await submitCheckpoint(guestKey, 'initial_hypothesis', 'insufficient');
  assert.equal(firstGuest.state.chapter, 2);
  assert.equal(firstGuest.state.shared.initialHypothesesComplete, true);
  assertRoleIsolation(firstGuest, 'guest');

  const chapter2Creator = await status(creatorKey);
  assert.equal(chapter2Creator.state.chapter, 2);
  assert.equal(chapter2Creator.state.shared.initialHypothesesComplete, true);
  assertRoleIsolation(chapter2Creator, 'creator');

  log('checkpoint 2: wrong photo observation must not unlock, then both correct observations unlock chapter 3');
  const wrongPhoto = await submitCheckpoint(creatorKey, 'photo_observation', { patch: 'present', scratch: 'present' });
  assert.equal(wrongPhoto.checkpointResult.correct, false);
  assert.equal(wrongPhoto.state.chapter, 2);
  assert.equal(wrongPhoto.state.shared.photoComparisonSolved, false);

  const photoCreator = await submitCheckpoint(creatorKey, 'photo_observation', { patch: 'absent', scratch: 'absent' });
  assert.equal(photoCreator.checkpointResult.correct, true);
  assert.equal(photoCreator.checkpointResult.sharedUnlocked, false);
  assert.equal(photoCreator.state.chapter, 2);

  const photoGuest = await submitCheckpoint(guestKey, 'photo_observation', { patch: 'present', scratch: 'present' });
  assert.equal(photoGuest.checkpointResult.correct, true);
  assert.equal(photoGuest.checkpointResult.sharedUnlocked, true);
  assert.equal(photoGuest.state.chapter, 3);
  assert.equal(photoGuest.state.shared.photoComparisonSolved, true);
  assertRoleIsolation(photoGuest, 'guest');

  log('checkpoint 3: cross-role T-04391 link');
  const linkCreator = await submitCheckpoint(creatorKey, 't04391_link', 'rybakov_r4');
  assert.equal(linkCreator.checkpointResult.correct, true);
  assert.equal(linkCreator.state.chapter, 3);

  const linkGuest = await submitCheckpoint(guestKey, 't04391_link', 'tk0');
  assert.equal(linkGuest.checkpointResult.sharedUnlocked, true);
  assert.equal(linkGuest.state.chapter, 4);
  assert.equal(linkGuest.state.shared.t04391Linked, true);

  log('checkpoint 4a: physical operation');
  const physicalCreator = await submitCheckpoint(creatorKey, 'physical_operation', 'two_loaded_objects');
  assert.equal(physicalCreator.checkpointResult.correct, true);
  assert.equal(physicalCreator.state.shared.physicalSwapProven, false);

  const physicalGuest = await submitCheckpoint(guestKey, 'physical_operation', 'mass_compensated');
  assert.equal(physicalGuest.checkpointResult.sharedUnlocked, true);
  assert.equal(physicalGuest.state.shared.physicalSwapProven, true);
  assert.equal(physicalGuest.state.chapter, 4);

  log('checkpoint 4b: Endpoint 184 / L-14 coordination');
  const endpointCreator = await submitCheckpoint(creatorKey, 'endpoint_link', 'endpoint184_call');
  assert.equal(endpointCreator.checkpointResult.correct, true);
  assert.equal(endpointCreator.state.chapter, 4);

  const endpointGuest = await submitCheckpoint(guestKey, 'endpoint_link', 'l14_markova');
  assert.equal(endpointGuest.checkpointResult.sharedUnlocked, true);
  assert.equal(endpointGuest.state.chapter, 5);
  assert.equal(endpointGuest.state.shared.endpoint184Linked, true);

  const finalCreatorState = await status(creatorKey);
  const finalGuestState = await status(guestKey);
  assert.ok(finalCreatorState.case.finalUi);
  assert.ok(finalGuestState.case.finalUi);
  assert.equal(finalCreatorState.resolution, null);
  assert.equal(finalGuestState.resolution, null);
  assertRoleIsolation(finalCreatorState, 'creator');
  assertRoleIsolation(finalGuestState, 'guest');

  log('final: first force a semantic disagreement without revealing correctness');
  const creatorDraft = await submitFinal(creatorKey, correctFinal, ['M08', 'M09']);
  assert.equal(creatorDraft.finalResult.status, 'waiting_partner');
  assert.equal(creatorDraft.resolution, null);

  const disagreeingGuestAnswers = { ...correctFinal, organizer: 'rybakov' };
  const guestDisagreement = await submitFinal(guestKey, disagreeingGuestAnswers, ['G02', 'G08']);
  assert.equal(guestDisagreement.finalResult.status, 'disagreement');
  assert.ok(guestDisagreement.finalResult.differences.some((item) => item.field === 'organizer'));
  assert.equal(guestDisagreement.resolution, null);
  assert.equal(guestDisagreement.state.shared.finalSolved, false);

  log('final: guest aligns with creator; four evidence classes should resolve the case');
  const solved = await submitFinal(guestKey, correctFinal, ['G02', 'G08']);
  assert.equal(solved.finalResult.status, 'solved');
  assert.equal(solved.state.shared.finalConsensus, true);
  assert.equal(solved.state.shared.finalSolved, true);
  assert.equal(solved.state.chapter, 6);
  assert.ok(solved.resolution?.timeline?.length > 0);

  const solvedCreator = await status(creatorKey);
  assert.equal(solvedCreator.state.shared.finalSolved, true);
  assert.equal(solvedCreator.state.chapter, 6);
  assert.ok(solvedCreator.resolution?.title);
  assertRoleIsolation(solvedCreator, 'creator');

  log('PASS: create/join, isolation, persistence, all gates, disagreement and consensus final');
};

run().catch((error) => {
  console.error(`[partner-v2-smoke] FAIL${roomCode ? ` room=${roomCode}` : ''}:`, error);
  process.exitCode = 1;
});
