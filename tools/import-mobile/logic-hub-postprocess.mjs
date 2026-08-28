import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.1.0';
const BASE='https://valera2872.github.io/ktovret-web/';

const puzzles=[
  {
    id:'logic:protocol-six',slug:'kod-protokol-6',number:'001',title:'Протокол шести цифр',difficulty:'Экспертная',time:'15–25 минут',answer:'581407',inputLabel:'Введите шестизначный код',inputHint:'Шесть разных цифр. Все количества в протоколе точные.',
    intro:'Код состоит из шести разных цифр. Для каждой строки точно указано, сколько цифр стоят на своих местах и сколько входят в код, но стоят в других позициях. Остальные цифры строки в код не входят.',
    clues:[
      ['970234','0 на месте · 3 не на месте'],
      ['950314','0 на месте · 4 не на месте'],
      ['053246','0 на месте · 3 не на месте'],
      ['410259','0 на месте · 4 не на месте'],
      ['130697','1 на месте · 2 не на месте'],
      ['061759','1 на месте · 3 не на месте'],
      ['145063','0 на месте · 4 не на месте'],
      ['205387','1 на месте · 3 не на месте'],
    ],
    hint:'Не угадывайте позиции. Сначала пересекайте строки как множества цифр, а уже затем переносите оставшиеся ограничения на позиции.',
    steps:[
      'У шести разных цифр 151 200 возможных кодов. Первая строка оставляет 34 080 вариантов: ровно три её цифры должны присутствовать, но ни одна не может стоять на указанной позиции.',
      'После второй, третьей и четвёртой строк остаётся соответственно 8 944, 2 208 и 451 допустимый код. Это важный момент: ни одна ранняя подсказка сама по себе не выдаёт решение — ограничения работают только вместе.',
      'Пятая и шестая строки добавляют одновременно ограничения на состав и позицию. После них остаётся 10 вариантов.',
      'Седьмая строка сводит пространство к двум кодам: 501487 и 581407. Оба удовлетворяют первым семи строкам.',
      'Последняя строка 205387 требует ровно одну цифру на своём месте и ещё три — не на своих. 501487 этому условию не соответствует, а 581407 соответствует. Единственный код — 581407.',
    ],
  },
  {
    id:'logic:self-reference-six',slug:'shest-pokazaniy',number:'002',title:'Шесть показаний',difficulty:'Экспертная',time:'15–30 минут',answer:'D',inputLabel:'Введите букву подозреваемого A–F',inputHint:'Ровно три из шести показаний истинны.',
    intro:'Один из шести подозреваемых A–F совершил кражу. Ровно три показания истинны. Когда показание ссылается на истинность другого показания, речь идёт именно о фразе в этом протоколе. Кто виновен?',
    clues:[
      ['A','Виновен C или E.'],
      ['B','Показание A ложно.'],
      ['C','Фраза «виновен не D» имеет ту же истинность, что и показание F.'],
      ['D','Виновен A, B, E или F.'],
      ['E','Истинно ровно одно: показание B истинно; виновен F.'],
      ['F','Виновен E или показание D истинно — возможно и то и другое.'],
    ],
    hint:'A и B — точные логические противоположности, поэтому из них истинно ровно одно. Затем следите не только за виновником, но и за самосогласованностью ссылок C, E и F.',
    steps:[
      'A и B противоположны: независимо от виновника одна из этих двух фраз истинна, другая ложна.',
      'Для каждого кандидата A–F нужно получить самосогласованный набор истинностей: значение C зависит от F, E — от B, а F — от D.',
      'Если виновен A, единственный самосогласованный набор даёт 5 истинных показаний; если B — тоже 5; если C — 1; если E — 4; если F — 4.',
      'Только гипотеза «виновен D» даёт ровно три истины: A — ложь, B — истина, C — истина, D — ложь, E — истина, F — ложь.',
      'Проверка замыкается без противоречий: при виновнике D фраза «виновен не D» ложна и F тоже ложно, поэтому C истинно. Всего истинны B, C и E. Ответ — D.',
    ],
  },
  {
    id:'logic:archive-matrix',slug:'arhivnaya-matrica-5x5',number:'003',title:'Архивная матрица 5×5',difficulty:'Экспертная',time:'20–35 минут',answer:'ИРИНА',inputLabel:'Кто был с ключом?',inputHint:'Введите имя.',
    intro:'Анна, Борис, Вера, Глеб и Ирина пришли по одному в 19:10, 19:20, 19:30, 19:40 и 19:50. Каждый посетил ровно одно место — архив, серверную, кабинет, холл или лабораторию — и у каждого был ровно один предмет: ключ, флешка, папка, телефон или жетон. Кто был с ключом?',
    clues:[
      ['01','Вера пришла ровно на 20 минут позже Глеба.'],
      ['02','Лабораторию посетили ровно через 10 минут после Анны.'],
      ['03','Серверную посетили сразу после холла.'],
      ['04','Телефон был у человека, который находился в холле.'],
      ['05','Папка была у человека, который находился в кабинете.'],
      ['06','Флешка была у человека, пришедшего ровно за 10 минут до Анны.'],
      ['07','Человек с ключом пришёл после Бориса, но до Анны.'],
    ],
    hint:'Сначала работайте только со временем. Свяжите пары Вера–Глеб, лаборатория–Анна и флешка–Анна, затем наложите последовательность холл → серверная.',
    steps:[
      'Семь условий образуют единственную полную матрицу. Важно: каждое условие существенно — если убрать любое одно, допустимых матриц становится несколько.',
      'Борис занимает 19:10, холл и телефон. Сразу после холла должна идти серверная — это слот 19:20.',
      'Глеб оказывается в 19:30 в архиве с флешкой: флешка должна быть ровно за 10 минут до Анны, значит Анна приходит в 19:40.',
      'Анна находится в кабинете с папкой. Лаборатория должна быть через 10 минут после неё, поэтому Вера приходит в 19:50 и занимает лабораторию с жетоном.',
      'Остаётся Ирина: 19:20, серверная, ключ. Это также удовлетворяет последнему условию — ключ после Бориса, но до Анны. Ответ — Ирина.',
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
function inputAttrs(p){return `${/^\d+$/.test(p.answer)?'inputmode="numeric"':''} maxlength="${p.answer.length}" placeholder="${'•'.repeat(p.answer.length)}"`;}

function hubHtml(){
  const cards=puzzles.map(p=>`<a class="logic-card" data-puzzle-card="${p.id}" href="./${p.slug}/"><div class="logic-card-top"><span class="logic-card-badge" data-card-badge>Экспертная</span><span>${p.time}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.intro)}</p><span class="logic-card-link">Решить задачу →</span></a>`).join('');
  const demo=puzzles[0];
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#06101b"><title>Сложные логические задачи и головоломки — Mystery Logic</title><meta name="description" content="Экспертные логические задачи без разминок: многошаговая дедукция, самоссылки, коды и логические матрицы. Единственное проверяемое решение и полный разбор."><link rel="canonical" href="${BASE}logicheskie-zadachi/"><meta property="og:title" content="Сложные логические задачи — Mystery Logic"><meta property="og:description" content="Разминок нет. Только задачи, где решение требует нескольких слоёв дедукции."><meta property="og:type" content="website"><link rel="stylesheet" href="../assets/logic-hub.css?v=${VERSION}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:'Сложные логические задачи — Mystery Logic',url:`${BASE}logicheskie-zadachi/`,description:'Экспертные интерактивные логические задачи с проверяемыми решениями.'})}</script></head><body class="logic-page">${header('../')}<main class="logic-wrap"><section class="logic-hero"><div><p class="logic-kicker">Mystery Logic · Expert</p><h1>Разминок<br>не будет</h1><p class="logic-lead">Здесь нет задач на один очевидный ход. Каждая требует нескольких слоёв дедукции, удержания ограничений и проверки альтернатив. Решение всегда единственное — и это проверяется автоматически до публикации.</p><div class="logic-actions"><a class="logic-btn logic-btn-primary" href="#library">Принять вызов</a><a class="logic-btn logic-btn-ghost" data-telegram-cta="hero" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Новая задача в Telegram →</a></div><div class="logic-trust"><div><strong>Только экспертный уровень</strong><span>Никаких задач-заполнителей</span></div><div><strong>Единственное решение</strong><span>Проверяем полным перебором состояний</span></div><div><strong>Полный разбор</strong><span>Почему работает ответ и отпадают альтернативы</span></div></div></div><aside class="logic-demo" data-logic-puzzle="${demo.id}" data-logic-answer="${demo.answer}"><div class="logic-demo-head"><span>Задача ${demo.number}</span><span class="logic-level">${demo.difficulty}</span></div><h2>${esc(demo.title)}</h2><p style="color:#b9c6d3">${esc(demo.inputHint)}</p><div class="logic-clues">${clueMarkup(demo.clues)}</div><div class="logic-answer-row"><input class="logic-input" data-logic-answer-input ${inputAttrs(demo)} aria-label="${esc(demo.inputLabel)}"><button class="logic-btn logic-btn-primary" data-logic-submit type="button">Проверить</button></div><p class="logic-feedback" data-logic-feedback>${esc(demo.inputLabel)}.</p><div class="logic-reveal" data-logic-reveal hidden><h3>Раскрыто: ${demo.answer}</h3><p>Полный пошаговый разбор — на странице задачи.</p><a class="logic-btn logic-btn-ghost" href="./${demo.slug}/">Показать разбор →</a></div></aside></section><section class="logic-section"><div class="logic-section-head"><div><p class="logic-kicker">Принцип отбора</p><h2>Сложность должна быть настоящей</h2></div><p>Мы не маркируем простую задачку словом «сложная». В CI проверяется пространство решений, самосогласованность и необходимость совмещать несколько независимых ограничений.</p></div><div class="logic-categories"><article class="logic-category"><small>01 · Constraint solving</small><h3>Коды</h3><p>Не три подсказки к трём цифрам, а полноценное пространство состояний, которое приходится последовательно сжимать.</p></article><article class="logic-category"><small>02 · Meta logic</small><h3>Самоссылки</h3><p>Истинность одних показаний зависит от других. Нужна не интуиция, а самосогласованная модель.</p></article><article class="logic-category"><small>03 · Logic grid</small><h3>Матрицы</h3><p>Несколько категорий одновременно: люди, время, места и предметы.</p></article><article class="logic-category"><small>04 · Conditional logic</small><h3>Условия</h3><p>Связки «если», «только если», исключающее ИЛИ и ограничения порядка.</p></article><article class="logic-category"><small>05 · Search space</small><h3>Альтернативы</h3><p>Хорошая задача заставляет удерживать несколько правдоподобных веток, прежде чем одна останется.</p></article><article class="logic-category"><small>06 · Detective reasoning</small><h3>Протоколы</h3><p>Сложная логика в форме расследования, а не школьного упражнения.</p></article></div></section><section class="logic-section" id="library"><div class="logic-section-head"><div><p class="logic-kicker">Стартовая коллекция</p><h2>Три задачи. Ни одной проходной.</h2></div><p data-logic-progress data-logic-total="3">0 из 3 раскрыто</p></div><div class="logic-library">${cards}</div></section><section class="logic-section"><div class="logic-premium"><div><p class="logic-kicker">Следующий этап</p><h2>Тематические тома экспертных головоломок.</h2><p>Будущие тома строятся не количеством, а качеством: многошаговая дедукция, разные механики, отсутствие повторяющихся шаблонов и машинная проверка единственности решения.</p><div class="logic-actions"><a class="logic-btn logic-btn-ghost" data-telegram-cta="premium" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Следить за новыми задачами →</a></div></div><aside class="logic-pack"><small>Mystery Logic · Expert series</small><strong>Без наполнителя</strong><ul><li>только высокая и экспертная сложность</li><li>каждая задача проходит логический gate</li><li>пошаговый разбор без «магических» догадок</li><li>новые механики, а не перекрашенные повторы</li></ul></aside></div></section><section class="logic-section"><div class="logic-community"><div><p class="logic-kicker">Следственный отдел</p><h2>Сначала версия. Потом разбор.</h2><p>В Telegram публикуем новые задачи и даём время на собственное решение до выхода разбора.</p></div><a class="logic-btn logic-btn-primary" data-telegram-cta="community" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Вступить в @mysterylogic</a></div></section></main>${footer('../')}${scripts('../')}</body></html>`;
}

function taskHtml(p,index){
  const next=puzzles[(index+1)%puzzles.length];
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#06101b"><title>${esc(p.title)} — сложная логическая задача | Mystery Logic</title><meta name="description" content="${esc(p.intro)} Экспертная задача с единственным решением и пошаговым разбором."><link rel="canonical" href="${BASE}logicheskie-zadachi/${p.slug}/"><meta property="og:title" content="${esc(p.title)} — Mystery Logic"><meta property="og:type" content="article"><link rel="stylesheet" href="../../assets/logic-hub.css?v=${VERSION}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:p.title,mainEntityOfPage:`${BASE}logicheskie-zadachi/${p.slug}/`,inLanguage:'ru'})}</script></head><body class="logic-page">${header('../../')}<main class="logic-wrap"><section class="logic-task-hero"><div class="logic-task-crumbs"><a href="../../">Mystery Logic</a><span>›</span><a href="../">Логические задачи</a><span>›</span><span>Задача ${p.number}</span></div><p class="logic-kicker" style="margin-top:22px">Expert challenge · ${esc(p.difficulty)}</p><h1>${esc(p.title)}</h1><p class="logic-lead">${esc(p.intro)}</p><div class="logic-task-meta"><span>${esc(p.difficulty)}</span><span>◷ ${esc(p.time)}</span><span>Единственное решение</span><span>Без регистрации</span></div></section><div class="logic-task-grid" data-logic-puzzle="${p.id}" data-logic-answer="${p.answer}"><article class="logic-task-panel"><h2>Условия</h2><p>${esc(p.inputHint)}</p><div class="logic-task-list">${clueMarkup(p.clues)}</div></article><aside class="logic-solve-panel"><h2>Ваш ответ</h2><label for="logic-answer-${index}">${esc(p.inputLabel)}</label><input id="logic-answer-${index}" class="logic-input" data-logic-answer-input ${inputAttrs(p)}><div class="logic-solve-actions"><button class="logic-btn logic-btn-primary" data-logic-submit type="button">Проверить</button><button class="logic-btn logic-btn-ghost" data-logic-hint type="button">Подсказка</button></div><p class="logic-feedback" data-logic-feedback>Проверка происходит локально в браузере.</p><div class="logic-reveal" data-logic-hint-copy hidden><h3>Подсказка</h3><p>${esc(p.hint)}</p></div><button class="logic-btn logic-btn-ghost" style="margin-top:10px;width:100%" data-logic-solution-toggle type="button">Показать пошаговый разбор</button><div class="logic-reveal" data-logic-reveal hidden><h3>Ответ: ${p.answer}</h3><ol>${p.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></div><div class="logic-next"><small>Следующий вызов</small><strong style="display:block;margin:6px 0 10px">${esc(next.title)}</strong><a href="../${next.slug}/">Перейти →</a></div></aside></div><section class="logic-section"><div class="logic-community"><div><p class="logic-kicker">Сравнить методы</p><h2>Покажите не ответ, а ход решения.</h2><p>В Следственном отделе Mystery Logic сравниваем способы вывода: на каком ограничении пространство вариантов действительно схлопнулось.</p></div><a class="logic-btn logic-btn-primary" data-telegram-cta="task" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Открыть Telegram</a></div></section></main>${footer('../../')}${scripts('../../')}</body></html>`;
}

function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  if(!fs.existsSync(file)) return 0;
  let html=fs.readFileSync(file,'utf8');
  if(html.includes('data-logic-home-launch')) return 0;
  const block=`<section class="ref-logic-launch" data-logic-home-launch><div class="ref-logic-launch-copy"><p class="ref-kicker">Mystery Logic · Expert</p><h2>Сложные логические задачи</h2><p>Никаких разминок на один ход. Многошаговая дедукция, самоссылки, коды и матрицы с единственным машинно проверенным решением.</p><div class="ref-home-actions ref-home-actions-v2"><a class="ref-btn ref-btn-primary" href="./logicheskie-zadachi/">Принять первый вызов →</a><a class="ref-btn ref-btn-outline" data-telegram-cta="home-logic" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Новые задачи в Telegram</a></div></div><div class="ref-logic-launch-proof"><strong>Без задач-заполнителей</strong><span>Каждая публикация проходит отдельный логический gate: единственность решения и несколько независимых слоёв вывода.</span></div></section>`;
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
