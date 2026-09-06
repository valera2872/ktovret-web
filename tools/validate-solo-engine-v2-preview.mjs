#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const html = fs.readFileSync(new URL('../admin/solo-engine-v2-preview/index.html', import.meta.url), 'utf8');
const publicManifest = fs.readFileSync(new URL('../assets/cases/ml-0512-case.mjs', import.meta.url), 'utf8');

assert.match(html, /meta name="robots" content="noindex,nofollow,noarchive"/, 'preview must be noindex/nofollow/noarchive');
assert.match(html, /puzzle-editorial/, 'preview must verify an administrative key');
assert.match(html, /solo-engine-v2-core\.mjs/, 'preview must exercise the real Solo Engine 2.0 core');
assert.match(html, /solo-engine-v2-contract-case\.mjs/, 'preview must use the spoiler-free synthetic contract case');
assert.match(html, /ml-0512-case\.mjs/, 'preview must show the ML-0512 public manifest');
assert.match(html, /Private canon boundary/, 'preview must state the private-canon boundary');

const moduleMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/i);
assert(moduleMatch, 'preview must contain a module script');
const tempModule = path.join(os.tmpdir(), `solo-engine-v2-preview-${process.pid}.mjs`);
fs.writeFileSync(tempModule, moduleMatch[1], 'utf8');
const syntax = spawnSync(process.execPath, ['--check', tempModule], { encoding: 'utf8' });
try { fs.unlinkSync(tempModule); } catch {}
assert.equal(syntax.status, 0, `preview module syntax invalid:\n${syntax.stderr || syntax.stdout}`);

for (const forbidden of [
  'SOFIA_PUSHED_LEV',
  'ANTON_REDIRECTED_B2',
  'LEV_INTENDED_TO_BLAME_SOFIA',
  'PUSH_AND_FALL',
  'expectedReconstruction',
  'canonicalTruth'
]) {
  assert(!publicManifest.includes(forbidden), `public ML-0512 manifest leaks private canon token: ${forbidden}`);
  assert(!html.includes(forbidden), `internal preview leaks private ML-0512 canon token: ${forbidden}`);
}

assert.match(publicManifest, /server-authoritative-private-canon/, 'public ML-0512 manifest must require private/server runtime');
assert.match(publicManifest, /deductionAnswersStayServerSide:\s*true/, 'deduction answers must stay server-side');
assert.match(publicManifest, /characterCanonStaysServerSide:\s*true/, 'character canon must stay server-side');
assert.match(publicManifest, /reconstructionAnswersStayServerSide:\s*true/, 'reconstruction answers must stay server-side');

console.log(JSON.stringify({
  verdict: 'SOLO_ENGINE_V2_PREVIEW_PASS',
  ownerGate: true,
  noindex: true,
  previewModuleSyntax: true,
  realEngineCore: true,
  syntheticBrowserCase: true,
  publicManifestNoCanon: true
}, null, 2));
