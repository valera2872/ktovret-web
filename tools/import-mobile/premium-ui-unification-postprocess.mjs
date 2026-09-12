import fs from 'node:fs';
import path from 'node:path';

const VERSION='20260912p3';
const read=(file)=>fs.readFileSync(file,'utf8');
const write=(file,html)=>fs.writeFileSync(file,html);
const exists=(file)=>fs.existsSync(file);

function addCss(html,href,marker){
  if(html.includes(marker)) return html;
  return html.replace('</head>',`<link data-premium-ui="${marker}" rel="stylesheet" href="${href}?v=${VERSION}">\n</head>`);
}
function addScript(html,src,marker){
  if(html.includes(marker)) return html;
  return html.replace('</body>',`<script data-premium-ui-script="${marker}" src="${src}?v=${VERSION}" defer></script>\n</body>`);
}

function premiumHeader(prefix){
  return `<header class="mlp-header ml-premium-site-header" data-functional-nav="v2" data-premium-global-nav><div class="mlp-header__inner"><a class="mlp-brand" href="${prefix}" aria-label="Mystery Logic — главная"><span class="mlp-brand__mark">ML</span><span class="mlp-brand__copy"><strong>Mystery Logic</strong><small>Детективные дела</small></span></a><nav class="mlp-nav" aria-label="Основная навигация"><a href="${prefix}#games">Игры</a><a data-nav-solo href="${prefix}detektivnye-igry-dlya-odnogo/">Для одного</a><a data-nav-coop href="${prefix}detektivnye-igry-dlya-dvoih/">Для двоих</a><a href="${prefix}dela/">15 бесплатных дел</a><a href="${prefix}tom-1/">Первый том</a><a href="${prefix}#method">Метод</a><a data-nav-logic href="${prefix}golovolomki-onlayn/">Головоломки</a><a class="mlp-nav__daily" data-nav-daily data-telegram-cta="header" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Мини-дело дня ↗</a></nav><a class="mlp-dossier" href="${prefix}delo/chetyre-vhoda-v-arhiv/"><span class="mlp-dossier__icon" aria-hidden="true">▤</span><span>Открыть досье</span></a></div></header>`;
}

function featureBanner(prefix,placement,modifier=''){
  return `<section class="ml-ai01-feature ${modifier}" aria-label="Новое бесплатное AI-расследование"><a class="ml-ai01-feature-link" href="${prefix}detektivnaya-igra-s-ii/" data-ai01-feature="${placement}"><picture><source media="(max-width: 640px)" srcset="${prefix}assets/ai01-mobile-banner.webp"><img src="${prefix}assets/ai01-home-banner.webp" width="1200" height="400" loading="lazy" decoding="async" alt="Восемь минут без камеры — бесплатное AI-расследование Mystery Logic: допрашивайте подозреваемых голосом или текстом"></picture><span class="ml-ai01-feature-badge">AI · бесплатно</span><span class="ml-ai01-feature-sr">Открыть расследование «Восемь минут без камеры»</span></a></section>`;
}

function commonStyles(html,prefix,{banner=false}={}){
  html=addCss(html,`${prefix}assets/mysterylogic.css`,'mysterylogic.css');
  html=addCss(html,`${prefix}assets/premium-unified-shell.css`,'premium-unified-shell.css');
  if(banner) html=addCss(html,`${prefix}assets/ai01-feature-banner.css`,'ai01-feature-banner.css');
  return html;
}

function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  if(!exists(file)) throw new Error('premium ui: homepage missing');
  let html=commonStyles(read(file),'./',{banner:true});
  if(!html.includes('data-ai01-feature="home"')){
    const re=/(<section class="ref-home-hero"[\s\S]*?<\/section>)/;
    if(!re.test(html)) throw new Error('premium ui: home hero marker missing');
    html=html.replace(re,`$1${featureBanner('./','home','ml-ai01-feature--home')}`);
  }
  if(!html.includes('data-ml-home-social-proof')){
    const block='<section class="ml-home-social-proof" data-ml-home-social-proof aria-label="Оценки и отзывы игроков"><div class="ml-home-social-proof-head"><div><p class="ml-proof-kicker">Оценки после прохождения</p><h2>Что говорят игроки</h2></div><span class="ml-home-proof-summary">Загружаем реальные оценки…</span></div></section>';
    const marker='<section class="ref-material-grid';
    if(!html.includes(marker)) throw new Error('premium ui: home social proof marker missing');
    html=html.replace(marker,`${block}${marker}`);
  }
  html=addScript(html,'./assets/home-social-proof.js','home-social-proof.js');
  write(file,html);
  return 1;
}

