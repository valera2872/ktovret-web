import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const expect = (cond, message) => {
  if (!cond) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
};

const home = read('index.html');
const hub = read('realnye-dela/index.html');
const post = read('tools/import-mobile/real-investigations-release-postprocess.mjs');
const compat = read('assets/real-investigations-production-compat.css');
const smoke = read('tools/archive-visual-smoke.mjs');
const sitemap = read('sitemap.xml');
const artPath = 'assets/real-investigations-approved-banner.jpg';

expect(fs.existsSync(artPath) && fs.statSync(artPath).size > 10000, 'approved Real Investigations banner artwork is present');
expect(post.includes('data-real-investigations-approved-home'), 'production finalizer installs approved homepage banner');
expect(post.includes('data-real-investigations-approved-solo'), 'production finalizer installs compact Solo banner');
expect(post.includes("detektivnye-igry-dlya-odnogo','index.html'"), 'production finalizer patches generated Solo hub');
expect(post.includes('real-investigations-approved-banner.jpg'), 'production finalizer uses approved mockup artwork');
expect(post.includes("ensureAiPromo(html,'homepage')"), 'production finalizer refuses homepage release without AI banner');
expect(post.includes("ensureAiPromo(html,'solo hub')"), 'production finalizer refuses Solo release without AI banner');
expect(post.includes("ensureAiPromo(html,'homepage-after-patch')"), 'homepage AI banner is rechecked after integration');
expect(post.includes("ensureAiPromo(html,'solo-after-patch')"), 'Solo AI banner is rechecked after integration');
expect(post.includes('Rejected slim Real Investigations promo still present'), 'rejected slim promo is explicitly removed');
expect(compat.includes('.ri-approved-home'), 'approved homepage banner styling is present');
expect(compat.includes('.ri-approved-solo'), 'approved Solo banner styling is present');
expect(compat.includes('.ml-nav-new'), 'Real Investigations navigation styling is present');

expect(smoke.includes("['.jpg','image/jpeg']"), 'production smoke renders JPG approved artwork with correct MIME type');
expect(smoke.includes("name:'solo',path:'/detektivnye-igry-dlya-odnogo/'"), 'production smoke captures Solo hub');
expect(smoke.includes("'data-real-investigations-approved-home'"), 'production smoke requires approved homepage banner');
expect(smoke.includes("'data-real-investigations-approved-solo'"), 'production smoke requires approved Solo banner');
expect(smoke.includes("'data-ml-social-proof-client'"), 'production smoke guards social proof in generated runtime');
expect(smoke.includes("'data-ai01-launch-promo-style'"), 'production smoke guards AI banner in generated runtime');

expect(hub.includes('pozharnaya-lestnica-1991-premium'), 'hub exposes the first real case');
expect(hub.includes('Игрок ведёт следствие'), 'hub explains player-led investigation');
expect(hub.includes('ИИ не имеет права придумывать новые улики'), 'hub states source-bounded AI rule');
expect(hub.includes('Реальный ответ останется закрытым'), 'hub promises spoiler-free discovery');
expect(hub.includes('CollectionPage'), 'hub includes structured data');
expect(hub.includes('index,follow,max-image-preview:large'), 'hub is indexable');

for (const spoiler of ['Rodney Daniels', 'Родни Дэниелс', 'convicted', 'осуждён', 'осужден']) {
  expect(!home.includes(spoiler) && !hub.includes(spoiler) && !post.includes(spoiler), `launch surfaces do not reveal outcome: ${spoiler}`);
}

expect(sitemap.includes('https://mysterylogic.com/realnye-dela/</loc>'), 'sitemap includes product hub');
expect(sitemap.includes('pozharnaya-lestnica-1991-premium'), 'sitemap includes first real case');

if (process.exitCode) process.exit(process.exitCode);
console.log('Real Investigations approved banner validation passed.');
