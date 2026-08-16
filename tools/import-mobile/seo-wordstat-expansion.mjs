import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, escapeHtml, estimate } from './common.mjs';
import { siteUrl } from './site-config.mjs';

const lieCategories = new Set(['Кто мог это знать?','Один лжец','Перекрёстные показания','Версии документа']);
const timeCategories = new Set(['Поправка времени','Время и обзор','Время и владение','Маршрут и время','Телефонные журналы','Циклический маршрут','Цепочка времени','Пересечение интервалов','Расписание','Цикл и время','Временные окна','Интервалы и датчики','Два журнала','Маршрут и ограничения']);
const evidenceCategories = new Set(['Следы вмешательства','Доступ и владение','Метки и объекты','Изменение состояния','Отслеживание объекта','Передача карты','Передача предмета','Причина и следствие']);
const spatialCategories = new Set(['Пространственное преобразование','Пространственная логика','Геометрия отражений','Разбиение плоскости','Трёхмерный подсчёт','Пространственное мышление']);
const detectiveCategories = new Set(['Бытовая дедукция','Финальное расследование','Разминка']);

const bucket = (item) => {
  const category = item.category || '';
  if (lieCategories.has(category)) return 'lie';
  if (timeCategories.has(category)) return 'time';
  if (evidenceCategories.has(category)) return 'evidence';
  if (spatialCategories.has(category)) return 'spatial';
  if (detectiveCategories.has(category)) return 'detective';
  return 'logic';
};

const typeLabel = {
  lie: 'детективная загадка на ложь в показаниях',
  time: 'логическая детективная задача на время и маршрут',
  evidence: 'детективная задача по уликам и фактам',
  spatial: 'логическая головоломка на пространственное мышление',
  logic: 'логическая головоломка с ответом',
  detective: 'детективная загадка на логику',
};

const titleLabel = {
  lie: 'детективная загадка',
  time: 'детективная задача на время',
  evidence: 'детективная задача',
  spatial: 'логическая головоломка',
  logic: 'логическая задача',
  detective: 'детективная задача',
};

const seoRoute = (item) => `ru/cases/${item.slug}/`;
const prefixFor = (route) => '../'.repeat(String(route || '').split('/').filter(Boolean).length);

const logicLead = (item) => {
  const logic = String(item.logicType || item.category || 'проверка связанных условий');
  const lowered = logic.charAt(0).toLowerCase() + logic.slice(1);
  switch (bucket(item)) {
    case 'lie': return `Проверьте, кто мог знать важную деталь и чьи слова не сходятся с фактами; основная логика дела — ${lowered}.`;
    case 'time': return `Сведите время, маршрут и последовательность событий; основная логика дела — ${lowered}.`;
    case 'evidence': return `Сопоставьте улики, состояние объектов и показания участников; основная логика дела — ${lowered}.`;
    case 'spatial': return `Работайте с расположением, направлением и пространственными ограничениями; основная логика дела — ${lowered}.`;
    case 'logic': return `Сопоставьте ограничения, порядок и распределение вариантов; основная логика дела — ${lowered}.`;
    default: return `Сопоставьте известные факты и проверьте все версии; основная логика дела — ${lowered}.`;
  }
};

const extraCopy = (item) => {
  switch (bucket(item)) {
    case 'lie': return 'В таких детективных загадках важно отделять то, что герой действительно мог видеть или знать, от деталей, которые появляются в его рассказе без объяснимого источника. Не ищите «подозрительный характер»: проверяйте каждую фразу по материалам дела, времени и доступной участнику информации.';
    case 'time': return 'Задачи на время и маршрут удобнее решать как короткую временную линию. Зафиксируйте исходные моменты, обязательные этапы и длительность переходов, а затем проверьте каждую версию. Если хотя бы один необходимый интервал невозможен, версия не может быть истинной.';
    case 'evidence': return 'В делах по уликам и следам ключевыми становятся объективные изменения: состояние предмета, отметка устройства, след доступа или физическое ограничение. Сначала выпишите факты, которые не зависят от показаний, и только потом сравнивайте с ними версии участников.';
    case 'spatial': return 'Пространственные головоломки лучше решать через схему: направление, взаимное положение объектов и допустимые перемещения. Не полагайтесь на первое визуальное впечатление — переведите условие в несколько точных ограничений и проверяйте варианты по очереди.';
    case 'logic': return 'Логические головоломки этого типа строятся на нескольких связанных ограничениях. Удобно исключать невозможные варианты один за другим, не делая ранних предположений. В результате остаётся единственная конфигурация, совместимая со всеми известными фактами.';
    default: return 'В коротком детективном деле все необходимые данные находятся в условии. Отделите факты от предположений, проверьте каждую версию и найдите конкретное противоречие. Правильный ответ должен следовать из материалов дела, а не из догадки.';
  }
};

