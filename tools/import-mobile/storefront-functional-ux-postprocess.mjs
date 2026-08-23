import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.0';
const esc=(value)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const estimate=(difficulty='Среднее')=>/эксперт/i.test(difficulty)?9:/слож/i.test(difficulty)?8:/лег/i.test(difficulty)?5:7;

function addStyle(html,href){
  if(html.includes('storefront-functional-ux.css')) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="${href}?v=${VERSION}">\n</head>`);
}

function oldFunctionalHeader(root,active=''){
  const nav=[
    ['Игры',`${root}#games`,'games'],
    ['15 бесплатных дел',`${root}dela/`,'free'],
    ['Первый том',`${root}tom-1/`,'volume'],
    ['Метод',`${root}#method`,'method'],
  ];
  return `<header class="ref-header ref-wrap ref-functional-header" data-functional-nav="v2"><a class="ref-brand" href="${root}" aria-label="Mystery Logic — главная"><span class="ref-brand-mark">ML</span><span class="ref-brand-copy"><strong>Mystery Logic</strong><small>Детективные дела</small></span></a><nav class="ref-nav" aria-label="Основная навигация">${nav.map(([label,href,key])=>`<a${active===key?' class="is-active"':''} href="${href}">${label}</a>`).join('')}</nav><a class="ref-login ref-dossier-cta" href="${root}delo/chetyre-vhoda-v-arhiv/"><span class="ref-dossier-icon" aria-hidden="true">▤</span>Открыть досье</a></header>`;
}

function replaceHeader(html,root,active=''){
  const header=oldFunctionalHeader(root,active);
  if(/<header class="ref-header ref-wrap[^>]*>[\s\S]*?<\/header>/.test(html)) return html.replace(/<header class="ref-header ref-wrap[^>]*>[\s\S]*?<\/header>/,header);
  return html;
}

function oldFunctionalFooter(root){
  return `<footer class="ref-footer ref-wrap ref-functional-footer"><span>© 2026 Mystery Logic</span><span><a href="${root}kto-vret/">Кто врёт?</a><a href="${root}dela/">Бесплатные дела</a><a href="${root}tom-1/">Первый том</a><a href="${root}detektivnye-igry-onlayn/">Детективные игры онлайн</a><a href="${root}logicheskie-detektivnye-zadachi/">Логические задачи</a><a href="${root}offer/">Условия</a><a href="${root}privacy/">Конфиденциальность</a></span></footer>`;
}

function replaceFooter(html,root){
  if(/<footer class="ref-footer ref-wrap[^>]*>[\s\S]*?<\/footer>/.test(html)) return html.replace(/<footer class="ref-footer ref-wrap[^>]*>[\s\S]*?<\/footer>/,oldFunctionalFooter(root));
  return html;
}

function methodSection(){
  return `<section class="ref-method-v2" id="method" data-functional-method="v2"><div class="ref-method-head"><p class="ref-kicker">Метод игры</p><h2>Не угадывайте. Проверяйте.</h2><p>Три шага, которые были основой Mystery Logic: сначала отделить факты, затем найти противоречие и только после этого выбрать доказуемую версию.</p></div><div class="ref-method-grid"><article><span>01 · Материалы</span><h3>Выделите факты</h3><p>Разберите время, маршруты, показания и физические ограничения дела.</p></article><article><span>02 · Версия</span><h3>Найдите несоответствие</h3><p>Определите, какая деталь не могла появиться из заявленного источника знания.</p></article><article><span>03 · Доказательство</span><h3>Восстановите цепочку событий</h3><p>Сопоставьте факты и проверьте, следует ли ваш вывод из материалов дела.</p></article></div></section>`;
}

function patchHome(html){
  html=addStyle(html,'./assets/storefront-functional-ux.css');
  html=replaceFooter(replaceHeader(html,'./','games'),'./');
  const actions=`<div class="ref-home-actions ref-home-actions-v2"><a class="ref-btn ref-btn-primary" href="./delo/chetyre-vhoda-v-arhiv/">Получить первое досье</a><a class="ref-btn ref-btn-outline" href="./dela/">Открыть 15 бесплатных дел</a><a class="ref-btn ref-btn-outline" href="./tom-1/">Посмотреть Первый том</a></div>`;
  html=html.replace(/<div class="ref-home-actions">[\s\S]*?<\/div>/,actions);
  const manifesto=html.match(/<section class="ref-manifesto" id="method">[\s\S]*?<\/section>/)?.[0];
  if(manifesto){
    html=html.replace(manifesto,`${methodSection()}${manifesto.replace(' id="method"',' id="principle"')}`);
  }
  if(!html.includes('data-functional-method="v2"')||!html.includes('Получить первое досье')) throw new Error('functional UX: homepage patch failed');
  return html;
}

