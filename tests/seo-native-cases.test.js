'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const base = 'https://valera2872.github.io/ktovret-web/';
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated/cases-index.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const analytics = fs.readFileSync(path.join(root, 'assets/analytics-events.js'), 'utf8');
const seoCases = catalog.cases.filter((item) => item.seoPublished === true);
const premiumCases = catalog.cases.filter((item) => item.access === 'premium');
const indexableCollections = catalog.collections.filter((item) => item.indexable === true && item.status === 'published');

assert.equal(catalog.schemaVersion, 4, 'generated Case schema must be version 4');
assert.equal(catalog.seoNativeCaseCount, 15, 'all 15 free cases must be SEO-native');
assert.equal(catalog.indexableCollectionCount, 1, 'exactly one collection should be indexable in 1.8');
assert.equal(seoCases.length, 15, 'SEO-native publication must contain the 15 free cases');
assert.equal(premiumCases.length, 85, 'premium boundary changed');
assert.ok(premiumCases.every((item) => item.seoPublished === false), 'premium cases must not become SEO-native');
assert.equal(indexableCollections.length, 1, 'only one real collection should be indexable');

const collection = indexableCollections[0];
assert.equal(collection.id, 'free-detective-cases');
assert.equal(collection.route, 'ru/besplatnye-detektivnye-dela/');
assert.equal(collection.caseIds.length, 15, 'free collection must contain all 15 free cases');
assert.ok(collection.description.length > 60, 'collection needs standalone editorial description');

for (const item of catalog.cases) {
  assert.ok(item.slug, `${item.id} needs a stable slug`);
  assert.equal(item.language, 'ru', `${item.id} needs an explicit language`);
  assert.equal(item.seoPath, `ru/cases/${item.slug}/`, `${item.id} needs an automatically derived locale-aware SEO URL`);
  assert.ok(['published', 'draft'].includes(item.status), `${item.id} needs an explicit publication status`);
  if (item.access === 'free') {
    assert.equal(item.path, item.seoPath, `${item.id} free case must use SEO canonical route`);
    assert.ok(item.collectionIds.includes('free-detective-cases'), `${item.id} must belong to free collection`);
  } else {
    assert.equal(item.path, item.legacyPath, `${item.id} premium route must stay legacy/locked`);
  }
}

