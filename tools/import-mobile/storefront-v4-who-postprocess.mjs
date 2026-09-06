import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.1.0';
const esc=(value)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function addStyle(html,href,needle){
  if(html.includes(needle)) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="${href}">\n</head>`);
}

function patchSeo(html){
  const title='«Кто врёт?» — 100 детективных загадок | Mystery Logic';
  const description='«Кто врёт?» — 100 коротких детективных загадок и дел с доказуемым ответом. 15 бесплатно. Решайте сами, вдвоём или вслух с семьёй.';
  let out=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${title}</title>`);
  out=out.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${description}">`);
  out=out.replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${title}">`);
  out=out.replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${description}">`);
  return out;
}

function header(){
  const nav=[
    ['Главная','../'],
    ['Архив дел','../dela/'],
    ['Как это работает','#how'],
    ['Первый том','../tom-1/'],
    ['О нас','#about'],
  ];
  return `<header class="ref-header ref-wrap"><a class="ref-brand" href="../" aria-label="Mystery Logic — главная"><span class="ref-brand-mark">ML</span><span class="ref-brand-copy"><strong>Mystery Logic</strong><small>Детективные дела</small></span></a><nav class="ref-nav" aria-label="Основная навигация">${nav.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}</nav><a class="ref-login" href="../tom-1/"><span class="ref-login-icon" aria-hidden="true"></span>Доступ</a></header>`;
}

function footer(){
  return `<footer class="ref-footer ref-wrap"><span>© 2026 Mystery Logic</span><span><a href="../dela/">Архив дел</a><a href="../detektivnye-igry-dlya-dvoih/">Для двоих</a><a href="../tom-1/">Первый том</a><a href="../offer/">Условия</a></span></footer>`;
}

function accessStrip(){
  return `<section class="ref-access-strip ref-who-access" aria-label="Что входит в Кто врёт"><div class="ref-access-stat"><span class="ico">♧</span><strong>15 дел</strong><span>бесплатно</span></div><div class="ref-access-stat"><span class="ico">▣</span><strong>85 дел</strong><span>в Первом томе</span></div><div class="ref-access-stat"><span class="ico">◷</span><strong>5–10 минут</strong><span>на одно дело</span></div><div class="ref-access-buy"><a class="ref-btn ref-btn-primary" href="../delo/chetyre-vhoda-v-arhiv/">Открыть первое дело →</a><small>Без регистрации · бесплатно</small></div></section>`;
}

function playModes(){
  return `<section class="ref-who-modes" data-who-play-modes><div class="ref-who-modes-head"><p class="ref-kicker">Один формат · три сценария</p><h2>Не нужно собирать компанию или изучать правила</h2><p>Откройте короткое дело и выберите, как хотите его разгадывать прямо сейчас.</p></div><div class="ref-who-modes-grid"><article><span>01</span><strong>Самому</strong><p>Прочитайте материалы, выберите версию и сразу получите доказательный разбор.</p></article><article><span>02</span><strong>Вдвоём</strong><p>Решите одно и то же дело, сравните версии и посмотрите, кто первым заметил противоречие.</p></article><article><span>03</span><strong>Вслух с семьёй</strong><p>Один читает условие, остальные спорят о версиях. Подходит для дороги, ожидания или короткой семейной игры.</p></article></div></section>`;
}

function archiveSnapshot(cases){
  const free=cases.filter(item=>item.access==='free').slice(0,2);
  const paid=cases.filter(item=>item.access==='premium').slice(0,6);
  const items=[...free,...paid];
  const links=items.map((item,index)=>`<a class="ref-snapshot-link hot-case hot-c${index+1}" href="${item.access==='premium'?'../tom-1/':`../${item.path}`}" aria-label="${esc(item.title)}">${esc(item.title)}</a>`).join('');
  return `<section class="ref-snapshot ref-archive-snapshot" aria-label="Примеры дел серии Кто врёт"><img src="../assets/reference-archive-grid.webp" data-reference-asset="archive-grid" alt="Примеры дел Mystery Logic: камеры, журналы, карты, аудиозаписи и архивные материалы" width="994" height="497" loading="eager">${links}</section>`;
}

function method(){
  return `<fieldset class="ref-why ref-who-method" id="how"><legend>Как проходит расследование</legend><div class="ref-why-grid"><article class="ref-why-card"><span class="ref-why-ico">01</span><strong>Изучите материалы</strong><span>Время, маршруты, записи, журналы и другие факты уже находятся в деле.</span></article><article class="ref-why-card"><span class="ref-why-ico">02</span><strong>Сравните показания</strong><span>Не угадывайте человека. Найдите версию, которая не может совпасть с подтверждёнными фактами.</span></article><article class="ref-why-card"><span class="ref-why-ico">03</span><strong>Докажите ответ</strong><span>После выбора откроется разбор: какая именно деталь выдаёт ложь и почему.</span></article></div></fieldset>`;
}

