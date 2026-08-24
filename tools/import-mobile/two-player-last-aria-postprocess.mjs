import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './common.mjs';

const VERSION='1.4.0';
const SPOILER_AUDIT_REVISION='1.1';
const LANDING='detektivnye-igry-dlya-dvoih/index.html';
const CASE_ROUTE='detektivnye-igry-dlya-dvoih/poslednyaya-ariya';
const INVESTIGATOR_RUNTIME='case-aria-investigator-v16.js';

const SAFE_MISSION='Установите, кто подготовил саботаж, кто воспользовался критическим окном у архива и где оказался оригинал партитуры. Восстановите события по независимым материалам и не принимайте заявления участников за установленный факт.';
const SAFE_STAGE1_OBJECTIVE='Сведите по секундам удар, сценическое затемнение, служебные маршруты и события у архива. Отмечайте только то, что подтверждается материалами вашего пакета.';
const SAFE_STAGE2_OBJECTIVE='Сопоставьте физические следы, журналы доступа и технические данные с показаниями участников. Ищите совпадения, которые подтверждаются независимым материалом напарника.';
const SAFE_GAME_COVER='Генеральная репетиция. Настоящая рана от бутафорского кинжала. Пятьдесят две секунды темноты. И партитура 1908 года, исчезнувшая из закрытого архива. У каждого участника есть своя версия этих событий.';

const replaceRequired=(source,from,to,label)=>{
  if(source.includes(to)) return source;
  if(!source.includes(from)) throw new Error(`Last Aria spoiler hardening source drift: ${label}`);
  return source.replace(from,to);
};

function hardenRuntimeCopy(siteRoot){
  const dataFile=path.join(siteRoot,'assets/case-aria-data.js');
  const fairplayFile=path.join(siteRoot,'assets/case-aria-fairplay-v2.js');
  const investigatorFile=path.join(siteRoot,'assets',INVESTIGATOR_RUNTIME);
  const gameFile=path.join(siteRoot,'assets/case-aria.js');
  const storefrontFile=path.join(siteRoot,'assets/case-aria-storefront.js');
  for(const file of [dataFile,fairplayFile,investigatorFile,gameFile,storefrontFile]) if(!fs.existsSync(file)) throw new Error(`Last Aria runtime missing: ${path.relative(siteRoot,file)}`);

  let data=fs.readFileSync(dataFile,'utf8');
  data=replaceRequired(
    data,
    "mission: 'Установите, кто подготовил саботаж, кто использовал темноту для входа в архив и почему голос человека, которого все слышали в оркестровой яме, не доказывает, что он там находился.'",
    `mission: '${SAFE_MISSION}'`,
    'raw briefing mission',
  );
  data=replaceRequired(
    data,
    "objective: 'Разведите заранее запланированное сценическое действие и то, что произошло после травмы. Не считайте голос в интеркоме доказательством физического присутствия.'",
    `objective: '${SAFE_STAGE1_OBJECTIVE}'`,
    'raw stage 1 objective',
  );
  data=replaceRequired(
    data,
    "objective: 'Отделите ложные алиби от физического присутствия. Вам понадобятся след из архива и техническое происхождение голоса.'",
    `objective: '${SAFE_STAGE2_OBJECTIVE}'`,
    'raw stage 2 objective',
  );
  data=replaceRequired(data,"type: 'audio', tag: 'Интерком · запись', title: 'Голос дирижёра слышен трижды в темноте'","type: 'audio', tag: 'Интерком · экспорт', title: 'Голос дирижёра слышен трижды в темноте'",'stage 1 audio label');
  data=replaceRequired(
    data,
    "facts: ['голос звучит во время открытия архива', 'источник записи: PB-2', 'PB-2 ещё не означает живой микрофон']",
    "facts: ['три фразы попали в общую шину во время blackout', 'источник в экспорте: PB-2', 'расшифровки PB-2 в этом пакете нет']",
    'stage 1 audio fact summary',
  );
  data=replaceRequired(data,"title: 'PB — это Playback Bus, а не микрофон'","title: 'Схема маршрутизации MIC-C / PB-1 / PB-2'",'stage 2 routing title');
  data=replaceRequired(data,"title: 'Три фразы — не живой эфир'","title: 'PB-2: технический экспорт трёх фраз'",'stage 2 audio title');
  fs.writeFileSync(dataFile,data);

  let fairplay=fs.readFileSync(fairplayFile,'utf8');
  fairplay=replaceRequired(
    fairplay,
    "data.brief.mission='Установите, что произошло с реквизитом, кто оказался у архива в критическое окно, как соотносятся звук, маршруты и доступ, и где в итоге оказался оригинал партитуры.';",
    `data.brief.mission='${SAFE_MISSION}';`,
    'fair-play briefing mission',
  );
  fairplay=replaceRequired(
    fairplay,
    "data.stages[0].objective='Сведите по секундам удар, сценическое затемнение, дверь архива и источники связи. Для каждого источника отделяйте прямое наблюдение от вывода о местонахождении человека.';",
    `data.stages[0].objective='${SAFE_STAGE1_OBJECTIVE}';`,
    'fair-play stage 1 objective',
  );
  fs.writeFileSync(fairplayFile,fairplay);

  let investigator=fs.readFileSync(investigatorFile,'utf8');
  investigator=replaceRequired(
    investigator,
    "audio.title='TAKE-6: физически вооружённый макрос, привязанный к Q-17B';",
    "audio.title='PB-2 / TAKE-6: журнал маршрутизации и cue-событий';",
    'investigator stage 2 audio title',
  );
  fs.writeFileSync(investigatorFile,investigator);

  let game=fs.readFileSync(gameFile,'utf8');
  game=replaceRequired(
    game,
    'Генеральная репетиция. Настоящая рана от бутафорского кинжала. Пятьдесят две секунды темноты. И партитура 1908 года, исчезнувшая из закрытого архива, пока все слышали голос дирижёра в оркестровой яме.',
    SAFE_GAME_COVER,
    'post-purchase game cover',
  );
  fs.writeFileSync(gameFile,game);

  let storefront=fs.readFileSync(storefrontFile,'utf8');
  storefront=replaceRequired(storefront,"const version = '1.3.0';",`const version = '${VERSION}';`,'dynamic runtime cache version');
  fs.writeFileSync(storefrontFile,storefront);
}

