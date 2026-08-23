import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.6';
const esc=(value)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function addStyle(html){
  if(html.includes('storefront-volume-sales.css')) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="../assets/storefront-volume-sales.css?v=${VERSION}">\n</head>`);
}

function premiumArchives(cases){
  const premium=cases.filter(item=>item.access==='premium'&&item.set?.id);
  const sets=[...new Map(premium.map(item=>[item.set.id,item.set])).values()]
    .sort((a,b)=>(a.order||0)-(b.order||0)||String(a.title||'').localeCompare(String(b.title||''),'ru'));
  const cards=sets.map((set,index)=>{
    const count=premium.filter(item=>item.set.id===set.id).length;
    const title=set.title==='Дела дня'?'Ежедневные расследования':(set.title||`Архив ${index+1}`);
    const description=set.description||'Отдельный тип противоречий, показаний и проверяемых версий.';
    const countLabel=`${count} ${count===1?'дело':count<5?'дела':'дел'}`;
    const crop=`c${index%8+1}`;
    return `<article class="ref-volume-archive-card"><div class="ref-volume-archive-art ${crop}" data-volume-archive-art="${crop}" role="img" aria-label="Материалы архива ${esc(title)}"><img src="../assets/reference-archive-grid.webp" alt="" width="994" height="497" loading="lazy" decoding="async"></div><div class="ref-volume-archive-copy"><div class="ref-volume-archive-top"><span>Архив ${String(index+1).padStart(2,'0')}</span><span>${countLabel}</span></div><h3>${esc(title)}</h3><p>${esc(description)}</p></div></article>`;
  }).join('');
  return `<section class="ref-volume-archives-v3" data-volume-premium-archives><div class="ref-volume-section-head"><p class="ref-kicker">Продолжение расследований</p><h2>85 дел в тематических архивах</h2><p>Не бесконечная лента карточек, а полноценный первый том: разные типы противоречий, показаний, временных линий и скрытых связей.</p></div><div class="ref-volume-archives-grid">${cards}</div></section>`;
}

function includedBlock(){
  return `<span data-reference-asset="archive-grid" class="ref-volume-archive-compat" hidden aria-hidden="true"></span><section class="ref-volume-trial-v4" data-volume-sales-v3 data-free-case-count="15"><div class="ref-volume-trial-copy"><p class="ref-kicker">Сначала попробуйте</p><h2>15 полноценных дел доступны бесплатно.</h2><p>Раскройте несколько дел и убедитесь, что формат вам подходит. Покупка нужна только для продолжения ещё на 85 расследований.</p></div><a class="ref-btn ref-btn-outline" href="../dela/">Открыть бесплатные дела →</a></section>`;
}

function closingCta(){
  return `<section class="ref-volume-close-v4" data-volume-closing-cta><div class="ref-volume-close-copy"><p class="ref-kicker">Первый том</p><h2>Расследование продолжается.</h2><p>Ещё 85 дел уже собраны в архив. Одна покупка — 99 ₽, без подписки и повторных списаний.</p></div><div class="ref-volume-close-action"><strong>85 новых дел <span>за 99 ₽</span></strong><a class="ref-btn ref-btn-primary" href="#volume-access" data-volume-scroll-buy>Получить 85 дел за 99 ₽ ↑</a><a href="../dela/">Сначала попробовать бесплатно</a></div></section>`;
}

function patchVolume(html,cases){
  let out=addStyle(html);
  out=out.replace('<section class="ref-access-strip">','<section class="ref-access-strip" id="volume-access">');
  out=out.replace('<span>закрыты</span>','<span>в полном томе</span>');
  out=out.replace('>Открыть Первый том →</summary>','>Получить 85 дел за 99 ₽ →</summary>');
  out=out.replace(/<div class="ref-archive-bar ref-volume-free-head">[\s\S]*?<\/div>\s*<div class="ref-case-grid ml-material-archive ref-free-grid"[\s\S]*?<\/div>\s*(?=<section class="ref-paid-library">)/,includedBlock());
  out=out.replace(/<section class="ref-paid-library">[\s\S]*?<\/section>/,premiumArchives(cases));
  out=out.replace('<section class="ref-volume-faq"',`${closingCta()}<section class="ref-volume-faq"`);
  if(!out.includes('data-volume-sales-v3')||!out.includes('ref-volume-trial-v4')||!out.includes('data-volume-premium-archives')||!out.includes('id="volume-access"')||!out.includes('Получить 85 дел за 99 ₽')||!out.includes('data-volume-closing-cta')||!out.includes('data-volume-scroll-buy')) throw new Error('volume sales v3 patch failed');
  if(out.includes('ref-volume-free-head')||out.includes('ref-volume-included-stats')||out.includes('<span>закрыты</span>')||out.includes('class="ref-case-grid ml-material-archive ref-free-grid"')) throw new Error('volume sales v3: duplicate stats or catalog grid leaked into sales page');
  return out;
}

export function applyStorefrontVolumeSales(siteRoot,cases){
  const file=path.join(siteRoot,'tom-1/index.html');
  if(!fs.existsSync(file)) return {pages:0,version:VERSION};
  const before=fs.readFileSync(file,'utf8');
  const after=patchVolume(before,cases);
  fs.writeFileSync(file,after);
  return {pages:1,version:VERSION};
}
