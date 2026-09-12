import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, escapeHtml, slugify } from './common.mjs';
import { siteUrl } from './site-config.mjs';

const HUB='detektivnye-igry-dlya-odnogo/rassledovaniya';
const SOURCE='content/solo-investigations/volume-1';
const PRODUCT_ID='solo_investigations_v1';
const VERSION='1.0.0';
const PRICE=99;

function loadCases(siteRoot){
  const dir=path.join(siteRoot,SOURCE);
  const files=fs.readdirSync(dir).filter(name=>/^case-\d+\.json$/.test(name)).sort();
  if(files.length!==10) throw new Error(`Solo paid investigations: expected 10 cases, got ${files.length}`);
  return files.map((name,index)=>{
    const item=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
    if(!item.id||!item.title||!item.shortDescription) throw new Error(`Solo paid investigation incomplete: ${name}`);
    return {
      id:item.id,
      title:item.title,
      shortDescription:item.shortDescription,
      difficulty:item.difficulty||'Сложное',
      category:item.category||'Расследование',
      logicType:item.logicType||'',
      slug:`${String(index+1).padStart(2,'0')}-${slugify(item.title)}`,
    };
  });
}

const header=(prefix)=>`<header class="sp-header"><div class="sp-shell sp-header__in"><a class="sp-brand" href="${prefix}detektivnye-igry-dlya-odnogo/"><span>ML</span><strong>Mystery Logic</strong></a><a class="sp-back" href="${prefix}detektivnye-igry-dlya-odnogo/">Все игры для одного</a></div></header>`;

function cards(cases){
  return cases.map((item,index)=>`<a class="sp-card" href="${item.slug}/" data-solo-paid-case="${escapeHtml(item.id)}"><div class="sp-card__top"><span>Дело ${String(index+1).padStart(2,'0')}</span><span data-solo-paid-lock>Том I</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.shortDescription)}</p><div class="sp-card__meta"><span>${escapeHtml(item.difficulty)}</span><span>${escapeHtml(item.category)}</span></div><strong>Открыть расследование →</strong></a>`).join('');
}

function hubPage(cases){
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#071018"><meta name="description" content="Том I больших solo-расследований Mystery Logic: 10 дел с уликами, показаниями и многошаговой реконструкцией."><meta name="robots" content="index,follow"><link rel="canonical" href="${siteUrl(`${HUB}/`)}"><link rel="stylesheet" href="../../assets/solo-paid-investigations.css?v=${VERSION}"><title>Расследования для одного — Том I · 10 дел</title></head><body class="sp-body">${header('../../')}<main class="sp-shell"><section class="sp-hero"><p class="sp-kicker">Mystery Logic · Solo investigations</p><h1>Расследования · Том I</h1><p>Десять более глубоких дел после бесплатного мини-архива: несколько слоёв улик, версии свидетелей, промежуточные выводы и финальная реконструкция.</p><div class="sp-offer"><div><small>Том I</small><strong>10 расследований</strong><span>разовая покупка · без подписки</span></div><b>${PRICE} ₽</b></div><details class="sp-checkout" data-solo-paid-checkout><summary>Открыть Том I за ${PRICE} ₽</summary><div class="sp-checkout__body"><label>E-mail для чека<input type="email" autocomplete="email" data-solo-paid-email></label><label class="sp-check"><input type="checkbox" data-solo-paid-offer> Принимаю условия Публичной оферты</label><label class="sp-check"><input type="checkbox" data-solo-paid-privacy> Ознакомлен с Политикой конфиденциальности</label><button type="button" data-solo-paid-buy disabled>Перейти к оплате · ${PRICE} ₽</button><p data-solo-paid-note>После оплаты Том I откроется в этом браузере.</p></div></details></section><section class="sp-grid">${cards(cases)}</section></main><script>window.MysteryLogicSoloPaidCases=${JSON.stringify(cases).replaceAll('<','\\u003c')};</script><script src="../../assets/solo-paid-access-config.js?v=${VERSION}"></script><script src="../../assets/solo-investigations-checkout.js?v=${VERSION}"></script></body></html>`;
}

function casePage(item,index){
  const prefix='../../../';
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#071018"><meta name="robots" content="noindex,follow"><meta name="description" content="${escapeHtml(item.shortDescription)}"><link rel="canonical" href="${siteUrl(`${HUB}/${item.slug}/`)}"><link rel="stylesheet" href="${prefix}assets/solo-paid-investigations.css?v=${VERSION}"><title>${escapeHtml(item.title)} — расследование Mystery Logic</title></head><body class="sp-body">${header(prefix)}<main class="sp-shell sp-case"><p class="sp-kicker">Расследования · Том I · дело ${String(index+1).padStart(2,'0')}</p><h1>${escapeHtml(item.title)}</h1><p class="sp-case__lead">${escapeHtml(item.shortDescription)}</p><div data-solo-deep-app data-case-id="${escapeHtml(item.id)}" data-volume-url="../"></div></main><script src="${prefix}assets/solo-paid-access-config.js?v=${VERSION}"></script><script src="${prefix}assets/solo-investigations-player.js?v=${VERSION}"></script></body></html>`;
}

function patchSoloHub(siteRoot){
  const file=path.join(siteRoot,'detektivnye-igry-dlya-odnogo/index.html');
  if(!fs.existsSync(file)) throw new Error('Solo hub missing before paid investigations patch');
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('solo-paid-investigations.css')) html=html.replace('</head>',`<link rel="stylesheet" href="../assets/solo-paid-investigations.css?v=${VERSION}"></head>`);
  if(!html.includes('data-solo-paid-bridge')){
    const block=`<section class="sp-bridge" data-solo-paid-bridge><p class="sp-kicker">Следующий уровень</p><h2>Расследования · Том I</h2><p>10 глубоких дел после бесплатного мини-архива. Больше улик, больше ложных версий и многошаговая реконструкция.</p><div class="sp-bridge__row"><strong>${PRICE} ₽ · разовая покупка</strong><a href="rassledovaniya/">Посмотреть Том I →</a></div></section>`;
    const marker='<section class="solo407-kv"';
    if(!html.includes(marker)) throw new Error('Solo hub paid bridge marker missing');
    html=html.replace(marker,`${block}${marker}`);
  }
  fs.writeFileSync(file,html);
}

export function applySoloPaidInvestigations(siteRoot){
  const cases=loadCases(siteRoot);
  const hubDir=path.join(siteRoot,HUB);ensureDir(hubDir);
  fs.writeFileSync(path.join(hubDir,'index.html'),hubPage(cases));
  for(const [index,item] of cases.entries()){
    const dir=path.join(hubDir,item.slug);ensureDir(dir);
    fs.writeFileSync(path.join(dir,'index.html'),casePage(item,index));
  }
  patchSoloHub(siteRoot);
  return {version:VERSION,productId:PRODUCT_ID,priceRub:PRICE,cases:cases.length,hub:HUB};
}
