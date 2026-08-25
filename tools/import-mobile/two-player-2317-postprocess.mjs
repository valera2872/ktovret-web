import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './common.mjs';

const VERSION = '1.3.0';
const LANDING = 'detektivnye-igry-dlya-dvoih/index.html';
const CASE_ROUTE = 'detektivnye-igry-dlya-dvoih/2317';

const specialPage = () => `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#07111d">
  <meta name="robots" content="noindex,follow">
  <meta name="description" content="Последний звонок в 23:17 — асимметричное детективное расследование Mystery Logic для двух игроков на двух устройствах.">
  <link rel="canonical" href="https://mysterylogic.com/${CASE_ROUTE}/">
  <link rel="icon" href="../../assets/ml-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../assets/mysterylogic.css">
  <link rel="stylesheet" href="../../assets/premium.css?v=1.1.0">
  <link rel="stylesheet" href="../../assets/case-2317.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-2317-v2.css?v=${VERSION}">
  <meta property="og:title" content="Последний звонок в 23:17 — дело для двоих">
  <meta property="og:description" content="Два игрока получают разные улики. Сопоставьте факты и раскройте дело вместе.">
  <meta property="og:type" content="website">
  <title>Последний звонок в 23:17 — дело для двоих</title>
</head>
<body class="case2317-body">
  <header class="ml-header ml-shell case2317-header">
    <a class="ml-brand" href="../../">
      <span class="ml-brand-mark">ML</span>
      <span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Case file ML-2317</small></span>
    </a>
    <nav class="ml-nav"><a href="../">Игра для двоих</a><a href="../../dela/">Другие дела</a></nav>
  </header>

  <main class="case2317-shell" data-case2317-app>
    <section class="case2317-boot">
      <div class="case2317-boot-copy">
        <p class="case2317-eyebrow">Дело ML-2317 · доступ открыт</p>
        <h1>Последний звонок<br><em>в 23:17</em></h1>
        <p>Два игрока. Две роли. Разные материалы. Полную картину можно восстановить только вместе.</p>
      </div>
      <div class="case2317-clock" aria-hidden="true"><span>23</span><i>:</i><span>17</span><small>46 SEC</small></div>
    </section>
  </main>

  <script src="../../assets/case-2317-data.js?v=${VERSION}"></script>
  <script src="../../assets/case-2317-detective-v3.js?v=${VERSION}"></script>
  <script src="../../assets/case-2317-timeline-v31.js?v=${VERSION}"></script>
  <script src="../../assets/case-2317.js?v=${VERSION}"></script>
  <script src="../../assets/case-2317-ux-v3.js?v=${VERSION}"></script>
  <script src="../../assets/case-2317-runtime.js?v=${VERSION}"></script>
  <script src="../../assets/case-2317-release-gate-v1.js?v=${VERSION}"></script>
</body>
</html>`;

const landingHero = `
    <section class="duel-hero coop-hero">
      <div class="coop-hero-grid">
        <div class="coop-hero-copy">
          <p class="duel-kicker">Mystery Logic · расследование на двух устройствах</p>
          <h1>Детективная игра для двоих онлайн</h1>
          <p class="coop-lead"><strong>Не просто решайте одно дело параллельно — расследуйте его вместе.</strong> У каждого игрока свои материалы. Чтобы раскрыть дело, придётся разговаривать, сверять время и соединять улики с двух экранов.</p>
          <div class="duel-trust" aria-label="Особенности совместного дела">
            <span>2 игрока</span><span>2 роли</span><span>45–60 минут</span><span>Бесплатно</span><span>Без регистрации</span>
          </div>
          <div class="coop-hero-actions">
            <a class="coop-primary" href="2317/">Начать расследование «23:17»</a>
            <a class="coop-secondary" href="#short-duel">Короткая дуэль · 10–15 минут</a>
          </div>
        </div>
        <div class="coop-hero-scene" aria-hidden="true">
          <div class="coop-phone">
            <div class="coop-phone-speaker"></div>
            <small>ЭКСТРЕННЫЙ ВЫЗОВ</small>
            <strong>23:17</strong>
            <div class="coop-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <span>00:46 · связь прервана</span>
          </div>
          <div class="coop-file-card coop-file-a"><small>МАТЕРИАЛ 04</small><b>Камера квартала</b><span>23:08:31</span></div>
          <div class="coop-file-card coop-file-b"><small>МАТЕРИАЛ 11</small><b>Контроль доступа</b><span>RB-17</span></div>
          <div class="coop-scene-stamp">CASE<br>2317</div>
        </div>
      </div>
    </section>`;

