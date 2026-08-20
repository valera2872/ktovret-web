import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, escapeHtml, estimate } from './common.mjs';

const PAGE_ROUTE = 'detektivnye-igry-dlya-dvoih';
const VERSION = '1.0.0';
const TITLE = 'Детективная игра для двоих онлайн';
const META = 'Детективная игра для двоих онлайн: создайте комнату, пройдите одно дело на двух устройствах и сравните результаты. Бесплатно и без регистрации.';

const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
const prefixFor = (route) => '../'.repeat(String(route || '').split('/').filter(Boolean).length);

const canonicalFrom = (html) => html.match(/<link rel="canonical" href="([^"]+)">/i)?.[1]
  || 'https://mysterylogic.com/detektivnye-igry-dlya-dvoih/';

const caseData = (item) => ({
  id: String(item.id || ''),
  title: String(item.title || ''),
  path: `/${String(item.path || '').replace(/^\/+/, '')}`,
  difficulty: String(item.difficulty || 'Среднее'),
  minutes: estimate(item.difficulty),
});

const caseLinks = (freeCases) => freeCases.slice(0, 6).map((item) => `
  <a class="seo-case-card" href="../${escapeHtml(String(item.path || '').replace(/^\/+/, ''))}">
    <strong>${escapeHtml(item.title)}</strong>
    <span>Дело № ${escapeHtml(item.number)} · ${escapeHtml(item.difficulty || 'Среднее')} · ≈ ${estimate(item.difficulty)} минут</span>
  </a>
`).join('');

const pageHtml = (canonical, freeCases) => `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#07111d">
  <meta name="description" content="${escapeHtml(META)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="../assets/ml-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../assets/mysterylogic.css">
  <link rel="stylesheet" href="../assets/premium.css?v=1.1.0">
  <link rel="stylesheet" href="../assets/duel-room.css?v=${VERSION}">
  <meta property="og:title" content="${escapeHtml(TITLE)}">
  <meta property="og:description" content="${escapeHtml(META)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <title>${escapeHtml(TITLE)}</title>
</head>
<body>
  <header class="ml-header ml-shell">
    <a class="ml-brand" href="../">
      <span class="ml-brand-mark">ML</span>
      <span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Detective logic games</small></span>
    </a>
    <nav class="ml-nav">
      <a href="../detektivnye-igry-onlayn/">Играть онлайн</a>
      <a href="../dela/">Бесплатные дела</a>
      <a href="../tom-1/">Первый том</a>
    </nav>
  </header>

  <main class="ml-shell duel-page">
    <section class="duel-hero">
      <div class="duel-hero-grid">
        <div>
          <p class="duel-kicker">Mystery Logic · игра на двух устройствах</p>
          <h1>${escapeHtml(TITLE)}</h1>
          <p class="duel-lead"><strong>Два игрока. Одно расследование.</strong> Каждый строит свою версию — время, попытки и подсказки другого игрока скрыты до финала.</p>
          <div class="duel-trust" aria-label="Особенности режима">
            <span>Бесплатно</span><span>Без регистрации</span><span>В браузере</span><span>10–15 минут</span>
          </div>
        </div>
        <aside class="duel-demo" aria-label="Как выглядит комната">
          <div class="duel-demo-head"><span>Комната расследования</span><span class="duel-demo-code">7K4P9D2X</span></div>
          <div class="duel-demo-player"><span class="duel-demo-avatar">1</span><span><strong>Первый следователь</strong><small>готов к расследованию</small></span></div>
          <div class="duel-demo-player"><span class="duel-demo-avatar">2</span><span><strong>Второй следователь</strong><small>подключается по ссылке</small></span></div>
          <div class="duel-demo-lock">Результаты соперника откроются только после завершения обоих.</div>
        </aside>
      </div>
    </section>

    <section class="duel-app-shell" aria-label="Начать детективную игру для двоих">
      <div class="duel-app" data-duel-room-app>
        <noscript><div class="duel-error">Для создания комнаты включите JavaScript. Обычные бесплатные дела доступны в каталоге.</div></noscript>
      </div>
      <aside class="duel-side">
        <h2>Как это работает</h2>
        <ol>
          <li>Один игрок выбирает бесплатное дело и создаёт комнату.</li>
          <li>Он отправляет второму игроку ссылку или восьмизначный код.</li>
          <li>Оба открывают одинаковое расследование на своих устройствах.</li>
          <li>После завершения обоих сравниваются время, попытки и подсказки.</li>
        </ol>
      </aside>
    </section>

    <section class="seo-case-links duel-case-links" aria-label="Примеры бесплатных дел">${caseLinks(freeCases)}</section>

    <div class="duel-seo">
      <section class="seo-content-section">
        <h2>Как играть вдвоём онлайн</h2>
        <p>Создайте комнату, выберите одно из бесплатных дел и отправьте ссылку второму игроку. После его подключения оба начинают одно расследование на разных телефонах или компьютерах. Материалы дела одинаковые, а игровой прогресс у каждого свой.</p>
      </section>
      <section class="seo-content-section">
        <h2>Ответы друг друга скрыты до финала</h2>
        <p>Каждый игрок самостоятельно проверяет свою версию. Пока второй следователь не завершил дело, его время, количество попыток и использованные подсказки не показываются. Когда оба закончили, появляется итоговое сравнение.</p>
      </section>
      <section class="seo-content-section">
        <h2>Без установки и регистрации</h2>
        <p>Комната работает прямо в браузере. Не нужен общий экран, аккаунт или установка приложения: достаточно двух устройств и ссылки. Созданная комната действует семь дней, поэтому начать можно сразу или вернуться к делу позже.</p>
      </section>
    </div>

    <section class="ml-copy-section">
      <div><p class="ml-kicker">Продолжить</p><h2>Хотите больше расследований?</h2></div>
      <div class="ml-copy"><p>В «Кто врёт?» первые 15 дел доступны бесплатно. Первый том содержит 100 расследований: ещё 85 открываются одной покупкой без подписки.</p><p><a href="../tom-1/">Посмотреть Первый том</a> · <a href="../dela/">Открыть все бесплатные дела</a></p></div>
    </section>
  </main>

  <script type="application/json" data-duel-room-cases>${json(freeCases.map(caseData))}</script>
  <script src="../assets/duel-room.js?v=${VERSION}"></script>
</body>
</html>`;

