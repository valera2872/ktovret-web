import fs from 'node:fs';
import path from 'node:path';

const HUB = 'detektivnye-igry-dlya-odnogo';

export function polishSoloKtoVret(siteRoot) {
  const file = path.join(siteRoot, HUB, 'index.html');
  if (!fs.existsSync(file)) throw new Error('Solo hub missing before Who Lies polish');

  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('А ещё здесь есть <em>«Кто врёт?»</em>', '<em>«Кто врёт?»</em>');

  if (!html.includes('<h2 id="solo407-kv-title"><em>«Кто врёт?»</em></h2>')) {
    throw new Error('Who Lies showcase title polish failed');
  }
  if (html.includes('А ещё здесь есть')) {
    throw new Error('Who Lies showcase still framed as secondary');
  }

  fs.writeFileSync(file, html);
}
