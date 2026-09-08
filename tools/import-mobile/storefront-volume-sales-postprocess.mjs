import fs from 'node:fs';
import path from 'node:path';
import { applySeoCtrModernization } from './seo-ctr-modernization.mjs';

const VERSION='2.1.0';

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

const OFFER_ROUTES=[
  'index.html',
  'kto-vret/index.html',
  'dela/index.html',
  'tom-1/index.html',
  'detektivnye-igry-onlayn/index.html',
  'kto-vret-igra/index.html',
  'ru/besplatnye-detektivnye-dela/index.html',
];

function normalizeOfferCopy(html){
  let out=html;
  out=out.replaceAll('15 бесплатных дел','10 бесплатных дел');
  out=out.replaceAll('15 бесплатных расследований','10 бесплатных расследований');
  out=out.replaceAll('15 дел доступны бесплатно','10 дел доступны бесплатно');
  out=out.replaceAll('15 дел можно пройти бесплатно','10 дел можно пройти бесплатно');
  out=out.replaceAll('15 дел бесплатно','10 дел бесплатно');
  out=out.replaceAll('Первые 15 дел','Первые 10 дел');
  out=out.replaceAll('первые 15 дел','первые 10 дел');
  out=out.replaceAll('первые 15 расследований','первые 10 расследований');
  out=out.replaceAll('Первые 15 расследований','Первые 10 расследований');
  out=out.replaceAll('первых пятнадцати расследований','первых десяти расследований');
  out=out.replaceAll('Пятнадцать расследований','Десять расследований');
  out=out.replaceAll('15 полноценных дел','10 полноценных дел');
  out=out.replaceAll('100 коротких расследований с доказуемыми ответами. 15 дел доступны бесплатно в браузере.','110 коротких расследований с доказуемыми ответами. 10 дел доступны бесплатно в браузере.');
  out=out.replaceAll('100 расследований</h2><p class="product-summary-lead">Начните с открытого архива. Полный том продолжает тот же прогресс и добавляет ещё 85 дел без подписки.','110 расследований</h2><p class="product-summary-lead">Начните с 10 бесплатных дел. Затем доступны два платных тома по 50 расследований — можно купить один том или оба сразу.');
  out=out.replaceAll('<strong>15</strong><span>полных дел доступны бесплатно</span></div><div><strong>85</strong><span>дополнительных дел в первом томе</span>','<strong>10</strong><span>полных дел доступны бесплатно</span></div><div><strong>50 + 50</strong><span>платных дел в двух томах</span>');
  out=out.replaceAll('Если формат понравится, <a href="../tom-1/">полный первый том</a> открывает ещё 85 дел одной покупкой без подписки.','Если формат понравится, <a href="../tom-1/">два платных тома</a> дают ещё 100 расследований: по 50 дел за 199 ₽ или оба тома за 299 ₽, без подписки.');
  out=out.replaceAll('В первом томе 100 активных дел, из них 15 доступны бесплатно в браузере.','Всего доступно 110 дел: 10 бесплатных и 100 платных в двух томах по 50.');
  return out;
}

function enforceOfferCopy(siteRoot){
  let patched=0;
  for(const relative of OFFER_ROUTES){
    const file=path.join(siteRoot,relative);
    if(!fs.existsSync(file)) continue;
    const before=fs.readFileSync(file,'utf8');
    const after=normalizeOfferCopy(before);
    fs.writeFileSync(file,after);
    patched+=1;
    const stale=[/15\s+бесплатн/iu,/15\s+дел\s+(?:доступны|можно|бесплат)/iu,/первых\s+пятнадцати\s+расследован/iu,/ещё\s+85\s+дел/iu,/85\s+дополнительных\s+дел/iu];
    const hit=stale.find((pattern)=>pattern.test(after));
    if(hit) throw new Error(`Who Lied offer copy is stale in ${relative}: ${hit}`);
  }
  return patched;
}

export function applyStorefrontVolumeSales(siteRoot,cases){
  const file=path.join(siteRoot,'tom-1/index.html');
  if(!fs.existsSync(file)) return {pages:0,version:VERSION};
  const before=fs.readFileSync(file,'utf8');
  const after=patchVolume(before,cases);
  fs.writeFileSync(file,after);
  const seo=applySeoCtrModernization(siteRoot);
  const offerCopyPages=enforceOfferCopy(siteRoot);
  return {pages:1,version:VERSION,seoCtrPages:seo.pages,seoCtrHomeTitle:seo.homeTitle,offerCopyPages};
}
