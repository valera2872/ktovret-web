import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './common.mjs';
import { siteUrl } from './site-config.mjs';

const VERSION = '1.1.0';
const HUB = 'detektivnye-igry-dlya-odnogo';
const CASE = `${HUB}/407`;
let finalizerRegistered = false;

const header = (prefix, active='solo') => `<header class="ml-header solo407-header solo407-shell"><a class="ml-brand" href="${prefix}"><span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Detective investigations</small></span></a><nav class="ml-nav"><a ${active==='solo'?'aria-current="page" ':''}href="${prefix}${HUB}/">Для одного</a><a href="${prefix}detektivnye-igry-dlya-dvoih/">Для двоих</a><a href="${prefix}kto-vret/">Кто врёт?</a></nav></header>`;

const hubPage = () => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#050a0f"><meta name="description" content="Детективные игры и квесты онлайн для одного: полноценные расследования и короткие дела «Кто врёт?» без напарника и регистрации."><link rel="canonical" href="${siteUrl(`${HUB}/`)}"><link rel="icon" href="../assets/ml-mark.svg" type="image/svg+xml"><link rel="preload" href="../assets/room-407-evidence.webp" as="image" type="image/webp"><link rel="stylesheet" href="../assets/mysterylogic.css"><link rel="stylesheet" href="../assets/case-407-solo.css?v=${VERSION}"><link rel="stylesheet" href="../assets/solo-hub-kto-vret.css?v=1.0.0"><meta property="og:title" content="Детективные игры и квесты онлайн для одного"><meta property="og:description" content="Большие самостоятельные расследования и короткие дела «Кто врёт?». Можно начать бесплатно."><meta property="og:type" content="website"><meta property="og:url" content="${siteUrl(`${HUB}/`)}"><meta property="og:image" content="${siteUrl('assets/room-407-evidence.webp')}"><title>Детективные игры и квесты онлайн для одного — бесплатно</title></head><body class="solo407-body">${header('../')}<main class="solo407-shell solo407-hub"><section class="solo407-hub-hero"><div><p class="solo407-kicker">Mystery Logic · игры для одного</p><h1>Детективные игры онлайн для одного</h1><p class="solo407-hub-lead">Выберите темп. Можно открыть большое расследование на один вечер — или пройти короткое дело «Кто врёт?» за 5–10 минут. В обоих форматах вы сами анализируете факты и принимаете решение.</p><div class="solo407-entry-facts"><span>1 игрок</span><span>в браузере</span><span>без регистрации</span><span>два формата бесплатно</span></div></div><div class="solo407-hub-visual" aria-hidden="true"></div></section><section class="solo407-hub-card"><div><p class="solo407-kicker">Большое расследование · доступно сейчас</p><h2>Номер 407</h2><p>Тихая тревога из гостиничного сейфа. Пустая запертая комната. Исчезнувшая хранительница сапфира. Камера утверждает, что никто не выходил. Ваша задача — не угадать, а построить версию, которая выдержит все журналы, следы и временные отметки.</p><div class="solo407-hub-facts"><span>50–70 минут</span><span>18 материалов</span><span>3 этапа</span><span>сохранение прогресса</span></div></div><a class="solo407-primary" href="407/">Начать расследование</a></section><section class="solo407-kv" aria-labelledby="solo407-kv-title"><div class="solo407-kv-head"><div><p class="solo407-kv-label">Короткий формат · можно начать за минуту</p><h2 id="solo407-kv-title">А ещё здесь есть <em>«Кто врёт?»</em></h2><p class="solo407-kv-lead">Короткие законченные детективные дела для одного. Несколько фактов, показаний или журналов — и одно несоответствие, которое нужно не угадать, а доказать.</p></div><div class="solo407-kv-fast"><div><strong>15</strong><span>дел можно пройти бесплатно</span></div><div><strong>5–10 мин</strong><span>одно законченное расследование</span></div><div><strong>1 ответ</strong><span>следует из материалов дела</span></div></div></div><div class="solo407-kv-flow"><article class="solo407-kv-step"><small>01 · ЧИТАЕТЕ</small><strong>Получаете материалы</strong><p>Обстоятельства, показания, время, маршруты и ограничения.</p></article><article class="solo407-kv-step"><small>02 · СВЕРЯЕТЕ</small><strong>Ищете несоответствие</strong><p>Какая деталь не может одновременно быть правдой вместе с остальными?</p></article><article class="solo407-kv-step"><small>03 · РЕШАЕТЕ</small><strong>Доказываете версию</strong><p>Выбираете ответ и сразу видите логику решения.</p></article></div><div class="solo407-kv-cases"><a class="solo407-kv-case" href="../delo/chetyre-vhoda-v-arhiv/"><small>Дело №001 · ≈ 8 минут</small><strong>Четыре входа в архив</strong><span>Порядок событий и способы доступа →</span></a><a class="solo407-kv-case" href="../delo/tri-nesinhronnyh-zhurnala/"><small>Дело №002 · ≈ 7 минут</small><strong>Три несинхронных журнала</strong><span>Камера, датчик и турникет →</span></a><a class="solo407-kv-case" href="../delo/pyat-papok-i-pustoe-mesto/"><small>Дело №003 · ≈ 6 минут</small><strong>Пять папок и пустое место</strong><span>Единственный возможный порядок →</span></a></div><div class="solo407-kv-bottom"><p>«Кто врёт?» — отдельная игровая линия Mystery Logic: 100 коротких расследований, первые 15 доступны бесплатно. Можно открыть одно дело прямо сейчас или пройти весь бесплатный архив.</p><a class="solo407-kv-cta" href="../dela/">Играть в 15 дел бесплатно →</a></div></section><section class="solo407-hub-section"><h2>Как устроено большое solo-расследование</h2><ol><li>Получаете только стартовый пакет, а не всю папку сразу.</li><li>Решаете, что запросить: камеру, реестр, алиби, лабораторию или служебные данные.</li><li>На контрольных точках фиксируете только то, что уже доказано материалами.</li><li>Собираете собственную доску доказательств и передаёте итоговую версию.</li></ol></section><section class="solo407-hub-section"><h2>Хотите играть вдвоём?</h2><div><p>У Mystery Logic есть отдельные асимметричные расследования для двух игроков: разные материалы, обмен уликами и общая финальная версия.</p><p><a href="../detektivnye-igry-dlya-dvoih/">Перейти к играм для двоих →</a></p></div></section></main></body></html>`;