function normalizeCatalogPrice(html){
  const match=html.match(/<section class="ref-access-strip"[^>]*>[\s\S]*?<\/section>/);
  if(!match) throw new Error('premium ui: catalog access strip missing');
  let strip=match[0];
  strip=strip
    .replace(/(<span class="ico">\s*₽\s*<\/span>\s*<strong>)\s*99\s*₽\s*(<\/strong>)/giu,'$1199 ₽$2')
    .replace(/<strong>\s*99\s*₽\s*<\/strong>/giu,'<strong>199 ₽</strong>')
    .replace(/99\s*₽(?=[^<]{0,80}(?:полный доступ|разовая покупка|покупк|архив|том))/giu,'199 ₽');
  if(!strip.includes('15 дел')||!strip.includes('85 дел')||!strip.includes('199 ₽')||/(?:^|>)\s*99\s*₽\s*(?:<|$)/iu.test(strip)){
    throw new Error('premium ui: catalog 15/85/199 normalization failed');
  }
  return html.replace(match[0],strip);
}

function patchCatalog(siteRoot){
  const file=path.join(siteRoot,'dela','index.html');
  if(!exists(file)) throw new Error('premium ui: catalog missing');
  let html=commonStyles(read(file),'../',{banner:true});
  html=normalizeCatalogPrice(html);
  if(!html.includes('data-ai01-feature="catalog"')){
    const re=/(<section class="ref-access-strip"[^>]*>[\s\S]*?<\/section>)/;
    html=html.replace(re,`$1${featureBanner('../','catalog','ml-ai01-feature--catalog')}`);
  }
  html=addScript(html,'../assets/who-lied-price-guard.js','who-lied-price-guard.js');
  write(file,html);
  return 1;
}

function patchSoloHub(siteRoot){
  const file=path.join(siteRoot,'detektivnye-igry-dlya-odnogo','index.html');
  if(!exists(file)) throw new Error('premium ui: solo hub missing');
  let html=commonStyles(read(file),'../',{banner:true});
  if(!html.includes('data-ai01-feature="solo"')){
    const re=/(<section class="solo407-hub-hero[^>]*>[\s\S]*?<\/section>)/;
    if(!re.test(html)) throw new Error('premium ui: solo hero marker missing');
    html=html.replace(re,`$1${featureBanner('../','solo','ml-ai01-feature--solo')}`);
  }
  write(file,html);
  return 1;
}

function patchDuo(siteRoot){
  const file=path.join(siteRoot,'detektivnye-igry-dlya-dvoih','index.html');
  if(!exists(file)) throw new Error('premium ui: duo hub missing');
  let html=commonStyles(read(file),'../',{banner:true});
  if(!html.includes('data-ai01-feature="duo"')){
    const re=/(<section class="duel-hero coop-hero"[\s\S]*?<\/section>)/;
    if(!re.test(html)) throw new Error('premium ui: duo hero marker missing');
    html=html.replace(re,`$1${featureBanner('../','duo','ml-ai01-feature--duo')}`);
  }
  write(file,html);
  return 1;
}

function replaceExistingPremiumHeader(html,prefix){
  const re=/<header class="[^"]*(?:mlp-header|ml-premium-site-header)[^"]*"[\s\S]*?<\/header>/;
  return re.test(html)?html.replace(re,premiumHeader(prefix)):html;
}
function replaceMiniHeader(html,prefix){
  const hasTools=html.includes('data-mini-notes-open');
  const toolbar=hasTools?'<div class="ml-premium-case-tools"><button class="sm-tool" data-mini-notes-open>Материалы дела</button><button class="sm-tool" data-mini-reset>Сначала</button></div>':'';
  if(html.includes('data-premium-global-nav')) return replaceExistingPremiumHeader(html,prefix);
  const re=/<header class="sm-header"[\s\S]*?<\/header>/;
  if(!re.test(html)) throw new Error('premium ui: mini header marker missing');
  return html.replace(re,`${premiumHeader(prefix)}${toolbar}`);
}
function decorateReviewPage(html,prefix){
  html=addCss(html,`${prefix}assets/player-feedback.css`,'player-feedback.css');
  html=addScript(html,`${prefix}assets/social-proof.js`,'social-proof.js');
  html=addScript(html,`${prefix}assets/solo-review-bridge.js`,'solo-review-bridge.js');
  return html;
}

function patchMini(siteRoot){
  const dir=path.join(siteRoot,'detektivnye-igry-dlya-odnogo','mini');
  const hub=path.join(dir,'index.html');
  if(!exists(hub)) throw new Error('premium ui: mini hub missing');
  let html=commonStyles(read(hub),'../../');
  html=replaceMiniHeader(html,'../../');
  if(!html.includes('ml-premium-mini-hero')){
    html=html.replace('<section class="sm-hub-hero">','<section class="sm-hub-hero ml-premium-mini-hero">');
    const marker='</section><section class="sm-ladder">';
    if(!html.includes(marker)) throw new Error('premium ui: mini hero close marker missing');
    const visual='<div class="ml-premium-visual ml-premium-visual--mini" aria-label="Архив мини-расследований"><img src="../../assets/reference-archive-hero.webp" width="562" height="385" loading="eager" decoding="async" alt="Архив Mystery Logic с папками дел и доказательствами"></div>';
    html=html.replace(marker,`${visual}</section><section class="sm-ladder">`);
  }
  write(hub,html);
  let cases=0;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(!entry.isDirectory()) continue;
    const file=path.join(dir,entry.name,'index.html');
    if(!exists(file)) continue;
    let page=commonStyles(read(file),'../../../');
    page=replaceMiniHeader(page,'../../../');
    page=page.replace('<section class="sm-hero">','<section class="sm-hero" data-case-hero>');
    page=decorateReviewPage(page,'../../../');
    write(file,page);cases++;
  }
  if(cases!==10) throw new Error(`premium ui: expected 10 mini cases, got ${cases}`);
  return cases+1;
}