const caseSeo = (item) => {
  const kind = bucket(item);
  const h1 = `${item.title} — ${typeLabel[kind]}`;
  let title = `${item.title} — ${titleLabel[kind]} | Mystery Logic`;
  if (title.length > 68) title = `${item.title} | Mystery Logic`;
  const meta = `«${item.title}» — ${titleLabel[kind]}: сопоставьте факты, найдите противоречие и проверьте решение онлайн. ${item.access === 'free' ? 'Бесплатно в браузере без регистрации.' : 'Дело входит в Первый том Mystery Logic.'}`;
  const visible = `«${item.title}» — ${typeLabel[kind]} для взрослых и подростков. ${logicLead(item)} Сопоставьте факты, проверьте версии и найдите единственный доказуемый ответ. ${item.access === 'free' ? 'Играйте онлайн бесплатно и без регистрации; после ответа откроется подробный разбор решения.' : 'Дело входит в Первый том; после открытия доступны все материалы, проверка версии и полный разбор решения.'}`;
  return { h1, title, meta, visible, extra: extraCopy(item) };
};

const patchHeadAndHero = (html, copy) => {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(copy.title)}</title>`);
  out = out.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(copy.meta || copy.description)}">`);
  out = out.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(copy.title)}">`);
  out = out.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(copy.meta || copy.description)}">`);
  out = out.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*<p([^>]*)>[\s\S]*?<\/p>/, `<h1>${escapeHtml(copy.h1)}</h1><p$1>${escapeHtml(copy.description)}</p>`);
  out = out.replaceAll('Бюро интерактивных расследований', 'Бюро детективных игр');
  out = out.replaceAll('Интерактивное расследование', 'Детективная игра');
  out = out.replaceAll('Интерактивные расследования', 'Детективные игры');
  out = out.replaceAll('Interactive investigations', 'Detective logic games');
  return out;
};

const writePage = (siteRoot, route, html) => {
  const dir = path.join(siteRoot, route);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
};

