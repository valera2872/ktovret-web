import fs from 'node:fs';
import path from 'node:path';

const VERSION='4.0.1';
const esc=(v)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const estimate=(difficulty='Среднее')=>/слож/i.test(difficulty)?8:/лег/i.test(difficulty)?5:7;

function injectStyle(html,href){
  if(html.includes('storefront-reference.css')) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="${href}?v=${VERSION}">\n</head>`);
}
function bodyClass(html){return html.replace(/<body(?: class="[^"]*")?>/,'<body class="ref-storefront">');}
function replaceHeader(html,root,active=''){
  const nav=[['Главная',`${root}`,active==='home'],['Архив дел',`${root}dela/`,active==='archive'],['Как это работает',`${root}#method`,false],['Первый том',`${root}tom-1/`,active==='volume'],['О нас',`${root}#about`,false]];
  const header=`<header class="ref-header ref-wrap"><a class="ref-brand" href="${root}" aria-label="Mystery Logic — главная"><span class="ref-brand-mark">ML</span><span class="ref-brand-copy"><strong>Mystery Logic</strong><small>Детективные дела</small></span></a><nav class="ref-nav" aria-label="Основная навигация">${nav.map(([label,href,on])=>`<a${on?' class="is-active"':''} href="${href}">${label}</a>`).join('')}</nav><a class="ref-login" href="${root}tom-1/"><span class="ref-login-icon" aria-hidden="true"></span>Доступ</a></header>`;
  return html.replace(/<header[\s\S]*?<\/header>/,header);
}
function footer(root){return `<footer class="ref-footer ref-wrap"><span>© 2026 Mystery Logic</span><span><a href="${root}dela/">Архив дел</a><a href="${root}detektivnye-igry-dlya-dvoih/">Для двоих</a><a href="${root}tom-1/">Первый том</a><a href="${root}offer/">Условия</a></span></footer>`;}
function replaceFooter(html,root){return html.replace(/<footer[\s\S]*?<\/footer>/,footer(root));}

const wave=()=>Array.from({length:35},()=>`<i aria-hidden="true"></i>`).join('');
function trustStrip(){return `<section class="ref-trust" aria-label="Преимущества"><article><span class="ref-trust-icon">⌁</span><strong>15 дел бесплатно</strong><span>Попробуйте без риска</span></article><article><span class="ref-trust-icon">▣</span><strong>100 дел в архиве</strong><span>Полный Первый том</span></article><article><span class="ref-trust-icon">◷</span><strong>5–10 минут</strong><span>Короткие расследования</span></article><article><span class="ref-trust-icon">✓</span><strong>Один доказуемый ответ</strong><span>Логика важнее догадок</span></article></section>`;}
function homeMain(){return `<main class="ref-main ref-wrap">
<section class="ref-home-hero"><div class="ref-home-copy"><p class="ref-kicker">Детективные игры онлайн</p><h1>Детективные<br>игры онлайн</h1><p class="ref-home-lead">Интуиция приводит к версии. Логика превращает её в доказательство. Исследуйте улики, сверяйте показания и доказывайте каждую версию по фактам.</p><div class="ref-home-actions"><a class="ref-btn ref-btn-primary" href="./delo/chetyre-vhoda-v-arhiv/">Начать расследование</a><a class="ref-btn ref-btn-outline" href="./dela/">Открыть архив дел</a></div></div><img class="ref-home-art" src="./assets/reference-home-hero.svg" alt="Звонок 112 в 23:17, кадр камеры C17 и папка дела ML-2317" width="560" height="435"></section>
${trustStrip()}
<p class="ref-section-label" id="games">Выберите формат расследования</p><section class="ref-format-grid" aria-labelledby="games"><a class="ref-format-card" href="./detektivnye-igry-dlya-dvoih/"><div class="ref-format-copy"><small>Для двоих</small><h3>Последний звонок<br>в 23:17</h3><p>Совместное расследование.<br>2 игрока · 45–60 минут</p></div><img class="ref-format-art" src="./assets/reference-format-2317.svg" alt="Телефон, карта и две роли"><span class="ref-format-link">Играть вдвоём →</span></a><a class="ref-format-card" href="./kto-vret/"><div class="ref-format-copy"><small>Серия дел</small><h3>Кто врёт?</h3><p>Короткие логические дела<br>в удобном формате.</p></div><img class="ref-format-art" src="./assets/reference-format-who.svg" alt="Блокнот с показаниями и лупа"><span class="ref-format-link">Открыть серию →</span></a><a class="ref-format-card" href="./tom-1/"><div class="ref-format-copy"><small>Архив</small><h3>Первый том</h3><p>Полный архив · 15 бесплатных дел<br>+ 85 дел в одном томе.</p></div><img class="ref-format-art" src="./assets/reference-format-volume.svg" alt="Первый том Mystery Logic"><span class="ref-format-link">Посмотреть том →</span></a></section>
<p class="ref-section-label">С чем вы будете работать</p><section class="ref-material-grid"><article class="ref-material"><h3>Запись 112</h3><div class="ref-wave">${wave()}</div><div class="ref-player"><span class="ref-play">▶</span><span>00:00 / 01:12</span></div></article><article class="ref-material"><h3>Камера</h3><div class="ref-camera-mini"></div></article><article class="ref-material"><h3>Переписка</h3><div class="ref-chat-bubble">Ты где?<small style="float:right">23:12 ✓✓</small></div><div class="ref-chat-bubble">Буду через 10 минут<small style="float:right">23:12 ✓✓</small></div></article><article class="ref-material"><h3>Протокол</h3><div class="ref-protocol"><strong>ПРОТОКОЛ ОСМОТРА</strong><span></span></div></article></section>
<section class="ref-manifesto" id="method"><div><h2>Честная детективная задача уважает игрока.</h2><p>Все необходимые сведения есть в материалах дела. Ключевая улика не возникает из воздуха, а решение не зависит от случайной догадки.<br>Определить правильную последовательность событий можно только сопоставив факты.</p></div><div class="ref-seal">ML</div></section>
</main>`;}