function replacePaidHeader(html,prefix){
  if(html.includes('data-premium-global-nav')) return replaceExistingPremiumHeader(html,prefix);
  const re=/<header class="sp-header"[\s\S]*?<\/header>/;
  if(!re.test(html)) throw new Error('premium ui: paid solo header marker missing');
  return html.replace(re,premiumHeader(prefix));
}
function patchPaidSolo(siteRoot){
  const dir=path.join(siteRoot,'detektivnye-igry-dlya-odnogo','rassledovaniya');
  const hub=path.join(dir,'index.html');
  if(!exists(hub)) throw new Error('premium ui: paid solo hub missing');
  let html=commonStyles(read(hub),'../../');
  html=replacePaidHeader(html,'../../');
  if(!html.includes('ml-premium-paid-hero')){
    html=html.replace('<section class="sp-hero">','<section class="sp-hero ml-premium-paid-hero">');
    const marker='</section><section class="sp-grid">';
    if(!html.includes(marker)) throw new Error('premium ui: paid solo hero close marker missing');
    const visual='<div class="ml-premium-visual ml-premium-visual--paid" aria-label="Расследования Том I"><img src="../../assets/reference-format-volume-archive.webp" width="1200" height="760" loading="eager" decoding="async" alt="Премиальный архив расследований Mystery Logic"></div>';
    html=html.replace(marker,`${visual}</section><section class="sp-grid">`);
  }
  write(hub,html);
  let cases=0;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(!entry.isDirectory()) continue;
    const file=path.join(dir,entry.name,'index.html');
    if(!exists(file)) continue;
    let page=commonStyles(read(file),'../../../');
    page=replacePaidHeader(page,'../../../');
    const id=page.match(/data-solo-deep-app data-case-id="([^"]+)"/)?.[1]||'';
    if(!id) throw new Error(`premium ui: paid solo case id missing ${entry.name}`);
    page=page.replace('<main class="sp-shell sp-case">',`<main class="sp-shell sp-case" data-case-id="${id}" data-case-hero>`);
    page=decorateReviewPage(page,'../../../');
    write(file,page);cases++;
  }
  if(cases!==10) throw new Error(`premium ui: expected 10 paid solo cases, got ${cases}`);
  return cases+1;
}

