#!/usr/bin/env node

import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const endpoint = String(
  process.env.LOCAL_PARTNER_V2_ENDPOINT || 'http://127.0.0.1:54321/functions/v1/coop-case-v2'
).trim().replace(/\/$/, '');

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/functions\/v1\/coop-case-v2$/i.test(endpoint)) {
  console.error(`Refusing unexpected endpoint: ${endpoint}`);
  process.exit(2);
}

const key = () => randomBytes(24).toString('hex');
const creatorKey = key();
const guestKey = key();
let code = '';

const request = async (browserKey, body, statuses = [200, 201]) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ ...body, browserKey }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!statuses.includes(response.status)) {
    const error = new Error(payload?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
};

const status = (browserKey) => request(browserKey, { action: 'status', code });

const checkpoint = async (browserKey, checkpointId, value) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const fresh = await status(browserKey);
    try {
      return await request(browserKey, {
        action: 'submit_checkpoint',
        code,
        checkpointId,
        value,
        clientRevision: fresh.state.revision,
      });
    } catch (error) {
      if (error.status === 409 && error.payload?.error === 'state_conflict') continue;
      throw error;
    }
  }
  throw new Error(`checkpoint retry exhausted: ${checkpointId}`);
};

const created = await request(creatorKey, {
  action: 'create',
  caseId: 'partner:zero-container',
  playerName: 'Tolerance Route',
});
code = created.room.code;

await request(guestKey, { action: 'join', code, playerName: 'Tolerance Cargo' });
await request(creatorKey, { action: 'start', code });
await request(guestKey, { action: 'start', code });
await checkpoint(creatorKey, 'initial_hypothesis', 'during_stop');
await checkpoint(guestKey, 'initial_hypothesis', 'insufficient');

// Creator profile is absent / absent / present. One wrong observation is tolerated.
const creatorPhoto = await checkpoint(creatorKey, 'photo_observation', {
  patch: 'absent',
  scratch: 'absent',
  door_deformation: 'absent',
});
assert.equal(creatorPhoto.checkpointResult.correct, true);
assert.equal(creatorPhoto.state.chapter, 2);

// Guest profile is present / present / absent. Again, one wrong observation is tolerated.
const guestPhoto = await checkpoint(guestKey, 'photo_observation', {
  patch: 'present',
  scratch: 'absent',
  door_deformation: 'absent',
});
assert.equal(guestPhoto.checkpointResult.correct, true);
assert.equal(guestPhoto.checkpointResult.sharedUnlocked, true);
assert.equal(guestPhoto.state.chapter, 3);
assert.equal(guestPhoto.state.shared.photoComparisonSolved, true);

console.log(`[partner-v2-photo-tolerance] PASS room=${code}: 2-of-3 observations unlock chapter 3`);
