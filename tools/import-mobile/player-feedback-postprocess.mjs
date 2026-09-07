import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git','.github','node_modules','tools','tests','artifacts','docs','ops','supabase','old.bac','admin']);
const MARKER = 'data-ml-player-feedback-auto';

export function applyPlayerFeedback(siteRoot) {
  const root = path.resolve(siteRoot);
  const asset = path.join(root, 'assets', 'player-feedback-auto.js');
  const uiAsset = path.join(root, 'assets', 'player-feedback.js');
  if (!fs.existsSync(asset)) throw new Error('assets/player-feedback-auto.js missing');
  if (!fs.existsSync(uiAsset)) throw new Error('assets/player-feedback.js missing');

  let injected = 0;
  let present = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
        continue;
      }
      if (!entry.isFile() || entry.name !== 'index.html') continue;
      const file = path.join(dir, entry.name);
      let html = fs.readFileSync(file, 'utf8');
      if (!/<\/body>/i.test(html)) continue;
      if (html.includes(MARKER)) { present += 1; continue; }
      const relative = path.relative(dir, asset).replaceAll(path.sep, '/');
      html = html.replace(/<\/body>/i, `<script ${MARKER} src="${relative}?v=2.0.0" defer></script>\n</body>`);
      fs.writeFileSync(file, html);
      injected += 1;
    }
  };
  walk(root);

  const required = [
    'detektivnaya-igra-s-ii/index.html',
    'detektivnye-igry-dlya-odnogo/407/index.html',
    'detektivnye-igry-dlya-dvoih/2317/index.html',
    'detektivnye-igry-dlya-dvoih/407/index.html',
    'detektivnye-igry-dlya-dvoih/poslednyaya-ariya/index.html',
  ];
  for (const relative of required) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(MARKER)) throw new Error(`Feedback bootstrap missing in ${relative}`);
  }

  return { pages:injected + present, injected, present, version:'2.0.0' };
}