const hubCopy = [
  ['index.html', { h1:'Mystery Logic — детективные игры, загадки и головоломки', title:'Детективные игры онлайн — Mystery Logic', meta:'Mystery Logic — детективные игры онлайн, логические загадки и головоломки. 15 дел доступны бесплатно в браузере без регистрации.', description:'Mystery Logic — детективные игры онлайн для тех, кому нравятся логика, загадки и короткие расследования. Изучайте улики и показания, находите противоречия, проверяйте версии и раскрывайте детективные дела с доказуемым ответом. Начать можно бесплатно прямо в браузере, без регистрации и установки.' }],
  ['kto-vret/index.html', { h1:'«Кто врёт?» — детективная игра со 100 делами', title:'«Кто врёт?» — 100 детективных дел | Mystery Logic', meta:'«Кто врёт?» — 100 коротких детективных дел с уликами, показаниями и доказуемым ответом. Первые 15 дел доступны бесплатно.', description:'«Кто врёт?» — серия коротких детективных игр и расследований Mystery Logic. В каждом деле есть обстоятельства, несколько показаний и версия, которая не сходится с фактами. Найдите, кто говорит неправду, докажите ответ и сравните своё решение с полным разбором. Первые 15 дел доступны бесплатно.' }],
  ['dela/index.html', { h1:'Архив «Кто врёт?» — 100 детективных дел', title:'Архив «Кто врёт?» — 100 детективных дел | Mystery Logic', meta:'Архив Mystery Logic: 15 бесплатных детективных дел и полный Первый том из 100 логических расследований.', description:'Архив детективных дел Mystery Logic: короткие загадки, логические задачи и расследования разной сложности. 15 дел можно пройти бесплатно, а полный Первый том содержит 100 расследований. Выбирайте дело по теме и сложности, продолжайте с сохранённого места и возвращайтесь к уже раскрытым делам.' }],
  ['tom-1/index.html', { h1:'Первый том «Кто врёт?» — 100 детективных расследований', title:'Первый том «Кто врёт?» — 100 расследований | Mystery Logic', meta:'Первый том Mystery Logic: 100 коротких детективных дел. 15 доступны бесплатно, ещё 85 открываются одной покупкой за 99 ₽ без подписки.', description:'Первый том Mystery Logic объединяет 100 коротких детективных дел, логических загадок и расследований. 15 дел доступны бесплатно, ещё 85 открываются одной покупкой за 99 ₽. Без подписки и рекламы: можно проходить дела в своём темпе, сохранять прогресс и возвращаться к расследованиям позже.' }],
  ['detektivnye-igry-onlayn/index.html', { h1:'Детективные игры онлайн бесплатно', title:'Детективные игры онлайн бесплатно — 15 дел | Mystery Logic', meta:'Детективные игры онлайн бесплатно: 15 коротких дел прямо в браузере без регистрации. Изучайте показания, находите противоречия и проверяйте версии.', description:'Играйте в детективные игры онлайн бесплатно и без регистрации. Выберите короткое расследование, изучите обстоятельства и показания участников, найдите ложь или логическое противоречие и проверьте свою версию. Все дела работают прямо в браузере на русском языке, а после ответа открывается подробное доказательство.' }],
  ['detektivnye-zagadki-s-otvetami/index.html', { h1:'Детективные загадки на логику с ответами', title:'Детективные загадки на логику с ответами | Mystery Logic', meta:'Детективные загадки на логику с ответами для взрослых и подростков. Найдите противоречие и после выбора получите подробный разбор решения.', description:'Детективные загадки на логику для взрослых и подростков с подробными ответами. В каждой истории нужно сопоставить показания, время, маршруты и доступную героям информацию, чтобы найти невозможную версию. Сначала решите загадку самостоятельно, а затем откройте ответ и полный разбор логики.' }],
  ['logicheskie-detektivnye-zadachi/index.html', { h1:'Логические детективные задачи с ответами онлайн', title:'Логические детективные задачи с ответами онлайн | Mystery Logic', meta:'Логические детективные задачи онлайн: время, маршруты, журналы доступа, показания и подробные ответы с доказательством.', description:'Решайте логические детективные задачи онлайн: проверяйте временные линии, маршруты, журналы доступа, последовательность событий и показания свидетелей. Это задачи на логику для взрослых и подростков, где правильный ответ следует из известных фактов, а после решения можно проверить всю цепочку рассуждений.' }],
  ['kto-vret-igra/index.html', { h1:'Игра «Кто врёт?» онлайн — найдите, кто говорит неправду', title:'Игра «Кто врёт?» онлайн — найдите ложь в показаниях', meta:'Игра «Кто врёт?» онлайн: сопоставьте показания с фактами, найдите невозможную деталь и получите полный логический разбор.', description:'Онлайн-игра «Кто врёт?» построена не на угадывании эмоций, а на логике. Сопоставьте показания участников с фактами дела, определите, кто не мог видеть, знать или сделать то, о чём говорит, и найдите лжеца. После выбора игра покажет правильный ответ и объяснит найденное противоречие.' }],
  ['ru/besplatnye-detektivnye-dela/index.html', { h1:'15 бесплатных детективных дел онлайн', title:'15 бесплатных детективных дел онлайн | Mystery Logic', meta:'15 бесплатных детективных дел онлайн без регистрации. Изучайте материалы, находите противоречия и сразу проверяйте решение.', description:'Откройте 15 бесплатных детективных дел и играйте онлайн без регистрации. Каждое расследование занимает несколько минут: прочитайте материалы, изучите показания, найдите логическое противоречие и выберите ответ. После раскрытия дела доступен подробный разбор, а затем можно перейти к следующей загадке.' }],
];

