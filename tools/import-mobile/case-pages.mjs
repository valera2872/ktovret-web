import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, escapeHtml, estimate } from './common.mjs';

const base = 'https://valera2872.github.io/ktovret-web/';
const version = '1.7.0';

const splitFacts = (intro) => String(intro || '')
  .split(/\n+|(?<=[.!?])\s+/u)
  .map((value) => value.replace(/^[•\-]\s*/, '').trim())
  .filter(Boolean)
  .filter((value) => !/^известно\s*:?$/iu.test(value))
  .slice(0, 6)
  .map((value, index) => ({ label: `Факт ${index + 1}`, value }));

const steps = (item) => Array.isArray(item.explanation?.reasoningSteps)
  && item.explanation.reasoningSteps.length
  ? item.explanation.reasoningSteps.slice(0, 5)
  : String(item.explanation?.fullReason || '')
    .split(/(?<=[.!?])\s+/u)
    .filter(Boolean)
    .slice(0, 4);

const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
const routeDepth = (route) => String(route || '').split('/').filter(Boolean).length;
const prefixFor = (route) => '../'.repeat(routeDepth(route));
const absolute = (route) => `${base}${String(route || '').replace(/^\/+/, '')}`;

const head = (item, { locked = false, route = item.path, canonicalRoute = item.path, noindex = locked } = {}) => {
  const url = absolute(canonicalRoute);
  const description = item.shortDescription || `Короткое детективное дело категории ${item.category || 'логика'} из серии «Кто врёт?».`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: item.title,
        url,
        description,
        inLanguage: item.language || 'ru',
        isPartOf: { '@type': 'WebSite', name: 'Mystery Logic', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mystery Logic', item: base },
          { '@type': 'ListItem', position: 2, name: 'Кто врёт?', item: `${base}kto-vret/` },
          { '@type': 'ListItem', position: 3, name: 'Каталог дел', item: `${base}dela/` },
          { '@type': 'ListItem', position: 4, name: item.title, item: url },
        ],
      },
    ],
  };
  const prefix = prefixFor(route);
  const robots = noindex ? '<meta name="robots" content="noindex,follow">' : '';
  const ogImage = `${base}assets/ml-mark.svg`;

  return `<!doctype html><html lang="${escapeHtml(item.language || 'ru')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#08111d"><meta name="description" content="${escapeHtml(description)}">${robots}<link rel="canonical" href="${url}"><link rel="alternate" hreflang="ru" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}"><link rel="icon" href="${prefix}assets/ml-mark.svg" type="image/svg+xml"><link rel="stylesheet" href="${prefix}assets/mysterylogic.css"><link rel="stylesheet" href="${prefix}assets/full-catalog.css"><link rel="stylesheet" href="${prefix}ktovret-game/assets/style.css"><link rel="stylesheet" href="${prefix}assets/premium.css?v=1.1.0"><link rel="stylesheet" href="${prefix}assets/premium-game.css?v=${version}"><link rel="stylesheet" href="${prefix}assets/premium-game-compat.css?v=${version}"><meta property="og:title" content="${escapeHtml(item.title)} — детективное дело"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:image" content="${ogImage}"><meta name="twitter:card" content="summary_large_image"><title>${escapeHtml(item.title)} — детективное дело | Кто врёт?</title><script type="application/ld+json">${json(schema)}</script></head>`;
};

const brand = (prefix) => `<div class="ml-brand-strip"><div class="ml-brand-strip-inner"><a class="ml-brand" href="${prefix}"><span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>Mystery Logic</strong><small>Interactive investigations</small></span></a><nav class="ml-brand-strip-nav"><a href="${prefix}kto-vret/">Кто врёт?</a><a href="${prefix}dela/">Все дела</a></nav></div></div>`;

const choose = (items, min, max, start = 0, picked = [], result = []) => {
  if (picked.length >= min && picked.length <= max) result.push([...picked]);
  if (picked.length === max) return result;
  for (let index = start; index < items.length; index += 1) {
    choose(items, min, max, index + 1, [...picked, items[index]], result);
  }
  return result;
};

const normalizeStage = (stage) => ({
  id: stage.id,
  prompt: stage.prompt,
  instruction: stage.instruction || '',
  selectionMode: stage.selectionMode || 'single',
  minSelections: stage.minSelections || 1,
  maxSelections: stage.maxSelections || 1,
  options: (stage.options || []).map((option) => ({
    id: option.id,
    label: option.label,
    detail: option.detail || '',
  })),
  correctOptionIds: stage.correctOptionIds || [],
});

