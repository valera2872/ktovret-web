import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const NAV_LINK='<a class="ml-nav-new" data-nav-real-investigations href="./realnye-dela/">Реальные расследования <span class="ml-nav-new-badge">NEW</span></a>';
const REAL_ROUTES=['https://mysterylogic.com/realnye-dela/','https://mysterylogic.com/realnye-dela/pozharnaya-lestnica-1991-premium/'];
const APPROVED_BANNER_SHA256='4c98ac9e4c98b13bb63d2a8a9cdeee0f8b5627744eca58dffa13b7913e76adca';
const APPROVED_BANNER_SIZE=39263;
const APPROVED_BANNER_SOURCE_FILES=[
  'banner.part01.b64',
  'banner.part01-tail.b64',
  'banner.part02.b64',
  'banner.part03.b64',
  'banner.part04.b64',
  'banner.part05.b64',
];
let releaseFinalizerRegistered=false;

const HOME_BANNER=`<section class="ri-approved-home" data-real-investigations-approved-home aria-label="Новый формат Mystery Logic — Реальные расследования">
  <a class="ri-approved-home__link" href="./realnye-dela/">
    <img class="ri-approved-home__image" src="./assets/real-investigations-approved-banner.jpg" alt="Реальные расследования Mystery Logic — реальные события, AI-допрос и собственная версия" width="900" height="322" loading="eager" decoding="async">
    <span class="ri-approved-home__new" aria-hidden="true">NEW</span>
    <span class="ri-approved-sr">Открыть раздел «Реальные расследования»</span>
  </a>
</section>`;

const SOLO_BANNER=`<aside class="ri-approved-solo" data-real-investigations-approved-solo aria-label="Реальные расследования Mystery Logic">
  <a class="ri-approved-solo__link" href="../realnye-dela/">
    <img class="ri-approved-solo__image" src="../assets/real-investigations-approved-banner.jpg" alt="Реальные расследования Mystery Logic — реальные события, AI-допрос, игрок ведёт следствие" width="900" height="322" loading="lazy" decoding="async">
    <span class="ri-approved-sr">Смотреть реальные расследования</span>
  </a>
</aside>`;

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

function restoreApprovedBanner(siteRoot){
  const sourceRoot=path.resolve(process.cwd(),'content','real-investigations-approved');
  const encoded=[];
  for(const name of APPROVED_BANNER_SOURCE_FILES){
    const source=path.join(sourceRoot,name);
    if(!fs.existsSync(source)) throw new Error(`Approved Real Investigations banner source part missing: ${source}`);
    encoded.push(fs.readFileSync(source,'utf8').trim());
  }
  const bytes=Buffer.from(encoded.join(''),'base64');
  const target=path.join(siteRoot,'assets','real-investigations-approved-banner.jpg');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,bytes);
  return target;
}

function validateApprovedBanner(siteRoot){
  const target=restoreApprovedBanner(siteRoot);
  const bytes=fs.readFileSync(target);
  if(bytes.length!==APPROVED_BANNER_SIZE) throw new Error(`Approved Real Investigations banner byte size changed: ${bytes.length}`);
  if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9) throw new Error('Approved Real Investigations banner is not a complete JPEG');
  const dimensions=jpegDimensions(bytes);
  if(!dimensions||dimensions.width!==900||dimensions.height!==322) throw new Error(`Approved Real Investigations banner dimensions changed: ${JSON.stringify(dimensions)}`);
  const digest=createHash('sha256').update(bytes).digest('hex');
  if(digest!==APPROVED_BANNER_SHA256) throw new Error(`Approved Real Investigations banner digest mismatch: ${digest}`);
  return {target,bytes:bytes.length,width:dimensions.width,height:dimensions.height,digest};
}

function finalizeSitemap(siteRoot){
  const file=path.join(siteRoot,'sitemap.xml');
  if(!fs.existsSync(file)) throw new Error('Sitemap missing before Real Investigations finalization');
  let xml=fs.readFileSync(file,'utf8');
  const lastmod=new Date().toISOString().slice(0,10);
  for(const url of REAL_ROUTES){
    if(xml.includes(`<loc>${url}</loc>`)) continue;
    xml=xml.replace('</urlset>',`<url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>\n</urlset>`);
  }
  for(const url of REAL_ROUTES) if(!xml.includes(`<loc>${url}</loc>`)) throw new Error(`Real Investigations sitemap route missing: ${url}`);
  fs.writeFileSync(file,xml);
}

function stripLegacyHomepageLaunch(html){
  let out=html;
  out=out.replace(/\s*<link[^>]+real-investigations-launch\.css[^>]*>\s*/g,'\n');
  out=out.replace(/\s*<div class="ml-launchbar"[^>]*data-real-investigations-launchbar[^>]*>[\s\S]*?<\/div>\s*/g,'\n');
  out=out.replace(/\s*<section class="ml-real-launch"[^>]*data-real-investigations-launch[^>]*>[\s\S]*?<\/section>\s*/g,'\n');
  out=out.replace(/\s*<a class="ref-format-card ref-format-card-real"[^>]*data-real-investigations-card[^>]*>[\s\S]*?<\/a>\s*/g,'');
  out=out.replace(/\s*<section class="ri-home-card"[^>]*data-real-investigations-home-card[^>]*>[\s\S]*?<\/section>\s*/g,'\n');
  out=out.replace(/\s*<aside class="ri-home-promo"[^>]*data-real-investigations-home-promo[^>]*>[\s\S]*?<\/aside>\s*/g,'\n');
  out=out.replace(/\s*<section class="ri-approved-home"[^>]*data-real-investigations-approved-home[^>]*>[\s\S]*?<\/section>\s*/g,'\n');
  return out;
}

