import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './common.mjs';
import { siteUrl } from './site-config.mjs';

const HUB='detektivnye-igry-dlya-odnogo/mini';
const VERSION='1.0.0';
const CASES=[
  ['mini-101','krasnyy-svet','Красный свет','Невозможное наблюдение при аварийном освещении','10–12 минут','Среднее','Восприятие'],
  ['mini-102','dve-svechi','Две свечи','Хронология, которую сохранил воск','10–12 минут','Среднее','Причинность'],
  ['mini-103','medalon-na-shnure','Медальон на шнуре','Замкнутый контур без разрыва','10–13 минут','Среднее','Пространство'],
  ['mini-104','sled-poverh-sleda','След поверх следа','Порядок событий без часов и камер','10–12 минут','Среднее','Следы'],
  ['mini-105','ten-ot-prozhektora','Тень от прожектора','Алиби, которое ломает геометрия света','8–10 минут','Легко','Пространство'],
  ['mini-106','shepot-za-steklom','Шёпот за стеклом','Фраза, которую никто не мог услышать','10–12 минут','Среднее','Звук'],
  ['mini-107','snimok-v-zerkale','Снимок в зеркале','Фотография выдаёт точку съёмки','12–15 минут','Сложно','Изображение'],
  ['mini-108','holodnaya-chashka','Холодная чашка','Температура против алиби','10–13 минут','Среднее','Температура'],
  ['mini-109','lozh-ne-o-prestuplenii','Ложь не о преступлении','Почему ложь ещё не делает человека виновным','12–15 минут','Сложно','Мотив'],
  ['mini-110','slovo-na-zerkale','Слово на зеркале','Послание, которое проявил пар','8–10 минут','Легко','Наблюдение']
];

const header=(prefix,mini=false)=>`<header class="sm-header"><div class="sm-shell sm-header__in"><a class="sm-brand" href="${prefix}"><span class="sm-brand__mark">ML</span><span><strong>Mystery Logic</strong><small>Solo investigations</small></span></a><div class="sm-header__actions"><a class="sm-link" href="${prefix}detektivnye-igry-dlya-odnogo/">Все игры для одного</a>${mini?'<button class="sm-tool" data-mini-notes-open>Материалы дела</button><button class="sm-tool" data-mini-reset>Сначала</button>':''}</div></div></header>`;

const hubCards=()=>CASES.map((c,i)=>`<a class="sm-hub-card" data-mini-card="${c[0]}" data-number="${String(i+1).padStart(2,'0')}" href="${c[1]}/"><div class="sm-hub-card__top"><span>${c[6]} · ${c[4]}</span><span class="sm-hub-card__status" data-mini-status>Открыто</span></div><h2>${c[2]}</h2><p>${c[3]}</p><div class="sm-hub-card__meta"><span>${c[5]}</span><span>1 игрок</span><span>бесплатно</span></div><span class="sm-hub-card__go">Открыть дело →</span></a>`).join('');

const hubPage=()=>`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#071018"><meta name="description" content="10 бесплатных мини-расследований Mystery Logic для одного: улики, показания, дедукция и финальная реконструкция. 8–15 минут на дело, без регистрации."><link rel="canonical" href="${siteUrl(`${HUB}/`)}"><link rel="icon" href="../../assets/ml-mark.svg" type="image/svg+xml"><link rel="stylesheet" href="../../assets/solo-mini.css?v=${VERSION}"><meta property="og:title" content="Мини-расследования онлайн для одного — 10 дел бесплатно"><meta property="og:description" content="Формат между «Кто врёт?» и большим расследованием: открывайте улики, проверяйте показания и собирайте реконструкцию."><meta property="og:type" content="website"><meta property="og:url" content="${siteUrl(`${HUB}/`)}"><title>Мини-расследования онлайн — 10 детективных дел бесплатно</title></head><body class="sm-body">${header('../../')}<main class="sm-shell" data-solo-mini-hub><section class="sm-hub-hero"><p class="sm-kicker">Mystery Logic · Solo Mini</p><h1>Мини-расследования для одного</h1><p>Не одна загадка и ещё не часовой квест. В каждом деле вы поэтапно открываете материалы, делаете промежуточный вывод, сверяете показания и только потом фиксируете финальную версию.</p><div class="sm-hub-stats"><div><strong>10</strong><span>бесплатных дел</span></div><div><strong>8–15</strong><span>минут на расследование</span></div><div><strong data-mini-completed-count>0</strong><span>уже раскрыто на этом устройстве</span></div></div></section><section class="sm-ladder"><h2>Три уровня детективной игры</h2><div class="sm-ladder__grid"><article><small>быстро</small><strong>«Кто врёт?»</strong><p>5–10 минут. Сверить факты и найти одно противоречие.</p></article><article><small>этот формат</small><strong>Мини-расследование</strong><p>Несколько пакетов улик, показания, промежуточная дедукция и реконструкция.</p></article><article><small>глубоко</small><strong>«Номер 407»</strong><p>50–70 минут. Большое самостоятельное дело с 18 материалами.</p></article></div></section><section class="sm-hub-grid">${hubCards()}</section></main><script src="../../assets/solo-mini-cases.js?v=${VERSION}"></script><script src="../../assets/solo-mini.js?v=${VERSION}"></script></body></html>`;