const flattenStages = (item) => {
  const source = Array.isArray(item.answerStages) && item.answerStages.length
    ? item.answerStages.map(normalizeStage)
    : [{
      id: 'liar',
      prompt: item.question || 'Кто говорит неправду?',
      instruction: 'Сопоставьте материалы дела со всеми показаниями.',
      selectionMode: 'single',
      minSelections: 1,
      maxSelections: 1,
      options: item.characters.map((character) => ({ id: character.id, label: character.name, detail: '' })),
      correctOptionIds: [item.correctOptionId],
    }];

  if (source.length === 1 && source[0].maxSelections === 1 && source[0].selectionMode !== 'multiple') {
    return source;
  }

  const variants = source.map((stage) => choose(
    stage.options,
    stage.minSelections,
    stage.maxSelections,
  ).map((selection) => ({
    label: `${stage.prompt}: ${selection.map((option) => option.label).join(', ')}`,
    correct: selection.length === stage.correctOptionIds.length
      && stage.correctOptionIds.every((id) => selection.some((option) => option.id === id)),
  })));

  let combinations = [[]];
  for (const list of variants) {
    combinations = combinations.flatMap((prefix) => list.map((value) => [...prefix, value]));
  }

  if (combinations.length > 240) {
    throw new Error(`Слишком много веб-комбинаций в ${item.id}: ${combinations.length}`);
  }

  const options = combinations.map((parts, index) => ({
    id: `conclusion_${index + 1}`,
    label: parts.map((part) => part.label).join(' · '),
    detail: '',
    correct: parts.every((part) => part.correct),
  }));
  const correct = options.filter((option) => option.correct);

  if (correct.length !== 1) {
    throw new Error(`Неоднозначная итоговая комбинация в ${item.id}`);
  }

  return [{
    id: 'complete_conclusion',
    prompt: item.question || 'Выберите полное заключение',
    instruction: 'Выберите вариант, который правильно объединяет все этапы ответа.',
    selectionMode: 'single',
    minSelections: 1,
    maxSelections: 1,
    options: options.map(({ correct: ignored, ...option }) => option),
    correctOptionIds: [correct[0].id],
  }];
};

function config(item) {
  const statements = item.characters
    .map((character) => `${character.name}: «${character.statement}»`)
    .join('\n\n');
  const timeline = Array.isArray(item.timeline) && item.timeline.length
    ? item.timeline
    : [{ time: 'Досье', title: 'Обстоятельства дела', detail: item.intro, source: 'Материалы бюро' }];
  const facts = Array.isArray(item.facts) && item.facts.length ? item.facts : splitFacts(item.intro);

  return {
    storageKey: item.storageKey,
    permalink: '',
    siteName: 'Mystery Logic',
    case: {
      id: item.id,
      title: item.title,
      caseNumber: `№ ${item.number}`,
      estimatedMinutes: estimate(item.difficulty),
      witnessCount: item.characters.length,
      difficulty: item.difficulty || 'Среднее',
      category: item.category || 'Логика',
      logicType: item.logicType || item.category || 'Логическое противоречие',
      materialsLabel: item.materialsLabel || 'Материалы дела',
      intro: item.intro,
      question: item.question || 'Кто говорит неправду?',
      timeline,
      facts,
      characters: item.characters.length
        ? [{ id: 'dossier', name: 'Показания', role: `${item.characters.length} свидетеля`, statement: statements }]
        : [],
      answerStages: flattenStages(item),
      explanation: {
        shortReason: item.explanation.shortReason || item.explanation.fullReason,
        fullReason: item.explanation.fullReason,
        reasoningSteps: steps(item),
        evidenceFragments: item.explanation.evidenceFragments || [],
      },
    },
  };
}

const staticAnswerStages = (item) => {
  const stages = Array.isArray(item.answerStages) && item.answerStages.length
    ? item.answerStages
    : [{ prompt: item.question || 'Кто говорит неправду?', options: item.characters.map((character) => ({ label: character.name })) }];
  return stages.map((stage) => `<section class="ktv-panel" data-seo-answer><div class="ktv-section-head"><div><p class="ktv-eyebrow">Ваша версия</p><h2>${escapeHtml(stage.prompt || item.question || 'Выберите ответ')}</h2></div></div><ul>${(stage.options || []).map((option) => `<li>${escapeHtml(option.label || '')}${option.detail ? ` — ${escapeHtml(option.detail)}` : ''}</li>`).join('')}</ul><p>Проверка ответа и полный разбор становятся доступны в интерактивном режиме.</p></section>`).join('');
};

