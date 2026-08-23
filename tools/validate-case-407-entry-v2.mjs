#!/usr/bin/env node
import fs from 'node:fs';

const css = fs.readFileSync('assets/case-407-entry-v2.css', 'utf8');
const page = fs.readFileSync('tools/import-mobile/two-player-407-postprocess.mjs', 'utf8');
const requiredCss = [
  "url('/assets/room-407-evidence.webp')",
  'ПРЕМИАЛЬНОЕ РАССЛЕДОВАНИЕ · ДВА ЭКРАНА',
  '2 игрока   ·   разные улики',
  '.case407-body.coop-v4 .case407-room-mark',
  '@media(max-width:760px)',
];
for (const marker of requiredCss) {
  if (!css.includes(marker)) throw new Error(`Room 407 entry v2 missing CSS marker: ${marker}`);
}
if (!page.includes('case-407-entry-v2.css')) throw new Error('Room 407 page does not load entry v2 stylesheet');
if (!page.includes("const VERSION = '1.1.0'")) throw new Error('Room 407 asset version was not bumped');
console.log(JSON.stringify({ entry: 'Room 407 v2', markers: requiredCss.length, status: 'passed' }, null, 2));
