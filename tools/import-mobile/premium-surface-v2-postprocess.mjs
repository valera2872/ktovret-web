import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.0';

const styleTag=href=>`<link data-premium-surface-v2 rel="stylesheet" href="${href}?v=${VERSION}">`;

function injectStyle(html,href){
  const tag=styleTag(href);
  if(/<link[^>]+data-premium-surface-v2[^>]*>/i.test(html)) return html.replace(/<link[^>]+data-premium-surface-v2[^>]*>/i,tag);
  return html.replace(/<\/head>/i,`${tag}\n</head>`);
}

function premiumCases(){
  return `<section class="ref-premium-cases-v2" data-premium-cases-v2>
    <div class="ref-premium-cases-head">
      <div><p class="ref-kicker">Большие расследования</p><h2>Премиальные дела Mystery Logic</h2></div>
      <p>Не короткая задача на пять минут, а полноценное расследование: десятки материалов, отдельные роли, версия игрока и финальная реконструкция событий.</p>
    </div>
    <div class="ref-premium-cases-grid">
      <article class="ref-premium-case ref-premium-case-407">
        <div class="ref-premium-case-copy">
          <div class="ref-premium-case-top"><span>CASE FILE · ML-0407</span><span>18 материалов</span></div>
          <p class="ref-kicker">Премиальное дело · одному или вдвоём</p>
          <h3>Номер 407</h3>
          <p>Тихая тревога сейфа. Запертая пустая комната. Телефон хранительницы и футляр без сапфира. Камера коридора не видела выхода — но электронные журналы и осмотр номера не складываются в одну версию.</p>
          <div class="ref-premium-case-meta"><span>≈ 50–70 минут</span><span>18 материалов</span><span>разные улики</span></div>
          <div class="ref-premium-case-actions"><a class="ref-btn ref-btn-primary" href="./detektivnye-igry-dlya-odnogo/407/">Расследовать одному</a><a class="ref-btn ref-btn-outline" href="./detektivnye-igry-dlya-dvoih/407/">Играть вдвоём</a></div>
        </div>
        <div class="ref-premium-case-art ref-premium-case-art-407"><img src="./assets/room-407-evidence.webp" alt="Материалы дела Номер 407" width="760" height="520" loading="lazy" decoding="async"></div>
      </article>
      <article class="ref-premium-case ref-premium-case-aria">
        <div class="ref-premium-case-copy">
          <div class="ref-premium-case-top"><span>CASE FILE · ML-AR17</span><span>299 ₽</span></div>
          <p class="ref-kicker">Премиальное дело · для двоих</p>
          <h3>Последняя ария</h3>
          <p>52 секунды blackout. Раненый тенор. Из закрытого нотного архива исчезает оригинальная партитура 1908 года. Восстановите события по секундам и определите, кому можно верить.</p>
          <div class="ref-premium-case-meta"><span>55–75 минут</span><span>18 материалов</span><span>2 роли</span></div>
          <div class="ref-premium-case-actions"><a class="ref-btn ref-btn-primary" href="./detektivnye-igry-dlya-dvoih/poslednyaya-ariya/">Открыть дело — 299 ₽</a></div>
        </div>
        <div class="ref-premium-case-art ref-premium-case-art-aria" aria-hidden="true"><div class="ref-aria-score"><span>ORIGINAL SCORE · 1908</span><strong>OPUS XVII</strong><i>21:49:12</i><b>52 sec</b></div></div>
      </article>
    </div>
  </section>`;
}

function puzzleHome(){
  return `<section class="ref-logic-launch ref-logic-launch-v2" data-logic-family-home data-logic-home-launch>
    <div class="ref-logic-launch-copy"><p class="ref-kicker">Mystery Logic · логические игры</p><h2>Головоломки для детей и взрослых</h2><p>20 утверждённых быстрых задач и отдельный Expert-каталог. Решайте прямо в браузере — без регистрации, лишних экранов и искусственного размножения одинаковых SEO-страниц.</p><div class="ref-home-actions ref-home-actions-v2"><a class="ref-btn ref-btn-primary" href="./golovolomki-onlayn/">Открыть все головоломки →</a></div></div>
    <div class="ref-logic-family-grid" aria-label="Подборки головоломок">
      <a href="./golovolomki-dlya-detei/"><span>13 задач</span><strong>Для детей</strong><small>Возрастные уровни и понятные объяснения</small></a>
      <a href="./igry-dlya-mozga/"><span>19 задач</span><strong>Для мозга</strong><small>Логика, внимание и закономерности</small></a>
      <a href="./detektivnye-golovolomki/"><span>4 дела</span><strong>Детективные</strong><small>Время, журналы и противоречия</small></a>
      <a href="./matematicheskie-golovolomki/"><span>6 задач</span><strong>Математические</strong><small>Системы, числа и комбинаторика</small></a>
    </div>
  </section>`;
}

