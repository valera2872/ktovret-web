import fs from 'node:fs';
import path from 'node:path';

export const PLAYER_FEEDBACK_VERSION = '1.0.0';
const CSS = '<link rel="stylesheet" href="/assets/player-feedback.css">';
const JS = '<script src="/assets/player-feedback.js" defer></script>';

function inject(file) {
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('/assets/player-feedback.js')) return false;
  if (html.includes('</head>')) html = html.replace('</head>', `  ${CSS}\n</head>`);
  else return false;
  if (html.includes('</body>')) html = html.replace('</body>', `  ${JS}\n</body>`);
  else return false;
  fs.writeFileSync(file, html);
  return true;
}
function htmlFilesBelow(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFilesBelow(p));
    else if (entry.isFile() && entry.name === 'index.html') out.push(p);
  }
  return out;
}

export function applyPlayerFeedback(siteRoot) {
  const candidates = new Set([
    ...htmlFilesBelow(path.join(siteRoot, 'delo')),
    ...htmlFilesBelow(path.join(siteRoot, 'ru', 'cases')),
    path.join(siteRoot, 'detektivnye-igry-dlya-dvoih', '2317', 'index.html'),
    path.join(siteRoot, 'detektivnye-igry-dlya-dvoih', '407', 'index.html'),
    path.join(siteRoot, 'detektivnye-igry-dlya-dvoih', 'poslednyaya-ariya', 'index.html'),
    path.join(siteRoot, 'detektivnye-igry-dlya-odnogo', '407', 'index.html'),
    path.join(siteRoot, 'detektivnaya-igra-s-ii', 'index.html'),
    path.join(siteRoot, 'ai-investigation', 'index.html'),
  ]);
  let injected = 0;
  for (const file of candidates) if (inject(file)) injected += 1;
  return { version: PLAYER_FEEDBACK_VERSION, injected };
}
