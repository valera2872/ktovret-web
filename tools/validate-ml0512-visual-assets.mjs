import fs from 'node:fs';
import path from 'node:path';

const files = [
  'intro-01-observatory.webp',
  'intro-02-spectral-room.webp',
  'intro-03-shutdown-data.webp',
  'intro-04-body-found.webp',
  'intro-hero-briefing.webp',
].map((name) => path.join('assets', 'ml0512', name));

for (const file of files) {
  const b = fs.readFileSync(file);
  if (b.length < 20000) throw new Error(`${file}: suspiciously small (${b.length} bytes)`);
  if (b.subarray(0, 4).toString('ascii') !== 'RIFF' || b.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error(`${file}: invalid WebP RIFF header`);
  }
  const declared = b.readUInt32LE(4) + 8;
  if (declared !== b.length) throw new Error(`${file}: truncated WebP; RIFF declares ${declared}, file has ${b.length}`);
}
console.log('ML0512_VISUAL_ASSETS_PASS');
