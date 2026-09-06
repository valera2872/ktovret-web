import fs from 'node:fs';
import path from 'node:path';
import { applySeoCtrModernization } from './seo-ctr-modernization.mjs';

const VERSION='2.0.0';

function addStyle(html){
  if(html.includes('storefront-volume-sales.css')) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="../assets/storefront-volume-sales.css?v=${VERSION}">\n</head>`);
}

function premiumArchives(cases){
  const volume1=cases.filter(item=>item.productId==='volume1');
  const volume2=cases.filter(item=>item.productId==='volume2');
  if(volume1.length!==50||volume2.length!==50) throw new Error(`volume sales: expected 50 + 50, got ${volume1.length} + ${volume2.length}`);
  return `<section class="ref-volume-archives-v3" data-volume-premium-archives><div class="ref-volume-section-head"><p class="ref-kicker">Продолжение расследований</p><h2>100 дел в двух томах</h2><p>Том I — 50 расследований за 199 ₽. Том II — ещё 50 расследований за 199 ₽. Комплект двух томов открывает все 100 платных дел за 299 ₽.</p></div><div class="ref-volume-archives-grid"><article class="ref-volume-archive-card" data-volume-card="volume1"><div class="ref-volume-archive-copy"><div class="ref-volume-archive-top"><span>Том I</span><span>50 дел</span></div><h3>Первый платный том</h3><p>Разные типы противоречий, алиби, показаний, временных линий и скрытых связей.</p><strong>199 ₽ · разовая покупка</strong></div></article><article class="ref-volume-archive-card" data-volume-card="volume2"><div class="ref-volume-archive-copy"><div class="ref-volume-archive-top"><span>Том II</span><span>50 дел</span></div><h3>Второй платный том</h3><p>Ещё пятьдесят расследований, включая новые дела на маршруты, документы, цифровые следы и скрытое знание.</p><strong>199 ₽ · разовая покупка</strong></div></article><article class="ref-volume-archive-card" data-volume-card="volume_bundle_1_2"><div class="ref-volume-archive-copy"><div class="ref-volume-archive-top"><span>Комплект</span><span>100 дел</span></div><h3>Том I + Том II</h3><p>Оба платных тома одним доступом. Экономия 99 ₽ относительно покупки по отдельности.</p><strong>299 ₽ · лучший вариант</strong></div></article></div></section>`;
}

function includedBlock(){
  return `<span data-reference-asset="archive-grid" class="ref-volume-archive-compat" hidden aria-hidden="true"></span><section class="ref-volume-trial-v4" data-volume-sales-v3 data-free-case-count="10"><div class="ref-volume-trial-copy"><p class="ref-kicker">Сначала попробуйте</p><h2>10 полноценных дел доступны бесплатно.</h2><p>Пройдите стартовую коллекцию и убедитесь, что формат вам подходит. После неё доступны два платных тома — по 50 расследований каждый.</p></div><a class="ref-btn ref-btn-outline" href="../dela/">Открыть бесплатные дела →</a></section>`;
}

function closingCta(){
  return `<section class="ref-volume-close-v4" data-volume-closing-cta><div class="ref-volume-close-copy"><p class="ref-kicker">Два тома</p><h2>Продолжите на 100 расследований.</h2><p>Один том — 50 дел за 199 ₽. Оба тома — 100 дел за 299 ₽. Без подписки и повторных списаний.</p></div><div class="ref-volume-close-action"><strong>100 платных дел <span>за 299 ₽</span></strong><a class="ref-btn ref-btn-primary" href="#volume-access" data-volume-scroll-buy>Выбрать томы ↑</a><a href="../dela/">Сначала попробовать бесплатно</a></div></section>`;
}

function patchVolume(html,cases){
  let out=addStyle(html);
  out=out.replace('<section class="ref-access-strip" data-volume-storefront-v2>','<section class="ref-access-strip" data-volume-storefront-v2 id="volume-access">');
  if(!out.includes('id="volume-access"')) out=out.replace('<section class="ref-access-strip">','<section class="ref-access-strip" id="volume-access">');
  out=out.replace(/<div class="ref-archive-bar ref-volume-free-head">[\s\S]*?<\/div>\s*<div class="ref-case-grid ml-material-archive ref-free-grid"[\s\S]*?<\/div>\s*(?=<section class="ref-paid-library">)/,includedBlock());
  out=out.replace(/<section class="ref-paid-library">[\s\S]*?<\/section>/,premiumArchives(cases));
  out=out.replace('<section class="ref-volume-faq"',`${closingCta()}<section class="ref-volume-faq"`);
  if(!out.includes('data-volume-sales-v3')||!out.includes('data-free-case-count="10"')||!out.includes('data-volume-premium-archives')||!out.includes('id="volume-access"')||!out.includes('100 платных дел')||!out.includes('data-volume-closing-cta')||!out.includes('data-volume-scroll-buy')) throw new Error('volume sales v4 patch failed');
  if(out.includes('ref-volume-free-head')||out.includes('ref-volume-included-stats')||out.includes('class="ref-case-grid ml-material-archive ref-free-grid"')) throw new Error('volume sales v4: duplicate stats or catalog grid leaked into sales page');
  return out;
}

export function applyStorefrontVolumeSales(siteRoot,cases){
  const file=path.join(siteRoot,'tom-1/index.html');
  if(!fs.existsSync(file)) return {pages:0,version:VERSION};
  const before=fs.readFileSync(file,'utf8');
  const after=patchVolume(before,cases);
  fs.writeFileSync(file,after);
  const seo=applySeoCtrModernization(siteRoot);
  return {pages:1,version:VERSION,seoCtrPages:seo.pages,seoCtrHomeTitle:seo.homeTitle};
}
