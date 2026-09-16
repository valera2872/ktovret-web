import fs from 'node:fs';
import {createHash} from 'node:crypto';

const read = (file) => fs.readFileSync(file, 'utf8');
const expect = (cond, message) => {
  if (!cond) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
};

function jpegDimensions(bytes){
  let offset=2;
  while(offset+9<bytes.length){
    if(bytes[offset]!==0xff){offset+=1;continue;}
    const marker=bytes[offset+1];
    offset+=2;
    if(marker===0xd8||marker===0xd9) continue;
    if(offset+2>bytes.length) break;
    const length=bytes.readUInt16BE(offset);
    if(length<2||offset+length>bytes.length) break;
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return {height:bytes.readUInt16BE(offset+3),width:bytes.readUInt16BE(offset+5)};
    offset+=length;
  }
  return null;
}

const home = read('index.html');
const hub = read('realnye-dela/index.html');
const post = read('tools/import-mobile/real-investigations-release-postprocess.mjs');
const compat = read('assets/real-investigations-production-compat.css');
const smoke = read('tools/archive-visual-smoke.mjs');
const sitemap = read('sitemap.xml');
const art=fs.readFileSync('assets/real-investigations-approved-banner.jpg');
const digest=createHash('sha256').update(art).digest('hex');
const dimensions=jpegDimensions(art);
console.log(`BANNER_DIAG bytes=${art.length} sha256=${digest} first16=${art.subarray(0,16).toString('hex')} last16=${art.subarray(-16).toString('hex')} dimensions=${dimensions?`${dimensions.width}x${dimensions.height}`:'none'}`);

expect(art.length===30034, 'approved banner asset keeps exact expected byte size');
expect(art[0]===0xff && art[1]===0xd8 && art.at(-2)===0xff && art.at(-1)===0xd9, 'approved banner asset is a complete JPEG');
expect(dimensions?.width===900 && dimensions?.height===322, 'approved banner asset keeps 900x322 dimensions');
expect(digest==='0c7a41164efdbd79f2515bd0922e6d2514b883bb9ba62e3289504190b61bd9d3', 'approved banner asset keeps exact approved artwork digest');
expect(post.includes('validateApprovedBanner'), 'production finalizer validates approved banner before patching pages');
expect(post.includes('APPROVED_BANNER_SHA256'), 'production finalizer verifies approved banner digest');
expect(post.includes('data-real-investigations-approved-home'), 'production finalizer installs approved homepage banner');
expect(post.includes('data-real-investigations-approved-solo'), 'production finalizer installs compact Solo banner');
expect(post.includes("detektivnye-igry-dlya-odnogo','index.html'"), 'production finalizer patches generated Solo hub');
expect(post.includes('width="900" height="322"'), 'both integrations use exact approved banner dimensions');
expect(post.includes("ensureAiPromo(html,'homepage')"), 'production finalizer refuses homepage release without AI banner');
expect(post.includes("ensureAiPromo(html,'solo hub')"), 'production finalizer refuses Solo release without AI banner');
expect(post.includes("ensureAiPromo(html,'homepage-after-patch')"), 'homepage AI banner is rechecked after integration');
expect(post.includes("ensureAiPromo(html,'solo-after-patch')"), 'Solo AI banner is rechecked after integration');
expect(post.includes('Rejected slim Real Investigations promo still present'), 'rejected slim promo is explicitly removed');
expect(compat.includes('.ri-approved-home__image'), 'approved homepage artwork styling is present');
expect(compat.includes('.ri-approved-solo__image'), 'approved Solo artwork styling is present');
expect(!compat.includes('.ri-approved-solo__copy'), 'Solo integration no longer reinterprets approved art with duplicate copy');
expect(compat.includes('.ml-nav-new'), 'Real Investigations navigation styling is present');

expect(smoke.includes("['.jpg','image/jpeg']"), 'production smoke serves JPG approved artwork with correct MIME type');
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

for (const spoiler of ['Rodney Daniels', 'Родни Дэниелс', 'convicted', 'осуждён', 'осужден']) expect(!home.includes(spoiler) && !hub.includes(spoiler) && !post.includes(spoiler), `launch surfaces do not reveal outcome: ${spoiler}`);

expect(sitemap.includes('https://mysterylogic.com/realnye-dela/</loc>'), 'sitemap includes product hub');
expect(sitemap.includes('pozharnaya-lestnica-1991-premium'), 'sitemap includes first real case');

if (process.exitCode) process.exit(process.exitCode);
console.log('Real Investigations exact approved banner validation passed.');
