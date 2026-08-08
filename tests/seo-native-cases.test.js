'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const base = 'https://valera2872.github.io/ktovret-web/';
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated/cases-index.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const analytics = fs.readFileSync(path.join(root, 'assets/analytics-events.js'), 'utf8');
const pilot = catalog.cases.filter((item) => item.seoPublished === true);

assert.equal(catalog.schemaVersion, 3, 'generated Case schema must be version 3');
assert.equal(catalog.seoNativePilotCount, 3, 'pilot must contain exactly three SEO-native cases');
assert.equal(pilot.length, 3, 'only three cases should migrate in the pilot');
assert.ok(Array.isArray(catalog.collections) && catalog.collections.length > 0, 'Collection entities must exist in the generated model');
assert.ok(catalog.collections.every((item) => item.indexable === false), 'collections must remain non-indexable until they have standalone value');

for (const item of catalog.cases) {
  assert.ok(item.slug, `${item.id} needs a stable slug`);
  assert.equal(item.language, 'ru', `${item.id} needs an explicit language`);
  assert.equal(item.seoPath, `ru/cases/${item.slug}/`, `${item.id} needs an automatically derived locale-aware SEO URL`);
  assert.ok(['published', 'draft'].includes(item.status), `${item.id} needs an explicit publication status`);
}

const expectedSlugs = [
  'chetyre-vhoda-v-arhiv',
  'tri-nesinhronnyh-zhurnala',
  'pyat-papok-i-pustoe-mesto',
];
assert.deepEqual(pilot.map((item) => item.slug), expectedSlugs);

const titles = new Set();
const descriptions = new Set();
for (const item of pilot) {
  assert.equal(item.language, 'ru');
  assert.equal(item.status, 'published');
  assert.equal(item.access, 'free');
  assert.equal(item.seoNative, true);
  assert.ok(item.shortDescription.length > 20, `${item.id} needs a real short description`);
  assert.equal(item.path, item.seoPath, `${item.id} must use the locale-aware canonical route`);
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
  assert.ok(serverHtml.includes('data-seo-links'), `${item.id} needs internal links in server HTML`);
  assert.ok(!serverHtml.includes('reasoningSteps'), `${item.id} must not expose the solution in the static SEO layer`);

  const canonical = `${base}${item.path}`;
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${item.id} canonical is wrong`);
  assert.ok(html.includes(`<link rel="alternate" hreflang="ru" href="${canonical}">`), `${item.id} hreflang is missing`);
  assert.ok(html.includes('<meta property="og:title"'), `${item.id} og:title is missing`);
  assert.ok(html.includes('<meta property="og:description"'), `${item.id} og:description is missing`);
  assert.ok(html.includes('<meta property="og:image"'), `${item.id} og:image is missing`);
  assert.ok(html.includes('analytics-events.js?v=1.7.0'), `${item.id} analytics layer is missing`);
  assert.ok(!html.includes('<meta name="robots" content="noindex,follow">'), `${item.id} canonical pilot page must be indexable`);

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

assert.equal(titles.size, 3, 'pilot pages need unique titles');
assert.equal(descriptions.size, 3, 'pilot pages need unique meta descriptions');
assert.equal(fs.readdirSync(path.join(root, 'ru', 'cases'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).length, 3, 'pilot must not generate extra SEO-native case pages');

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

console.log('seo-native pilot 1.7 tests passed: 3 canonical case pages + legacy compatibility + automatic SEO paths');