const titles = new Set();
const descriptions = new Set();
for (const item of seoCases) {
  assert.equal(item.language, 'ru');
  assert.equal(item.status, 'published');
  assert.equal(item.access, 'free');
  assert.equal(item.seoNative, true);
  assert.ok(item.shortDescription.length > 20, `${item.id} needs a real short description`);
  assert.ok(item.legacyPath.startsWith('delo/'), `${item.id} must preserve its legacy route`);
  assert.ok(Array.isArray(item.relatedCaseIds) && item.relatedCaseIds.length >= 2, `${item.id} needs related cases`);

  const canonicalFile = path.join(root, item.path, 'index.html');
  const legacyFile = path.join(root, item.legacyPath, 'index.html');
  assert.ok(fs.existsSync(canonicalFile), `missing canonical page ${item.path}`);
  assert.ok(fs.existsSync(legacyFile), `missing legacy compatibility page ${item.legacyPath}`);

  const html = fs.readFileSync(canonicalFile, 'utf8');
  const legacy = fs.readFileSync(legacyFile, 'utf8');
  const configPos = html.indexOf('window.KtoVretWeb=');
  const prerenderPos = html.indexOf('data-seo-prerender');
  assert.ok(prerenderPos >= 0 && prerenderPos < configPos, `${item.id} must render indexable content before JavaScript config`);
  const serverHtml = html.slice(0, configPos);
  assert.ok(serverHtml.includes(`<h1>${item.title}</h1>`), `${item.id} needs an H1 in server HTML`);
  assert.ok(serverHtml.includes('data-seo-story'), `${item.id} needs its story in server HTML`);
  assert.ok(serverHtml.includes('data-seo-statements'), `${item.id} needs statements in server HTML`);
  assert.ok(serverHtml.includes('data-seo-answer'), `${item.id} needs answer choices in server HTML`);
  assert.ok(serverHtml.includes('data-seo-links'), `${item.id} needs internal case links in server HTML`);
  assert.ok(serverHtml.includes('data-seo-collection-link'), `${item.id} needs collection link in server HTML`);
  assert.ok(serverHtml.includes(collection.route), `${item.id} must link to its public collection`);
  assert.ok(!serverHtml.includes('reasoningSteps'), `${item.id} must not expose the solution in the static SEO layer`);

  const canonical = `${base}${item.path}`;
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${item.id} canonical is wrong`);
  assert.ok(html.includes(`<link rel="alternate" hreflang="${item.language}" href="${canonical}">`), `${item.id} hreflang is missing`);
  assert.ok(html.includes('<meta property="og:title"'), `${item.id} og:title is missing`);
  assert.ok(html.includes('<meta property="og:description"'), `${item.id} og:description is missing`);
  assert.ok(html.includes('<meta property="og:image"'), `${item.id} og:image is missing`);
  assert.ok(html.includes('analytics-events.js?v=1.7.0'), `${item.id} analytics layer is missing`);
  assert.ok(!html.includes('<meta name="robots" content="noindex,follow">'), `${item.id} canonical page must be indexable`);

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const descriptionMatch = html.match(/<meta name="description" content="([^"]+)">/);
  assert.ok(titleMatch, `${item.id} title is missing`);
  assert.ok(descriptionMatch, `${item.id} meta description is missing`);
  titles.add(titleMatch[1]);
  descriptions.add(descriptionMatch[1]);

  assert.ok(legacy.includes('<meta name="robots" content="noindex,follow">'), `${item.id} legacy duplicate must be noindex`);
  assert.ok(legacy.includes(`<link rel="canonical" href="${canonical}">`), `${item.id} legacy duplicate must canonicalize to the new route`);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${item.id} canonical must be in sitemap`);
  assert.ok(!sitemap.includes(`<loc>${base}${item.legacyPath}</loc>`), `${item.id} legacy duplicate must not be in sitemap`);
}

assert.equal(titles.size, 15, 'all SEO-native case titles must be unique');
assert.equal(descriptions.size, 15, 'all SEO-native meta descriptions must be unique');
assert.equal(fs.readdirSync(path.join(root, 'ru', 'cases'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).length, 15, 'must generate exactly 15 SEO-native case pages');

const collectionFile = path.join(root, collection.route, 'index.html');
assert.ok(fs.existsSync(collectionFile), 'indexable collection page is missing');
const collectionHtml = fs.readFileSync(collectionFile, 'utf8');
const collectionCanonical = `${base}${collection.route}`;
assert.ok(collectionHtml.includes(`<link rel="canonical" href="${collectionCanonical}">`), 'collection canonical is wrong');
assert.ok(collectionHtml.includes(`<h1>${collection.title}</h1>`), 'collection H1 is missing');
assert.ok(collectionHtml.includes('CollectionPage'), 'collection schema is missing');
assert.ok(collectionHtml.includes('ItemList'), 'collection ItemList schema is missing');
assert.ok(!collectionHtml.includes('noindex'), 'real collection must be indexable');
for (const item of seoCases) assert.ok(collectionHtml.includes(item.path), `collection must link to ${item.id}`);
assert.ok(sitemap.includes(`<loc>${collectionCanonical}</loc>`), 'collection must be in sitemap');

for (const event of [
  'case_view',
  'case_started',
  'answer_selected',
  'answer_correct',
  'answer_wrong',
  'case_completed',
  'next_case_clicked',
  'paywall_viewed',
  'purchase_started',
]) {
  assert.ok(analytics.includes(`'${event}'`), `analytics event ${event} is missing`);
}
assert.ok(analytics.includes('location.search'), 'query-parameter states need a noindex guard');
assert.ok(analytics.includes("robots.content = 'noindex,follow'"), 'query-parameter states must become noindex,follow');

console.log('seo-native 1.8 tests passed: 15 canonical cases + 1 real collection + legacy compatibility');
