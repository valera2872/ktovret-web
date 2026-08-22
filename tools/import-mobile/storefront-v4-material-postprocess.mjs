import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.1';
const esc=(value)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const estimate=(difficulty='Среднее')=>/слож/i.test(difficulty)?8:/лег/i.test(difficulty)?5:7;

function addClass(html,className){
  return html.replace(/<body(?: class="([^"]*)")?([^>]*)>/,(_,classes='',rest='')=>`<body class="${[classes,className].filter(Boolean).join(' ').trim()}"${rest}>`);
}
function addStyle(html,href){
  if(html.includes('storefront-v4-material.css')) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="${href}?v=${VERSION}">\n</head>`);
}
function materialCrop(src,klass,alt,loading='lazy'){
  return `<div class="ml-mat-crop ${klass}"><img src="${src}" alt="${esc(alt)}" width="1055" height="940" loading="${loading}" decoding="async"></div>`;
}
function trustStrip(){
  return `<section class="ref-trust" aria-label="Преимущества"><article><span class="ref-trust-icon">⌁</span><strong>15 дел бесплатно</strong><span>Попробуйте без риска</span></article><article><span class="ref-trust-icon">▣</span><strong>100+ дел в архиве</strong><span>Растущий каталог</span></article><article><span class="ref-trust-icon">◷</span><strong>5–10 минут</strong><span>Короткие расследования</span></article><article><span class="ref-trust-icon">✓</span><strong>Один доказуемый ответ</strong><span>Логика важнее догадок</span></article></section>`;
}
function formats(){
  const src='./assets/reference-home-lower.webp';
  return `<p class="ref-section-label" id="games">Выберите формат расследования</p><section class="ref-format-grid ml-material-formats" aria-labelledby="games"><a class="ref-format-card" href="./detektivnye-igry-dlya-dvoih/"><div class="ref-format-copy"><small>Для двоих</small><h3>Последний звонок<br>в 23:17</h3><p>Совместное расследование.<br>2 игрока · 45–60 минут</p></div>${materialCrop(src,'mat-format-1','Телефон 112, карта и материалы двух следователей','eager')}<span class="ref-format-link">Играть вдвоём →</span></a><a class="ref-format-card" href="./kto-vret/"><div class="ref-format-copy"><small>Серия дел</small><h3>Кто врёт?</h3><p>Короткие логические дела<br>в удобном формате.</p></div>${materialCrop(src,'mat-format-2','Блокнот с показаниями и лупа','eager')}<span class="ref-format-link">Открыть серию →</span></a><a class="ref-format-card" href="./tom-1/"><div class="ref-format-copy"><small>Архив</small><h3>Первый том</h3><p>Полный архив · 15 бесплатных дел<br>+ 85 дел в одном томе.</p></div>${materialCrop(src,'mat-format-3','Первый том Mystery Logic и архивные папки','eager')}<span class="ref-format-link">Посмотреть том →</span></a></section>`;
}
function materials(){
  const src='./assets/reference-home-lower.webp';
  return `<p class="ref-section-label">С чем вы будете работать</p><section class="ref-material-grid ml-material-evidence"><article class="ref-material"><h3>Запись 112</h3>${materialCrop(src,'mat-evidence-1','Запись экстренного звонка 112')}</article><article class="ref-material"><h3>Камера</h3>${materialCrop(src,'mat-evidence-2','Кадр камеры наблюдения')}</article><article class="ref-material"><h3>Переписка</h3>${materialCrop(src,'mat-evidence-3','Фрагмент переписки')}</article><article class="ref-material"><h3>Протокол</h3>${materialCrop(src,'mat-evidence-4','Протокол осмотра')}</article></section>`;
}
function manifesto(){
  return `<section class="ref-manifesto" id="method"><div><h2>Честная детективная задача уважает игрока.</h2><p>Все необходимые сведения есть в материалах дела. Ключевая улика не возникает из воздуха, а решение не зависит от случайной догадки.<br>Определить правильную последовательность событий можно только сопоставив факты.</p></div><div class="ref-seal">ML</div></section>`;
}
function homeLower(){return `<div class="ml-material-home-lower" data-material-ui="home-lower" data-reference-asset="home-lower">${trustStrip()}${formats()}${materials()}${manifesto()}</div>`;}

const archivePositions=[['c1','0','0'],['c2','24.7','0'],['c3','49.3','0'],['c4','76.2','0'],['c5','0','52.8'],['c6','24.7','52.8'],['c7','49.3','52.8'],['c8','76.2','52.8']];
function materialCaseCard(item,index,{root='../'}={}){
  const locked=item.access==='premium';
  const href=locked?`${root}tom-1/`:`${root}${String(item.path||'').replace(/^\/+/, '')}`;
  const [pos,x,y]=archivePositions[index]||archivePositions[index%8];
  const number=String(index+1).padStart(2,'0');
  const badge=locked?'В Первом томе':'Бесплатно';
  return `<a class="ref-case ml-material-case" href="${href}"><div class="ref-case-visual ml-archive-crop ${pos}" data-crop-x="${x}" data-crop-y="${y}"><img src="${root}assets/reference-archive-grid.webp" alt="Материал дела ${esc(item.title)}" width="994" height="497" loading="lazy" decoding="async"><span class="ml-live-number">${number}</span><span class="ml-live-badge${locked?' locked':''}">${badge}</span></div><div class="ref-case-body"><h3>${esc(item.title||`Дело ${index+1}`)}</h3><div class="ref-case-meta"><span>${esc(item.difficulty||'Среднее')}</span><span>◷ ${estimate(item.difficulty)} минут</span></div></div></a>`;
}
function materialArchiveGrid(cases,{premium=false,root='../'}={}){
  const free=cases.filter(item=>item.access==='free');
  const items=premium?[...free.slice(0,2),...cases.filter(item=>item.access==='premium').slice(0,6)]:free.slice(0,8);
  return `<div class="ref-case-grid ml-material-archive" data-material-ui="archive-grid" data-reference-asset="archive-grid">${items.map((item,index)=>materialCaseCard(item,index,{root})).join('')}</div>`;
}
function replaceArchiveSnapshot(html,replacement){
  const pattern=/<section class="ref-snapshot ref-archive-snapshot"[\s\S]*?<\/section>/;
  if(!pattern.test(html)) throw new Error('material v4: archive snapshot not found');
  return html.replace(pattern,replacement);
}
function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,'./assets/storefront-v4-material.css'),'ref-storefront-material');
  const lower=/<section class="ref-snapshot ref-home-lower"[\s\S]*?<\/section><section class="ref-sr-only" id="method"[\s\S]*?<\/section>/;
  if(!lower.test(html)) throw new Error('material v4: homepage reference snapshot not found');
  html=html.replace(lower,homeLower());
  if(!html.includes('data-material-ui="home-lower"')||html.includes('class="ref-snapshot ref-home-lower"')) throw new Error('material v4: homepage remained a screenshot');
  fs.writeFileSync(file,html);
}
function patchCatalog(siteRoot,cases){
  const file=path.join(siteRoot,'dela/index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,'../assets/storefront-v4-material.css'),'ref-storefront-material');
  html=replaceArchiveSnapshot(html,materialArchiveGrid(cases,{premium:false}));
  if(!html.includes('data-material-ui="archive-grid"')||html.includes('class="ref-snapshot ref-archive-snapshot"')) throw new Error('material v4: catalog remained a screenshot');
  fs.writeFileSync(file,html);
}
function patchVolume(siteRoot,cases){
  const file=path.join(siteRoot,'tom-1/index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,'../assets/storefront-v4-material.css'),'ref-storefront-material');
  html=replaceArchiveSnapshot(html,materialArchiveGrid(cases,{premium:true}));
  if(!html.includes('data-material-ui="archive-grid"')||html.includes('class="ref-snapshot ref-archive-snapshot"')) throw new Error('material v4: volume remained a screenshot');
  fs.writeFileSync(file,html);
}
function patchWho(siteRoot,cases){
  const file=path.join(siteRoot,'kto-vret/index.html');
  if(!fs.existsSync(file)) return;
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,'../assets/storefront-v4-material.css'),'ref-storefront-material');
  const hero=/<div class="ref-who-crop"><img src="\.\.\/assets\/reference-home-lower\.webp"[\s\S]*?<\/div>/;
  if(hero.test(html)) html=html.replace(hero,materialCrop('../assets/reference-home-lower.webp','mat-format-who-hero','Блокнот с показаниями и лупа','eager').replace('class="ml-mat-crop mat-format-who-hero"','class="ml-mat-crop mat-format-who-hero" data-reference-asset="who-approved-art"'));
  html=replaceArchiveSnapshot(html,materialArchiveGrid(cases,{premium:true}));
  if(!html.includes('data-reference-asset="who-approved-art"')||!html.includes('data-material-ui="archive-grid"')) throw new Error('material v4: who page patch failed');
  fs.writeFileSync(file,html);
}

export function applyStorefrontV4Material(siteRoot,cases){
  patchHome(siteRoot);
  patchCatalog(siteRoot,cases);
  patchVolume(siteRoot,cases);
  patchWho(siteRoot,cases);
  return {pages:4,version:VERSION};
}