const feature = `
    <section class="coop-case-feature">
      <div class="coop-case-head">
        <div>
          <p class="ml-kicker">Первое специальное дело для двоих</p>
          <h2>Последний звонок в 23:17</h2>
        </div>
        <div class="coop-case-number">ML<br><strong>2317</strong></div>
      </div>
      <p class="coop-case-setup">В 23:17 Вера Лебедева звонит в экстренную службу. Через 46 секунд связь обрывается. В 00:09 её автомобиль находят пустым. Телефона нет. Сумка и кошелёк остались внутри.</p>
      <div class="coop-case-question">Что случилось между <strong>23:17</strong> и <strong>00:09</strong>?</div>

      <div class="coop-role-grid">
        <article class="coop-role-card">
          <div class="coop-role-mark">СЛ</div>
          <div><small>Игрок 1</small><h3>Следователь</h3><p>Получает протоколы, показания, осмотр автомобиля и материалы с места происшествия.</p></div>
        </article>
        <div class="coop-role-bridge"><span>+</span><small>обсуждайте<br>вслух</small></div>
        <article class="coop-role-card is-analyst">
          <div class="coop-role-mark">АН</div>
          <div><small>Игрок 2</small><h3>Аналитик</h3><p>Получает переписки, сотовые логи, камеры, транзакции и цифровые следы.</p></div>
        </article>
      </div>

      <div class="coop-evidence-strip">
        <div class="coop-evidence-paper"><small>112 · 23:17:08</small><strong>«Он приехал. Я вижу его машину…»</strong><span>аудиореконструкция звонка</span></div>
        <div class="coop-evidence-map"><i></i><i></i><i></i><b>23:44</b><span>цифровой след требует сверки</span></div>
        <div class="coop-evidence-chat"><small>22:41</small><p>Если он появится —<br><b>выход Б.</b> Я рядом.</p><span>переписка</span></div>
      </div>

      <div class="coop-case-footer">
        <div><strong>Ни один игрок не видит всей правды.</strong><span>Для каждого ключевого вывода нужен факт с экрана напарника.</span></div>
        <a class="coop-primary" href="2317/">Открыть дело бесплатно</a>
      </div>
    </section>

    <section class="coop-how">
      <p class="ml-kicker">Как проходит расследование</p>
      <div class="coop-how-grid">
        <article><span>01</span><h3>Создайте комнату</h3><p>Отправьте второму игроку ссылку или восьмисимвольный код.</p></article>
        <article><span>02</span><h3>Получите разные роли</h3><p>Следователь и Аналитик видят разные документы и передают друг другу ключевые маркеры.</p></article>
        <article><span>03</span><h3>Соберите одну версию</h3><p>Принимайте решения, выберите главные доказательства и получите общий ранг пары.</p></article>
      </div>
    </section>

    <section class="coop-duel-intro" id="short-duel">
      <div><p class="ml-kicker">Второй формат</p><h2>Хотите быстрее? Сыграйте дуэль</h2></div>
      <p>Если у вас только 10–15 минут, выберите одно из 15 бесплатных дел «Кто врёт?». Оба получают одинаковое расследование, решают независимо, а результаты открываются только в финале.</p>
    </section>`;

const patchLanding = (siteRoot) => {
  const file = path.join(siteRoot, LANDING);
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('case-2317.css')) {
    html = html.replace('</head>', `  <link rel="stylesheet" href="../assets/case-2317.css?v=${VERSION}">\n</head>`);
  }
  html = html.replace(/\s*<section class="duel-hero">[\s\S]*?<\/section>\s*(?=<section class="duel-app-shell")/, `\n${landingHero}\n${feature}\n`);
  if (!html.includes('coop-case-feature')) throw new Error('23:17 landing patch failed');
  if (html.includes('телефон и автомобиль расходятся')) throw new Error('23:17 public spoiler boundary regressed');
  fs.writeFileSync(file, html);
};

export function applyTwoPlayer2317(siteRoot) {
  const caseDir = path.join(siteRoot, CASE_ROUTE);
  ensureDir(caseDir);
  const page = specialPage();
  if (!page.includes('case-2317-release-gate-v1.js')) throw new Error('23:17 release-gate runtime missing');
  fs.writeFileSync(path.join(caseDir, 'index.html'), page);
  patchLanding(siteRoot);
  return { route: CASE_ROUTE, title: 'Последний звонок в 23:17', indexed: false };
}
