import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'tools', 'tests', 'artifacts', 'docs', 'ops', 'supabase', 'old.bac', 'admin']);
const SCRIPT_MARKER = 'data-ml-funnel';

export function applyFunnelAnalytics(siteRoot) {
  const root = path.resolve(siteRoot);
  if (!fs.existsSync(path.join(root, 'assets', 'funnel-analytics.js'))) {
    throw new Error('assets/funnel-analytics.js missing');
  }

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
      if (!/<\/body>/i.test(html)) throw new Error(`Funnel injection: </body> missing in ${path.relative(root, file)}`);
      const asset = path.relative(dir, path.join(root, 'assets', 'funnel-analytics.js')).replaceAll(path.sep, '/');
      html = html.replace(/<\/body>/i, `<script ${SCRIPT_MARKER} src="${asset}?v=1.0.0" defer></script>\n</body>`);
      fs.writeFileSync(file, html);
      injected += 1;
    }
  };

  walk(root);
  const mustContain = [
    'index.html',
    'dela/index.html',
    'kto-vret/index.html',
    'tom-1/index.html',
    'detektivnye-igry-dlya-odnogo/index.html',
    'detektivnye-igry-dlya-dvoih/index.html',
  ];
  for (const relative of mustContain) {
    const file = path.join(root, relative);
    if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes(SCRIPT_MARKER)) {
      throw new Error(`Funnel injection missing in ${relative}`);
    }
  }

  return { pages: injected + alreadyPresent, injected, alreadyPresent, version: '1.0.0' };
}
