import fs from 'node:fs';
import path from 'node:path';
import {logicExpertPuzzles as puzzles,logicExpertSeo as seo} from './logic-expert-release-data.mjs';

const VERSION='2.0.0';
const ORIGIN='https://mysterylogic.com/';
const oldLogicSlugs=['shest-pokazaniy','arhivnaya-matrica-5x5','kod-507','poryadok-pyati-papok','seyf-5074','kod-protokol-6'];
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const ensure=d=>fs.mkdirSync(d,{recursive:true});
const write=(dir,html)=>{ensure(dir);fs.writeFileSync(path.join(dir,'index.html'),html);};
const url=route=>`${ORIGIN}${route.replace(/^\//,'')}`;

function head({title,description,canonical,type='website',extra=''}){
  const schema={'@context':'https://schema.org','@type':type==='article'?'WebPage':'CollectionPage',name:title,url:canonical,description,inLanguage:'ru-RU',isAccessibleForFree:true};
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#06101b"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="${type}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${JSON.stringify(schema)}</script>${extra}`;
}
function header(root,active='puzzles'){
  return `<header class="logic-header logic-wrap"><a class="logic-brand" href="${root}"><span class="logic-brand-mark">ML</span><span class="logic-brand-copy"><strong>Mystery Logic</strong><small>Detective & logic games</small></span></a><nav class="logic-nav" aria-label="Основная навигация"><a href="${root}dela/">Детективные дела</a><a href="${root}detektivnye-igry-dlya-odnogo/">Для одного</a><a href="${root}detektivnye-igry-dlya-dvoih/">Для двоих</a><a class="${active==='puzzles'?'is-active':''}" href="${root}golovolomki-onlayn/">Головоломки</a><a class="logic-tg" data-telegram-cta="header" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Telegram</a></nav></header>`;
}
function footer(root){
  return `<footer class="logic-footer logic-wrap"><span>© 2026 Mystery Logic</span><nav><a href="${root}golovolomki-onlayn/">Головоломки онлайн</a><a href="${root}zagadki-na-logiku-dlya-vzroslyh/">Для взрослых</a><a href="${root}logicheskie-zadachi/">Expert</a><a href="${root}dela/">Детективные дела</a><a data-telegram-cta="footer" href="https://t.me/mysterylogic" target="_blank" rel="noopener">@mysterylogic</a></nav></footer>`;
}
function styles(root){return `<link rel="stylesheet" href="${root}assets/logic-hub.css?v=${VERSION}"><link rel="stylesheet" href="${root}assets/logic-expert-seo.css?v=${VERSION}">`;}
function scripts(root){return `<script src="${root}assets/logic-expert.js?v=${VERSION}" defer></script>`;}
function subnav(root,active){
  return `<nav class="logic-seo-subnav" aria-label="Раздел головоломок"><a class="${active==='main'?'is-active':''}" href="${root}golovolomki-onlayn/">Головоломки онлайн</a><a class="${active==='adult'?'is-active':''}" href="${root}zagadki-na-logiku-dlya-vzroslyh/">Для взрослых с ответами</a><a class="${active==='expert'?'is-active':''}" href="${root}logicheskie-zadachi/">Expert-каталог</a></nav>`;
}
function card(p,root='../'){
  return `<a class="logic-card" data-expert-card="expert:${p.n}" href="${root}logicheskie-zadachi/${p.slug}/"><div class="logic-card-meta"><span data-expert-badge>Expert</span><span>${esc(p.time)}</span></div><span class="logic-card-number">Задача ${p.n} · ${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><span class="logic-card-link">Решить онлайн →</span></a>`;
}
function hubPage(kind){
  const cfg=kind==='main'?seo.mainHub:kind==='adult'?seo.adultHub:seo.expertHub;
  const root='../';
  const selected=kind==='adult'?puzzles.filter((_,i)=>[0,1,2,3,4,8,10,11,13,16,17,18].includes(i)):puzzles;
  const intro=kind==='main'
    ?'Бесплатная коллекция сложных головоломок без регистрации. Не школьные упражнения и не загадки с подвохом: здесь коды, графы, логические сетки, криптарифмы, маршруты и другие задачи с единственным проверяемым решением.'
    :kind==='adult'
      ?'Здесь собраны сложные загадки на логику для взрослых с ответами и подробным разбором. Сначала решайте самостоятельно; подсказка и решение спрятаны внутри каждой задачи.'
      :'Expert — это каталог задач, прошедших автоматическую проверку единственности. Мы не называем задачу сложной только ради заголовка: механика должна выдерживать полный перебор допустимых состояний.';
  const seoCopy=kind==='main'
    ?`<h2>Головоломки онлайн бесплатно и без регистрации</h2><p>Этот раздел создан именно под игровой интент: открыл задачу — сразу решаешь. Сейчас доступно ${puzzles.length} головоломок разных типов; прогресс сохраняется в браузере. Для задач с сетками и схемами можно сначала решить на бумаге, затем открыть проверенный разбор.</p><p>Если нужен более узкий формат, откройте <a href="../zagadki-na-logiku-dlya-vzroslyh/">загадки на логику для взрослых с ответами</a> или полный <a href="../logicheskie-zadachi/">Expert-каталог</a>.</p>`
    :kind==='adult'
      ?`<h2>Что здесь считается сложной загадкой на логику</h2><p>Не вопрос на знание трюка и не «угадай, что задумал автор». Условия формализованы, ответ единственный, а после решения доступно объяснение. Подборка рассчитана на взрослых и сильных подростков; искусственные ярлыки вроде «IQ 140» мы не используем без психометрической проверки.</p>`
      :`<h2>Как задачи проходят Expert Gate</h2><p>Для каждой механики используется детерминированный валидатор: перебор кодов и перестановок, проверка раскрасок графа, латинских сеток, бинарных полей, маршрутов, взвешиваний или разбиений. Если решение не единственно, задача не публикуется.</p>`;
  const categories=[...new Set(puzzles.map(p=>p.category))].slice(0,10);
  return `<!doctype html><html lang="ru"><head>${head({title:cfg.title,description:cfg.description,canonical:url(`${cfg.slug}/`)})}${styles(root)}</head><body class="logic-page">${header(root)}<main class="logic-wrap"><section class="logic-seo-hero"><p class="logic-kicker">Mystery Logic · Expert</p><h1>${esc(cfg.h1)}</h1><p>${intro}</p><div class="logic-actions"><a class="logic-btn logic-btn-primary" href="#puzzles">Выбрать головоломку</a><a class="logic-btn logic-btn-ghost" data-telegram-cta="seo-hero" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Новые задачи в Telegram →</a></div>${subnav(root,kind)}<div class="logic-seo-proof"><div><strong>${puzzles.length} задач</strong><span>разные механики</span></div><div><strong>Бесплатно</strong><span>без регистрации</span></div><div><strong>Expert Gate</strong><span>единственность доказана</span></div><div><strong>С ответами</strong><span>разбор спрятан до запроса</span></div></div></section><section class="logic-section" id="puzzles"><div class="logic-section-head"><div><p class="logic-kicker">Коллекция</p><h2>${kind==='adult'?'Сложные задачи для самостоятельного решения':'Выберите механику'}</h2></div><p data-expert-progress data-expert-total="20">0 из 20 решено</p></div><div class="logic-filter-row">${categories.map(c=>`<a href="#puzzles">${esc(c)}</a>`).join('')}</div><div class="logic-library">${selected.map(p=>card(p,root)).join('')}</div><div class="logic-seo-copy">${seoCopy}</div></section><section class="logic-section"><div class="logic-community"><div><p class="logic-kicker">Mystery Logic в Telegram</p><h2>Новая головоломка — сначала без ответа.</h2><p>Публикуем задачу, собираем версии и только потом разбираем решение. На сайте остаётся полный архив.</p></div><a class="logic-btn logic-btn-primary" data-telegram-cta="seo-community" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Перейти в @mysterylogic</a></div></section></main>${footer(root)}${scripts(root)}</body></html>`;
}
function taskPage(p,index){
  const root='../../';
  const canonical=url(`logicheskie-zadachi/${p.slug}/`);
  const title=`${p.title} — сложная головоломка онлайн с ответом | Mystery Logic`;
  const description=`${p.summary} Решайте онлайн бесплатно; подсказка и проверенный ответ доступны на странице.`;
  const aliases=[p.answer,...(p.aliases||[])].filter(Boolean).join('|');
  const next=puzzles[(index+1)%puzzles.length],prev=puzzles[(index-1+puzzles.length)%puzzles.length];
  const solve=p.mode==='input'
    ?`<h2>Ваш ответ</h2><label for="expert-${p.n}">${esc(p.input)}</label><input id="expert-${p.n}" class="logic-input" data-expert-input autocomplete="off"><button class="logic-btn logic-btn-primary" data-expert-submit type="button">Проверить ответ</button><p class="logic-feedback" data-expert-feedback>Ответ проверяется локально в браузере.</p>`
    :`<h2>Решили?</h2><p class="logic-self-note">Для этой задачи ответ — поле, схема или набор координат, поэтому текстовый ввод только мешал бы. Сначала решите самостоятельно, затем откройте разбор.</p><button class="logic-btn logic-btn-primary" data-expert-self-report type="button">Я решил — показать разбор</button>`;
  const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
    {'@type':'ListItem',position:1,name:'Mystery Logic',item:ORIGIN},
    {'@type':'ListItem',position:2,name:'Головоломки онлайн',item:url('golovolomki-onlayn/')},
    {'@type':'ListItem',position:3,name:p.title,item:canonical}
  ]};
  return `<!doctype html><html lang="ru"><head>${head({title,description,canonical,type:'article',extra:`<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`})}${styles(root)}</head><body class="logic-page">${header(root)}<main class="logic-wrap"><section class="logic-task-hero"><div class="logic-task-crumbs"><a href="../../">Mystery Logic</a><span>›</span><a href="../../golovolomki-onlayn/">Головоломки</a><span>›</span><a href="../">Expert</a><span>›</span><span>${p.n}</span></div><p class="logic-kicker" style="margin-top:22px">${esc(p.category)} · задача ${p.n}</p><h1>${esc(p.title)}</h1><p class="logic-lead">${esc(p.summary)}</p><div class="logic-task-meta"><span>Expert</span><span>${esc(p.time)}</span><span>Единственное решение</span><span>Бесплатно</span></div>${subnav(root,'expert')}</section><div class="logic-task-grid" data-expert-puzzle="expert:${p.n}" data-expert-mode="${p.mode}" data-expert-answers="${esc(aliases)}"><article class="logic-task-panel"><h2>Условие</h2>${p.body}</article><aside class="logic-solve-panel">${solve}<button class="logic-btn logic-btn-ghost" data-expert-hint type="button">Подсказка</button><div class="logic-reveal" data-expert-hint-copy hidden><h3>Подсказка</h3><p>${esc(p.hint)}</p></div><button class="logic-btn logic-btn-ghost" data-expert-solution-toggle type="button">Показать ответ и разбор</button><div class="logic-reveal" data-expert-solution hidden><h3>Решение</h3>${p.solution}</div></aside></div><section class="logic-task-seo"><h2>${esc(p.title)}: как решать без угадывания</h2><p>Переведите текст задачи в точные ограничения и фиксируйте только вынужденные выводы. Для этой головоломки опубликованный ответ проверен отдельным детерминированным валидатором — альтернативного решения при заданных условиях нет.</p><p><a href="../../zagadki-na-logiku-dlya-vzroslyh/">Ещё сложные загадки на логику для взрослых</a> · <a href="../../golovolomki-onlayn/">все головоломки онлайн</a>.</p></section><section class="logic-section"><div class="logic-section-head"><div><p class="logic-kicker">Продолжить</p><h2>Ещё две задачи</h2></div></div><div class="logic-related"><a href="../${prev.slug}/"><strong>← ${esc(prev.title)}</strong><span>${esc(prev.category)}</span></a><a href="../${next.slug}/"><strong>${esc(next.title)} →</strong><span>${esc(next.category)}</span></a><a data-telegram-cta="task-related" href="https://t.me/mysterylogic" target="_blank" rel="noopener"><strong>Новая задача в Telegram</strong><span>@mysterylogic</span></a></div></section></main>${footer(root)}${scripts(root)}</body></html>`;
}
function patchHome(root){
  const file=path.join(root,'index.html');if(!fs.existsSync(file))return 0;
  let html=fs.readFileSync(file,'utf8');
  const block=`<section class="ref-logic-launch" data-logic-home-launch><div class="ref-logic-launch-copy"><p class="ref-kicker">Mystery Logic · Expert</p><h2>Сложные головоломки онлайн</h2><p>${puzzles.length} задач разных механик: коды, графы, матрицы, криптарифмы, нонограммы и логические схемы. Бесплатно, без регистрации, с проверяемыми ответами.</p><div class="ref-home-actions ref-home-actions-v2"><a class="ref-btn ref-btn-primary" href="./golovolomki-onlayn/">Открыть головоломки →</a><a class="ref-btn ref-btn-outline" data-telegram-cta="home-logic" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Новые задачи в Telegram</a></div></div><div class="ref-logic-launch-proof"><strong>Не повторяет «Кто врёт?»</strong><span>Здесь чистая логика: коды, сетки, маршруты, операции, графы и пространственные ограничения — без подозреваемых, алиби и допросов.</span></div></section>`;
  if(/<section class="ref-logic-launch" data-logic-home-launch>[\s\S]*?<\/section>/.test(html))html=html.replace(/<section class="ref-logic-launch" data-logic-home-launch>[\s\S]*?<\/section>/,block);
  else if(html.includes('<section class="ref-method-v2"'))html=html.replace('<section class="ref-method-v2"',`${block}<section class="ref-method-v2"`);
  else html=html.replace('</main>',`${block}</main>`);
  fs.writeFileSync(file,html);return 1;
}
function removeOld(root){
  const base=path.join(root,'logicheskie-zadachi');let removed=0;
  for(const slug of oldLogicSlugs){const dir=path.join(base,slug);if(fs.existsSync(dir)){fs.rmSync(dir,{recursive:true,force:true});removed++;}}
  return removed;
}
export function applyLogicExpertSeo(rootDir){
  const root=path.resolve(rootDir);removeOld(root);
  write(path.join(root,seo.mainHub.slug),hubPage('main'));
  write(path.join(root,seo.adultHub.slug),hubPage('adult'));
  write(path.join(root,seo.expertHub.slug),hubPage('expert'));
  for(const [i,p] of puzzles.entries())write(path.join(root,'logicheskie-zadachi',p.slug),taskPage(p,i));
  const homePatched=patchHome(root);
  const routes=[`${seo.mainHub.slug}/`,`${seo.adultHub.slug}/`,`${seo.expertHub.slug}/`,...puzzles.map(p=>`logicheskie-zadachi/${p.slug}/`)];
  for(const route of routes){const file=path.join(root,route,'index.html');if(!fs.existsSync(file))throw new Error(`logic expert route missing: ${route}`);const html=fs.readFileSync(file,'utf8');if(!html.includes('<link rel="canonical"')||!html.includes('Mystery Logic'))throw new Error(`logic expert route invalid: ${route}`);}
  return {version:VERSION,puzzles:puzzles.length,routes,homePatched,mainHub:`${seo.mainHub.slug}/`,adultHub:`${seo.adultHub.slug}/`,expertHub:`${seo.expertHub.slug}/`};
}
