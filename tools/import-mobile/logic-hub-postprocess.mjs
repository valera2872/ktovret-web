import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.0';
const BASE='https://valera2872.github.io/ktovret-web/';

const puzzles=[
  {
    id:'logic:lock-507',slug:'kod-507',number:'001',title:'Трёхзначный замок',difficulty:'Средняя',time:'4–7 минут',answer:'507',icon:'🔐',
    intro:'Нужно открыть замок из трёх цифр. Все подсказки точные: если сказано «одна цифра», остальные цифры этой строки в код не входят.',
    clues:[
      ['548','одна цифра верная и стоит на своём месте'],
      ['159','одна цифра верная, но стоит не на своём месте'],
      ['058','две цифры верные, но обе стоят не на своих местах'],
      ['238','ни одна цифра не верна'],
      ['870','две цифры верные, но обе стоят не на своих местах'],
    ],
    hint:'Начните со строки 238: она сразу исключает три цифры. Затем вернитесь к 870.',
    steps:[
      'Из 238 исключаем 2, 3 и 8.',
      'В 548 цифра 8 исключена. Верной на своём месте остаётся 5 или 4.',
      'Строка 058 говорит, что две цифры из 0, 5 и 8 верны, но стоят неверно. Так как 8 исключена, в код входят 0 и 5; значит в 548 верная цифра — 5 на первой позиции, а 4 из этой строки не входит.',
      'В 870 две цифры верны. 8 исключена, значит это 7 и 0; обе стоят не там. 0 не может быть третьей, а из 058 не может быть первой — значит 0 стоит второй.',
      'Остаётся третья позиция для 7. Получаем 507.',
    ],
  },
  {
    id:'logic:archive-order',slug:'poryadok-pyati-papok',number:'002',title:'Пять папок',difficulty:'Выше средней',time:'6–9 минут',answer:'EDACB',icon:'🗂️',
    intro:'Пять архивных папок A, B, C, D и E стоят в один ряд слева направо. Нужно восстановить единственный порядок.',
    clues:[
      ['A → C','C стоит непосредственно справа от A'],
      ['E · ? · A','между E и A ровно одна папка'],
      ['C < B','B находится правее C'],
      ['D','D не стоит ни первой, ни последней'],
      ['D < A','D находится левее A'],
    ],
    hint:'Связка A–C занимает соседние позиции. Попробуйте поставить её в каждое допустимое место и сразу проверять расстояние E–A.',
    steps:[
      'A и C образуют неразрывную пару A–C.',
      'Между E и A должна быть ровно одна позиция, поэтому E находится на две позиции левее A или правее A.',
      'D обязан быть левее A и при этом не может стоять с краю. Это отсекает размещения пары A–C в начале ряда.',
      'B должен находиться правее C, поэтому после пары A–C необходимо оставить место для B.',
      'Единственная расстановка, удовлетворяющая всем пяти условиям: E–D–A–C–B.',
    ],
  },
  {
    id:'logic:vault-5074',slug:'seyf-5074',number:'003',title:'Сейф: четыре цифры',difficulty:'Сложная',time:'8–12 минут',answer:'5074',icon:'⌨️',
    intro:'Код состоит из четырёх разных цифр. Ни одна цифра не повторяется. Для каждой строки точно указано количество верных цифр и их положение.',
    clues:[
      ['8140','две цифры верные, обе стоят не на своих местах'],
      ['2736','одна цифра верная, стоит не на своём месте'],
      ['0531','две цифры верные, обе стоят не на своих местах'],
      ['4203','две цифры верные, обе стоят не на своих местах'],
      ['7409','три цифры верные, все стоят не на своих местах'],
    ],
    hint:'Сопоставьте 7409 и 8140. Затем используйте 2736, чтобы определить, какая цифра из первой строки точно входит в код.',
    steps:[
      'В 7409 верны три цифры. Сравнение с 8140 и последующими строками приводит к тому, что 7, 4 и 0 входят в код, а 9 — нет.',
      '8140 содержит ровно две верные цифры — это 4 и 0. Значит 8 и 1 исключаются.',
      'В 2736 ровно одна верная цифра. Поскольку 7 уже подтверждена, 2, 3 и 6 исключаются.',
      'В 0531 должны быть две верные цифры. После исключения 3 и 1 это 0 и 5. Набор цифр кода: 5, 0, 7, 4.',
      'По ограничениям положения 0 не может быть 1-й, 3-й или 4-й — значит он 2-й. 4 не может быть 1-й, 2-й или 3-й — значит она 4-я. 7 не может быть 1-й — остаётся 3-я. Код: 5074.',
    ],
  },
];

