'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const base = 'https://valera2872.github.io/ktovret-web/';
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated/cases-index.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated/import-report.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const analytics = fs.readFileSync(path.join(root, 'assets/analytics-events.js'), 'utf8');
const freeSeoCases = catalog.cases.filter((item) => item.seoPublished === true);
const premiumCases = catalog.cases.filter((item) => item.access === 'premium');
const indexableCollections = catalog.collections.filter((item) => item.indexable === true && item.status === 'published');
const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

assert.equal(catalog.schemaVersion, 4);
assert.equal(catalog.totalCases, 100);
assert.equal(catalog.seoNativeCaseCount, 15, '15 free cases remain the fully playable SEO-native set');
assert.equal(freeSeoCases.length, 15);
assert.equal(premiumCases.length, 85);
assert.ok(premiumCases.every((item) => item.seoPublished === false), 'premium payloads must not become public SEO-native payloads');
assert.equal(report.seoCasePages, 100, 'all 100 cases need an indexable /ru/cases/ route');
assert.equal(report.premiumSeoTeaserPages, 85, '85 premium cases need safe teaser pages');
assert.equal(report.wordstatHubPages, 3, 'three Wordstat expansion hubs are required');
assert.equal(report.indexableUrls, sitemapLocs.length, 'import report must equal the generated sitemap boundary');
assert.equal(new Set(sitemapLocs).size, sitemapLocs.length, 'sitemap URLs must be unique across SEO generators');
assert.ok(report.indexableUrls >= 133, 'SEO expansion + 20-puzzle Expert vertical must expose the expanded indexable boundary');
assert.equal(report.soloHubPage, 'detektivnye-igry-dlya-odnogo');
assert.equal(report.soloCaseRoute, 'detektivnye-igry-dlya-odnogo/407');
assert.equal(report.soloMaterials, 18);
assert.equal(report.logicHubPuzzles, 20);
assert.equal(report.logicHubPages, 23);
assert.equal(report.logicHubVersion, '2.0.0');
assert.equal(report.logicExpertMainHub, 'golovolomki-onlayn/');
assert.equal(report.logicExpertAdultHub, 'zagadki-na-logiku-dlya-vzroslyh/');
assert.equal(indexableCollections.length, 1);

const collection = indexableCollections[0];
assert.equal(collection.id, 'free-detective-cases');
assert.equal(collection.route, 'ru/besplatnye-detektivnye-dela/');
assert.equal(collection.caseIds.length, 15);

const titles = new Set();
const descriptions = new Set();
for (const item of catalog.cases) {
  assert.ok(item.slug, `${item.id} needs a stable slug`);
  assert.equal(item.language, 'ru');
  assert.equal(item.seoPath, `ru/cases/${item.slug}/`);
  assert.ok(['published', 'draft'].includes(item.status));

  const seoFile = path.join(root, item.seoPath, 'index.html');
  const legacyFile = path.join(root, item.legacyPath, 'index.html');
  assert.ok(fs.existsSync(seoFile), `missing SEO page ${item.seoPath}`);
  assert.ok(fs.existsSync(legacyFile), `missing legacy page ${item.legacyPath}`);

  const html = fs.readFileSync(seoFile, 'utf8');
  const legacy = fs.readFileSync(legacyFile, 'utf8');
  const canonical = `${base}${item.seoPath}`;

  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${item.id} canonical is wrong`);
  assert.ok(!html.includes('<meta name="robots" content="noindex'), `${item.id} SEO page must be indexable`);
  assert.ok(html.includes(item.title), `${item.id} needs its case title in visible/indexable content`);
  assert.ok(html.includes('<h1>'), `${item.id} needs an H1`);
  assert.ok(html.includes('<meta property="og:title"'), `${item.id} og:title is missing`);
  assert.ok(html.includes('<meta property="og:description"'), `${item.id} og:description is missing`);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${item.id} SEO route must be in sitemap`);
  assert.ok(!sitemap.includes(`<loc>${base}${item.legacyPath}</loc>`), `${item.id} legacy route must stay out of sitemap`);
  assert.ok(legacy.includes('<meta name="robots" content="noindex,follow">'), `${item.id} legacy route must stay noindex`);

  if (item.access === 'free') {
    assert.equal(item.path, item.seoPath, `${item.id} free case must use SEO canonical route`);
    assert.ok(html.includes('data-seo-prerender'), `${item.id} free case must prerender playable content`);
    assert.ok(html.includes('window.KtoVretWeb='), `${item.id} free case must keep playable config`);
    assert.ok(html.includes('data-seo-story'), `${item.id} needs story in server HTML`);
    assert.ok(html.includes('data-seo-statements'), `${item.id} needs statements in server HTML`);
    assert.ok(html.includes('data-seo-answer'), `${item.id} needs answer choices in server HTML`);
    assert.ok(html.includes('data-seo-collection-link'), `${item.id} needs collection link`);
    assert.ok(html.includes('data-wordstat-seo-copy'), `${item.id} needs expanded Wordstat copy`);
  } else {
    assert.equal(item.path, item.legacyPath, `${item.id} premium runtime route must remain locked/legacy`);
    assert.ok(html.includes('data-premium-seo-teaser="true"'), `${item.id} needs premium teaser marker`);
    assert.ok(!html.includes('window.KtoVretWeb='), `${item.id} teaser must not expose playable config`);
    assert.ok(!html.includes('data-seo-story'), `${item.id} teaser must not expose story payload`);
    assert.ok(!html.includes('data-seo-statements'), `${item.id} teaser must not expose statements`);
    assert.ok(!html.includes('reasoningSteps'), `${item.id} teaser must not expose reasoning`);
    assert.ok(!html.includes('correctOption'), `${item.id} teaser must not expose the answer`);
    assert.ok(html.includes('Первый том'), `${item.id} teaser must explain access`);
  }

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const descriptionMatch = html.match(/<meta name="description" content="([^"]+)">/);
  assert.ok(titleMatch, `${item.id} title is missing`);
  assert.ok(descriptionMatch, `${item.id} meta description is missing`);
  titles.add(titleMatch[1]);
  descriptions.add(descriptionMatch[1]);
}

