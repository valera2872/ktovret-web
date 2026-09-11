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
const volume1Cases = catalog.cases.filter((item) => item.productId === 'volume1');
const volume2Cases = catalog.cases.filter((item) => item.productId === 'volume2');
const indexableCollections = catalog.collections.filter((item) => item.indexable === true && item.status === 'published');
const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

assert.equal(catalog.schemaVersion, 5);
assert.equal(catalog.totalCases, 100);
assert.equal(catalog.freeCount, 15);
assert.equal(catalog.premiumCount, 85);
assert.equal(catalog.volume1Count, 85);
assert.equal(catalog.volume2Count, 0);
assert.equal(catalog.seoNativeCaseCount, 15);
assert.equal(freeSeoCases.length, 15);
assert.equal(premiumCases.length, 85);
assert.equal(volume1Cases.length, 85);
assert.equal(volume2Cases.length, 0);
assert.ok(premiumCases.every((item) => item.seoPublished === false), 'premium payloads must not become public SEO-native payloads');
assert.ok(premiumCases.every((item) => item.productId === 'volume1'), 'all paid Who Lied cases must use the restored volume1 entitlement');
assert.equal(report.seoCasePages, 100);
assert.equal(report.premiumSeoTeaserPages, 85);
assert.equal(report.wordstatHubPages, 3);
assert.equal(report.indexableUrls, sitemapLocs.length);
assert.equal(new Set(sitemapLocs).size, sitemapLocs.length);
assert.equal(report.soloHubPage, 'detektivnye-igry-dlya-odnogo');
assert.equal(report.soloCaseRoute, 'detektivnye-igry-dlya-odnogo/407');
assert.equal(report.soloMaterials, 18);
assert.equal(report.logicHubPuzzles, 20);
assert.equal(report.logicHubPages, 23);
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
  const seoFile = path.join(root, item.seoPath, 'index.html');
  const legacyFile = path.join(root, item.legacyPath, 'index.html');
  assert.ok(fs.existsSync(seoFile), `missing SEO page ${item.seoPath}`);
  assert.ok(fs.existsSync(legacyFile), `missing legacy page ${item.legacyPath}`);
  const html = fs.readFileSync(seoFile, 'utf8');
  const legacy = fs.readFileSync(legacyFile, 'utf8');
  const canonical = `${base}${item.seoPath}`;
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
  assert.ok(html.includes(item.title));
  assert.ok(html.includes('<h1>'));
  assert.ok(!sitemap.includes(`<loc>${base}${item.legacyPath}</loc>`));
  assert.ok(legacy.includes('<meta name="robots" content="noindex,follow">'));

  if (item.access === 'free') {
    assert.equal(item.path, item.seoPath);
    assert.ok(html.includes('data-seo-prerender'));
    assert.ok(html.includes('window.KtoVretWeb='));
    assert.ok(html.includes('data-seo-story'));
    assert.ok(html.includes('data-seo-statements'));
    assert.ok(html.includes('data-seo-answer'));
    assert.equal(item.productId, null);
    assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
  } else {
    assert.equal(item.path, item.legacyPath);
    assert.equal(item.productId, 'volume1');
    assert.ok(html.includes('data-premium-seo-teaser="true"'));
    assert.ok(!html.includes('window.KtoVretWeb='));
    assert.ok(!html.includes('data-seo-story'));
    assert.ok(!html.includes('reasoningSteps'));
    assert.ok(html.includes('Том I') || html.includes('перв')); 
  }

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const descriptionMatch = html.match(/<meta name="description" content="([^"]+)">/);
  assert.ok(titleMatch);
  assert.ok(descriptionMatch);
  titles.add(titleMatch[1]);
  descriptions.add(descriptionMatch[1]);
}

assert.equal(titles.size, 100);
assert.equal(descriptions.size, 100);
assert.equal(fs.readdirSync(path.join(root, 'ru', 'cases'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).length, 100);

const collectionFile = path.join(root, collection.route, 'index.html');
assert.ok(fs.existsSync(collectionFile));
const collectionHtml = fs.readFileSync(collectionFile, 'utf8');
assert.ok(collectionHtml.includes('15 бесплатных детективных дел'));
assert.ok(collectionHtml.includes('CollectionPage'));
assert.ok(collectionHtml.includes('ItemList'));
for (const item of freeSeoCases) assert.ok(collectionHtml.includes(item.path));

for (const route of ['golovolomki-onlayn/','zagadki-na-logiku-dlya-vzroslyh/','detektivnye-igry-dlya-dvoih/','detektivnye-igry-dlya-odnogo/']) {
  const file = path.join(root, route, 'index.html');
  assert.ok(fs.existsSync(file), `${route} hub is missing`);
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('<h1>'));
  assert.ok(!html.includes('noindex'));
  assert.ok(sitemap.includes(`<loc>${base}${route}</loc>`));
}

const logicRoot = path.join(root, 'logicheskie-zadachi');
const logicTaskDirs = fs.readdirSync(logicRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
assert.equal(logicTaskDirs.length, 20);
for (const slug of logicTaskDirs) {
  const route = `logicheskie-zadachi/${slug}/`;
  const file = path.join(root, route, 'index.html');
  assert.ok(fs.existsSync(file));
  assert.ok(sitemap.includes(`<loc>${base}${route}</loc>`));
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('data-expert-puzzle='));
  assert.ok(html.includes('https://t.me/mysterylogic'));
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(home.includes('>Головоломки</a>'));
assert.ok(home.includes('data-logic-home-launch'));
assert.ok(/15\s+бесплатн/iu.test(home));

const soloCaseFile = path.join(root, 'detektivnye-igry-dlya-odnogo', '407', 'index.html');
assert.ok(fs.existsSync(soloCaseFile));
assert.ok(fs.readFileSync(soloCaseFile, 'utf8').includes('<meta name="robots" content="noindex,follow">'));
assert.ok(!sitemap.includes(`<loc>${base}detektivnye-igry-dlya-odnogo/407/</loc>`));

for (const event of ['case_view','case_started','answer_selected','answer_correct','answer_wrong','case_completed','next_case_clicked','paywall_viewed','purchase_started']) {
  assert.ok(analytics.includes(`'${event}'`), `analytics event ${event} is missing`);
}

console.log(`seo expansion tests passed: 100 Who Lied SEO routes, 15 free, 85 paid + hubs + 20 Expert puzzles = ${report.indexableUrls} unique URLs`);