const seoPrerender = (item, related, nextCase, prefix) => `<article class="ktv-app ktv-seo-prerender" data-seo-prerender data-case-id="${escapeHtml(item.id)}"><header class="ktv-cover"><div class="ktv-cover-copy"><div class="ktv-file-line"><span>Досье № ${escapeHtml(item.number)}</span><span>${escapeHtml(item.difficulty || 'Среднее')}</span></div><p class="ktv-eyebrow">Интерактивное расследование</p><h1>${escapeHtml(item.title)}</h1><p class="ktv-cover-lead">${escapeHtml(item.shortDescription || item.intro)}</p></div></header><section class="ktv-panel ktv-paper" data-seo-story><div class="ktv-section-head"><div><p class="ktv-eyebrow">Досье</p><h2>Завязка дела</h2></div></div><p>${escapeHtml(item.story || item.intro).replaceAll('\n', '<br>')}</p></section><section class="ktv-panel ktv-testimony" data-seo-statements><div class="ktv-section-head"><div><p class="ktv-eyebrow">Показания</p><h2>Что говорят участники</h2></div></div>${item.characters.length ? item.characters.map((character) => `<article class="ktv-transcript"><div class="ktv-person"><span><strong>${escapeHtml(character.name || 'Свидетель')}</strong><small>${escapeHtml(character.role || '')}</small></span></div><blockquote>«${escapeHtml(character.statement || '')}»</blockquote></article>`).join('') : '<p>В этом деле ответ строится по условиям и материалам досье.</p>'}</section>${staticAnswerStages(item)}<nav class="ktv-dossier-next" aria-label="Продолжить расследования" data-seo-links><div class="ktv-dossier-next-copy"><small>Продолжить</small><strong>Другие дела Mystery Logic</strong><p>После решения можно перейти к следующему делу или выбрать похожее.</p></div><div class="ktv-dossier-next-actions">${nextCase ? `<a class="ktv-dossier-link ktv-dossier-link-primary" data-analytics-event="next_case_clicked" href="${prefix}${nextCase.path}">Следующее дело: ${escapeHtml(nextCase.title)}</a>` : ''}<a class="ktv-dossier-link ktv-dossier-link-secondary" href="${prefix}dela/">Полная библиотека</a></div><p>${related.slice(0, 3).map((value) => `<a href="${prefix}${value.path}">${escapeHtml(value.title)}</a>`).join(' · ')}</p></nav><noscript><p>Для выбора ответа и проверки версии включите JavaScript. Условие и показания доступны выше без JavaScript.</p></noscript></article>`;

const seoCopy = (item, related, prefix) => `<section class="ml-shell ml-copy-section" aria-labelledby="about-case"><div><p class="ml-kicker">Без спойлеров</p><h2 id="about-case">О деле «${escapeHtml(item.title)}»</h2></div><div class="ml-copy"><p>Это короткая детективная задача категории «${escapeHtml(item.category || 'Логика')}» со сложностью «${escapeHtml(item.difficulty || 'Средняя')}». На прохождение обычно требуется около ${estimate(item.difficulty)} минут. Решение не зависит от угадывания: нужно сопоставить материалы дела, показания и ограничения ситуации.</p><p>Основной тип рассуждения — ${escapeHtml((item.logicType || item.category || 'поиск логического противоречия').toLowerCase())}. Полный ответ и цепочка доказательства открываются только после проверки вашей версии.</p><p>Похожие дела: ${related.slice(0, 4).map((value) => `<a href="${prefix}${value.path}">${escapeHtml(value.title)}</a>`).join(' · ')}. <a href="${prefix}dela/">Открыть полную библиотеку</a>.</p></div></section>`;

const pageMeta = (item, canonicalRoute) => ({
  caseId: item.id,
  slug: item.slug,
  language: item.language || 'ru',
  access: item.access,
  canonicalPath: canonicalRoute,
  collectionIds: [item.set.id],
});

