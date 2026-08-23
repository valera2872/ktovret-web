import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './common.mjs';

const VERSION = '1.5.0';
const LANDING = 'detektivnye-igry-dlya-dvoih/index.html';
const CASE_ROUTE = 'detektivnye-igry-dlya-dvoih/407';

const specialPage = () => `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#02090e">
  <meta name="robots" content="noindex,follow">
  <meta name="description" content="Номер 407 — премиальное асимметричное расследование Mystery Logic для двух игроков на двух устройствах.">
  <link rel="canonical" href="https://mysterylogic.com/${CASE_ROUTE}/">
  <link rel="icon" href="../../assets/ml-mark.svg" type="image/svg+xml">
  <link rel="preload" href="../../assets/room-407-evidence.webp" as="image" type="image/webp">
  <link rel="stylesheet" href="../../assets/mysterylogic.css">
  <link rel="stylesheet" href="../../assets/premium.css?v=1.1.0">
  <link rel="stylesheet" href="../../assets/case-2317.css?v=1.1.0">
  <link rel="stylesheet" href="../../assets/case-2317-v2.css?v=1.1.0">
  <link rel="stylesheet" href="../../assets/case-407.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-407-entry-v2.css?v=${VERSION}">
  <link rel="stylesheet" href="../../assets/case-407-evidence-v2.css?v=${VERSION}">
  <meta property="og:title" content="Номер 407 — детективное дело для двоих">
  <meta property="og:description" content="Два игрока получают разные улики. Раскройте исчезновение из запертого гостиничного номера.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://mysterylogic.com/assets/room-407-evidence.webp">
  <title>Номер 407 — премиальное дело для двоих</title>
</head>
<body class="case2317-body case407-body">
  <header class="ml-header ml-shell case2317-header">
    <a class="ml-brand" href="../../">
      <span class="ml-brand-mark">ML</span>
      <span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Case file ML-0407</small></span>
    </a>
    <nav class="ml-nav"><a href="../">Игры для двоих</a><a href="../../dela/">Другие дела</a></nav>
  </header>

  <main class="case2317-shell" data-case407-app>
    <section class="case2317-boot">
      <div class="case2317-boot-copy">
        <p class="case2317-eyebrow">Дело ML-0407 · доступ открыт</p>
        <h1>Номер <em>407</em></h1>
        <p>Два игрока. Две перспективы. Один запертый номер, из которого никто не выходил. Полную картину можно восстановить только вместе.</p>
      </div>
      <div class="case2317-clock case407-room-mark" aria-hidden="true"><span>4</span><i>0</i><span>7</span><small>SILENT ALARM · 01:12</small></div>
    </section>
  </main>

  <script src="../../assets/case-407-data.js?v=${VERSION}"></script>
  <script src="../../assets/case-407.js?v=${VERSION}"></script>
  <script src="../../assets/case-407-evidence-v2.js?v=${VERSION}"></script>
</body>
</html>`;

const catalogCard = `
    <section class="case407-catalog" aria-labelledby="case407-title">
      <div class="case407-catalog-grid">
        <div class="case407-catalog-copy">
          <p class="ml-kicker">Новое большое дело · премиальный формат</p>
          <h2 id="case407-title">Номер 407</h2>
          <p class="case407-catalog-lead">В 01:12 сейф гостиничного номера подаёт тихую тревогу. Через четыре минуты охрана находит запертую пустую комнату, телефон хранительницы и футляр без сапфира. Камера коридора не видела выхода.</p>
          <div class="case407-catalog-question">Из какого номера на самом деле исчезла Марта — и почему охрана искала не за той дверью?</div>
          <div class="case407-catalog-facts"><span>2 игрока</span><span>разные улики</span><span>50–70 минут</span><span>18 материалов</span><span>без регистрации</span></div>
          <a class="coop-primary" href="407/">Открыть дело «Номер 407»</a>
        </div>
        <div class="case407-catalog-visual" aria-hidden="true"><span class="case407-catalog-seal">CASE FILE · ML-0407</span></div>
      </div>
    </section>`;

const patchLanding = (siteRoot) => {
  const file = path.join(siteRoot, LANDING);
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('case-407.css')) {
    html = html.replace('</head>', `  <link rel="stylesheet" href="../assets/case-407.css?v=${VERSION}">\n</head>`);
  }
  if (!html.includes('case407-catalog')) {
    html = html.replace(/(\s*<section class="coop-how"[^>]*>)/, `\n${catalogCard}\n$1`);
  }
  for (const marker of ['case407-catalog', 'href="407/"', 'Номер 407']) {
    if (!html.includes(marker)) throw new Error(`407 landing patch missing ${marker}`);
  }
  fs.writeFileSync(file, html);
};

export function applyTwoPlayer407(siteRoot) {
  const caseDir = path.join(siteRoot, CASE_ROUTE);
  ensureDir(caseDir);
  fs.writeFileSync(path.join(caseDir, 'index.html'), specialPage());
  patchLanding(siteRoot);
  return { route: CASE_ROUTE, title: 'Номер 407', indexed: false, materials: 18 };
}