function ensure(dir){fs.mkdirSync(dir,{recursive:true});}
function esc(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function header(root='./',active='logic'){
  return `<header class="logic-header logic-wrap"><a class="logic-brand" href="${root}"><span class="logic-brand-mark">ML</span><span class="logic-brand-copy"><strong>Mystery Logic</strong><small>Detective & logic games</small></span></a><nav class="logic-nav" aria-label="Основная навигация"><a href="${root}dela/">Детективные дела</a><a href="${root}detektivnye-igry-dlya-odnogo/">Для одного</a><a href="${root}detektivnye-igry-dlya-dvoih/">Для двоих</a><a class="${active==='logic'?'is-active':''}" href="${root}logicheskie-zadachi/">Логические задачи</a><a class="logic-tg" data-telegram-cta="header" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Telegram</a></nav></header>`;
}
function footer(root='./'){
  return `<footer class="logic-footer logic-wrap"><span>© 2026 Mystery Logic</span><nav><a href="${root}dela/">Бесплатные дела</a><a href="${root}tom-1/">Первый том</a><a href="${root}logicheskie-zadachi/">Логические задачи</a><a data-telegram-cta="footer" href="https://t.me/mysterylogic" target="_blank" rel="noopener">@mysterylogic</a><a href="${root}offer/">Условия</a><a href="${root}privacy/">Конфиденциальность</a></nav></footer>`;
}
function clueMarkup(clues){return clues.map(([code,text])=>`<div class="logic-clue"><strong>${esc(code)}</strong><span>${esc(text)}</span></div>`).join('');}
function scripts(root){return `<script src="${root}assets/logic-hub.js?v=${VERSION}" defer></script>`;}

function hubHtml(){
  const cards=puzzles.map(p=>`<a class="logic-card" data-puzzle-card="${p.id}" href="./${p.slug}/"><div class="logic-card-top"><span class="logic-card-badge" data-card-badge>Бесплатно</span><span>${p.time}</span></div><h3>${p.icon} ${esc(p.title)}</h3><p>${esc(p.intro)}</p><span class="logic-card-link">Решить задачу →</span></a>`).join('');
  const demo=puzzles[0];
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#06101b"><title>Логические задачи и головоломки онлайн — Mystery Logic</title><meta name="description" content="Логические задачи и головоломки с единственным проверяемым решением: коды, дедукция, последовательности и детективная логика. Бесплатно онлайн."><link rel="canonical" href="${BASE}logicheskie-zadachi/"><meta property="og:title" content="Логические задачи — Mystery Logic"><meta property="og:description" content="Не угадывайте. Выводите ответ из условий. Бесплатные интерактивные задачи с пошаговым разбором."><meta property="og:type" content="website"><link rel="stylesheet" href="../assets/logic-hub.css?v=${VERSION}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:'Логические задачи и головоломки — Mystery Logic',url:`${BASE}logicheskie-zadachi/`,description:'Интерактивные логические задачи с проверяемыми решениями.'})}</script></head><body class="logic-page">${header('../')}<main class="logic-wrap"><section class="logic-hero"><div><p class="logic-kicker">Новая линия Mystery Logic</p><h1>Логика<br>без догадок</h1><p class="logic-lead">Коды, последовательности, дедукция и головоломки, где ответ следует из условий. Решайте бесплатно, открывайте пошаговый разбор и собирайте серию раскрытых задач.</p><div class="logic-actions"><a class="logic-btn logic-btn-primary" href="#library">Начать решать</a><a class="logic-btn logic-btn-ghost" data-telegram-cta="hero" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Новая задача в Telegram →</a></div><div class="logic-trust"><div><strong>Единственное решение</strong><span>Каждая задача проверяется до публикации</span></div><div><strong>Без регистрации</strong><span>Первые задачи открыты сразу</span></div><div><strong>Не просто ответ</strong><span>Пошаговый разбор логики</span></div></div></div><aside class="logic-demo" data-logic-puzzle="${demo.id}" data-logic-answer="${demo.answer}"><div class="logic-demo-head"><span>Дело ${demo.number}</span><span class="logic-level">${demo.difficulty}</span></div><h2>${demo.icon} ${esc(demo.title)}</h2><div class="logic-clues">${clueMarkup(demo.clues)}</div><div class="logic-answer-row"><input class="logic-input" data-logic-answer-input inputmode="numeric" maxlength="3" aria-label="Введите код" placeholder="•••"><button class="logic-btn logic-btn-primary" data-logic-submit type="button">Проверить</button></div><p class="logic-feedback" data-logic-feedback>Три цифры. Используйте все пять подсказок.</p><div class="logic-reveal" data-logic-reveal hidden><h3>Раскрыто: ${demo.answer}</h3><p>Полный пошаговый разбор — на странице задачи.</p><a class="logic-btn logic-btn-ghost" href="./${demo.slug}/">Показать разбор →</a></div></aside></section><section class="logic-section"><div class="logic-section-head"><div><p class="logic-kicker">Категории</p><h2>Разные механики. Один принцип.</h2></div><p>Никаких ответов «потому что так задумал автор». Все существенные условия находятся перед игроком.</p></div><div class="logic-categories"><article class="logic-category"><small>01 · Дедукция</small><h3>Коды и замки</h3><p>Отсекайте невозможные цифры и позиции, пока не останется единственный код.</p></article><article class="logic-category"><small>02 · Порядок</small><h3>Последовательности</h3><p>Восстанавливайте места, события и маршруты из относительных ограничений.</p></article><article class="logic-category"><small>03 · Показания</small><h3>Правда и ложь</h3><p>Проверяйте совместимость утверждений, а не доверяйте интуиции.</p></article><article class="logic-category"><small>04 · Таблицы</small><h3>Логические сетки</h3><p>Связывайте людей, объекты, время и признаки через систему исключений.</p></article><article class="logic-category"><small>05 · Пространство</small><h3>Маршруты и схемы</h3><p>Ищите единственный путь, который удовлетворяет всем ограничениям.</p></article><article class="logic-category"><small>06 · Детективная логика</small><h3>Улики и противоречия</h3><p>Короткие дела на границе головоломки и настоящего расследования.</p></article></div></section><section class="logic-section" id="library"><div class="logic-section-head"><div><p class="logic-kicker">Стартовая коллекция</p><h2>Три задачи уже открыты</h2></div><p data-logic-progress data-logic-total="3">0 из 3 раскрыто</p></div><div class="logic-library">${cards}</div></section><section class="logic-section"><div class="logic-premium"><div><p class="logic-kicker">Следующий этап</p><h2>Тематические тома вместо случайной россыпи задач.</h2><p>Мы готовим большие коллекции с контролируемой сложностью: дедукция, коды и сейфы, логические сетки и детективные головоломки. Бесплатные задачи останутся входом; полный том будет открываться одной покупкой, без подписки и рекламы.</p><div class="logic-actions"><a class="logic-btn logic-btn-ghost" data-telegram-cta="premium" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Следить за новыми задачами →</a></div></div><aside class="logic-pack"><small>Mystery Logic · будущий том</small><strong>Дедукция</strong><ul><li>задачи от среднего до экспертного уровня</li><li>пошаговые объяснения</li><li>прогресс и продолжение с места остановки</li><li>одна покупка вместо подписки</li></ul></aside></div></section><section class="logic-section"><div class="logic-community"><div><p class="logic-kicker">Следственный отдел</p><h2>Новая задача — в Telegram.</h2><p>В канале публикуем короткие дела и головоломки, а в обсуждении участники сравнивают версии до выхода разбора. Подписка нужна не «ради новостей», а чтобы регулярно получать новый повод подумать.</p></div><a class="logic-btn logic-btn-primary" data-telegram-cta="community" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Вступить в @mysterylogic</a></div></section></main>${footer('../')}${scripts('../')}</body></html>`;
}

function taskHtml(p,index){
  const next=puzzles[(index+1)%puzzles.length];
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#06101b"><title>${esc(p.title)} — логическая задача с ответом | Mystery Logic</title><meta name="description" content="${esc(p.intro)} Решите онлайн и откройте пошаговое объяснение."><link rel="canonical" href="${BASE}logicheskie-zadachi/${p.slug}/"><meta property="og:title" content="${esc(p.title)} — Mystery Logic"><meta property="og:type" content="article"><link rel="stylesheet" href="../../assets/logic-hub.css?v=${VERSION}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:p.title,mainEntityOfPage:`${BASE}logicheskie-zadachi/${p.slug}/`,inLanguage:'ru'})}</script></head><body class="logic-page">${header('../../')}<main class="logic-wrap"><section class="logic-task-hero"><div class="logic-task-crumbs"><a href="../../">Mystery Logic</a><span>›</span><a href="../">Логические задачи</a><span>›</span><span>Дело ${p.number}</span></div><p class="logic-kicker" style="margin-top:22px">Дело ${p.number} · ${esc(p.difficulty)}</p><h1>${p.icon} ${esc(p.title)}</h1><p class="logic-lead">${esc(p.intro)}</p><div class="logic-task-meta"><span>${esc(p.difficulty)}</span><span>◷ ${esc(p.time)}</span><span>Единственное решение</span><span>Бесплатно</span></div></section><div class="logic-task-grid" data-logic-puzzle="${p.id}" data-logic-answer="${p.answer}"><article class="logic-task-panel"><h2>Условия</h2><p>Используйте каждую подсказку как точное ограничение.</p><div class="logic-task-list">${clueMarkup(p.clues)}</div></article><aside class="logic-solve-panel"><h2>Ваш ответ</h2><label for="logic-answer-${index}">Введите ${p.answer.length===3?'три цифры':'ответ без пробелов'}</label><input id="logic-answer-${index}" class="logic-input" data-logic-answer-input ${/^\d+$/.test(p.answer)?'inputmode="numeric"':''} maxlength="${p.answer.length}" placeholder="${'•'.repeat(p.answer.length)}"><div class="logic-solve-actions"><button class="logic-btn logic-btn-primary" data-logic-submit type="button">Проверить</button><button class="logic-btn logic-btn-ghost" data-logic-hint type="button">Подсказка</button></div><p class="logic-feedback" data-logic-feedback>Ответ не отправляется на сервер — проверка происходит в браузере.</p><div class="logic-reveal" data-logic-hint-copy hidden><h3>Подсказка</h3><p>${esc(p.hint)}</p></div><button class="logic-btn logic-btn-ghost" style="margin-top:10px;width:100%" data-logic-solution-toggle type="button">Показать пошаговый разбор</button><div class="logic-reveal" data-logic-reveal hidden><h3>Ответ: ${p.answer}</h3><ol>${p.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></div><div class="logic-next"><small>Следующее дело</small><strong style="display:block;margin:6px 0 10px">${esc(next.title)}</strong><a href="../${next.slug}/">Перейти →</a></div></aside></div><section class="logic-section"><div class="logic-community"><div><p class="logic-kicker">Сравнить версии</p><h2>Обсудите решение до разбора.</h2><p>В Следственном отделе Mystery Logic можно показать ход рассуждений и увидеть, на какой подсказке другие игроки сделали решающий вывод.</p></div><a class="logic-btn logic-btn-primary" data-telegram-cta="task" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Открыть Telegram</a></div></section></main>${footer('../../')}${scripts('../../')}</body></html>`;
}

function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  if(!fs.existsSync(file)) return 0;
  let html=fs.readFileSync(file,'utf8');
  if(html.includes('data-logic-home-launch')) return 0;
  const block=`<section class="ref-logic-launch" data-logic-home-launch><div class="ref-logic-launch-copy"><p class="ref-kicker">Новая линия Mystery Logic</p><h2>Логические задачи и головоломки</h2><p>Коды, последовательности и дедукция с единственным проверяемым решением. Первые задачи уже открыты бесплатно — без регистрации.</p><div class="ref-home-actions ref-home-actions-v2"><a class="ref-btn ref-btn-primary" href="./logicheskie-zadachi/">Решить первую задачу →</a><a class="ref-btn ref-btn-outline" data-telegram-cta="home-logic" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Новые задачи в Telegram</a></div></div><div class="ref-logic-launch-proof"><strong>Не просто «ответ»</strong><span>После решения — пошаговый разбор, почему другие варианты невозможны.</span></div></section>`;
  const anchor='<section class="ref-method-v2"';
  if(html.includes(anchor)) html=html.replace(anchor,`${block}${anchor}`);
  else if(html.includes('<section class="ref-manifesto"')) html=html.replace('<section class="ref-manifesto"',`${block}<section class="ref-manifesto"`);
  else html=html.replace('</main>',`${block}</main>`);
  fs.writeFileSync(file,html);
  return 1;
}

export function applyLogicHub(siteRoot){
  const root=path.resolve(siteRoot);
  const hubDir=path.join(root,'logicheskie-zadachi');
  ensure(hubDir);
  fs.writeFileSync(path.join(hubDir,'index.html'),hubHtml());
  for(const [index,p] of puzzles.entries()){
    const dir=path.join(hubDir,p.slug);ensure(dir);fs.writeFileSync(path.join(dir,'index.html'),taskHtml(p,index));
  }
  const homePatched=patchHome(root);
  return {version:VERSION,hub:'logicheskie-zadachi',routes:['logicheskie-zadachi/',...puzzles.map(p=>`logicheskie-zadachi/${p.slug}/`)],puzzles:puzzles.length,homePatched};
}