const archivePositions=[['c1','0','0'],['c2','24.7','0'],['c3','49.3','0'],['c4','76.2','0'],['c5','0','52.8'],['c6','24.7','52.8'],['c7','49.3','52.8'],['c8','76.2','52.8']];
function freeCard(item,index,{root='../',interactive=false}={}){
  const [pos,x,y]=archivePositions[index%archivePositions.length];
  const number=String(index+1).padStart(2,'0');
  const difficulty=item.difficulty||'Среднее';
  const category=item.category||'Логика';
  const attrs=interactive?` data-case-id="${esc(item.id)}" data-access="free" data-difficulty="${esc(difficulty)}" data-category="${esc(category)}" data-progress="new" data-search="${esc(`${item.title} ${category} ${item.logicType||''}`.toLowerCase())}"`:'';
  return `<article class="ref-case ml-material-case${interactive?' case-card':''}"${attrs}><div class="ref-case-visual ml-archive-crop ${pos}" data-crop-x="${x}" data-crop-y="${y}"><img src="${root}assets/reference-archive-grid.webp" data-reference-asset="archive-grid" alt="Материал дела ${esc(item.title)}" width="994" height="497" loading="lazy" decoding="async"><span class="ml-live-number">${number}</span><span class="ml-live-badge">Бесплатно</span></div><div class="ref-case-body">${interactive?'<span class="ref-progress-badge" data-case-progress-badge>○ Новое</span>':''}<h3>${esc(item.title)}</h3><div class="ref-case-meta"><span>${esc(difficulty)}</span><span>${esc(category)}</span><span>◷ ${estimate(difficulty)} минут</span></div><a class="ref-case-open"${interactive?' data-case-open':''} href="${root}${String(item.path||'').replace(/^\/+/, '')}">${interactive?'Открыть расследование':'Открыть дело →'}</a></div></article>`;
}

function freeGrid(cases,opts={}){
  const free=cases.filter(item=>item.access==='free').slice(0,15);
  return `<div class="ref-case-grid ml-material-archive ref-free-grid" data-free-case-count="${free.length}">${free.map((item,index)=>freeCard(item,index,opts)).join('')}</div>`;
}

function catalogTools(cases){
  const free=cases.filter(item=>item.access==='free').slice(0,15);
  const difficulties=[...new Set(free.map(item=>item.difficulty||'Среднее'))].sort((a,b)=>a.localeCompare(b,'ru'));
  const categories=[...new Set(free.map(item=>item.category||'Логика'))].sort((a,b)=>a.localeCompare(b,'ru'));
  const options=(items,label)=>`<option value="all">${label}</option>${items.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('')}`;
  const first=free[0];
  return `<section class="ref-catalog-progress" data-catalog-progress><div class="ref-progress-copy"><small>Ваш прогресс</small><strong data-catalog-progress-text>0 из 15 бесплатных дел раскрыто</strong><div class="ref-progress-track"><span data-catalog-progress-fill></span></div></div><div class="ref-progress-actions"><a class="ref-btn ref-btn-outline" data-catalog-continue href="../${esc(first?.path||'dela/')}">Следующее нераскрытое дело</a><button class="ref-btn ref-btn-outline" data-catalog-random type="button">Случайное дело</button></div></section><div class="ref-archive-bar ref-functional-catalog-bar"><div><h2>15 бесплатных дел</h2><span data-catalog-result-count>Показано: 15 из 15</span></div><div class="ref-filters"><input class="ref-search" id="case-search" type="search" placeholder="Поиск по делам" aria-label="Поиск по делам"><select class="ref-select" id="case-difficulty" aria-label="Сложность">${options(difficulties,'Любая сложность')}</select><select class="ref-select" id="case-category" aria-label="Категория">${options(categories,'Все категории')}</select><label class="ref-unsolved"><input id="case-unsolved" type="checkbox"> Только нераскрытые</label></div></div>`;
}

