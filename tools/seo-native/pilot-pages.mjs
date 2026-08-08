import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, escapeHtml } from '../import-mobile/common.mjs';
import { buildPilotCaseEntities, canonicalPublicPathFor } from './case-entity.mjs';
import { getCollection } from './collection-entity.mjs';
import { buildGameConfig } from './game-config.mjs';

const BASE = 'https://valera2872.github.io/ktovret-web/';
const VERSION = '1.7.0';
const OG_DEFAULT = `${BASE}assets/og-case-default.svg`;
const safeJson = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

const abs = (relative) => new URL(relative, BASE).href;

const statementHtml = (item) => {
  const chars = item.characters || [];
  if (!chars.length) return '<p>В этом деле нет отдельных свидетелей: решите задачу по условиям и материалам.</p>';
  return `<div class="seo-case-prerender__witness-grid">${chars.map((character) => `<article class="seo-case-prerender__witness"><strong>${escapeHtml(character.name || 'Свидетель')}</strong>${character.role ? `<small>${escapeHtml(character.role)}</small>` : ''}<blockquote>«${escapeHtml(character.statement || '')}»</blockquote></article>`).join('')}</div>`;
};

const staticPrerender = (entity, item) => `<article class="seo-case-prerender" data-seo-static="true" itemscope itemtype="https://schema.org/Game"><div class="seo-case-prerender__meta"><span>Дело № ${escapeHtml(entity.number)}</span><span>${escapeHtml(entity.difficulty)}</span><span>${escapeHtml(entity.category)}</span><span>≈ ${escapeHtml(String(entity.estimated_minutes))} минут</span></div><h1 itemprop="name">${escapeHtml(entity.title)}</h1><p class="seo-case-prerender__lead" itemprop="description">${escapeHtml(entity.short_description)}</p><section class="seo-case-prerender__story" aria-labelledby="seo-story-${escapeHtml(entity.id)}"><h2 id="seo-story-${escapeHtml(entity.id)}">Обстоятельства дела</h2><p>${escapeHtml(entity.story)}</p></section><section class="seo-case-prerender__witnesses" aria-labelledby="seo-witnesses-${escapeHtml(entity.id)}"><h2 id="seo-witnesses-${escapeHtml(entity.id)}">Показания</h2>${statementHtml(item)}</section><p class="seo-case-prerender__start">Начните расследование — без регистрации</p><noscript><p>Для выбора версии и проверки ответа включите JavaScript. Сюжет и показания доступны выше без JavaScript.</p></noscript></article>`;

const relatedSection = (entity, entities, collection) => {
  const related = entities.filter((item) => entity.related_cases.includes(item.id));
  return `<section class="ml-shell seo-case-related" aria-labelledby="related-${escapeHtml(entity.id)}"><div><p class="ml-kicker">Продолжить расследование</p><h2 id="related-${escapeHtml(entity.id)}">Похожие дела</h2></div><div class="seo-case-related__grid">${related.map((item) => `<a href="${abs(item.routes.canonical)}" data-analytics-next="related">${escapeHtml(item.title)}<br><small>${escapeHtml(item.category)} · ${escapeHtml(item.difficulty)}</small></a>`).join('')}<a href="${abs(collection.route)}" data-analytics-next="collection">${escapeHtml(collection.title)}<br><small>Открыть всю подборку</small></a><a href="${abs('dela/')}" data-analytics-next="library">Все 100 дел<br><small>Полная библиотека</small></a></div></section>`;
};

const schemaFor = (entity, collection) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['WebPage', 'Game'],
      name: entity.title,
      url: abs(entity.routes.canonical),
      description: entity.short_description,
      inLanguage: entity.language,
      isAccessibleForFree: entity.free,
      genre: ['Detective', 'Logic puzzle'],
      about: entity.category,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Mystery Logic', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Кто врёт?', item: abs('kto-vret/') },
        { '@type': 'ListItem', position: 3, name: collection.title, item: abs(collection.route) },
        { '@type': 'ListItem', position: 4, name: entity.title, item: abs(entity.routes.canonical) },
      ],
    },
  ],
});

