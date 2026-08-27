import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'tools', 'tests', 'artifacts', 'docs', 'ops', 'supabase', 'old.bac', 'admin']);
const MARKER = 'data-ml-social-proof-client';

export function applySocialProof(siteRoot) {
  const root = path.resolve(siteRoot);
  const assetFile = path.join(root, 'assets', 'social-proof.js');
  if (!fs.existsSync(assetFile)) throw new Error('assets/social-proof.js missing');

  let injected = 0;
  let present = 0;
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
      if (html.includes(MARKER)) {
        present += 1;
        continue;
      }
      if (!/<\/body>/i.test(html)) continue;
      const asset = path.relative(dir, assetFile).replaceAll(path.sep, '/');
      html = html.replace(/<\/body>/i, `<script ${MARKER} src="${asset}?v=1.0.0" defer></script>\n</body>`);
      fs.writeFileSync(file, html);
      injected += 1;
    }
  };

  walk(root);
  for (const relative of [
    'index.html',
    'dela/index.html',
    'detektivnye-igry-dlya-odnogo/index.html',
    'detektivnye-igry-dlya-dvoih/index.html',
  ]) {
    const file = path.join(root, relative);
    if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes(MARKER)) {
      throw new Error(`Social proof injection missing in ${relative}`);
    }
  }

  return { pages: injected + present, injected, present, version: '1.0.0' };
}
