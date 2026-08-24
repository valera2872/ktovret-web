import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './common.mjs';

const VERSION='1.4.0';
const SPOILER_AUDIT_REVISION='1.3';
const LANDING='detektivnye-igry-dlya-dvoih/index.html';
const CASE_ROUTE='detektivnye-igry-dlya-dvoih/poslednyaya-ariya';
const INVESTIGATOR_RUNTIME='case-aria-investigator-v16.js';

const SAFE_MISSION='Установите, кто подготовил саботаж, кто воспользовался критическим окном у архива и где оказался оригинал партитуры. Восстановите события по независимым материалам и не принимайте заявления участников за установленный факт.';
const SAFE_STAGE1_OBJECTIVE='Сведите по секундам удар, сценическое затемнение, служебные маршруты и события у архива. Отмечайте только то, что подтверждается материалами вашего пакета.';
const SAFE_STAGE2_OBJECTIVE='Сопоставьте физические следы, журналы доступа и технические данные с показаниями участников. Ищите совпадения, которые подтверждаются независимым материалом напарника.';
const SAFE_STAGE3_OBJECTIVE='Теперь свяжите подготовку травмы, события критического окна у архива и дальнейший путь партитуры. Мотив и причастность должны подтверждаться независимыми материалами.';
const SAFE_GAME_COVER='Генеральная репетиция. Настоящая рана от бутафорского кинжала. Пятьдесят две секунды темноты. И партитура 1908 года, исчезнувшая из закрытого архива. У каждого участника есть своя версия этих событий.';
const SAFE_FINAL_LEAD='Ответьте на четыре вопроса и выберите не просто подозрительные, а доказательные материалы. Нужны независимые цепочки по хронологии, источникам сообщений, личности у архива, доступу и физической связи с оригиналом.';
const SAFE_FINAL_WRONG='Версия пока не выдерживает все временные и физические ограничения. Перепроверьте хронологию и то, какие материалы действительно устанавливают местонахождение участников.';
const SAFE_FINAL_PROOF='Ответ выглядит верно, но доказательная конструкция неполна. Нужны независимые материалы по хронологии, источникам сообщений, личности у архива, доступу и физической связи с оригиналом.';
const SAFE_DECISION_LEAD='После обмена фактами выберите линию, которая лучше всего связывает физические следы, временные окна и технические данные.';
const SAFE_DECISION_CONDUCTOR='Его показания, технические данные и след из архива требуют независимой сверки.';
const SAFE_DECISION_FEEDBACK='Эта линия связывает два независимых противоречия: технические данные о сообщениях и физический след между оркестровой ямой и архивом.';