const newHubs = [
  {
    slug:'golovolomki-onlayn',
    title:'Головоломки онлайн для взрослых — бесплатно | Mystery Logic',
    h1:'Логические головоломки онлайн для взрослых — бесплатно',
    description:'Бесплатные логические головоломки онлайн для взрослых и подростков: играйте прямо в браузере без регистрации и установки. Вместо абстрактных чисел — детективные истории, показания, временные линии и противоречия. Выберите головоломку, найдите решение и сразу проверьте ответ с подробным объяснением.',
    sections:[
      ['Головоломки онлайн без регистрации','Mystery Logic запускается прямо в браузере: не нужно создавать аккаунт, устанавливать программу или вводить данные, чтобы начать бесплатные дела. Вы получаете условия задачи, несколько проверяемых фактов и возможность сразу проверить свою версию.'],
      ['Логические головоломки для взрослых','В подборке есть задачи на порядок, чётность, время, маршруты, распределение предметов, пространственное мышление и поиск невозможной версии. Это короткие задачи для тех, кому интереснее строгая логика, чем случайный подвох.'],
      ['Головоломки с ответами и объяснениями','Ответ открывается после вашего выбора вместе с цепочкой рассуждения. Поэтому можно не просто узнать правильный вариант, а проверить, какие условия были ключевыми и где именно исключаются остальные версии.']
    ]
  },
  {
    slug:'zagadki-na-logiku-dlya-vzroslyh',
    title:'Загадки на логику для взрослых с ответами | Mystery Logic',
    h1:'Загадки на логику для взрослых с ответами',
    description:'Сложные и интересные загадки на логику для взрослых с ответами и подробными объяснениями. Здесь нужно не угадывать подвох, а внимательно сопоставлять несколько условий и находить единственно возможное решение. Начните с коротких бесплатных задач, а затем переходите к полноценным детективным делам.',
    sections:[
      ['Сложные загадки на логику взрослым','Вместо одной случайной хитрости задачи строятся на нескольких связанных ограничениях. Нужно восстановить порядок событий, проверить временную линию, понять источник знания или исключить невозможное распределение.'],
      ['Как решать логические загадки','Сначала отделите твёрдые факты от предположений. Затем переводите каждую версию в проверяемые условия и исключайте те, которые нарушают хотя бы одно из них. Такой подход работает и в коротких головоломках, и в больших детективных делах.'],
      ['Ответы без спойлера до решения','Mystery Logic не показывает разгадку заранее. Сначала вы выбираете версию, после чего открывается полный разбор: ключевой факт, ограничение и вывод. Так ответ становится проверкой вашего рассуждения, а не подсказкой.']
    ]
  },
  {
    slug:'detektivnye-igry-dlya-dvoih',
    title:'Детективная игра для двоих онлайн | Mystery Logic',
    h1:'Детективная игра для двоих онлайн',
    description:'Детективные игры для двоих онлайн: раскройте одно расследование, отправьте вызов другу и сравните результат. Оба игрока получают одинаковые материалы, но проходят дело отдельно, после чего можно сопоставить скорость, количество попыток и итог. Начать можно бесплатно прямо в браузере.',
    sections:[
      ['Как играть вдвоём','Сначала один игрок раскрывает бесплатное дело и после результата создаёт вызов. Друг получает ссылку на то же расследование, проходит его самостоятельно и не видит чужой ответ до завершения.'],
      ['Одинаковое дело — отдельный результат','Оба игрока работают с одинаковыми материалами, поэтому сравнение честное. У каждого сохраняются собственные попытки и время, а после прохождения можно увидеть результат против друга.'],
      ['Детективная игра без общего экрана','Не нужно одновременно сидеть за одним устройством или созваниваться. Вызов асинхронный: отправьте ссылку сейчас, а друг может принять его позже с телефона или компьютера.']
    ]
  }
];