const specialPage=()=>`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#07080a">
  <meta name="robots" content="noindex,follow">
  <meta name="description" content="Последняя ария — большое асимметричное детективное расследование для двух игроков: травма на сцене, противоречивые алиби и кража партитуры.">
  <link rel="canonical" href="https://mysterylogic.com/${CASE_ROUTE}/">
  <link rel="icon" href="../../assets/ml-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../assets/mysterylogic.css">
  <link rel="stylesheet" href="../../assets/premium.css?v=1.1.0">
  <link rel="stylesheet" href="../../assets/case-aria.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-aria-materials-v2.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-aria-layout-v2.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-aria-storefront.css?v=${VERSION}">
  <meta property="og:title" content="Онлайн-расследование «Последняя ария» — детективная игра">
  <meta property="og:description" content="Премиальное дело для двух игроков. Разные роли, 18 материалов и расследование на 55–75 минут.">
  <meta property="og:type" content="website">
  <title>Онлайн-расследование «Последняя ария» — детективная игра</title>
</head>
<body class="casearia-body">
  <header class="ml-header ml-shell">
    <a class="ml-brand" href="../../"><span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Case file ML-AR17</small></span></a>
    <nav class="ml-nav"><a href="../">Игры для двоих</a><a href="../../dela/">Другие дела</a></nav>
  </header>
  <main class="casearia-shell" data-casearia-app>
    <section class="casearia-paywall-status"><span class="casearia-paywall-spinner"></span><strong>Загружаем дело…</strong></section>
  </main>
  <script src="../../assets/case-aria-paid-auth.js?v=${VERSION}"></script>
  <script src="../../assets/case-aria-storefront.js?v=${VERSION}"></script>
</body>
</html>`;

const catalogCard=`
<section class="casearia-catalog" aria-labelledby="casearia-title">
  <div class="casearia-catalog-grid">
    <div class="casearia-catalog-copy">
      <p class="ml-kicker">Премиальное дело · совершенно другой жанр</p>
      <h2 id="casearia-title">Последняя ария</h2>
      <p class="casearia-catalog-lead">Во время генеральной репетиции бутафорский кинжал ранит тенора по-настоящему. Сценический blackout длится 52 секунды. Когда рабочий свет возвращается, из закрытого нотного архива исчезает оригинальная партитура 1908 года.</p>
      <div class="casearia-catalog-question">52 секунды темноты. Раненый артист. Исчезнувшая партитура. Восстановите события по секундам и решите, кому из участников можно верить.</div>
      <div class="casearia-catalog-facts"><span>2 игрока</span><span>разные роли</span><span>55–75 минут</span><span>18 материалов</span><span>299 ₽ за дело</span><span>второй игрок бесплатно</span></div>
      <a class="coop-primary" href="poslednyaya-ariya/">Купить дело — 299 ₽</a>
    </div>
    <div class="casearia-catalog-visual" aria-hidden="true"><div class="casearia-catalog-score"><small>ORIGINAL SCORE · 1908</small><strong>OPUS XVII</strong><span>21:49</span></div><span class="casearia-catalog-seal">CASE FILE · ML-AR17</span></div>
  </div>
</section>`;