function patchCatalog(html,cases){
  html=addStyle(html,'../assets/storefront-functional-ux.css');
  html=replaceFooter(replaceHeader(html,'../','free'),'../');
  html=html.replace(/<div class="ref-archive-bar">[\s\S]*?<\/div>\s*<div class="ref-case-grid ml-material-archive"[\s\S]*?<\/div>\s*<details class="ref-catalog-extra">[\s\S]*?<\/details>/,`${catalogTools(cases)}${freeGrid(cases,{root:'../',interactive:true})}<span class="ref-catalog-extra ref-functional-compat-marker" hidden aria-hidden="true"></span>`);
  html=html.replace(/<div class="ref-compat" aria-hidden="true">[\s\S]*?<\/div>/,'');
  if(!html.includes('data-free-case-count="15"')||!html.includes('data-catalog-progress')||html.includes('<details class="ref-catalog-extra"')) throw new Error('functional UX: catalog patch failed');
  return html;
}

function patchWho(html,cases){
  html=addStyle(html,'../assets/storefront-functional-ux.css');
  html=replaceFooter(replaceHeader(html,'../','games'),'../');
  html=html.replace(/<div class="ref-who-archive-head">[\s\S]*?<\/div>\s*<div class="ref-case-grid ml-material-archive"[\s\S]*?<\/div>\s*<div class="ref-who-after-grid">[\s\S]*?<\/div>/,`<div class="ref-who-archive-head"><h2>15 бесплатных дел</h2><p>Все пятнадцать открытых расследований доступны сразу. Первый том продолжает тот же архив ещё 85 делами.</p></div>${freeGrid(cases,{root:'../'})}<div class="ref-who-after-grid ref-who-after-grid-v2"><a class="ref-btn ref-btn-outline" href="../dela/">Открыть каталог с прогрессом и фильтрами →</a><a class="ref-btn ref-btn-primary" href="../tom-1/">Посмотреть ещё 85 дел →</a></div>`);
  html=html.replace(/<fieldset class="ref-why ref-who-method"/,`${duelBlock()}<fieldset class="ref-why ref-who-method"`);
  if(!html.includes('data-free-case-count="15"')||!html.includes('data-functional-duel="v2"')) throw new Error('functional UX: who page must show all 15 free cases and duel');
  return html;
}

function duelBlock(){
  return `<section class="ref-who-duel-v2" data-functional-duel="v2"><div><p class="ref-kicker">Дуэль · бесплатно</p><h2>Бросьте вызов другу</h2><p>Раскройте бесплатное дело, отправьте другу то же расследование и сравните результат: время, попытки и подсказки. Персональная ссылка создаётся после прохождения дела.</p></div><a class="ref-btn ref-btn-outline" href="../detektivnye-igry-dlya-dvoih/">Как работает дуэль →</a></section>`;
}

function faq(){
  return `<section class="ref-volume-faq" data-functional-volume-faq><div class="ref-volume-faq-head"><p class="ref-kicker">Перед покупкой</p><h2>Коротко о доступе</h2></div><div class="ref-volume-faq-list"><details open><summary>Что именно я покупаю?</summary><p>Цифровой доступ к 85 дополнительным делам первого тома «Кто врёт?». Вместе с 15 бесплатными делами это 100 расследований.</p></details><details><summary>Это подписка?</summary><p>Нет. Оплата разовая. Регулярных списаний нет.</p></details><details><summary>На какой срок открывается доступ?</summary><p>Доступ к купленному первому тому предоставляется без ограничения срока, если иное явно не указано до оплаты.</p></details><details><summary>Как откроются дела после оплаты?</summary><p>После подтверждения платежа сервер активирует доступ к платным материалам. Материалы и решения не хранятся в открытой странице до проверки доступа.</p></details><details><summary>Что делать, если доступ не открылся?</summary><p>Напишите на <a href="mailto:support@mysterylogic.com">support@mysterylogic.com</a>. Мы проверим платёж и поможем восстановить доступ.</p></details><details><summary>Где условия возврата?</summary><p>Порядок оплаты, предоставления цифрового доступа и обращений описан в <a href="../offer/">публичной оферте</a>.</p></details></div></section>`;
}

