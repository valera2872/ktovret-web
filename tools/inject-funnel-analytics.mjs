#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback = '') => {
  const index = args.indexOf(flag);
  return index >= 0 ? String(args[index + 1] || fallback) : fallback;
};
const siteRoot = path.resolve(valueAfter('--site', '.'));
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'tools', 'tests', 'artifacts', 'docs', 'ops', 'supabase', 'old.bac', 'admin']);
const SCRIPT_MARKER = 'data-ml-funnel';
let injected = 0;
let alreadyPresent = 0;

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name));
      continue;
    }
    if (!entry.isFile() || entry.name !== 'index.html') continue;

    const file = path.join(dir, entry.name);
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes(SCRIPT_MARKER)) {
      alreadyPresent += 1;
      continue;
    }
    if (!/<\/body>/i.test(html)) throw new Error(`Funnel injection: </body> missing in ${path.relative(siteRoot, file)}`);

    const asset = path.relative(dir, path.join(siteRoot, 'assets', 'funnel-analytics.js')).replaceAll(path.sep, '/');
    const script = `<script ${SCRIPT_MARKER} src="${asset}?v=1.0.0" defer></script>`;
    html = html.replace(/<\/body>/i, `${script}\n</body>`);
    fs.writeFileSync(file, html);
    injected += 1;
  }
};

if (!fs.existsSync(siteRoot)) throw new Error(`Site root not found: ${siteRoot}`);
if (!fs.existsSync(path.join(siteRoot, 'assets', 'funnel-analytics.js'))) throw new Error('assets/funnel-analytics.js missing');
walk(siteRoot);

const mustContain = [
  'index.html',
  'dela/index.html',
  'kto-vret/index.html',
  'tom-1/index.html',
  'detektivnye-igry-dlya-odnogo/index.html',
  'detektivnye-igry-dlya-dvoih/index.html',
  'golovolomki-onlayn/index.html',
  'zagadki-na-logiku-dlya-vzroslyh/index.html',
];
for (const relative of mustContain) {
  const file = path.join(siteRoot, relative);
  if (!fs.existsSync(file)) continue;
  if (!fs.readFileSync(file, 'utf8').includes(SCRIPT_MARKER)) {
    throw new Error(`Funnel injection missing in ${relative}`);
  }
}

console.log(JSON.stringify({ funnelAnalytics: true, injected, alreadyPresent }, null, 2));