const patchPlayableCase = (siteRoot, item) => {
  const route = String(item.path || '').replace(/^\/+/, '');
  const file = path.join(siteRoot, route, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Two-player mode: missing free case page ${route}`);
  const prefix = prefixFor(route);
  let html = fs.readFileSync(file, 'utf8');

  if (!html.includes('data-duel-storage-isolation')) {
    const isolation = `<script data-duel-storage-isolation>(()=>{const code=new URL(location.href).searchParams.get('duel')?.trim().toUpperCase()||'';if(/^[A-HJ-NP-Z2-9]{8}$/.test(code)&&window.KtoVretWeb?.storageKey){window.KtoVretWeb.storageKey=window.KtoVretWeb.storageKey+':duel:'+code;}})();</script>`;
    const appScript = /<script src="[^"]*ktovret-game\/assets\/app\.js[^"]*"><\/script>/;
    if (!appScript.test(html)) throw new Error(`Two-player mode: app.js not found in ${route}`);
    html = html.replace(appScript, (match) => `${isolation}${match}`);
  }

  if (!html.includes('duel-room-client.js')) {
    const duelScript = `<script src="${prefix}ktovret-game/assets/duel-room-client.js?v=${VERSION}"></script>`;
    const adapterScript = /<script src="[^"]*assets\/case-adapter\.js[^"]*"><\/script>/;
    if (!adapterScript.test(html)) throw new Error(`Two-player mode: case-adapter.js not found in ${route}`);
    html = html.replace(adapterScript, (match) => `${match}${duelScript}`);
  }

  fs.writeFileSync(file, html);
};

export function applyTwoPlayerRoom(siteRoot, cases) {
  const file = path.join(siteRoot, PAGE_ROUTE, 'index.html');
  if (!fs.existsSync(file)) throw new Error('Two-player mode: SEO hub is missing');
  const current = fs.readFileSync(file, 'utf8');
  const canonical = canonicalFrom(current);
  const freeCases = cases.filter((item) => item.access === 'free');
  if (freeCases.length !== 15) throw new Error(`Two-player mode expected 15 free cases, got ${freeCases.length}`);

  ensureDir(path.dirname(file));
  fs.writeFileSync(file, pageHtml(canonical, freeCases));
  freeCases.forEach((item) => patchPlayableCase(siteRoot, item));

  return {
    page: PAGE_ROUTE,
    freeCases: freeCases.length,
    title: TITLE,
    metaLength: META.length,
  };
}
