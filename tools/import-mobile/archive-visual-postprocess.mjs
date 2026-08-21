import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.0';
const STYLE=`archive-visual-v1.css?v=${VERSION}`;

const addBodyClass=(html,className)=>{
  if(html.includes(`class="${className}"`)) return html;
  return html.replace('<body>',`<body class="${className}">`).replace(/<body class="([^"]*)">/,(_,classes)=>`<body class="${classes.includes(className)?classes:`${classes} ${className}`.trim()}">`);
};

const addStyle=(html,href)=>{
  if(html.includes(STYLE)) return html;
  return html.replace('</head>',`  <link rel="stylesheet" href="${href}">\n</head>`);
};

const homeArchive=`
      <aside class="av-hero-archive" aria-label="Архив расследований Mystery Logic">
        <div class="av-archive-box">
          <span class="av-volume-label">MYSTERY LOGIC<strong>CASE ARCHIVE</strong></span>
          <div class="av-folder-stack" aria-hidden="true"><i>001</i><i>015</i><i>066</i><i>100</i></div>
        </div>
        <div class="av-archive-evidence"><small>ДЕЛО ML-2317</small><strong>Последний звонок в 23:17</strong><span>совместное расследование · 2 игрока</span></div>
        <div class="av-archive-photo" aria-hidden="true"><span>CAM C17</span><b>23:17:41</b></div>
      </aside>`;

const homeActions=`<div class="ml-actions"><a class="ml-button ml-button-primary" href="./delo/chetyre-vhoda-v-arhiv/">Начать расследование</a><a class="ml-button ml-button-secondary" href="./detektivnye-igry-dlya-dvoih/">Играть вдвоём</a></div>`;

const formatSection=`
    <section class="av-formats" id="games">
      <div class="av-section-head">
        <div><p class="ml-kicker">Доступно сейчас</p><h2>Выберите формат расследования</h2></div>
        <p>Короткое дело на несколько минут, совместное расследование для двоих или полный архив из ста задач.</p>
      </div>
      <div class="av-format-grid">
        <a class="av-format-card is-featured" href="./detektivnye-igry-dlya-dvoih/">
          <span class="av-format-kicker">Для двоих · 45–60 минут</span><h3>Последний звонок в 23:17</h3><p>Два игрока получают разные материалы и могут восстановить полную картину только вместе.</p><div class="av-format-art av-art-duo" aria-hidden="true"></div><span class="av-format-link">Играть вдвоём →</span>
        </a>
        <a class="av-format-card" href="./kto-vret/">
          <span class="av-format-kicker">Серия дел · 5–10 минут</span><h3>Кто врёт?</h3><p>Сто коротких логических расследований с одним доказуемым ответом.</p><div class="av-format-art av-art-series" aria-hidden="true"></div><span class="av-format-link">Открыть серию →</span>
        </a>
        <a class="av-format-card" href="./tom-1/">
          <span class="av-format-kicker">Архив · 100 дел</span><h3>Первый том</h3><p>15 дел доступны бесплатно, ещё 85 открываются одной покупкой без подписки.</p><div class="av-format-art av-art-volume" aria-hidden="true"></div><span class="av-format-link">Посмотреть том →</span>
        </a>
      </div>
    </section>`;

const evidenceSection=`
    <section class="av-evidence-showcase" aria-labelledby="av-evidence-title">
      <p class="ml-kicker">Материалы дела</p><h2 id="av-evidence-title">С чем вы будете работать</h2>
      <div class="av-evidence-grid">
        <article class="av-evidence-tile"><small>АУДИО / 112</small><strong>Записи звонков</strong><div class="av-evidence-wave" aria-hidden="true"></div><span>00:46 · линия прервана</span></article>
        <article class="av-evidence-tile"><small>CAM C17</small><strong>Камеры</strong><div class="av-evidence-camera" aria-hidden="true"></div><span>23:17:41 · внешний контур</span></article>
        <article class="av-evidence-tile"><small>MESSAGES</small><strong>Переписки</strong><div class="av-evidence-chat" aria-hidden="true"><i>Ты где?</i><i>Буду через 10 минут</i></div><span>сверяйте время и контекст</span></article>
        <article class="av-evidence-tile"><small>CASE FILE</small><strong>Протоколы</strong><div class="av-evidence-doc" aria-hidden="true"></div><span>факты, показания, отметки</span></article>
      </div>
    </section>`;

const volumeArt=`<div class="av-volume-art" aria-hidden="true"><div class="av-volume-binder"></div><div class="av-volume-tabs"><i>001</i><i>015</i><i>037</i><i>066</i><i>100</i></div><div class="av-volume-case-paper"><small>ДЕЛО №037</small><strong>Mystery Logic</strong><span>ДОКАЗАТЕЛЬСТВО</span></div></div>`;

function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  if(!fs.existsSync(file)) return false;
  let html=fs.readFileSync(file,'utf8');
  html=addBodyClass(html,'av-home');
  html=addStyle(html,`./assets/${STYLE}`);
  html=html.replace(/\s*<aside class="ml-hero-preview"[\s\S]*?<\/aside>/,`\n${homeArchive}`);
  html=html.replace(/<div class="ml-actions">[\s\S]*?<\/div>/,homeActions);
  html=html.replace(/\s*<section class="ml-section" id="games">[\s\S]*?<\/section>\s*(?=<section class="ml-section" id="method">)/,`\n${formatSection}\n${evidenceSection}\n`);
  if(!html.includes('av-hero-archive')||!html.includes('av-format-grid')||!html.includes('av-evidence-showcase')) throw new Error('archive visual home patch failed');
  fs.writeFileSync(file,html);
  return true;
}

function patchCatalog(siteRoot){
  const file=path.join(siteRoot,'dela/index.html');
  if(!fs.existsSync(file)) return false;
  let html=fs.readFileSync(file,'utf8');
  html=addBodyClass(html,'av-catalog');
  html=addStyle(html,`../assets/${STYLE}`);
  if(!html.includes('class="case-grid"')||!html.includes('catalog-case-file')) throw new Error('archive visual catalog contract missing');
  fs.writeFileSync(file,html);
  return true;
}

function patchVolume(siteRoot){
  const file=path.join(siteRoot,'tom-1/index.html');
  if(!fs.existsSync(file)) return false;
  let html=fs.readFileSync(file,'utf8');
  html=addBodyClass(html,'av-volume');
  html=addStyle(html,`../assets/${STYLE}`);
  if(!html.includes('av-volume-art')) html=html.replace('<aside class="volume-purchase-card">',`<aside class="volume-purchase-card">${volumeArt}`);
  if(!html.includes('data-volume-buy')||!html.includes('av-volume-binder')) throw new Error('archive visual volume patch failed');
  fs.writeFileSync(file,html);
  return true;
}

export function applyArchiveVisualSystem(siteRoot){
  const pages=[patchHome(siteRoot),patchCatalog(siteRoot),patchVolume(siteRoot)].filter(Boolean).length;
  if(pages!==3) throw new Error(`archive visual expected 3 pages, patched ${pages}`);
  return {pages,version:VERSION};
}