function seoCopy(){
  return `<section class="ref-who-seo" id="about"><div><p class="ref-kicker">Серия «Кто врёт?»</p><h2>100 коротких детективных загадок с доказуемым ответом</h2></div><div class="ref-who-seo-copy"><p>Перед вами несколько версий одного события. Правильный ответ определяется не интуицией, а противоречием с материалами дела: временем, маршрутом, доступом, последовательностью событий или другим проверяемым условием.</p><p>Формат рассчитан на короткую игровую сессию: можно разгадывать дело самостоятельно, сравнивать версии вдвоём или читать условие вслух семье. Начните с <a href="../dela/">15 бесплатных расследований</a>. Полный <a href="../tom-1/">Первый том</a> добавляет ещё 85 дел одной покупкой без подписки.</p><p>Другие подборки Mystery Logic: <a href="../detektivnye-igry-onlayn/">детективные игры онлайн</a>, <a href="../detektivnye-zagadki-s-otvetami/">детективные загадки с ответами</a> и <a href="../logicheskie-detektivnye-zadachi/">логические детективные задачи</a>.</p></div></section>`;
}

function bottomBanner(){
  return `<section class="ref-bottom-banner"><div class="ref-banner-scene" aria-hidden="true"></div><div class="ref-banner-copy"><h2>Каждое дело — отдельное доказательство.</h2><p>Материалы, показания и логические ограничения уже содержат всё необходимое. Нужно только связать факты.</p></div><div class="ref-banner-logo"><div class="ref-seal">ML</div><span>MYSTERY LOGIC</span></div></section>`;
}

function main(cases){
  return `<main class="ref-main ref-wrap"><section class="ref-who-hero"><div class="ref-who-copy"><p class="ref-kicker">100 коротких детективных дел</p><h1>Кто врёт?</h1><p class="ref-who-lead">Одно дело занимает несколько минут: прочитайте версии, найдите противоречие и докажите ответ. Играйте сами, вдвоём или читайте условие вслух семье.</p><div class="ref-who-actions"><a class="ref-btn ref-btn-primary" href="../delo/chetyre-vhoda-v-arhiv/">Попробовать первое дело</a><a class="ref-btn ref-btn-outline" href="../dela/">15 бесплатных дел</a></div></div><div class="ref-who-art" aria-label="Блокнот с показаниями и лупа из утверждённого дизайна Mystery Logic"><div class="ref-who-crop"><img src="../assets/reference-home-lower.webp" data-reference-asset="who-approved-art" alt="Блокнот с материалами дела и лупа" width="1055" height="940"></div></div></section>${accessStrip()}${playModes()}<div class="ref-who-archive-head"><h2>Архив дел</h2><p>15 расследований доступны бесплатно. Если формат понравится, ещё 85 открываются одной покупкой за 99 ₽ без подписки.</p></div>${archiveSnapshot(cases)}<div class="ref-who-after-grid"><a class="ref-btn ref-btn-outline" href="../dela/">Открыть 15 бесплатных дел →</a></div>${method()}${seoCopy()}${bottomBanner()}</main>`;
}

export function applyStorefrontV4Who(siteRoot,cases){
  const file=path.join(siteRoot,'kto-vret/index.html');
  if(!fs.existsSync(file)) return {pages:0,version:VERSION};
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<style>\s*\.product\{[\s\S]*?<\/style>/,'');
  html=addStyle(html,'../assets/storefront-reference.css?v=4.0.1','storefront-reference.css');
  html=addStyle(html,'../assets/storefront-reference-v41.css?v=4.1.4','storefront-reference-v41.css');
  html=addStyle(html,`../assets/storefront-v4-who.css?v=${VERSION}`,'storefront-v4-who.css');
  const body=`<body class="ref-storefront ref-storefront-v41 ref-who-v4" data-storefront-v4-who="${VERSION}">${header()}${main(cases)}${footer()}</body>`;
  html=html.replace(/<body[\s\S]*?<\/body>/,body);
  html=patchSeo(html);
  const required=['data-storefront-v4-who','data-reference-asset="who-approved-art"','data-reference-asset="archive-grid"','data-who-play-modes','15 дел','85 дел','99 ₽','Вслух с семьёй','Как проходит расследование','storefront-v4-who.css'];
  for(const marker of required) if(!html.includes(marker)) throw new Error(`Who Lied v4 extension missing marker: ${marker}`);
  fs.writeFileSync(file,html);
  return {pages:1,version:VERSION};
}