function visualClass(i){return `v${i%8||8}`;}
function caseCard(item,i,badge='Бесплатно',locked=false,root='../'){
  const href=item?.path?`${root}${item.path}`:`${root}tom-1/`;
  const title=esc(item?.title||`Дело ${String(i).padStart(2,'0')}`);
  const difficulty=esc(item?.difficulty||'Среднее');
  return `<a class="ref-case" href="${href}"><div class="ref-case-visual ${visualClass(i)}"><span class="ref-case-number">${String(i).padStart(2,'0')}</span><span class="ref-case-badge${locked?' locked':''}">${esc(badge)}</span></div><div class="ref-case-body"><h3>${title}</h3><div class="ref-case-meta"><span>${difficulty}</span><span>◷ ${estimate(item?.difficulty)} минут</span></div></div></a>`;
}
function whyBlock(){return `<fieldset class="ref-why" id="about"><legend>Почему Mystery Logic работает</legend><div class="ref-why-grid"><article class="ref-why-card"><span class="ref-why-ico">◷</span><strong>Короткий формат</strong><span>Каждое дело можно решить за 5–10 минут — идеально для очереди и дороги.</span></article><article class="ref-why-card"><span class="ref-why-ico">⚖</span><strong>Проверяемая логика</strong><span>Все решения основаны на фактах. Никаких догадок — только проверяемые выводы.</span></article><article class="ref-why-card"><span class="ref-why-ico">✓</span><strong>Прогресс в браузере</strong><span>Ваш прогресс сохраняется автоматически. Продолжайте с того места, где остановились.</span></article></div></fieldset>`;}
function banner(){return `<section class="ref-bottom-banner"><div class="ref-banner-scene" aria-hidden="true"></div><div class="ref-banner-copy"><h2>Это не просто список дел —<br>это архив расследований.</h2><p>Документы, показания, таймлайны, камеры и логические ограничения. Каждое дело — отдельная доказуемая задача.</p></div><div class="ref-banner-logo"><div class="ref-seal">ML</div><span>MYSTERY LOGIC</span></div></section>`;}
function accessStrip({button=true,root='../'}={}){return `<section class="ref-access-strip"><div class="ref-access-stat"><span class="ico">♧</span><strong>15 дел</strong><span>бесплатно</span></div><div class="ref-access-stat"><span class="ico">▣</span><strong>85 дел</strong><span>в полном томе</span></div><div class="ref-access-stat"><span class="ico">₽</span><strong>99 ₽</strong><span>полный доступ</span></div><div class="ref-access-buy">${button?`<button class="ref-btn ref-btn-primary" type="button" data-volume-buy disabled aria-label="Открыть 85 дел за 99 ₽">Открыть Первый том →</button><small data-volume-payment-note>Мгновенный доступ · Без подписки</small>`:`<a class="ref-btn ref-btn-primary" href="${root}tom-1/">Открыть Первый том →</a><small>Мгновенный доступ · Без подписки</small>`}</div></section>`;}