function patchLanding(siteRoot){
  const file=path.join(siteRoot,LANDING);
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('case-aria.css')) html=html.replace('</head>',`<link rel="stylesheet" href="../assets/case-aria.css?v=${VERSION}">\n</head>`);
  if(html.includes('casearia-catalog')) html=html.replace(/<section class="casearia-catalog"[\s\S]*?<\/section>/,catalogCard.trim());
  else if(html.includes('<section class="coop-how"')) html=html.replace(/(\s*<section class="coop-how"[^>]*>)/,`\n${catalogCard}\n$1`);
  else throw new Error('Last Aria landing insertion point missing');
  for(const marker of ['casearia-catalog','href="poslednyaya-ariya/"','Последняя ария','299 ₽','case-aria.css','52 секунды темноты. Раненый артист. Исчезнувшая партитура.']) if(!html.includes(marker)) throw new Error(`Last Aria landing missing ${marker}`);
  fs.writeFileSync(file,html);
}

function validateSpoilerBoundary(siteRoot){
  const landing=fs.readFileSync(path.join(siteRoot,LANDING),'utf8');
  const data=fs.readFileSync(path.join(siteRoot,'assets/case-aria-data.js'),'utf8');
  const fairplay=fs.readFileSync(path.join(siteRoot,'assets/case-aria-fairplay-v2.js'),'utf8');
  const investigator=fs.readFileSync(path.join(siteRoot,'assets',INVESTIGATOR_RUNTIME),'utf8');
  const game=fs.readFileSync(path.join(siteRoot,'assets/case-aria.js'),'utf8');
  const storefront=fs.readFileSync(path.join(siteRoot,'assets/case-aria-storefront.js'),'utf8');

  for(const forbidden of ['весь театр слышал его голос','Как человек мог открыть архив','голос из оркестровой ямы']) if(landing.includes(forbidden)) throw new Error(`Last Aria public teaser spoiler leaked: ${forbidden}`);
  for(const forbidden of ['почему голос человека, которого все слышали','Не считайте голос в интеркоме','Отделите ложные алиби от физического присутствия','техническое происхождение голоса','PB-2 ещё не означает живой микрофон']) if(data.includes(forbidden)) throw new Error(`Last Aria runtime directive spoiler leaked: ${forbidden}`);
  for(const forbidden of ['как соотносятся звук, маршруты и доступ','отделяйте прямое наблюдение от вывода о местонахождении человека']) if(fairplay.includes(forbidden)) throw new Error(`Last Aria fair-play directive spoiler leaked: ${forbidden}`);
  if(investigator.includes("audio.title='TAKE-6: физически вооружённый макрос, привязанный к Q-17B';")) throw new Error('Last Aria stage 2 title reveals playback mechanism before reading evidence');
  for(const forbidden of ['пока все слышали голос дирижёра','голос дирижёра в оркестровой яме']) if(game.includes(forbidden)) throw new Error(`Last Aria post-purchase cover spoiler leaked: ${forbidden}`);
  for(const marker of [SAFE_MISSION,SAFE_STAGE1_OBJECTIVE,SAFE_STAGE2_OBJECTIVE,SAFE_GAME_COVER,"tag: 'Интерком · экспорт'","title: 'Схема маршрутизации MIC-C / PB-1 / PB-2'","audio.title='PB-2 / TAKE-6: журнал маршрутизации и cue-событий';",`const version = '${VERSION}';`]) if(!`${data}\n${fairplay}\n${investigator}\n${game}\n${storefront}`.includes(marker)) throw new Error(`Last Aria spoiler-safe runtime marker missing: ${marker}`);

  const prePurchase=`${catalogCard}\n${specialPage()}`.toLowerCase();
  for(const forbidden of ['голос','интерком','pb-2','mic-c','take-6','playback']) if(prePurchase.includes(forbidden)) throw new Error(`Last Aria pre-purchase copy reveals solution channel: ${forbidden}`);
}

export function applyTwoPlayerLastAria(siteRoot){
  hardenRuntimeCopy(siteRoot);
  const caseDir=path.join(siteRoot,CASE_ROUTE);
  ensureDir(caseDir);
  fs.writeFileSync(path.join(caseDir,'index.html'),specialPage());
  patchLanding(siteRoot);
  validateSpoilerBoundary(siteRoot);
  return {route:CASE_ROUTE,title:'Последняя ария',indexed:false,materials:18,priceRub:299,productId:'last_aria',creatorPays:true,guestPays:false,version:VERSION,spoilerAuditRevision:SPOILER_AUDIT_REVISION,materializedEvidence:true,compactMobileHeader:true,investigatorProofGate:true,investigatorRevision:'1.6',investigatorRuntime:INVESTIGATOR_RUNTIME};
}