function stripLegacySoloLaunch(html){
  return html.replace(/\s*<aside class="ri-approved-solo"[^>]*data-real-investigations-approved-solo[^>]*>[\s\S]*?<\/aside>\s*/g,'\n');
}

function ensureAiPromo(html,label){
  if(!html.includes('data-ai01-launch-promo-style')) throw new Error(`${label}: AI01 promo stylesheet missing — refusing to publish`);
  if(!html.includes('data-ai01-launch-promo-script')) throw new Error(`${label}: AI01 promo script missing — refusing to publish`);
}

function patchHome(siteRoot){
  const home=path.join(siteRoot,'index.html');
  let html=stripLegacyHomepageLaunch(fs.readFileSync(home,'utf8'));
  ensureAiPromo(html,'homepage');
  if(!html.includes('real-investigations-production-compat.css')) html=html.replace('</head>','  <link rel="stylesheet" href="./assets/real-investigations-production-compat.css?v=2.1.0">\n</head>');
  if(!html.includes('data-nav-real-investigations')){
    const logic='<a data-nav-logic href="./golovolomki-onlayn/">Головоломки</a>';
    if(html.includes(logic)) html=html.replace(logic,`${NAV_LINK}${logic}`);
    else html=html.replace('</nav>',`${NAV_LINK}</nav>`);
  }
  const heroPattern=/<section class="ref-home-hero">[\s\S]*?<\/section>/;
  const heroMatch=html.match(heroPattern);
  if(!heroMatch) throw new Error('Production homepage hero marker missing');
  html=html.replace(heroMatch[0],`${heroMatch[0]}\n${HOME_BANNER}`);
  if(!html.includes('data-nav-real-investigations')) throw new Error('Real investigations nav item was not preserved');
  if(!html.includes('data-real-investigations-approved-home')) throw new Error('Approved Real Investigations homepage banner was not preserved');
  if(html.includes('data-real-investigations-home-promo')) throw new Error('Rejected slim Real Investigations promo still present');
  if(html.includes('data-real-investigations-launchbar')) throw new Error('Legacy Real Investigations launch bar still present');
  if(html.includes('data-real-investigations-launch>')) throw new Error('Legacy oversized Real Investigations launch still present');
  if(html.includes('data-real-investigations-card')) throw new Error('Legacy Real Investigations format card still present');
  if(html.includes('real-investigations-launch.css')) throw new Error('Hub-only Real Investigations stylesheet leaked into homepage');
  ensureAiPromo(html,'homepage-after-patch');
  fs.writeFileSync(home,html);
}

function patchSolo(siteRoot){
  const file=path.join(siteRoot,'detektivnye-igry-dlya-odnogo','index.html');
  if(!fs.existsSync(file)) throw new Error(`Solo hub missing: ${file}`);
  let html=stripLegacySoloLaunch(fs.readFileSync(file,'utf8'));
  ensureAiPromo(html,'solo hub');
  if(!html.includes('real-investigations-production-compat.css')) html=html.replace('</head>','  <link rel="stylesheet" href="../assets/real-investigations-production-compat.css?v=2.1.0">\n</head>');
  const heroPattern=/<section class="solo407-hub-hero[^\"]*"[^>]*>[\s\S]*?<\/section>/;
  const heroMatch=html.match(heroPattern);
  if(!heroMatch) throw new Error('Solo hub hero marker missing');
  html=html.replace(heroMatch[0],`${heroMatch[0]}\n${SOLO_BANNER}`);
  if(!html.includes('data-real-investigations-approved-solo')) throw new Error('Approved Real Investigations solo banner was not preserved');
  ensureAiPromo(html,'solo-after-patch');
  fs.writeFileSync(file,html);
}

export function preserveRealInvestigationsLaunch(siteRoot){
  const art=validateApprovedBanner(siteRoot);
  const hub=path.join(siteRoot,'realnye-dela','index.html');
  const casePage=path.join(siteRoot,'realnye-dela','pozharnaya-lestnica-1991-premium','index.html');
  const hubCss=path.join(siteRoot,'assets','real-investigations-launch.css');
  const compatCss=path.join(siteRoot,'assets','real-investigations-production-compat.css');
  for(const file of [hub,casePage,hubCss,compatCss,art.target]) if(!fs.existsSync(file)) throw new Error(`Real investigations release asset missing: ${file}`);
  patchHome(siteRoot);
  patchSolo(siteRoot);
  return {version:'2.1.0',homePatched:true,soloPatched:true,nav:true,approvedArtwork:true,aiPromoPreserved:true,art};
}

export function registerRealInvestigationsReleaseFinalizer(siteRoot){
  if(releaseFinalizerRegistered) return;
  releaseFinalizerRegistered=true;
  process.once('beforeExit',()=>{
    preserveRealInvestigationsLaunch(siteRoot);
    finalizeSitemap(siteRoot);
  });
}