function archiveGrid(items,{premiumSamples=false,root='../'}={}){
  let cards=[];
  if(premiumSamples){
    const free=items.filter(x=>x.access==='free').slice(0,2);
    const paid=items.filter(x=>x.access==='premium').slice(0,6);
    cards=[...free.map((x,i)=>caseCard(x,i+1,'Бесплатно',false,root)),...paid.map((x,i)=>caseCard(x,i+3,'В Первом томе',true,root))];
  }else cards=items.filter(x=>x.access==='free').slice(0,15).map((x,i)=>caseCard(x,i+1,'Бесплатно',false,root));
  return `<div class="ref-case-grid">${cards.join('')}</div>`;
}
function archiveToolbar(){return `<div class="ref-archive-bar"><h2>Архив дел</h2><div class="ref-filters"><select class="ref-select" aria-label="Категория"><option>Все категории</option></select><select class="ref-select" aria-label="Сортировка"><option>Сначала новые</option></select><button class="ref-view-btn" type="button" aria-label="Сетка">▦</button></div></div>`;}

function catalogCompatibility(cases){
  const free=cases.filter(x=>x.access==='free').slice(0,15);
  const cards=free.map(item=>`<i class="case-card" data-case-id="${esc(item.id)}" data-access="free" data-difficulty="${esc(item.difficulty||'Среднее')}" data-category="${esc(item.category||'Логика')}" data-progress="new" data-search="${esc(`${item.title} ${item.category||''}`.toLowerCase())}"><span data-case-progress-badge>○ Новое</span><a data-case-open href="../${esc(item.path)}">Открыть расследование</a></i>`).join('');
  return `<div class="ref-compat" aria-hidden="true"><section data-catalog-progress><strong data-catalog-progress-text>0 из 15 бесплатных дел раскрыто</strong><span data-catalog-progress-fill></span><a data-catalog-continue href="../${esc(free[0]?.path||'dela/')}">Следующее нераскрытое дело</a><button data-catalog-random type="button">Случайное дело</button></section><input id="case-search" type="search"><select id="case-difficulty"><option value="all">Все</option></select><select id="case-category"><option value="all">Все</option></select><input id="case-unsolved" type="checkbox">${cards}<article class="volume-archive-card"><h3>Архивы первого тома</h3><p>Ещё 85 дел — одной покупкой</p></article></div>`;
}
function volumeCompatibility(){return `<div class="ref-compat" aria-hidden="true"><h1>Первый том «Кто врёт?» — 100 детективных задач</h1><p>Внутри несколько тематических архивов. 15 дел доступны без покупки. Для вопросов об оплате и восстановлении доступа: support@mysterylogic.com</p><article class="volume-archive-card"><h3>Тематический архив</h3></article></div>`;}

function volumeMain(cases){return `<main class="ref-main ref-wrap"><section class="ref-archive-hero"><div class="ref-archive-copy"><p class="ref-kicker">Первый том</p><h1>100 детективных дел</h1><p>Полный архив коротких расследований Mystery Logic.<br>15 дел доступны бесплатно, ещё 85 открываются одной покупкой.</p></div><img class="ref-archive-art" src="../assets/reference-archive-hero.svg" alt="Коробка первого тома Mystery Logic с папками дел и доказательствами" width="562" height="385"></section>${accessStrip({button:true})}${archiveToolbar()}${archiveGrid(cases,{premiumSamples:true})}${whyBlock()}${banner()}${volumeCompatibility()}</main>`;}
function catalogMain(cases){return `<main class="ref-main ref-wrap"><section class="ref-archive-hero"><div class="ref-archive-copy"><p class="ref-kicker">Открытый архив</p><h1>Детективные дела</h1><p>15 полноценных расследований доступны бесплатно. Решайте их в любом порядке, сохраняйте прогресс и переходите к Первому тому, когда захотите продолжить.</p></div><img class="ref-archive-art" src="../assets/reference-archive-hero.svg" alt="Архив дел Mystery Logic" width="562" height="385"></section>${accessStrip({button:false})}${archiveToolbar()}${archiveGrid(cases,{premiumSamples:false})}${whyBlock()}${banner()}${catalogCompatibility(cases)}</main>`;}

function patch(file,{root,active,main,style}){
  let html=fs.readFileSync(file,'utf8');
  html=bodyClass(injectStyle(html,style));
  html=replaceHeader(html,root,active);
  html=html.replace(/<main[\s\S]*?<\/main>/,main);
  html=replaceFooter(html,root);
  fs.writeFileSync(file,html);
}
export function applyStorefrontReference(siteRoot,cases){
  patch(path.join(siteRoot,'index.html'),{root:'./',active:'home',main:homeMain(),style:'./assets/storefront-reference.css'});
  patch(path.join(siteRoot,'dela/index.html'),{root:'../',active:'archive',main:catalogMain(cases),style:'../assets/storefront-reference.css'});
  patch(path.join(siteRoot,'tom-1/index.html'),{root:'../',active:'volume',main:volumeMain(cases),style:'../assets/storefront-reference.css'});
  return {pages:3,version:VERSION};
}