const playable = (item, related, nextCase, { route = item.path, canonicalRoute = item.path, noindex = false, prerender = false } = {}) => {
  const prefix = prefixFor(route);
  return `${head(item, { route, canonicalRoute, noindex })}<body class="ktv-case-page" data-case-language="${escapeHtml(item.language || 'ru')}"><div class="ktv-ambient" aria-hidden="true"></div>${brand(prefix)}<main class="ktv-game-shell" data-ktv-root data-premium-game="${version}" data-case-id="${escapeHtml(item.id)}">${prerender ? seoPrerender(item, related, nextCase, prefix) : '<noscript>Включите JavaScript, чтобы открыть интерактивное расследование.</noscript>'}</main><script src="${prefix}assets/generated/cases-index.js?v=${version}"></script><script src="${prefix}assets/dossier-model.js?v=${version}"></script><script>window.KtoVretWeb=${json(config(item))};window.KtoVretWeb.permalink=location.href;window.KtoVretPage=${json(pageMeta(item, canonicalRoute))};</script><script src="${prefix}assets/analytics-events.js?v=${version}"></script><script src="${prefix}ktovret-game/assets/app.js?v=${version}"></script><script src="${prefix}ktovret-game/assets/performance.js?v=${version}"></script><script src="${prefix}assets/case-adapter.js?v=${version}"></script>${seoCopy(item, related, prefix)}<footer class="ml-case-footer">Дело из серии <a href="${prefix}kto-vret/">«Кто врёт?»</a> · <a href="${prefix}dela/">все расследования</a> · Mystery Logic</footer></body></html>`;
};

const locked = (item, { route = item.path, canonicalRoute = item.path, noindex = true } = {}) => {
  const prefix = prefixFor(route);
  return `${head(item, { locked: true, route, canonicalRoute, noindex })}<body>${brand(prefix)}<main class="ml-shell locked-case" data-paywall-view="true"><section class="ml-card"><p class="ml-kicker">Дело № ${item.number} · полный первый том</p><h1>${escapeHtml(item.title)}</h1><p>Расследование категории «${escapeHtml(item.category || 'Логика')}». Материалы, показания и решение не загружаются в публичную страницу до проверки доступа.</p><div class="ml-actions"><a class="ml-button ml-button-primary" href="${prefix}dela/">Вернуться в каталог</a><span class="ml-button ml-button-secondary">Полный том · скоро</span></div></section></main><script>window.KtoVretPage=${json(pageMeta(item, canonicalRoute))};</script><script src="${prefix}assets/analytics-events.js?v=${version}"></script></body></html>`;
};

export function writeCasePages(siteRoot, cases, editorial) {
  const legacyRoot = path.join(siteRoot, 'delo');
  const seoRoot = path.join(siteRoot, 'ru', 'cases');
  fs.rmSync(legacyRoot, { recursive: true, force: true });
  fs.rmSync(seoRoot, { recursive: true, force: true });
  ensureDir(legacyRoot);
  ensureDir(seoRoot);
  const free = cases.filter((item) => item.access === 'free');
  const byId = new Map(cases.map((item) => [item.id, item]));

  const write = (route, html) => {
    const dir = path.join(siteRoot, route);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  };

  for (const item of cases) {
    const related = (item.relatedCases || []).map((id) => byId.get(id)).filter(Boolean);
    const currentFreeIndex = free.findIndex((value) => value.id === item.id);
    const nextCase = currentFreeIndex >= 0 ? free[(currentFreeIndex + 1) % free.length] : null;
    const legacyRoute = item.legacyPath || `delo/${item.slug}/`;

    if (item.seoNative) {
      write(
        item.path,
        editorial || item.access === 'free'
          ? playable(item, related, nextCase, { route: item.path, canonicalRoute: item.path, prerender: true })
          : locked(item, { route: item.path, canonicalRoute: item.path }),
      );
      write(
        legacyRoute,
        editorial || item.access === 'free'
          ? playable(item, related, nextCase, { route: legacyRoute, canonicalRoute: item.path, noindex: true, prerender: false })
          : locked(item, { route: legacyRoute, canonicalRoute: item.path, noindex: true }),
      );
      continue;
    }

    write(
      legacyRoute,
      editorial || item.access === 'free'
        ? playable(item, related, nextCase, { route: legacyRoute, canonicalRoute: legacyRoute })
        : locked(item, { route: legacyRoute, canonicalRoute: legacyRoute }),
    );
  }
}
