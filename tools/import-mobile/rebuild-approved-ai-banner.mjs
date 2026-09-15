import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const EXPECTED_SHA256='e4174a50e199cda3a114eb452590c5614ca31310e081539de660d78169373a68';
const PART_RE=/^ai01-approved\.\d+\.b64\.txt$/;

export function rebuildApprovedAiBanner(siteRoot){
  const partsDir=path.join(siteRoot,'assets','reference-parts');
  const files=fs.readdirSync(partsDir).filter(name=>PART_RE.test(name)).sort();
  if(files.length!==4) throw new Error(`approved AI banner expected 4 chunks, got ${files.length}`);
  const base64=files.map(name=>fs.readFileSync(path.join(partsDir,name),'utf8').trim()).join('');
  const bytes=Buffer.from(base64,'base64');
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  if(sha!==EXPECTED_SHA256) throw new Error(`approved AI banner checksum mismatch: ${sha}`);
  if(bytes.subarray(0,4).toString()!=='RIFF' || bytes.subarray(8,12).toString()!=='WEBP') throw new Error('approved AI banner is not valid WebP container');
  fs.writeFileSync(path.join(siteRoot,'assets','ai01-home-banner.webp'),bytes);
  fs.writeFileSync(path.join(siteRoot,'assets','ai01-mobile-banner.webp'),bytes);
  return {bytes:bytes.length,sha256:sha,parts:files.length};
}
