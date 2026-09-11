import fs from 'node:fs';
import path from 'node:path';
import { applySolo407PlayerFeedback } from './solo-407-player-feedback-postprocess.mjs';
import { applySoloMiniInvestigations } from './solo-mini-postprocess.mjs';
import { applySoloPaidInvestigations } from './solo-paid-investigations-postprocess.mjs';

const HUB = 'detektivnye-igry-dlya-odnogo';

function restoreWhoLiedOffer(siteRoot) {
  const file = path.join(siteRoot, HUB, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html
    .replaceAll('<strong>10</strong><span>дел можно пройти бесплатно</span>', '<strong>15</strong><span>дел можно пройти бесплатно</span>')
    .replaceAll('Играть в 10 дел бесплатно', 'Играть в 15 дел бесплатно')
    .replace(/110\s+коротких\s+расследований/giu, '100 коротких расследований')
    .replace(/первые\s+10\s+доступны\s+бесплатно/giu, 'первые 15 доступны бесплатно')
    .replace(/Ещё\s+100\s+дел\s+разделены\s+на\s+два\s+платных\s+тома\s+по\s+50\.?/giu, 'Ещё 85 дел открываются одним полным архивом за 199 ₽.')
    .replace(/Ещё\s+85\s+дел\s+открываются\s+одним\s+полным\s+архивом\s+за\s+199\s*₽\.?/giu, 'Ещё 85 дел открываются одним полным архивом за 199 ₽.');

  if (/110\s+коротких/iu.test(html) || /первые\s+10\s+доступны\s+бесплатно/iu.test(html) || /два\s+платных\s+тома/iu.test(html) || /Играть\s+в\s+10\s+дел\s+бесплатно/iu.test(html)) {
    throw new Error('Solo hub still contains abandoned 10/50+50 Who Lied offer');
  }
  if (!html.includes('100 коротких расследований') || !html.includes('первые 15 доступны бесплатно') || !html.includes('85 дел открываются одним полным архивом за 199 ₽')) {
    throw new Error('Solo hub restored 100 / 15 / 85 Who Lied offer is incomplete');
  }
  fs.writeFileSync(file, html);
}

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
  applySolo407PlayerFeedback(siteRoot);
  applySoloMiniInvestigations(siteRoot);
  applySoloPaidInvestigations(siteRoot);
  restoreWhoLiedOffer(siteRoot);
}
