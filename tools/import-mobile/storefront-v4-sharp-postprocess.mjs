import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.1';
const esc=(value)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const estimate=(difficulty='Среднее')=>/слож/i.test(difficulty)?8:/лег/i.test(difficulty)?5:7;

function addClass(html,className){
  return html.replace(/<body(?: class="([^"]*)")?([^>]*)>/,(_,classes='',rest='')=>`<body class="${[classes,className].filter(Boolean).join(' ').trim()}"${rest}>`);
}
function addStyle(html,href){
  if(html.includes('storefront-v4-sharp.css')) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="${href}?v=${VERSION}">\n</head>`);
}
const wave=()=>Array.from({length:35},()=>'<i aria-hidden="true"></i>').join('');
const miniWave=()=>Array.from({length:19},(_,i)=>`<i style="--h:${[8,14,20,11,28,17,34,21,13,30,19,25,11,31,18,23,13,17,9][i]}px"></i>`).join('');

function homeHeroArt(){
  return `<div class="ref-home-art sharp-home-scene" data-reference-asset="home-hero" data-sharp-ui="home-hero-html" role="img" aria-label="Звонок 112 в 23:17, кадр камеры C17 и папка дела ML-2317"><div class="sharp-map-lines" aria-hidden="true"></div><article class="sharp-call-card"><small>ЗВОНОК 112</small><strong>23:17</strong><div class="sharp-call-wave">${miniWave()}</div><span>▶ &nbsp; 00:00 / 01:12</span></article><article class="sharp-camera-card"><div class="sharp-camera-head"><span>CAM C17</span><span>2024-05-12&nbsp;&nbsp;23:17:41</span></div><div class="sharp-camera-frame"><i class="sharp-light l1"></i><i class="sharp-light l2"></i><i class="sharp-light l3"></i><i class="sharp-person"></i></div></article><article class="sharp-case-folder"><div class="sharp-folder-tab"></div><div class="sharp-case-stamp">CASE<br><b>ML-2317</b></div><div class="sharp-folder-seal">ML</div></article></div>`;
}
function archiveHeroArt(){
  return `<div class="ref-archive-art sharp-volume-scene" data-reference-asset="archive-hero" data-sharp-ui="archive-hero-html" role="img" aria-label="Коробка Первого тома Mystery Logic, архивные папки, фотографии и карточка доказательства"><div class="sharp-volume-files" aria-hidden="true"><i><b>003</b></i><i><b>003</b></i><i><b>003</b></i><i><b>003</b></i><i><b>003</b></i></div><div class="sharp-volume-box"><span class="sharp-volume-monogram">ML</span><strong>VOLUME I</strong><small>MYSTERY LOGIC</small><i></i></div><div class="sharp-volume-photo"><span>CAM 03</span><i></i></div><div class="sharp-volume-evidence"><b>ДЕЛО №037</b><span>Отдел расследований<br>MYSTERY LOGIC</span><em>ДОКАЗАТЕЛЬСТВО</em></div></div>`;
}
function trustStrip(){
  return `<section class="ref-trust" aria-label="Преимущества"><article><span class="ref-trust-icon">⌁</span><strong>15 дел бесплатно</strong><span>Попробуйте без риска</span></article><article><span class="ref-trust-icon">▣</span><strong>100+ дел в архиве</strong><span>Растущий каталог</span></article><article><span class="ref-trust-icon">◷</span><strong>5–10 минут</strong><span>Короткие расследования</span></article><article><span class="ref-trust-icon">✓</span><strong>Один доказуемый ответ</strong><span>Логика важнее догадок</span></article></section>`;
}
function formats(){
  return `<p class="ref-section-label" id="games">Выберите формат расследования</p><section class="ref-format-grid" aria-labelledby="games"><a class="ref-format-card" href="./detektivnye-igry-dlya-dvoih/"><div class="ref-format-copy"><small>Для двоих</small><h3>Последний звонок<br>в 23:17</h3><p>Совместное расследование.<br>2 игрока · 45–60 минут</p></div><img class="ref-format-art" src="./assets/reference-format-2317.svg" data-sharp-asset="format-2317-svg" alt="Телефон, карта и две роли"><span class="ref-format-link">Играть вдвоём →</span></a><a class="ref-format-card" href="./kto-vret/"><div class="ref-format-copy"><small>Серия дел</small><h3>Кто врёт?</h3><p>Короткие логические дела<br>в удобном формате.</p></div><img class="ref-format-art" src="./assets/reference-format-who.svg" data-sharp-asset="format-who-svg" alt="Блокнот с показаниями и лупа"><span class="ref-format-link">Открыть серию →</span></a><a class="ref-format-card" href="./tom-1/"><div class="ref-format-copy"><small>Архив</small><h3>Первый том</h3><p>Полный архив · 15 бесплатных дел<br>+ 85 дел в одном томе.</p></div><img class="ref-format-art" src="./assets/reference-format-volume.svg" data-sharp-asset="format-volume-svg" alt="Первый том Mystery Logic"><span class="ref-format-link">Посмотреть том →</span></a></section>`;
}
function materials(){
  return `<p class="ref-section-label">С чем вы будете работать</p><section class="ref-material-grid"><article class="ref-material"><h3>Запись 112</h3><div class="ref-wave">${wave()}</div><div class="ref-player"><span class="ref-play">▶</span><span>00:00 / 01:12</span></div></article><article class="ref-material"><h3>Камера</h3><div class="ref-camera-mini"></div></article><article class="ref-material"><h3>Переписка</h3><div class="ref-chat-bubble">Ты где?<small style="float:right">23:12 ✓✓</small></div><div class="ref-chat-bubble">Буду через 10 минут<small style="float:right">23:12 ✓✓</small></div></article><article class="ref-material"><h3>Протокол</h3><div class="ref-protocol"><strong>ПРОТОКОЛ ОСМОТРА</strong><span></span></div></article></section>`;
}
function manifesto(){
  return `<section class="ref-manifesto" id="method"><div><h2>Честная детективная задача уважает игрока.</h2><p>Ключевая улика не возникает из воздуха, а решение не зависит от случайной догадки.<br>Все необходимые сведения есть в материалах дела.<br>Определить правильную последовательность событий можно только сопоставив факты.</p></div><div class="ref-seal">ML</div></section>`;
}
function homeLowerSharp(){
  return `<div class="ref-home-sharp" data-reference-asset="home-lower" data-sharp-ui="home-lower-html">${trustStrip()}${formats()}${materials()}${manifesto()}</div>`;
}
function visualClass(i){return `v${i%8||8}`;}
function caseCard(item,i,badge='Бесплатно',locked=false,root='../'){
  const href=locked?`${root}tom-1/`:`${root}${String(item?.path||'').replace(/^\/+/, '')}`;
  return `<a class="ref-case" href="${href}"><div class="ref-case-visual ${visualClass(i)}"><span class="ref-case-number">${String(i).padStart(2,'0')}</span><span class="ref-case-badge${locked?' locked':''}">${esc(badge)}</span></div><div class="ref-case-body"><h3>${esc(item?.title||`Дело ${i}`)}</h3><div class="ref-case-meta"><span>${esc(item?.difficulty||'Среднее')}</span><span>◷ ${estimate(item?.difficulty)} минут</span></div></div></a>`;
}
function archiveGridSharp(cases,{premium=false,root='../'}={}){
  const free=cases.filter(item=>item.access==='free');
  const items=premium?[...free.slice(0,2),...cases.filter(item=>item.access==='premium').slice(0,6)]:free.slice(0,8);
  const cards=items.map((item,index)=>caseCard(item,index+1,item.access==='premium'?'В Первом томе':'Бесплатно',item.access==='premium',root)).join('');
  return `<div class="ref-case-grid ref-case-grid-sharp" data-reference-asset="archive-grid" data-sharp-ui="archive-grid-html">${cards}</div>`;
}
function replaceArchiveSnapshot(html,replacement){
  const pattern=/<section class="ref-snapshot ref-archive-snapshot"[\s\S]*?<\/section>/;
  if(!pattern.test(html)) throw new Error('sharp storefront: archive snapshot not found');
  return html.replace(pattern,replacement);
}
function assertNoVisibleRaster(html,label){
  const forbidden=['reference-home-lower.webp','reference-archive-grid.webp','reference-home-hero.webp','reference-archive-hero.webp','reference-archive-bottom-left.webp','reference-archive-bottom-mid.webp','reference-archive-bottom-right.webp'];
  for(const name of forbidden) if(html.includes(name)) throw new Error(`${label}: obsolete raster UI still visible: ${name}`);
}
function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,'./assets/storefront-v4-sharp.css'),'ref-storefront-sharp');
  const hero=/<img class="ref-home-art"[^>]*>/;
  if(!hero.test(html)) throw new Error('sharp storefront: home hero art not found');
  html=html.replace(hero,homeHeroArt());
  const lower=/<section class="ref-snapshot ref-home-lower"[\s\S]*?<\/section><section class="ref-sr-only" id="method"[\s\S]*?<\/section>/;
  if(!lower.test(html)) throw new Error('sharp storefront: raster home lower block not found');
  html=html.replace(lower,homeLowerSharp());
  assertNoVisibleRaster(html,'home');
  fs.writeFileSync(file,html);
}
function patchCatalog(siteRoot,cases){
  const file=path.join(siteRoot,'dela/index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,'../assets/storefront-v4-sharp.css'),'ref-storefront-sharp');
  const hero=/<img class="ref-archive-art"[^>]*>/;
  if(!hero.test(html)) throw new Error('sharp storefront: catalog hero art not found');
  html=html.replace(hero,archiveHeroArt());
  html=replaceArchiveSnapshot(html,archiveGridSharp(cases,{premium:false}));
  assertNoVisibleRaster(html,'catalog');
  fs.writeFileSync(file,html);
}
function patchVolume(siteRoot,cases){
  const file=path.join(siteRoot,'tom-1/index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,'../assets/storefront-v4-sharp.css'),'ref-storefront-sharp');
  const hero=/<img class="ref-archive-art"[^>]*>/;
  if(!hero.test(html)) throw new Error('sharp storefront: volume hero art not found');
  html=html.replace(hero,archiveHeroArt());
  html=replaceArchiveSnapshot(html,archiveGridSharp(cases,{premium:true}));
  assertNoVisibleRaster(html,'volume');
  fs.writeFileSync(file,html);
}
function patchWho(siteRoot,cases){
  const file=path.join(siteRoot,'kto-vret/index.html');
  if(!fs.existsSync(file)) return;
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,'../assets/storefront-v4-sharp.css'),'ref-storefront-sharp');
  html=html.replace(/src="\.\.\/assets\/reference-home-lower\.webp"\s+data-reference-asset="who-approved-art"/, 'src="../assets/reference-format-who.svg" data-reference-asset="who-approved-art" data-sharp-asset="who-art-svg"');
  html=replaceArchiveSnapshot(html,archiveGridSharp(cases,{premium:true}));
  assertNoVisibleRaster(html,'who');
  fs.writeFileSync(file,html);
}

export function applyStorefrontV4Sharp(siteRoot,cases){
  patchHome(siteRoot);
  patchCatalog(siteRoot,cases);
  patchVolume(siteRoot,cases);
  patchWho(siteRoot,cases);
  return {pages:4,version:VERSION};
}