assert.equal(titles.size, 100, 'all 100 SEO case titles must be unique');
assert.equal(descriptions.size, 100, 'all 100 SEO case descriptions must be unique');
assert.equal(fs.readdirSync(path.join(root, 'ru', 'cases'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).length, 100, 'must generate 100 SEO case pages');

const collectionFile = path.join(root, collection.route, 'index.html');
assert.ok(fs.existsSync(collectionFile));
const collectionHtml = fs.readFileSync(collectionFile, 'utf8');
assert.ok(collectionHtml.includes('15 бесплатных детективных дел онлайн'), 'collection H1 must reflect Wordstat copy');
assert.ok(collectionHtml.includes('CollectionPage'));
assert.ok(collectionHtml.includes('ItemList'));
assert.ok(!collectionHtml.includes('noindex'));
for (const item of freeSeoCases) assert.ok(collectionHtml.includes(item.path), `collection must link to ${item.id}`);

for (const route of ['golovolomki-onlayn/','zagadki-na-logiku-dlya-vzroslyh/','detektivnye-igry-dlya-dvoih/','detektivnye-igry-dlya-odnogo/']) {
  const file = path.join(root, route, 'index.html');
  assert.ok(fs.existsSync(file), `${route} hub is missing`);
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('<h1>'));
  assert.ok(!html.includes('noindex'));
  assert.ok(sitemap.includes(`<loc>${base}${route}</loc>`), `${route} must be in sitemap`);
}

const logicRoot = path.join(root, 'logicheskie-zadachi');
assert.ok(fs.existsSync(path.join(logicRoot, 'index.html')), 'Expert logic catalog is missing');
const logicTaskDirs = fs.readdirSync(logicRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
assert.equal(logicTaskDirs.length, 20, 'Expert catalog must publish exactly 20 task routes');
for (const slug of logicTaskDirs) {
  const route = `logicheskie-zadachi/${slug}/`;
  const file = path.join(root, route, 'index.html');
  assert.ok(fs.existsSync(file), `${route} expert logic route is missing`);
  assert.ok(sitemap.includes(`<loc>${base}${route}</loc>`), `${route} expert logic route must be in sitemap`);
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('data-expert-puzzle='), `${route} needs an interactive Expert contract`);
  assert.ok(html.includes('https://t.me/mysterylogic'), `${route} needs the Telegram retention path`);
}
for (const removedRoute of [
  'logicheskie-zadachi/kod-507/',
  'logicheskie-zadachi/poryadok-pyati-papok/',
  'logicheskie-zadachi/seyf-5074/',
  'logicheskie-zadachi/kod-protokol-6/',
  'logicheskie-zadachi/shest-pokazaniy/',
  'logicheskie-zadachi/arhivnaya-matrica-5x5/',
]) {
  assert.ok(!sitemap.includes(`<loc>${base}${removedRoute}</loc>`), `${removedRoute} must stay outside the Logic sitemap`);
}
assert.ok(sitemap.includes(`<loc>${base}logicheskie-zadachi/protokol-shesti-cifr/</loc>`));
assert.ok(sitemap.includes(`<loc>${base}logicheskie-zadachi/domino-razbienie-4x5/</loc>`));

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(home.includes('>Головоломки</a>'), 'top navigation must expose the puzzle vertical');
assert.ok(home.includes('data-logic-home-launch'), 'homepage must link into the puzzle funnel');

const soloCaseFile = path.join(root, 'detektivnye-igry-dlya-odnogo', '407', 'index.html');
assert.ok(fs.existsSync(soloCaseFile), 'solo 407 runtime route is missing');
assert.ok(fs.readFileSync(soloCaseFile, 'utf8').includes('<meta name="robots" content="noindex,follow">'), 'solo runtime must stay noindex');
assert.ok(!sitemap.includes(`<loc>${base}detektivnye-igry-dlya-odnogo/407/</loc>`), 'solo runtime must stay out of sitemap');

for (const event of ['case_view','case_started','answer_selected','answer_correct','answer_wrong','case_completed','next_case_clicked','paywall_viewed','purchase_started']) {
  assert.ok(analytics.includes(`'${event}'`), `analytics event ${event} is missing`);
}
assert.ok(analytics.includes('location.search'));
assert.ok(analytics.includes("robots.content = 'noindex,follow'"));

console.log(`seo expansion tests passed: 100 case SEO routes + hubs + 20 Expert puzzles = ${report.indexableUrls} unique URLs`);