const casePage=(c,i)=>{
  const [id,slug,title,subtitle,duration,difficulty,category]=c;
  const description=`${title} — бесплатное мини-расследование Mystery Logic для одного. Улики, показания и дедукция; ${duration}.`;
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#071018"><meta name="description" content="${description}"><link rel="canonical" href="${siteUrl(`${HUB}/${slug}/`)}"><link rel="icon" href="../../../assets/ml-mark.svg" type="image/svg+xml"><link rel="stylesheet" href="../../../assets/solo-mini.css?v=${VERSION}"><meta property="og:title" content="${title} — мини-расследование Mystery Logic"><meta property="og:description" content="${subtitle}. Бесплатное solo-дело на ${duration}."><meta property="og:type" content="website"><meta property="og:url" content="${siteUrl(`${HUB}/${slug}/`)}"><title>${title} — бесплатное детективное мини-расследование</title></head><body class="sm-body">${header('../../../',true)}<section class="sm-hero"><div class="sm-shell"><div class="sm-hero__grid"><div><p class="sm-kicker">Дело ${String(i+1).padStart(2,'0')} из 10 · бесплатно</p><h1>${title}</h1><p class="sm-hero__subtitle">${subtitle}</p></div><aside class="sm-hero__stamp"><span>${category}<br>${difficulty}<br>${duration}</span><strong>${String(i+1).padStart(2,'0')}</strong></aside></div><div class="sm-progress-wrap"><div class="sm-progress-meta"><span data-mini-progress-label>Вводная · 5%</span><span>прогресс сохраняется</span></div><div class="sm-progress-track"><i data-mini-progress></i></div></div></div></section><main class="sm-shell sm-main" data-solo-mini-app data-case-id="${id}"><div data-mini-stage></div></main><dialog class="sm-notes" data-mini-notes><button class="sm-notes__close" data-mini-notes-close aria-label="Закрыть">×</button><p class="sm-kicker">Досье</p><h2>Материалы дела</h2><div data-mini-notes-content></div></dialog><script src="../../../assets/solo-mini-cases.js?v=${VERSION}"></script><script src="../../../assets/solo-mini.js?v=${VERSION}"></script></body></html>`;
};

function patchSoloHub(siteRoot){
  const file=path.join(siteRoot,'detektivnye-igry-dlya-odnogo/index.html');
  if(!fs.existsSync(file))throw new Error('Solo hub missing before mini investigations patch');
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('solo-mini.css'))html=html.replace('</head>',`<link rel="stylesheet" href="../assets/solo-mini.css?v=${VERSION}"></head>`);
  html=html.replace('Можно открыть большое расследование на один вечер — или пройти короткое дело «Кто врёт?» за 5–10 минут. В обоих форматах вы сами анализируете факты и принимаете решение.','Можно открыть большое расследование на один вечер, пройти мини-расследование на 8–15 минут или решить короткое дело «Кто врёт?». Во всех форматах вы сами анализируете факты и принимаете решение.');
  html=html.replace('<span>два формата бесплатно</span>','<span>3 уровня глубины</span>');
  if(!html.includes('data-solo-mini-bridge')){
    const bridge=`<section class="sm-ladder" data-solo-mini-bridge aria-labelledby="solo-mini-title"><p class="sm-kicker">Бесплатный средний формат · 10 дел</p><h2 id="solo-mini-title">Мини-расследования</h2><p class="sm-lead">Между быстрой задачей «Кто врёт?» и большим «Номером 407»: несколько пакетов материалов, показания, промежуточный вывод и финальная реконструкция. Одно дело занимает 8–15 минут.</p><div class="sm-ladder__grid"><article><small>01 · ИССЛЕДУЙТЕ</small><strong>Открывайте улики</strong><p>Материалы появляются поэтапно, а не сваливаются одной стеной текста.</p></article><article><small>02 · ПРОВЕРЯЙТЕ</small><strong>Фиксируйте вывод</strong><p>Промежуточный вопрос проверяет, что вы доказали, а что только предполагаете.</p></article><article><small>03 · СОБЕРИТЕ</small><strong>Дайте вердикт</strong><p>Сопоставьте показания и восстановите непротиворечивую картину.</p></article></div><div class="sm-actions"><a class="sm-button" href="mini/">Открыть 10 мини-расследований</a></div></section>`;
    const marker='<section class="solo407-kv"';
    if(!html.includes(marker))throw new Error('Who Lied block missing on Solo hub');
    html=html.replace(marker,`${bridge}${marker}`);
  }
  fs.writeFileSync(file,html);
}

export function applySoloMiniInvestigations(siteRoot){
  const hubDir=path.join(siteRoot,HUB);ensureDir(hubDir);fs.writeFileSync(path.join(hubDir,'index.html'),hubPage());
  for(const [i,c] of CASES.entries()){
    const dir=path.join(siteRoot,HUB,c[1]);ensureDir(dir);fs.writeFileSync(path.join(dir,'index.html'),casePage(c,i));
  }
  patchSoloHub(siteRoot);
  const routes=[`${HUB}/`,...CASES.map(c=>`${HUB}/${c[1]}/`)];
  for(const route of routes){if(!fs.existsSync(path.join(siteRoot,route,'index.html')))throw new Error(`Solo mini route missing: ${route}`)}
  return {version:VERSION,hub:HUB,routes,cases:CASES.length};
}