function patchAiFile(file,prefix){
  let html=commonStyles(read(file),prefix);
  if(html.includes('data-premium-global-nav')) html=replaceExistingPremiumHeader(html,prefix);
  else {
    const headerRe=/<header class="aid-topbar"[\s\S]*?<\/header>/;
    if(!headerRe.test(html)) throw new Error('premium ui: AI header marker missing');
    html=html.replace(headerRe,premiumHeader(prefix));
  }
  if(!html.includes('ml-premium-ai-intro')) html=html.replace('<section class="aid-intro" data-view="intro">','<section class="aid-intro ml-premium-ai-intro" data-view="intro" data-case-hero>');
  if(!html.includes('aid-premium-visual')){
    const marker='<aside class="aid-case-stamp"';
    if(!html.includes(marker)) throw new Error('premium ui: AI case stamp marker missing');
    const visual=`<div class="aid-premium-visual" aria-label="Восемь минут без камеры — AI-расследование"><picture><source media="(max-width: 640px)" srcset="${prefix}assets/ai01-mobile-banner.webp"><img src="${prefix}assets/ai01-home-banner.webp" width="1200" height="400" loading="eager" decoding="async" alt="Восемь минут без камеры: микрофон, подозреваемые, улики и свободный AI-допрос"></picture></div>`;
    html=html.replace(marker,`${visual}${marker}`);
  }
  html=addScript(html,`${prefix}assets/social-proof.js`,'social-proof.js');
  write(file,html);
  return 1;
}
function patchAi(siteRoot){
  let pages=0;
  const primary=path.join(siteRoot,'detektivnaya-igra-s-ii','index.html');
  if(!exists(primary)) throw new Error('premium ui: AI page missing');
  pages+=patchAiFile(primary,'../');
  const alias=path.join(siteRoot,'ai-investigation','index.html');
  if(exists(alias)) pages+=patchAiFile(alias,'../');
  return pages;
}

function validate(siteRoot){
  const files={home:'index.html',catalog:'dela/index.html',solo:'detektivnye-igry-dlya-odnogo/index.html',mini:'detektivnye-igry-dlya-odnogo/mini/index.html',paid:'detektivnye-igry-dlya-odnogo/rassledovaniya/index.html',duo:'detektivnye-igry-dlya-dvoih/index.html',ai:'detektivnaya-igra-s-ii/index.html'};
  const html={};
  for(const [key,rel] of Object.entries(files)){
    html[key]=read(path.join(siteRoot,rel));
    if(!html[key].includes('premium-unified-shell.css')) throw new Error(`premium ui: ${key} missing premium css`);
  }
  const strip=html.catalog.match(/<section class="ref-access-strip"[^>]*>[\s\S]*?<\/section>/)?.[0]||'';
  if(!strip.includes('<strong>199 ₽</strong>')||/(?:^|>)\s*99\s*₽\s*(?:<|$)/iu.test(strip)||!html.catalog.includes('who-lied-price-guard.js')) throw new Error('premium ui: catalog price regression');
  for(const key of ['mini','paid','ai']){
    if(!html[key].includes('data-premium-global-nav')||!html[key].includes('class="mlp-header')) throw new Error(`premium ui: ${key} missing self-contained premium nav`);
  }
  for(const key of ['home','solo','duo','catalog']) if(!html[key].includes(`data-ai01-feature="${key==='catalog'?'catalog':key}"`)) throw new Error(`premium ui: ${key} missing approved AI banner`);
  if(!html.home.includes('data-ml-home-social-proof')||!html.home.includes('home-social-proof.js')) throw new Error('premium ui: homepage social proof missing');
  if(!html.mini.includes('ml-premium-visual--mini')||!html.paid.includes('ml-premium-visual--paid')||!html.ai.includes('ai01-home-banner.webp')) throw new Error('premium ui: premium hero imagery missing');
  if(!html.duo.includes('coop-hero-grid')||!html.duo.includes('coop-hero-scene')) throw new Error('premium ui: duo premium composition missing');
  return true;
}

export function applyPremiumUiUnification(siteRoot){
  for(const asset of ['assets/ai01-home-banner.webp','assets/ai01-mobile-banner.webp','assets/reference-archive-hero.webp','assets/reference-format-volume-archive.webp','assets/ai01-feature-banner.css','assets/premium-unified-shell.css','assets/home-social-proof.js','assets/solo-review-bridge.js','assets/social-proof.js','assets/player-feedback.css','assets/who-lied-price-guard.js']){
    if(!exists(path.join(siteRoot,asset))) throw new Error(`premium ui asset missing: ${asset}`);
  }
  const pages=patchHome(siteRoot)+patchCatalog(siteRoot)+patchSoloHub(siteRoot)+patchDuo(siteRoot)+patchMini(siteRoot)+patchPaidSolo(siteRoot)+patchAi(siteRoot);
  validate(siteRoot);
  return {version:VERSION,pages};
}