const hubPage = (hub, freeCases) => {
  const canonical = siteUrl(`${hub.slug}/`);
  const links = freeCases.slice(0, 6).map((item) => `<a class="seo-case-card" href="../${seoRoute(item)}"><strong>${escapeHtml(item.title)}</strong><span>Дело № ${escapeHtml(item.number)} · ${escapeHtml(item.difficulty || 'Среднее')} · ≈ ${estimate(item.difficulty)} минут</span></a>`).join('');
  const sections = hub.sections.map(([heading,text]) => `<section class="seo-content-section"><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p></section>`).join('');
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#07111d"><meta name="description" content="${escapeHtml(hub.description)}"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="../assets/mysterylogic.css"><link rel="stylesheet" href="../assets/premium.css?v=1.1.0"><meta property="og:title" content="${escapeHtml(hub.title)}"><meta property="og:description" content="${escapeHtml(hub.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><title>${escapeHtml(hub.title)}</title></head><body><header class="ml-header ml-shell"><a class="ml-brand" href="../"><span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Detective logic games</small></span></a><nav class="ml-nav"><a href="../detektivnye-igry-onlayn/">Играть онлайн</a><a href="../dela/">Бесплатные дела</a><a href="../tom-1/">Первый том</a></nav></header><main class="ml-shell"><section class="catalog-hero"><div class="catalog-hero-grid"><div><p class="ml-kicker">Mystery Logic · логика и детектив</p><h1>${escapeHtml(hub.h1)}</h1><p>${escapeHtml(hub.description)}</p><div class="ml-actions"><a class="ml-button ml-button-primary" href="../${seoRoute(freeCases[0])}">Начать бесплатно</a><a class="ml-button ml-button-secondary" href="../dela/">Все бесплатные дела</a></div></div><aside class="catalog-case-file"><small>БРАУЗЕР · БЕЗ РЕГИСТРАЦИИ</small><strong>15</strong><p>бесплатных задач<br>с проверкой версии<br>и подробным ответом</p></aside></div></section><section class="seo-case-links">${links}</section>${sections}<section class="ml-copy-section"><div><p class="ml-kicker">Продолжить</p><h2>От короткой задачи к полному тому</h2></div><div class="ml-copy"><p>Бесплатные дела знакомят с разными типами логики. Если формат подходит, Первый том «Кто врёт?» содержит 100 расследований: 15 открытых и ещё 85 после одной покупки без подписки.</p><p><a href="../tom-1/">Посмотреть Первый том</a> · <a href="../detektivnye-zagadki-s-otvetami/">Детективные загадки с ответами</a></p></div></section></main></body></html>`;
};

const premiumTeaser = (item, allCases) => {
  const route = seoRoute(item);
  const prefix = prefixFor(route);
  const canonical = siteUrl(route);
  const seo = caseSeo(item);
  const byId = new Map(allCases.map((value) => [value.id, value]));
  const related = (item.relatedCases || []).map((id) => byId.get(id)).filter(Boolean).slice(0, 4);
  const relatedLinks = related.map((value) => `<a href="${prefix}${seoRoute(value)}">${escapeHtml(value.title)}</a>`).join(' · ');
  const schema = JSON.stringify({ '@context':'https://schema.org', '@type':'WebPage', name:seo.h1, url:canonical, description:seo.meta, inLanguage:'ru', isPartOf:{'@type':'WebSite',name:'Mystery Logic',url:siteUrl('')} }).replaceAll('<','\\u003c');
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#08111d"><meta name="description" content="${escapeHtml(seo.meta)}"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="ru" href="${canonical}"><link rel="alternate" hreflang="x-default" href="${canonical}"><link rel="stylesheet" href="${prefix}assets/mysterylogic.css"><link rel="stylesheet" href="${prefix}assets/full-catalog.css"><link rel="stylesheet" href="${prefix}assets/premium.css?v=1.1.0"><meta property="og:title" content="${escapeHtml(seo.title)}"><meta property="og:description" content="${escapeHtml(seo.meta)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><title>${escapeHtml(seo.title)}</title><script type="application/ld+json">${schema}</script></head><body><header class="ml-header ml-shell"><a class="ml-brand" href="${prefix}"><span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Detective logic games</small></span></a><nav class="ml-nav"><a href="${prefix}dela/">Бесплатные дела</a><a href="${prefix}tom-1/">Первый том</a></nav></header><main class="ml-shell" data-premium-seo-teaser="true"><section class="catalog-hero"><div class="catalog-hero-grid"><div><p class="ml-kicker">Дело № ${escapeHtml(item.number)} · Первый том</p><h1>${escapeHtml(seo.h1)}</h1><p>${escapeHtml(seo.visible)}</p><div class="case-meta"><span>${escapeHtml(item.difficulty || 'Среднее')}</span><span>${escapeHtml(item.category || 'Логика')}</span><span>≈ ${estimate(item.difficulty)} минут</span></div><div class="ml-actions"><a class="ml-button ml-button-primary" href="${prefix}tom-1/">Открыть Первый том</a><a class="ml-button ml-button-secondary" href="${prefix}ru/besplatnye-detektivnye-dela/">Сначала бесплатные дела</a></div></div><aside class="catalog-case-file"><small>MYSTERY LOGIC / CASE ${escapeHtml(item.number)}</small><strong>85</strong><p>дополнительных дел<br>в полном первом томе<br>без публикации спойлеров</p></aside></div></section><section class="ml-copy-section"><div><p class="ml-kicker">Без спойлеров</p><h2>Как решать дело «${escapeHtml(item.title)}»</h2></div><div class="ml-copy"><p>${escapeHtml(seo.extra)}</p><p>${escapeHtml(logicLead(item))} Все необходимые материалы и варианты ответа открываются только после получения доступа к делу.</p></div></section><section class="ml-copy-section"><div><p class="ml-kicker">Формат дела</p><h2>${escapeHtml(item.category || 'Логическая детективная задача')}</h2></div><div class="ml-copy"><p>Сложность: ${escapeHtml(item.difficulty || 'Среднее')}. Ориентировочное время решения — около ${estimate(item.difficulty)} минут. Задача построена так, чтобы ответ следовал из условий и мог быть проверен по фактам.</p><p>${relatedLinks ? `Похожие дела: ${relatedLinks}.` : ''} <a href="${prefix}dela/">Открыть бесплатный архив</a>.</p></div></section></main></body></html>`;
};