function patchHome(root){
  const file=path.join(root,'index.html');
  if(!fs.existsSync(file)) throw new Error('premium surface v2: home missing');
  let html=fs.readFileSync(file,'utf8');
  html=injectStyle(html,'./assets/premium-surface-v2.css');
  html=html.replace(/<section class="ref-premium-cases-v2"[\s\S]*?<\/section>/, '');
  const premium=premiumCases();
  const materialMarker='<p class="ref-section-label">С чем вы будете работать</p>';
  if(html.includes(materialMarker)) html=html.replace(materialMarker,`${premium}${materialMarker}`);
  else if(html.includes('<section class="ref-logic-launch"')) html=html.replace('<section class="ref-logic-launch"',`${premium}<section class="ref-logic-launch"`);
  else throw new Error('premium surface v2: home insertion marker missing');
  if(/<section class="ref-logic-launch[^>]*data-logic-home-launch>[\s\S]*?<\/section>/.test(html)) html=html.replace(/<section class="ref-logic-launch[^>]*data-logic-home-launch>[\s\S]*?<\/section>/,puzzleHome());
  else throw new Error('premium surface v2: puzzle home block missing');
  fs.writeFileSync(file,html);
  return 1;
}

function patchPuzzleHub(root){
  const file=path.join(root,'golovolomki-onlayn','index.html');
  if(!fs.existsSync(file)) throw new Error('premium surface v2: puzzle hub missing');
  let html=fs.readFileSync(file,'utf8');
  html=injectStyle(html,'../assets/premium-surface-v2.css');
  html=html.replace('<body class="logic-page">','<body class="logic-page logic-premium-hub">');
  html=html.replace('<section class="logic-seo-hero">','<section class="logic-seo-hero mlp-puzzle-hero">');
  html=html.replace('Mystery Logic · Expert</p><h1>Логические игры и головоломки онлайн</h1>','Mystery Logic · коллекция логики</p><h1>Логические игры<br>и головоломки онлайн</h1>');
  html=html.replace(/<div class="logic-seo-proof">[\s\S]*?<\/div><\/section>/,`<div class="logic-seo-proof"><div><strong>20 быстрых</strong><span>утверждены редактором</span></div><div><strong>20 Expert</strong><span>проверяемые решения</span></div><div><strong>Без регистрации</strong><span>открыл — сразу решаешь</span></div><div><strong>Дети и взрослые</strong><span>разные уровни сложности</span></div></div></section>`);
  html=html.replace('<section class="logic-hub-audience-strip"','<section class="logic-hub-audience-strip mlp-route-section"');
  html=html.replace('<h2>От двух минут до полноценного Expert-вызова</h2>','<h2>Выберите свой формат</h2><p class="mlp-route-lead">Сначала — короткие игровые подборки. Если хочется задачи, над которой можно сидеть двадцать минут, ниже начинается Expert.</p>');
  html=html.replace('<section class="logic-section" id="puzzles">','<section class="logic-section mlp-expert-section" id="puzzles">');
  html=html.replace('<h2>Выберите механику</h2>','<h2>Expert-коллекция</h2><p class="mlp-expert-lead">Сложные задачи с единственным проверяемым решением — коды, сетки, графы, маршруты и комбинаторика.</p>');
  fs.writeFileSync(file,html);
  return 1;
}

export function applyPremiumSurfaceV2(siteRoot){
  const root=path.resolve(siteRoot);
  const css=path.join(root,'assets','premium-surface-v2.css');
  if(!fs.existsSync(css)) throw new Error('premium surface v2: css missing');
  const home=patchHome(root);
  const hub=patchPuzzleHub(root);
  const homeHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const hubHtml=fs.readFileSync(path.join(root,'golovolomki-onlayn','index.html'),'utf8');
  if(!homeHtml.includes('data-premium-cases-v2')||!homeHtml.includes('Номер 407')||!homeHtml.includes('Последняя ария')) throw new Error('premium surface v2: premium cases not rendered');
  for(const route of ['golovolomki-dlya-detei/','igry-dlya-mozga/','detektivnye-golovolomki/','matematicheskie-golovolomki/']) if(!homeHtml.includes(route)) throw new Error(`premium surface v2: home puzzle route missing: ${route}`);
  if(!hubHtml.includes('logic-premium-hub')||!hubHtml.includes('20 быстрых')||!hubHtml.includes('Expert-коллекция')) throw new Error('premium surface v2: puzzle hub upgrade missing');
  return {version:VERSION,home,puzzleHub:hub,premiumCases:2,puzzleEntrances:4};
}