const SAFE_EVIDENCE={
  checkout:'B-3 + BR-06 + P-771: мастерская, пломба и путь PR-17 до сцены',
  playback:'PB-2 + TAKE-6 + C-2 + Q-17B: трассировка трёх фраз и cue-событий',
  footprint:'HEEL-43C + CRESCENT-43: ремонт, два дефекта подошвы и свежая краска',
  key:'K-12: заявка на дубликат, журнал возврата и изъятый безымянный ключ',
  tag:'RFI-1 + MS-1908 + T-6M: контрольные RFID-сканы изолированного контейнера',
};

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
  data=replaceRequired(
    data,
    "objective: 'Теперь нужно связать подготовку травмы, ложное присутствие в яме и саму партитуру. Мотив должен подтверждаться до финального раскрытия.'",
    `objective: '${SAFE_STAGE3_OBJECTIVE}'`,
    'raw stage 3 objective',
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
  data=replaceRequired(data,"title: 'Почему голос Михаила не является алиби?'","title: 'Что следует из материалов о голосе Михаила?'",'final voice question');
  data=replaceRequired(data,"lead: 'После обмена фактами выберите линию, которая способна одновременно проверить личность в архиве и ложное алиби.'",`lead: '${SAFE_DECISION_LEAD}'`,'stage 2 decision lead');
  data=replaceRequired(data,"{ id: 'conductor', title: 'Дирижёр', text: 'Его голос слышали, но источник PB-2 и след из архива требуют независимой проверки.' }",`{ id: 'conductor', title: 'Дирижёр', text: '${SAFE_DECISION_CONDUCTOR}' }`,'stage 2 conductor option');
  data=replaceRequired(data,"conductor: 'Эта линия объединяет два независимых противоречия: голос оказывается записью, а след обуви ведёт от оркестровой ямы к архиву.'",`conductor: '${SAFE_DECISION_FEEDBACK}'`,'stage 2 conductor feedback');
  data=replaceRequired(data,"{ id: 'checkout', group: 'sabotage', label: '18:36–18:45: PR-17 находился у Михаила' }",`{ id: 'checkout', group: 'sabotage', label: '${SAFE_EVIDENCE.checkout}' }`,'raw checkout evidence label');
  data=replaceRequired(data,"{ id: 'playback', group: 'alibi', label: 'PB-2 + TAKE-6: голос дирижёра был заранее записан' }",`{ id: 'playback', group: 'alibi', label: '${SAFE_EVIDENCE.playback}' }`,'raw playback evidence label');
  data=replaceRequired(data,"{ id: 'footprint', group: 'identity', label: 'HEEL-43C: след из архива совпадает с обувью Михаила' }",`{ id: 'footprint', group: 'identity', label: '${SAFE_EVIDENCE.footprint}' }`,'raw footprint evidence label');
  data=replaceRequired(data,"{ id: 'key', group: 'access', label: 'K-12: Михаил заранее заказал невозвращённый дубликат' }",`{ id: 'key', group: 'access', label: '${SAFE_EVIDENCE.key}' }`,'raw key evidence label');
  data=replaceRequired(data,"{ id: 'tag', group: 'possession', label: 'MS-1908 + T-6M: оригинал находится в личном кофре Михаила' }",`{ id: 'tag', group: 'possession', label: '${SAFE_EVIDENCE.tag}' }`,'raw tag evidence label');
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
  investigator=replaceRequired(investigator,"if(checkout){ checkout.group='culprit-sabotage'; checkout.label='B-3 + P-771: Михаил разобрал PR-17 у BR-06, после чего кинжал опломбировали до сцены'; }",`if(checkout){ checkout.group='culprit-sabotage'; checkout.label='${SAFE_EVIDENCE.checkout}'; }`,'investigator checkout evidence label');
  investigator=replaceRequired(investigator,"if(playback) playback.label='PB-2 + TAKE-6 + C-2: физический LOCAL-ARM, затем cue-trigger Q-17B';",`if(playback) playback.label='${SAFE_EVIDENCE.playback}';`,'investigator playback evidence label');
  investigator=replaceRequired(investigator,"if(footprint) footprint.label='HEEL-43C: индивидуальный след и краска совпадают с туфлей, изъятой у Михаила';",`if(footprint) footprint.label='${SAFE_EVIDENCE.footprint}';`,'investigator footprint evidence label');
  investigator=replaceRequired(investigator,"if(key) key.label='K-12: Михаил заказал дубликат; безымянный ключ того же профиля изъят при нём';",`if(key) key.label='${SAFE_EVIDENCE.key}';`,'investigator key evidence label');
  investigator=replaceRequired(investigator,"if(tag) tag.label='RFI-1 + MS-1908 + T-6M: оригинал отвечает из изолированного личного кофра Михаила';",`if(tag) tag.label='${SAFE_EVIDENCE.tag}';`,'investigator tag evidence label');
  fs.writeFileSync(investigatorFile,investigator);

  let game=fs.readFileSync(gameFile,'utf8');
  game=replaceRequired(
    game,
    'Генеральная репетиция. Настоящая рана от бутафорского кинжала. Пятьдесят две секунды темноты. И партитура 1908 года, исчезнувшая из закрытого архива, пока все слышали голос дирижёра в оркестровой яме.',
    SAFE_GAME_COVER,
    'post-purchase game cover',
  );
  game=replaceRequired(
    game,
    'Ответьте на четыре вопроса и выберите не просто подозрительные, а доказательные материалы. Нужны независимые цепочки: саботаж, ложное алиби, личность в архиве, доступ и физическая связь с оригиналом.',
    SAFE_FINAL_LEAD,
    'final synthesis lead',
  );
  game=replaceRequired(
    game,
    'Версия пока не выдерживает все временные и физические ограничения. Проверьте алиби, которое существует только как звук.',
    SAFE_FINAL_WRONG,
    'final wrong-answer feedback',
  );
  game=replaceRequired(
    game,
    'Ответ выглядит верно, но доказательная конструкция неполна. Нужны независимые материалы о саботаже, ложном алиби, личности в архиве, доступе и физической связи с оригиналом.',
    SAFE_FINAL_PROOF,
    'final incomplete-proof feedback',
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
  for(const forbidden of ['почему голос человека, которого все слышали','Не считайте голос в интеркоме','Отделите ложные алиби от физического присутствия','техническое происхождение голоса','ложное присутствие в яме','PB-2 ещё не означает живой микрофон','Почему голос Михаила не является алиби?','способна одновременно проверить личность в архиве и ложное алиби','Его голос слышали, но источник PB-2','голос оказывается записью']) if(data.includes(forbidden)) throw new Error(`Last Aria runtime directive spoiler leaked: ${forbidden}`);
  for(const forbidden of ['18:36–18:45: PR-17 находился у Михаила','голос дирижёра был заранее записан','след из архива совпадает с обувью Михаила','Михаил заранее заказал невозвращённый дубликат','оригинал находится в личном кофре Михаила']) if(data.includes(forbidden)) throw new Error(`Last Aria raw final-board answer leak: ${forbidden}`);
  for(const forbidden of ['как соотносятся звук, маршруты и доступ','отделяйте прямое наблюдение от вывода о местонахождении человека']) if(fairplay.includes(forbidden)) throw new Error(`Last Aria fair-play directive spoiler leaked: ${forbidden}`);
  for(const forbidden of ["audio.title='TAKE-6: физически вооружённый макрос, привязанный к Q-17B';","checkout.label='B-3 + P-771: Михаил разобрал PR-17","совпадают с туфлей, изъятой у Михаила","Михаил заказал дубликат; безымянный ключ","личного кофра Михаила';"]) if(investigator.includes(forbidden)) throw new Error(`Last Aria final-board answer leak: ${forbidden}`);
  for(const forbidden of ['пока все слышали голос дирижёра','голос дирижёра в оркестровой яме','Нужны независимые цепочки: саботаж, ложное алиби','Проверьте алиби, которое существует только как звук','Нужны независимые материалы о саботаже, ложном алиби']) if(game.includes(forbidden)) throw new Error(`Last Aria game-shell spoiler leaked: ${forbidden}`);
  for(const marker of [SAFE_MISSION,SAFE_STAGE1_OBJECTIVE,SAFE_STAGE2_OBJECTIVE,SAFE_STAGE3_OBJECTIVE,SAFE_GAME_COVER,SAFE_FINAL_LEAD,SAFE_FINAL_WRONG,SAFE_FINAL_PROOF,SAFE_DECISION_LEAD,SAFE_DECISION_CONDUCTOR,SAFE_DECISION_FEEDBACK,...Object.values(SAFE_EVIDENCE),"tag: 'Интерком · экспорт'","title: 'Схема маршрутизации MIC-C / PB-1 / PB-2'","title: 'Что следует из материалов о голосе Михаила?'","audio.title='PB-2 / TAKE-6: журнал маршрутизации и cue-событий';",`const version = '${VERSION}';`]) if(!`${data}\n${fairplay}\n${investigator}\n${game}\n${storefront}`.includes(marker)) throw new Error(`Last Aria spoiler-safe runtime marker missing: ${marker}`);

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