const pageHtml = (entity, item, entities, collection) => {
  const canonical = abs(entity.routes.canonical);
  const config = buildGameConfig(item);
  config.permalink = canonical;
  const nextIndex = (entities.findIndex((value) => value.id === entity.id) + 1) % entities.length;
  const next = entities[nextIndex];
  const related = entities.filter((value) => entity.related_cases.includes(value.id));
  const seoRuntime = {
    language: entity.language,
    canonical,
    next: next ? { title: next.title, url: abs(next.routes.canonical) } : null,
    related: related.map((value) => ({ title: value.title, url: abs(value.routes.canonical) })),
    collection: { title: collection.title, url: abs(collection.route) },
    library: { title: 'Все дела', url: abs('dela/') },
  };
  const ogImage = entity.image ? abs(entity.image) : OG_DEFAULT;
  const schema = schemaFor(entity, collection);

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#08111d"><meta name="description" content="${escapeHtml(entity.seo.description)}"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="ru" href="${canonical}"><link rel="alternate" hreflang="x-default" href="${canonical}"><link rel="icon" href="../../../assets/ml-mark.svg" type="image/svg+xml"><link rel="stylesheet" href="../../../assets/mysterylogic.css"><link rel="stylesheet" href="../../../assets/full-catalog.css"><link rel="stylesheet" href="../../../ktovret-game/assets/style.css"><link rel="stylesheet" href="../../../assets/premium.css?v=1.1.0"><link rel="stylesheet" href="../../../assets/premium-game.css?v=1.4.0"><link rel="stylesheet" href="../../../assets/premium-game-compat.css?v=1.4.0"><link rel="stylesheet" href="../../../assets/witness-cycle.css?v=1.4.0"><link rel="stylesheet" href="../../../assets/seo-case.css?v=${VERSION}"><meta property="og:title" content="${escapeHtml(entity.seo.og_title)}"><meta property="og:description" content="${escapeHtml(entity.seo.og_description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${ogImage}"><meta property="og:locale" content="ru_RU"><title>${escapeHtml(entity.seo.title)}</title><script type="application/ld+json">${safeJson(schema)}</script></head><body class="ktv-case-page"><div class="ktv-ambient" aria-hidden="true"></div><div class="ml-brand-strip"><div class="ml-brand-strip-inner"><a class="ml-brand" href="${BASE}"><span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Interactive investigations</small></span></a><nav class="ml-brand-strip-nav"><a href="${abs('kto-vret/')}">Кто врёт?</a><a href="${abs('dela/')}">Все дела</a></nav></div></div><main class="ktv-game-shell" data-ktv-root data-seo-native="1.7" data-case-id="${escapeHtml(entity.id)}">${staticPrerender(entity, item)}</main><script src="../../../assets/generated/cases-index.js?v=${VERSION}"></script><script src="../../../assets/dossier-model.js?v=${VERSION}"></script><script>window.KtoVretWeb=${safeJson(config)};window.KtoVretSeo=${safeJson(seoRuntime)};</script><script src="../../../ktovret-game/assets/app.js?v=1.4.1"></script><script src="../../../ktovret-game/assets/performance.js?v=1.4.1"></script><script src="../../../assets/case-adapter.js?v=1.4.0"></script><script src="../../../assets/mobile-scroll-stabilizer.js?v=1.4.1"></script><script src="../../../assets/seo-case-runtime.js?v=${VERSION}"></script><script src="../../../assets/analytics-events.js?v=${VERSION}"></script>${relatedSection(entity, entities, collection)}<footer class="ml-case-footer">Дело из серии <a href="${abs('kto-vret/')}">«Кто врёт?»</a> · <a href="${abs('dela/')}">вся библиотека</a> · Mystery Logic</footer></body></html>`;
};

const patchLegacy = (siteRoot, entity) => {
  const page = path.join(siteRoot, entity.routes.legacy, 'index.html');
  if (!fs.existsSync(page)) throw new Error(`Legacy page missing for ${entity.id}: ${entity.routes.legacy}`);
  let html = fs.readFileSync(page, 'utf8');
  const canonical = abs(entity.routes.canonical);
  html = html.replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${canonical}">`);
  if (!/<meta name="robots"/i.test(html)) html = html.replace('<meta name="description"', '<meta name="robots" content="noindex,follow"><meta name="description"');
  else html = html.replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="noindex,follow">');
  fs.writeFileSync(page, html);
};

export function writeSeoNativePilot(siteRoot, cases) {
  const entities = buildPilotCaseEntities(cases);
  const collection = getCollection('kto-vret-free');
  if (!collection) throw new Error('Pilot collection is missing');
  const itemById = new Map(cases.map((item) => [item.id, item]));

  for (const entity of entities) {
    const item = itemById.get(entity.id);
    const dir = path.join(siteRoot, entity.routes.canonical);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(entity, item, entities, collection));
    patchLegacy(siteRoot, entity);
  }

  const publicManifest = entities.map((entity) => ({
    id: entity.id,
    title: entity.title,
    slug: entity.slug,
    language: entity.language,
    status: entity.status,
    access: entity.access,
    path: entity.routes.canonical,
    legacyPath: entity.routes.legacy,
    shortDescription: entity.short_description,
    difficulty: entity.difficulty,
    category: entity.category,
    collectionId: entity.collection_id,
    relatedCases: entity.related_cases,
  }));
  const generated = path.join(siteRoot, 'assets/generated');
  ensureDir(generated);
  fs.writeFileSync(path.join(generated, 'seo-native-pilot.json'), JSON.stringify(publicManifest, null, 2));

  return {
    entities,
    canonicalPaths: new Map(entities.map((entity) => [entity.id, entity.routes.canonical])),
    canonicalPublicPathFor,
  };
}