const casePage = () => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#050a0f"><meta name="robots" content="noindex,follow"><meta name="description" content="Номер 407 — большое самостоятельное детективное расследование Mystery Logic для одного игрока."><link rel="canonical" href="${siteUrl(`${CASE}/`)}"><link rel="icon" href="../../assets/ml-mark.svg" type="image/svg+xml"><link rel="preload" href="../../assets/room-407-evidence.webp" as="image" type="image/webp"><link rel="stylesheet" href="../../assets/mysterylogic.css"><link rel="stylesheet" href="../../assets/case-407-solo.css?v=${VERSION}"><title>Номер 407 — детективное расследование для одного</title></head><body class="solo407-body">${header('../../')}<main class="solo407-shell" data-solo407-app><section class="solo407-entry"><div class="solo407-entry-copy"><p class="solo407-kicker">Загрузка дела ML-0407</p><h1>Номер 407</h1><p>Подготавливаем материалы расследования…</p></div></section></main><script src="../../assets/case-407-data.js?v=${VERSION}"></script><script src="../../assets/case-407-solo.js?v=${VERSION}"></script></body></html>`;

function patchTwoPlayerLanding(siteRoot) {
  const file = path.join(siteRoot, 'detektivnye-igry-dlya-dvoih/index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('solo407-format-switch')) {
    html = html.replace(/(<main[^>]*>)/, `$1\n<section class="solo407-format-switch"><span><strong>Играете один?</strong> Напарник не нужен — у нас есть отдельные полноценные solo-расследования.</span><a href="../${HUB}/">Открыть игры для одного →</a></section>`);
    if (!html.includes('case-407-solo.css')) html = html.replace('</head>', `  <link rel="stylesheet" href="../assets/case-407-solo.css?v=${VERSION}">\n</head>`);
  }
  fs.writeFileSync(file, html);
}

function patchHome(siteRoot) {
  const file = path.join(siteRoot, 'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('case-407-solo.css')) html = html.replace('</head>', `  <link rel="stylesheet" href="./assets/case-407-solo.css?v=${VERSION}">\n</head>`);
  if (!html.includes('solo407-home-switch')) {
    const chooser = `<section class="solo407-home-switch" aria-label="Выберите формат детективной игры"><div><p class="solo407-kicker">Как хотите расследовать?</p><strong>Выберите формат — и сразу попадёте в подходящие дела.</strong></div><div class="solo407-home-switch-actions"><a href="./${HUB}/"><span>1 игрок</span><b>Расследовать одному</b><small>Большие дела без комнат и приглашений</small></a><a href="./detektivnye-igry-dlya-dvoih/"><span>2 игрока</span><b>Расследовать вдвоём</b><small>Разные улики и совместная версия</small></a></div></section>`;
    html = html.replace(/(<main[^>]*>)/, `$1\n${chooser}`);
  }
  fs.writeFileSync(file, html);
}

export function finalizeSolo407(siteRoot) {
  patchHome(siteRoot);
  patchTwoPlayerLanding(siteRoot);
  const sitemap = path.join(siteRoot, 'sitemap.xml');
  if (fs.existsSync(sitemap)) {
    let xml = fs.readFileSync(sitemap, 'utf8');
    const url = siteUrl(`${HUB}/`);
    if (!xml.includes(`<loc>${url}</loc>`)) xml = xml.replace('</urlset>', `<url><loc>${url}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod></url>\n</urlset>`);
    fs.writeFileSync(sitemap, xml);
  }
  const reportFile = path.join(siteRoot, 'assets/generated/import-report.json');
  if (fs.existsSync(reportFile)) {
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    report.soloHubPage = HUB;
    report.soloCaseRoute = CASE;
    report.soloMaterials = 18;
    report.soloVersion = VERSION;
    if (fs.existsSync(sitemap)) report.indexableUrls = (fs.readFileSync(sitemap,'utf8').match(/<loc>/g) || []).length;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  }
}

export function applySolo407(siteRoot) {
  ensureDir(path.join(siteRoot, HUB)); ensureDir(path.join(siteRoot, CASE));
  fs.writeFileSync(path.join(siteRoot, HUB, 'index.html'), hubPage());
  fs.writeFileSync(path.join(siteRoot, CASE, 'index.html'), casePage());
  patchTwoPlayerLanding(siteRoot);
  for (const file of [path.join(siteRoot,HUB,'index.html'), path.join(siteRoot,CASE,'index.html')]) {
    const html = fs.readFileSync(file,'utf8');
    for (const forbidden of ['создать комнату','код комнаты','пригласить напарника']) if (html.toLowerCase().includes(forbidden)) throw new Error(`Solo 407 room-language regression: ${forbidden}`);
  }
  if (!finalizerRegistered && path.basename(process.argv[1] || '') === 'import-mobile-cases.mjs') {
    finalizerRegistered = true;
    process.once('beforeExit', () => finalizeSolo407(siteRoot));
  }
  return { hub:HUB, route:CASE, indexableRoutes:[`${HUB}/`], materials:18, version:VERSION };
}