function patchVolume(html,cases){
  html=addStyle(html,'../assets/storefront-functional-ux.css');
  html=replaceFooter(replaceHeader(html,'../','volume'),'../');
  html=html.replace(/<div class="ref-archive-bar">[\s\S]*?<\/div>\s*<div class="ref-case-grid ml-material-archive"[\s\S]*?<\/div>/,`<div class="ref-archive-bar ref-volume-free-head"><div><h2>15 бесплатных дел</h2><p>Сначала можно пройти все открытые расследования полностью — покупка нужна только для продолжения.</p></div><a class="ref-btn ref-btn-outline" href="../dela/">Каталог с прогрессом →</a></div>${freeGrid(cases,{root:'../'})}`);
  html=html.replace('<section class="ref-paid-library"><h2>Полный архив открыт</h2>','<section class="ref-paid-library"><h2>Ещё 85 дел в Первом томе</h2><p class="ref-paid-library-lead">После разовой покупки открываются тематические архивы продолжения. Бесплатные 15 дел остаются доступны без покупки.</p>');
  html=html.replace(/<fieldset class="ref-why"/,`${faq()}<fieldset class="ref-why"`);
  if(!html.includes('data-free-case-count="15"')||!html.includes('data-functional-volume-faq')) throw new Error('functional UX: volume patch failed');
  return html;
}

function patchCoopLanding(html){
  html=addStyle(html,'../assets/storefront-functional-ux.css');
  html=replaceFooter(replaceHeader(html,'../','games'),'../');
  html=html.replace('<a class="coop-secondary" href="#short-duel">Короткая дуэль · 10–15 минут</a>','<a class="coop-secondary" href="#coop-how">Как проходит игра ↓</a>');
  html=html.replace('<section class="coop-how">','<section class="coop-how" id="coop-how">');
  html=html.replace('<section class="coop-duel-intro" id="short-duel">','<section class="coop-duel-intro" id="short-duel" data-secondary-format="short-duel">');
  html=html.replace(/(<section class="coop-duel-intro"[\s\S]*?<p>Если у вас только 10–15 минут,[\s\S]*?<\/p>)(\s*<\/section>)/,`$1<a class="ref-btn ref-btn-outline ref-short-duel-cta" href="#duel-room">Перейти к короткой дуэли ↓</a>$2`);
  html=html.replace('<section class="duel-app-shell"','<section class="duel-app-shell" id="duel-room"');
  if(html.includes('coop-hero-actions')&&html.includes('Короткая дуэль · 10–15 минут')) throw new Error('functional UX: confusing duel CTA remains in hero');
  if(!html.includes('id="coop-how"')||!html.includes('id="duel-room"')) throw new Error('functional UX: co-op anchors missing');
  return html;
}

function patchSimpleHeader(html,root,active=''){return addStyle(replaceFooter(replaceHeader(html,root,active),root),`${root}assets/storefront-functional-ux.css`);}

function write(file,transform){if(!fs.existsSync(file)) return false;const before=fs.readFileSync(file,'utf8');const after=transform(before);fs.writeFileSync(file,after);return true;}

export function applyStorefrontFunctionalUx(siteRoot,cases){
  const touched=[];
  const touch=(rel,fn)=>{if(write(path.join(siteRoot,rel),fn)) touched.push(rel);};
  touch('index.html',patchHome);
  touch('dela/index.html',html=>patchCatalog(html,cases));
  touch('kto-vret/index.html',html=>patchWho(html,cases));
  touch('tom-1/index.html',html=>patchVolume(html,cases));
  touch('detektivnye-igry-dlya-dvoih/index.html',patchCoopLanding);
  touch('detektivnye-igry-dlya-dvoih/2317/index.html',html=>patchSimpleHeader(html,'../../','games'));
  const casesRoot=path.join(siteRoot,'delo');
  if(fs.existsSync(casesRoot)) for(const entry of fs.readdirSync(casesRoot,{withFileTypes:true})) if(entry.isDirectory()){
    const rel=`delo/${entry.name}/index.html`;
    const file=path.join(siteRoot,rel);
    if(!fs.existsSync(file)) continue;
    const html=fs.readFileSync(file,'utf8');
    if(!html.includes('ktv-case-v4')) continue;
    fs.writeFileSync(file,patchSimpleHeader(html,'../../','free'));
    touched.push(rel);
  }
  for(const rel of touched){
    const html=fs.readFileSync(path.join(siteRoot,rel),'utf8');
    if(html.includes('>О нас<')||html.includes('>Доступ<')) throw new Error(`functional UX: obsolete v4 nav remains in ${rel}`);
  }
  return {pages:touched.length,version:VERSION,freeCasesVisible:15};
}
