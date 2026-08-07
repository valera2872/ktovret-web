import fs from 'node:fs';
import path from 'node:path';

const VERSION = '1.4.0';
const SCROLL_VERSION = '1.4.1';
const safeJson = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

const publicCharacters = (item) => (item.characters || [])
  .filter((character) => character?.id && !String(character.id).startsWith('__'))
  .map((character) => ({
    id: character.id,
    name: character.name || 'Свидетель',
    role: character.role || '',
    statement: character.statement || '',
  }));

export function enhanceGeneratedCases(siteRoot, cases, editorial = false) {
  let enhanced = 0;

  for (const item of cases) {
    if (!editorial && item.access !== 'free') continue;

    const pagePath = path.join(siteRoot, item.path, 'index.html');
    if (!fs.existsSync(pagePath)) throw new Error(`Не найдена игровая страница ${item.path}`);

    let html = fs.readFileSync(pagePath, 'utf8');
    const match = html.match(/window\.KtoVretWeb=(\{.*?\});window\.KtoVretWeb\.permalink=location\.href;/s);
    if (!match) throw new Error(`Не найден KtoVretWeb config в ${item.path}`);

    const config = JSON.parse(match[1]);
    const characters = publicCharacters(item);
    config.case.characters = characters;
    config.case.witnessCount = characters.length;

    html = html.replace(match[0], `window.KtoVretWeb=${safeJson(config)};window.KtoVretWeb.permalink=location.href;`);
    html = html.replace(/case-adapter\.js\?v=[^\"]+/g, `case-adapter.js?v=${VERSION}`);
    html = html.replace(/premium-game\.css\?v=[^\"]+/g, `premium-game.css?v=${VERSION}`);
    html = html.replace(/premium-game-compat\.css\?v=[^\"]+/g, `premium-game-compat.css?v=${VERSION}`);

    if (!html.includes('witness-cycle.css')) {
      html = html.replace('</head>', `<link rel="stylesheet" href="../../assets/witness-cycle.css?v=${VERSION}"></head>`);
    }

    if (!html.includes('mobile-scroll-stabilizer.js')) {
      html = html.replace('</body>', `<script src="../../assets/mobile-scroll-stabilizer.js?v=${SCROLL_VERSION}"></script></body>`);
    }

    html = html.replace(
      /data-premium-game="[^"]+"/,
      `data-premium-game="${VERSION}" data-witness-ui="1.3" data-cycle-polish="1.4" data-mobile-scroll="${SCROLL_VERSION}" data-witness-count="${characters.length}"`,
    );

    fs.writeFileSync(pagePath, html);
    enhanced += 1;
  }

  return enhanced;
}
