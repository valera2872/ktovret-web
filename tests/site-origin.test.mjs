import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'mysterylogic-origin-'));
const staging = 'https://valera2872.github.io/ktovret-web/';
const production = 'https://mysterylogic.com/';

fs.mkdirSync(path.join(fixture, 'ru', 'cases', 'test-case'), { recursive: true });
fs.writeFileSync(path.join(fixture, 'index.html'), `<link rel="canonical" href="${staging}"><meta property="og:url" content="${staging}">`);
fs.writeFileSync(path.join(fixture, 'ru', 'cases', 'test-case', 'index.html'), `<link rel="canonical" href="${staging}ru/cases/test-case/">`);
fs.writeFileSync(path.join(fixture, 'sitemap.xml'), `<urlset><url><loc>${staging}ru/cases/test-case/</loc></url></urlset>`);
fs.writeFileSync(path.join(fixture, 'robots.txt'), `Sitemap: ${staging}sitemap.xml\n`);

const moduleUrl = new URL('../tools/import-mobile/site-origin-postprocess.mjs', import.meta.url).href;
const script = `import {applySiteOrigin} from ${JSON.stringify(moduleUrl)}; applySiteOrigin(${JSON.stringify(fixture)});`;
const run = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
  cwd: root,
  env: { ...process.env, MYSTERYLOGIC_SITE_ORIGIN: production },
  encoding: 'utf8',
});

assert.equal(run.status, 0, `production origin smoke failed: ${run.stderr || run.stdout}`);
for (const relative of ['index.html', 'ru/cases/test-case/index.html', 'sitemap.xml', 'robots.txt']) {
  const text = fs.readFileSync(path.join(fixture, relative), 'utf8');
  assert.ok(!text.includes(staging), `${relative} still contains staging origin`);
  assert.ok(text.includes(production), `${relative} did not switch to production origin`);
}
assert.equal(fs.readFileSync(path.join(fixture, 'robots.txt'), 'utf8'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${production}sitemap.xml\n`);
fs.rmSync(fixture, { recursive: true, force: true });
console.log('site origin 1.9 smoke passed: staging -> mysterylogic.com with robots/sitemap/canonical migration');
