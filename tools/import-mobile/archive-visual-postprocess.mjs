import fs from 'node:fs';
import path from 'node:path';

const VERSION='2.0.0';
const STYLE=`storefront-v2.css?v=${VERSION}`;

const addStyle=(html,href)=>html.includes(STYLE)?html:html.replace('</head>',`  <link rel="stylesheet" href="${href}">\n</head>`);
const setBodyClass=(html,className)=>html.replace(/<body(?: class="[^"]*")?>/,`<body class="sf-v2 ${className}">`);
const replaceMain=(html,main)=>html.replace(/<main[^>]*>[\s\S]*?<\/main>/,main);
const grab=(html,re)=>html.match(re)?.[1]||'';

const homeMain=`<main class="ml-shell sf-home-main">
  <section class="sf-home-hero">
    <div class="sf-home-copy">
      <p class="ml-kicker">Mystery Logic · архив расследований</p>
      <h1>Детективные<br>игры онлайн</h1>
      <p class="sf-lead">Интуиция приводит к версии. Логика превращает её в доказательство. Исследуйте улики, сверяйте показания и доказывайте каждую версию по фактам.</p>
      <div class="sf-home-actions"><a class="ml-button ml-button-primary" href="./delo/chetyre-vhoda-v-arhiv/">Начать расследование</a><a class="ml-button ml-button-secondary" href="./dela/">Открыть 15 бесплатных дел</a></div>
      <div class="sf-home-proof"><span><strong>15 дел бесплатно</strong><small>без регистрации</small></span><span><strong>100 дел в архиве</strong><small>Первый том</small></span><span><strong>5–10 минут</strong><small>короткое дело</small></span></div>
    </div>
    <aside class="sf-stage" aria-label="Архив расследований Mystery Logic">
      <div class="sf-archive-box"><span class="sf-archive-label">MYSTERY LOGIC<strong>CASE ARCHIVE</strong></span><div class="sf-folder-row" aria-hidden="true"><i>001</i><i>015</i><i>037</i><i>066</i><i>100</i></div></div>
      <div class="sf-case-paper"><small>CASE ML-2317</small><strong>Последний звонок в 23:17</strong><p>Два игрока. Разные материалы. Одна версия событий.</p><span>OPEN CASE</span></div>
      <div class="sf-photo-card" aria-hidden="true"><span>CAM C17</span><b>23:17:41</b></div>
    </aside>
  </section>

  <section class="sf-format-section" id="games">
    <div class="sf-section-head"><div><p class="ml-kicker">Выберите формат</p><h2>Три способа войти в расследование</h2></div><p>От короткой логической задачи до полноценного совместного дела на вечер.</p></div>
    <div class="sf-format-grid">
      <a class="sf-format is-main" href="./detektivnye-igry-dlya-dvoih/"><small>Для двоих · 45–60 минут</small><h3>Последний звонок в 23:17</h3><p>Следователь и Аналитик получают разные улики и могут восстановить картину только вместе.</p><div class="sf-format-art sf-art-2317" aria-hidden="true"></div><span class="sf-link">Играть вдвоём →</span></a>
      <a class="sf-format" href="./kto-vret/"><small>Короткие дела · 5–10 минут</small><h3>Кто врёт?</h3><p>Сто расследований с показаниями, таймлайнами и одним доказуемым ответом.</p><div class="sf-format-art sf-art-kv" aria-hidden="true"></div><span class="sf-link">Открыть серию →</span></a>
      <a class="sf-format" href="./tom-1/"><small>Полный архив · 100 дел</small><h3>Первый том</h3><p>15 дел доступны бесплатно. Ещё 85 открываются одной покупкой без подписки.</p><div class="sf-format-art sf-art-volume" aria-hidden="true"></div><span class="sf-link">Посмотреть том →</span></a>
    </div>
  </section>

  <section class="sf-materials">
    <div class="sf-section-head"><div><p class="ml-kicker">Материалы дела</p><h2>Не декорации. Улики.</h2></div><p>Каждый формат использует собственный язык доказательств: документы, камеры, переписки и временные метки.</p></div>
    <div class="sf-material-grid">
      <article class="sf-material"><small>АУДИО / 112</small><strong>Записи звонков</strong><div class="sf-wave" aria-hidden="true"></div><span>00:46 · линия прервана</span></article>
      <article class="sf-material"><small>CAM C17</small><strong>Камеры</strong><div class="sf-cctv" aria-hidden="true"></div><span>23:17:41 · внешний контур</span></article>
      <article class="sf-material"><small>MESSAGES</small><strong>Переписки</strong><div class="sf-chat"><i>Ты где?</i><i>Буду через 10 минут</i></div><span>время · контекст · противоречия</span></article>
      <article class="sf-material"><small>CASE FILE</small><strong>Протоколы</strong><div class="sf-document" aria-hidden="true"></div><span>факты · показания · отметки</span></article>
    </div>
  </section>

  <section class="sf-manifesto" id="method"><div class="sf-manifesto-main"><p class="ml-kicker">Принцип Mystery Logic</p><h2>Честная детективная задача уважает игрока.</h2><p><strong>Все необходимые сведения есть в материалах дела.</strong> Ключевая улика не возникает из воздуха, а решение не зависит от случайной догадки. Определить правильную последовательность событий можно только сопоставив факты.</p></div><aside class="sf-manifesto-side"><strong>Один доказуемый ответ</strong><small>Первый том · 100 расследований</small></aside></section>
</main>`;

const catalogMain=(caseGrid,tools,archives)=>`<main class="ml-shell sf-catalog-main">
  <section class="sf-catalog-hero"><div class="sf-catalog-copy"><p class="ml-kicker">Открытый архив</p><h1>100 детективных дел</h1><p>Пятнадцать расследований открыты бесплатно. Остальные собраны в Первый том и доступны одной покупкой — без подписки и регулярных списаний.</p><div class="sf-home-actions"><a class="ml-button ml-button-primary" href="../delo/chetyre-vhoda-v-arhiv/">Начать бесплатно</a><a class="ml-button ml-button-secondary" href="../tom-1/">Открыть Первый том</a></div></div><aside class="sf-catalog-art" aria-label="Архив дел Mystery Logic"><div class="sf-catalog-box"></div><div class="sf-catalog-tabs" aria-hidden="true"><i>001</i><i>015</i><i>037</i><i>066</i><i>100</i></div><div class="sf-catalog-paper"><small>OPEN ARCHIVE</small><strong>15 дел бесплатно</strong><span>Полный том · 100 расследований</span></div></aside></section>

  <section class="sf-catalog-command" data-catalog-progress><div class="sf-catalog-command-grid"><div><p class="ml-kicker">Ваш прогресс</p><h2>Продолжайте с того места, где остановились</h2><strong data-catalog-progress-text>0 из 15 бесплатных дел раскрыто</strong><div class="sf-catalog-progress-track"><div class="sf-catalog-progress-fill" data-catalog-progress-fill></div></div><div class="sf-catalog-actions"><a class="ml-button ml-button-primary" data-catalog-continue href="../delo/chetyre-vhoda-v-arhiv/">Следующее нераскрытое дело</a><button class="ml-button ml-button-secondary" data-catalog-random type="button">Случайное дело</button></div></div><aside class="sf-catalog-summary"><div><strong>15</strong><span>бесплатно</span></div><div><strong>85</strong><span>в томе</span></div><div><strong>100</strong><span>всего</span></div></aside></div></section>

  <section class="sf-free-section"><div class="sf-free-head"><div><p class="ml-kicker">15 бесплатных дел</p><h2>Открытый архив</h2></div><p>Каждая карточка — полноценное короткое расследование с материалами, ответом и разбором.</p></div><div class="sf-catalog-tools">${tools}</div><div class="case-grid sf-case-grid">${caseGrid}</div></section>

  <section class="sf-volume-promo"><div><p class="ml-kicker">Первый том</p><h2>Весь архив — одной покупкой</h2><p>Ещё 85 дел объединены в тематические архивы. Доступ открывается навсегда и продолжает тот же прогресс в браузере.</p><div class="catalog-volume-price"><strong>99 ₽</strong><span>разовый платёж</span></div><div class="sf-home-actions"><a class="ml-button ml-button-primary" href="../tom-1/">Посмотреть Первый том</a><a class="ml-button ml-button-secondary" href="../offer/">Условия покупки</a></div></div><aside class="sf-volume-promo-art" aria-hidden="true"></aside></section>

  <section class="sf-archives"><div class="sf-free-head"><div><p class="ml-kicker">Структура тома</p><h2>Тематические архивы</h2></div><p>После покупки архивы раскрываются прямо здесь: выбирайте направление и переходите к делу.</p></div><div class="volume-archive-list">${archives}</div></section>
</main>`;

const volumeMain=(archives)=>`<main class="ml-shell sf-volume-main">
  <section class="sf-volume-hero" id="buy"><div class="sf-volume-copy"><p class="ml-kicker">Mystery Logic · Первый том</p><h1>100 расследований в одном архиве</h1><p class="sf-lead">Пятнадцать дел уже доступны бесплатно. Остальные 85 открываются одной покупкой — без подписки, рекламы и регулярных списаний.</p><div class="sf-volume-access"><span>15 дел бесплатно</span><span>85 после покупки</span><span>доступ навсегда</span></div><div class="sf-buy-shell"><div class="volume-actions"><button class="ml-button ml-button-primary" type="button" data-volume-buy disabled>Открыть 85 дел за 99 ₽</button><a class="ml-button ml-button-secondary" href="../dela/">Сначала пройти бесплатные</a></div><p class="volume-payment-note" data-volume-payment-note>Оплата будет включена после подключения интернет-эквайринга. Бесплатные дела уже работают без ограничений.</p></div></div><aside class="sf-volume-object" aria-label="Первый том Mystery Logic"><div class="sf-volume-box"></div><div class="sf-volume-folders" aria-hidden="true"><i>001</i><i>015</i><i>037</i><i>066</i><i>100</i></div><div class="sf-volume-sheet"><small>CASE FILE / VOLUME I</small><strong>100 закрытых дел</strong><p>Время, маршруты, показания, камеры и логические ограничения.</p><span>FULL ACCESS · 99 ₽</span></div></aside></section>

  <section class="sf-value-strip"><article><strong>100 дел</strong><span>полный первый том</span></article><article><strong>Без подписки</strong><span>одна покупка</span></article><article><strong>Без рекламы</strong><span>ничего не отвлекает</span></article><article><strong>Навсегда</strong><span>доступ к этому тому</span></article></section>

  <section class="sf-volume-section"><div class="sf-section-head"><div><p class="ml-kicker">Внутри архива</p><h2>Разные типы расследований</h2></div><p>Не сто одинаковых вопросов, а разные способы искать противоречие и строить доказательство.</p></div><div class="sf-preview-grid"><article class="sf-preview-card"><div class="sf-preview-art"></div><h3>Камеры и время</h3><p>Сверяйте таймкоды и проверяйте, мог ли человек оказаться там, где утверждает.</p></article><article class="sf-preview-card"><div class="sf-preview-art"></div><h3>Маршруты и доступ</h3><p>Восстанавливайте последовательности входов, ключей, перемещений и ограничений.</p></article><article class="sf-preview-card"><div class="sf-preview-art"></div><h3>Документы и показания</h3><p>Ищите деталь, которую свидетель не мог знать при заявленной версии событий.</p></article></div></section>

  <section class="sf-volume-section sf-volume-archives"><div class="sf-section-head"><div><p class="ml-kicker">Архивы первого тома</p><h2>Откройте весь том</h2></div><p>После подтверждения оплаты тематические архивы становятся интерактивными и ведут прямо к делам.</p></div><div class="volume-archive-list">${archives}</div></section>

  <section class="sf-volume-section"><div class="sf-manifesto"><div class="sf-manifesto-main"><p class="ml-kicker">Перед покупкой</p><h2>Сначала попробуйте бесплатно.</h2><p>15 дел доступны полностью без оплаты. Если формат подходит — откройте ещё 85 за 99 ₽. Это разовая покупка, не подписка.</p></div><aside class="sf-manifesto-side"><strong>15 + 85 = 100</strong><small>Первый том Mystery Logic</small></aside></div></section>
</main>`;

function patchHome(siteRoot){const file=path.join(siteRoot,'index.html');if(!fs.existsSync(file))return false;let html=fs.readFileSync(file,'utf8');html=setBodyClass(html,'sf-home');html=addStyle(html,`./assets/${STYLE}`);html=replaceMain(html,homeMain);if(!html.includes('sf-stage')||!html.includes('Все необходимые сведения есть в материалах дела')||!html.includes('Определить правильную последовательность'))throw new Error('storefront v2 home failed');fs.writeFileSync(file,html);return true;}
function patchCatalog(siteRoot){const file=path.join(siteRoot,'dela/index.html');if(!fs.existsSync(file))return false;let html=fs.readFileSync(file,'utf8');const caseGrid=grab(html,/<div class="case-grid">([\s\S]*?)<\/div><\/section><section class="catalog-volume-promo">/);const tools=grab(html,/<section class="catalog-tools-advanced"[^>]*>([\s\S]*?)<\/section><div class="case-grid">/);const archives=grab(html,/<div class="volume-archive-list">([\s\S]*?)<\/div><\/div><\/section><section class="ml-copy-section">/);if(!caseGrid||!tools||!archives)throw new Error('storefront v2 catalog source extraction failed');html=setBodyClass(html,'sf-catalog');html=addStyle(html,`../assets/${STYLE}`);html=replaceMain(html,catalogMain(caseGrid,tools,archives));if(!html.includes('data-catalog-progress')||!html.includes('case-search')||!html.includes('class="case-grid sf-case-grid"'))throw new Error('storefront v2 catalog failed');fs.writeFileSync(file,html);return true;}
function patchVolume(siteRoot){const file=path.join(siteRoot,'tom-1/index.html');if(!fs.existsSync(file))return false;let html=fs.readFileSync(file,'utf8');const archives=grab(html,/<div class="volume-archive-list">([\s\S]*?)<\/div><\/section><section class="volume-section volume-free">/);if(!archives)throw new Error('storefront v2 volume archive extraction failed');html=setBodyClass(html,'sf-volume');html=addStyle(html,`../assets/${STYLE}`);html=replaceMain(html,volumeMain(archives));if(!html.includes('data-volume-buy')||!html.includes('Открыть 85 дел за 99 ₽')||!html.includes('sf-volume-box'))throw new Error('storefront v2 volume failed');fs.writeFileSync(file,html);return true;}

export function applyArchiveVisualSystem(siteRoot){const pages=[patchHome(siteRoot),patchCatalog(siteRoot),patchVolume(siteRoot)].filter(Boolean).length;if(pages!==3)throw new Error(`storefront v2 expected 3 pages, patched ${pages}`);return{pages,version:VERSION};}
