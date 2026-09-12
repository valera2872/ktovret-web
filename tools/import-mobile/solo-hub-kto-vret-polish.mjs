import fs from 'node:fs';
import path from 'node:path';
import { applySolo407PlayerFeedback } from './solo-407-player-feedback-postprocess.mjs';
import { applySoloMiniInvestigations } from './solo-mini-postprocess.mjs';
import { applySoloPaidInvestigations } from './solo-paid-investigations-postprocess.mjs';
import { applyPremiumUiUnification } from './premium-ui-unification-postprocess.mjs';

const HUB = 'detektivnye-igry-dlya-odnogo';
let finalizerRegistered = false;

function restoreWhoLiedOfferInHtml(html) {
  return html
    .replaceAll('<strong>10</strong><span>дел можно пройти бесплатно</span>', '<strong>15</strong><span>дел можно пройти бесплатно</span>')
    .replaceAll('Играть в 10 дел бесплатно', 'Играть в 15 дел бесплатно')
    .replaceAll('10 бесплатных дел «Кто врёт?»', '15 бесплатных дел «Кто врёт?»')
    .replaceAll('одно из 10 бесплатных дел', 'одно из 15 бесплатных дел')
    .replaceAll('>10 бесплатных дел<', '>15 бесплатных дел<')
    .replace(/110\s+коротких\s+расследований/giu, '100 коротких расследований')
    .replace(/первые\s+10\s+доступны\s+бесплатно/giu, 'первые 15 доступны бесплатно')
    .replace(/Ещё\s+100\s+дел\s+разделены\s+на\s+два\s+платных\s+тома\s+по\s+50\.?/giu, 'Ещё 85 дел открываются одним полным архивом за 199 ₽.')
    .replace(/Ещё\s+85\s+дел\s+открываются\s+одним\s+полным\s+архивом\s+за\s+199\s*₽\.?/giu, 'Ещё 85 дел открываются одним полным архивом за 199 ₽.');
}

function assertRestoredWhoLiedOffer(html, label) {
  if (/110\s+коротких/iu.test(html) || /первые\s+10\s+доступны\s+бесплатно/iu.test(html) || /два\s+платных\s+тома/iu.test(html) || /Играть\s+в\s+10\s+дел\s+бесплатно/iu.test(html) || />10\s+бесплатных\s+дел</iu.test(html) || /одно\s+из\s+10\s+бесплатных\s+дел/iu.test(html)) {
    throw new Error(`${label} still contains abandoned 10/50+50 Who Lied offer`);
  }
}

function restoreWhoLiedOffer(siteRoot) {
  const soloFile = path.join(siteRoot, HUB, 'index.html');
  if (fs.existsSync(soloFile)) {
    const html = restoreWhoLiedOfferInHtml(fs.readFileSync(soloFile, 'utf8'));
    assertRestoredWhoLiedOffer(html, 'Solo hub');
    if (!html.includes('100 коротких расследований') || !html.includes('первые 15 доступны бесплатно') || !html.includes('85 дел открываются одним полным архивом за 199 ₽')) {
      throw new Error('Solo hub restored 100 / 15 / 85 Who Lied offer is incomplete');
    }
    fs.writeFileSync(soloFile, html);
  }

  const duoFile = path.join(siteRoot, 'detektivnye-igry-dlya-dvoih', 'index.html');
  if (fs.existsSync(duoFile)) {
    const html = restoreWhoLiedOfferInHtml(fs.readFileSync(duoFile, 'utf8'));
    assertRestoredWhoLiedOffer(html, 'Two-player hub');
    fs.writeFileSync(duoFile, html);
  }
}

function registerFinalRestore(siteRoot) {
  if (finalizerRegistered) return;
  finalizerRegistered = true;
  process.once('beforeExit', () => {
    restoreWhoLiedOffer(siteRoot);
    applyPremiumUiUnification(siteRoot);
  });
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
  const premiumUi = applyPremiumUiUnification(siteRoot);
  registerFinalRestore(siteRoot);
  return { premiumUi };
}
