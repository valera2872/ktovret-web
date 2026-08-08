'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/seo-native-pilot.json'),'utf8'));
assert.equal(manifest.length,3,'pilot must contain exactly three SEO-native cases');

const titles=new Set();
const descriptions=new Set();
for(const item of manifest){
  const page=path.join(root,item.path,'index.html');
  assert.ok(fs.existsSync(page),`missing SEO-native page ${item.path}`);
  const html=fs.readFileSync(page,'utf8');
  const canonical=`https://valera2872.github.io/ktovret-web/${item.path}`;
  const title=html.match(/<title>(.*?)<\/title>/s)?.[1]||'';
  const description=html.match(/<meta name="description" content="([^"]+)">/)?.[1]||'';
  titles.add(title);descriptions.add(description);

  assert.ok(html.includes('data-seo-static="true"'),'static prerender is missing');
  assert.ok(html.includes('<h1 itemprop="name">'),'static H1 is missing');
  assert.ok(html.includes('Обстоятельства дела'),'static story is missing');
  assert.ok(html.includes('Показания'),'static statements are missing');
  assert.ok(html.indexOf('data-seo-static="true"')<html.indexOf('window.KtoVretWeb='),'static case content must exist before game bootstrap');
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`),'canonical is incorrect');
  assert.ok(html.includes(`hreflang="ru" href="${canonical}"`),'ru hreflang is missing');
  assert.ok(html.includes(`hreflang="x-default" href="${canonical}"`),'x-default hreflang is missing');
  assert.ok(html.includes('property="og:title"'),'OpenGraph title is missing');
  assert.ok(html.includes('property="og:description"'),'OpenGraph description is missing');
  assert.ok(html.includes('property="og:image"'),'OpenGraph image is missing');
  assert.ok(html.includes('BreadcrumbList'),'structured breadcrumbs are missing');
  assert.ok(html.includes('../../../ktovret-game/assets/app.js'),'shared Game Engine is missing');
  assert.ok(html.includes('../../../assets/seo-case-runtime.js?v=1.7.0'),'SEO runtime is missing');
  assert.ok(html.includes('../../../assets/analytics-events.js?v=1.7.0'),'analytics bridge is missing');
  assert.ok((html.match(/data-analytics-next=/g)||[]).length>=3,'internal related links are missing');

  const legacy=path.join(root,item.legacyPath,'index.html');
  assert.ok(fs.existsSync(legacy),`legacy page missing ${item.legacyPath}`);
  const legacyHtml=fs.readFileSync(legacy,'utf8');
  assert.ok(legacyHtml.includes('meta name="robots" content="noindex,follow"'),'legacy duplicate must be noindex');
  assert.ok(legacyHtml.includes(`rel="canonical" href="${canonical}"`),'legacy canonical must point to SEO-native URL');
  assert.ok(legacyHtml.includes('window.KtoVretWeb='),'legacy game must remain playable');
}

assert.equal(titles.size,3,'pilot titles must be unique');
assert.equal(descriptions.size,3,'pilot meta descriptions must be unique');

const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
for(const item of manifest){
  assert.ok(sitemap.includes(`https://valera2872.github.io/ktovret-web/${item.path}`),`sitemap missing ${item.path}`);
  assert.ok(!sitemap.includes(`https://valera2872.github.io/ktovret-web/${item.legacyPath}`),`sitemap must exclude legacy duplicate ${item.legacyPath}`);
}
assert.equal((sitemap.match(/<url>/g)||[]).length,22,'pilot must replace legacy URLs rather than inflate sitemap');

const analytics=fs.readFileSync(path.join(root,'assets/analytics-events.js'),'utf8');
for(const event of ['case_view','case_started','answer_selected','answer_correct','answer_wrong','case_completed','next_case_clicked','paywall_viewed','purchase_started']){
  assert.ok(analytics.includes(`'${event}'`),`analytics event ${event} is missing`);
}
const runtime=fs.readFileSync(path.join(root,'assets/seo-case-runtime.js'),'utf8');
assert.ok(runtime.includes("if(location.search)"),'query-parameter noindex guard is missing');
assert.ok(runtime.includes('noindex,follow'),'query-parameter pages must be marked noindex at runtime');

const collection=fs.readFileSync(path.join(root,'tools/seo-native/collection-entity.mjs'),'utf8');
assert.ok(collection.includes('minimum_cases'),'Collection indexability threshold is missing');
assert.ok(collection.includes('isCollectionIndexable'),'Collection indexability guard is missing');

console.log('SEO-native pilot passed: 3 canonical cases, static HTML, shared engine, interlinking and analytics');
