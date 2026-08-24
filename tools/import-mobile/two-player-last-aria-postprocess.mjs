import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './common.mjs';

const VERSION='1.3.0';
const LANDING='detektivnye-igry-dlya-dvoih/index.html';
const CASE_ROUTE='detektivnye-igry-dlya-dvoih/poslednyaya-ariya';

const specialPage=()=>`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#07080a">
  <meta name="robots" content="noindex,follow">
  <meta name="description" content="Последняя ария — большое асимметричное детективное расследование для двух игроков: травма на сцене, противоречивые алиби и кража партитуры.">
  <link rel="canonical" href="https://mysterylogic.com/${CASE_ROUTE}/">
  <link rel="icon" href="../../assets/ml-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../assets/mysterylogic.css">
  <link rel="stylesheet" href="../../assets/premium.css?v=1.1.0">
  <link rel="stylesheet" href="../../assets/case-aria.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-aria-materials-v2.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-aria-layout-v2.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-aria-storefront.css?v=${VERSION}">
  <meta property="og:title" content="Онлайн-расследование «Последняя ария» — детективная игра">
  <meta property="og:description" content="Премиальное дело для двух игроков. Разные роли, 18 материалов и расследование на 55–75 минут.">
  <meta property="og:type" content="website">
  <title>Онлайн-расследование «Последняя ария» — детективная игра</title>
</head>
<body class="casearia-body">
  <header class="ml-header ml-shell">
    <a class="ml-brand" href="../../"><span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Case file ML-AR17</small></span></a>
    <nav class="ml-nav"><a href="../">Игры для двоих</a><a href="../../dela/">Другие дела</a></nav>
  </header>
  <main class="casearia-shell" data-casearia-app>
    <section class="casearia-paywall-status"><span class="casearia-paywall-spinner"></span><strong>Загружаем дело…</strong></section>
  </main>
  <script src="../../assets/case-aria-storefront.js?v=${VERSION}"></script>
</body>
</html>`;

const catalogCard=`
<section class="casearia-catalog" aria-labelledby="casearia-title">
  <div class="casearia-catalog-grid">
    <div class="casearia-catalog-copy">
      <p class="ml-kicker">Премиальное дело · совершенно другой жанр</p>
      <h2 id="casearia-title">Последняя ария</h2>
      <p class="casearia-catalog-lead">Во время генеральной репетиции бутафорский кинжал ранит тенора по-настоящему. Сценический blackout длится 52 секунды. Когда рабочий свет возвращается, из закрытого нотного архива исчезает оригинальная партитура 1908 года.</p>
      <div class="casearia-catalog-question">Как человек мог открыть архив, если в те же секунды весь театр слышал его голос из оркестровой ямы?</div>
      <div class="casearia-catalog-facts"><span>2 игрока</span><span>разные роли</span><span>55–75 минут</span><span>18 материалов</span><span>299 ₽ за дело</span><span>второй игрок бесплатно</span></div>
      <a class="coop-primary" href="poslednyaya-ariya/">Купить дело — 299 ₽</a>
    </div>
    <div class="casearia-catalog-visual" aria-hidden="true"><div class="casearia-catalog-score"><small>ORIGINAL SCORE · 1908</small><strong>OPUS XVII</strong><span>21:49</span></div><span class="casearia-catalog-seal">CASE FILE · ML-AR17</span></div>
  </div>
</section>`;

function patchLanding(siteRoot){
  const file=path.join(siteRoot,LANDING);
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('case-aria.css')) html=html.replace('</head>',`<link rel="stylesheet" href="../assets/case-aria.css?v=${VERSION}">\n</head>`);
  if(!html.includes('casearia-catalog')){
    if(html.includes('<section class="coop-how"')) html=html.replace(/(\s*<section class="coop-how"[^>]*>)/,`\n${catalogCard}\n$1`);
    else throw new Error('Last Aria landing insertion point missing');
  }
  for(const marker of ['casearia-catalog','href="poslednyaya-ariya/"','Последняя ария','299 ₽','case-aria.css']) if(!html.includes(marker)) throw new Error(`Last Aria landing missing ${marker}`);
  fs.writeFileSync(file,html);
}

export function applyTwoPlayerLastAria(siteRoot){
  const caseDir=path.join(siteRoot,CASE_ROUTE);
  ensureDir(caseDir);
  fs.writeFileSync(path.join(caseDir,'index.html'),specialPage());
  patchLanding(siteRoot);
  return {route:CASE_ROUTE,title:'Последняя ария',indexed:false,materials:18,priceRub:299,productId:'last_aria',creatorPays:true,guestPays:false,version:VERSION,materializedEvidence:true,compactMobileHeader:true,investigatorProofGate:true,investigatorRevision:'1.6'};
}
