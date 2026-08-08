import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, escapeHtml, estimate } from './common.mjs';

const base = 'https://valera2872.github.io/ktovret-web/';
const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
const depth = (route) => String(route || '').split('/').filter(Boolean).length;
const prefixFor = (route) => '../'.repeat(depth(route));
const absolute = (route) => `${base}${String(route || '').replace(/^\/+/, '')}`;

const card = (item, prefix) => `
  <article class="case-card" data-access="free">
    <div class="case-card-visual" data-code="ML-${escapeHtml(item.number)}"></div>
    <div class="case-card-body">
      <div class="case-head"><span class="case-num">Дело № ${escapeHtml(item.number)}</span><span class="case-free">Бесплатно</span></div>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.shortDescription || item.intro)}</p>
      <div class="case-meta"><span>${escapeHtml(item.difficulty || 'Среднее')}</span><span>${escapeHtml(item.category || 'Логика')}</span><span>≈ ${estimate(item.difficulty)} минут</span></div>
      <a href="${prefix}${item.path}">Начать расследование →</a>
    </div>
  </article>`;

export function writeCollectionPages(siteRoot, collections, cases) {
  const byId = new Map(cases.map((item) => [item.id, item]));
  const written = [];

  for (const collection of collections.filter((item) => item.indexable === true && item.status === 'published')) {
    const members = (collection.caseIds || []).map((id) => byId.get(id)).filter(Boolean);
    if (members.length < Number(collection.minimumCases || 1)) {
      throw new Error(`Коллекция ${collection.id} не достигла минимального размера`);
    }

    const route = collection.route;
    if (!route) throw new Error(`У индексируемой коллекции ${collection.id} нет route`);
    const prefix = prefixFor(route);
    const canonical = absolute(route);
    const title = `${collection.title} | Mystery Logic`;
    const description = collection.description;
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: collection.title,
          url: canonical,
          description,
          inLanguage: collection.language || 'ru',
          isPartOf: { '@type': 'WebSite', name: 'Mystery Logic', url: base },
        },
        {
          '@type': 'ItemList',
          numberOfItems: members.length,
          itemListElement: members.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            url: absolute(item.path),
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Mystery Logic', item: base },
            { '@type': 'ListItem', position: 2, name: 'Кто врёт?', item: `${base}kto-vret/` },
            { '@type': 'ListItem', position: 3, name: collection.shortTitle || collection.title, item: canonical },
          ],
        },
      ],
    };

    const html = `<!doctype html><html lang="${escapeHtml(collection.language || 'ru')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#07111d"><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="${escapeHtml(collection.language || 'ru')}" href="${canonical}"><link rel="alternate" hreflang="x-default" href="${canonical}"><link rel="stylesheet" href="${prefix}assets/mysterylogic.css"><link rel="stylesheet" href="${prefix}assets/full-catalog.css"><link rel="stylesheet" href="${prefix}assets/premium.css?v=1.1.0"><meta property="og:title" content="${escapeHtml(collection.title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${base}assets/ml-mark.svg"><title>${escapeHtml(title)}</title><script type="application/ld+json">${json(schema)}</script></head><body><header class="ml-header ml-shell"><a class="ml-brand" href="${prefix}"><span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Interactive investigations</small></span></a><nav class="ml-nav"><a href="${prefix}kto-vret/">О серии</a><a href="${prefix}dela/">Все 100 дел</a></nav></header><main class="ml-shell"><section class="catalog-hero"><div class="catalog-hero-grid"><div><p class="ml-kicker">Бесплатная подборка · ${members.length} дел</p><h1>${escapeHtml(collection.title)}</h1><p>${escapeHtml(collection.intro)}</p><div class="ml-actions"><a class="ml-button ml-button-primary" href="${prefix}${members[0].path}">Начать с первого дела</a><a class="ml-button ml-button-secondary" href="${prefix}dela/">Полная библиотека</a></div></div><aside class="catalog-case-file"><small>MYSTERY LOGIC / FREE DOSSIER</small><strong>${members.length}</strong><p>полных расследований<br>без регистрации<br>с мгновенной проверкой</p></aside></div></section><section class="ml-copy-section"><div><p class="ml-kicker">Как устроена подборка</p><h2>Каждое дело — самостоятельная игровая страница</h2></div><div class="ml-copy"><p>Можно открыть любое расследование напрямую, изучить обстоятельства и показания, выбрать версию и сразу получить разбор. Дела не требуют прохождения по порядку.</p><p>Если хотите продолжить после решения, на странице каждого дела есть следующее расследование, похожие задачи и возврат к этой подборке.</p></div></section><section class="case-set" aria-labelledby="free-cases-list"><div class="set-heading"><div><p class="ml-kicker">Открытый архив</p><h2 id="free-cases-list">Все ${members.length} бесплатных дел</h2><p>Выберите любое расследование и начните без регистрации.</p></div><span>${members.length} дел</span></div><div class="case-grid">${members.map((item) => card(item, prefix)).join('')}</div></section><section class="ml-copy-section"><div><p class="ml-kicker">Дальше</p><h2>Полный первый том</h2></div><div class="ml-copy"><p>В общем каталоге Mystery Logic уже собраны 100 активных дел: эти ${members.length} доступны бесплатно, остальные 85 относятся к полному первому тому и будут открываться после подключения доступа.</p><p><a href="${prefix}dela/">Перейти в каталог 100 дел</a> · <a href="${prefix}kto-vret/">О серии «Кто врёт?»</a></p></div></section></main></body></html>`;

    const dir = path.join(siteRoot, route);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    written.push({ id: collection.id, route, caseCount: members.length });
  }

  return written;
}