const patchFreeCase = (siteRoot, item) => {
  const file = path.join(siteRoot, seoRoute(item), 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Не найдена бесплатная SEO-страница ${seoRoute(item)}`);
  const seo = caseSeo(item);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(seo.meta)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(seo.title)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(seo.meta)}">`);
  html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, `<h1>${escapeHtml(seo.h1)}</h1>`);
  html = html.replace(/<p class="ktv-cover-lead">[\s\S]*?<\/p>/, `<p class="ktv-cover-lead">${escapeHtml(seo.visible)}</p>`);
  html = html.replaceAll('Интерактивное расследование', 'Детективная игра');
  html = html.replaceAll('Interactive investigations', 'Detective logic games');
  if (!html.includes('data-wordstat-seo-copy')) {
    const block = `<section class="ml-shell ml-copy-section" data-wordstat-seo-copy><div><p class="ml-kicker">Задача на логику</p><h2>Как решать дело «${escapeHtml(item.title)}» без спойлеров</h2></div><div class="ml-copy"><p>${escapeHtml(seo.extra)}</p><p>${escapeHtml(logicLead(item))}</p></div></section>`;
    html = html.replace('<footer class="ml-case-footer">', `${block}<footer class="ml-case-footer">`);
  }
  fs.writeFileSync(file, html);
};

export const seoExpansionSlugs = newHubs.map((hub) => hub.slug);

export function applyWordstatSeoExpansion(siteRoot, cases) {
  let patchedHubs = 0;
  for (const [relative, copy] of hubCopy) {
    const file = path.join(siteRoot, relative);
    if (!fs.existsSync(file)) throw new Error(`SEO hub not found: ${relative}`);
    fs.writeFileSync(file, patchHeadAndHero(fs.readFileSync(file, 'utf8'), copy));
    patchedHubs += 1;
  }

  const freeCases = cases.filter((item) => item.access === 'free');
  for (const item of freeCases) patchFreeCase(siteRoot, item);

  let premiumTeaserPages = 0;
  for (const item of cases.filter((value) => value.access !== 'free')) {
    writePage(siteRoot, seoRoute(item), premiumTeaser(item, cases));
    premiumTeaserPages += 1;
  }

  for (const hub of newHubs) writePage(siteRoot, `${hub.slug}/`, hubPage(hub, freeCases));

  return {
    caseRoutes: cases.map((item) => seoRoute(item)),
    premiumTeaserPages,
    updatedFreeCasePages: freeCases.length,
    updatedHubPages: patchedHubs,
    newHubPages: newHubs.length,
    hubSlugs: seoExpansionSlugs,
  };
}
