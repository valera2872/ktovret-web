import fs from 'node:fs';
import path from 'node:path';

const NAV_LINK='<a class="ml-nav-new" data-nav-real-investigations href="./realnye-dela/">Реальные расследования <span class="ml-nav-new-badge">NEW</span></a>';
const REAL_ROUTES=['https://mysterylogic.com/realnye-dela/','https://mysterylogic.com/realnye-dela/pozharnaya-lestnica-1991-premium/'];
let releaseFinalizerRegistered=false;

const HOME_PROMO=`<aside class="ri-home-promo" data-real-investigations-home-promo aria-labelledby="ri-home-promo-title">
  <div class="ri-home-promo__main">
    <span class="ri-home-promo__badge">NEW</span>
    <div class="ri-home-promo__copy">
      <h2 id="ri-home-promo-title">Реальные расследования</h2>
      <p>Настоящие дела · свободный AI-допрос · собственная версия без прямых подсказок.</p>
    </div>
  </div>
  <a class="ri-home-promo__case" href="./realnye-dela/pozharnaya-lestnica-1991-premium/" aria-label="Открыть первое реальное расследование — Девушка на пожарной лестнице">
    <span class="ri-home-promo__case-copy"><small>Первое дело · Malden, 1991</small><strong>Девушка на пожарной лестнице</strong></span>
    <span class="ri-home-promo__arrow" aria-hidden="true">→</span>
  </a>
</aside>`;

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
  return out;
}

export function preserveRealInvestigationsLaunch(siteRoot){
  const home=path.join(siteRoot,'index.html');
  const hub=path.join(siteRoot,'realnye-dela','index.html');
  const casePage=path.join(siteRoot,'realnye-dela','pozharnaya-lestnica-1991-premium','index.html');
  const hubCss=path.join(siteRoot,'assets','real-investigations-launch.css');
  const compatCss=path.join(siteRoot,'assets','real-investigations-production-compat.css');
  const homeArt=path.join(siteRoot,'assets','real-investigations-hero.svg');
  for(const file of [home,hub,casePage,hubCss,compatCss,homeArt]) if(!fs.existsSync(file)) throw new Error(`Real investigations release asset missing: ${file}`);

  let html=stripLegacyHomepageLaunch(fs.readFileSync(home,'utf8'));
  if(!html.includes('real-investigations-production-compat.css')) html=html.replace('</head>','  <link rel="stylesheet" href="./assets/real-investigations-production-compat.css?v=1.3.0">\n</head>');

  if(!html.includes('data-nav-real-investigations')){
    const logic='<a data-nav-logic href="./golovolomki-onlayn/">Головоломки</a>';
    if(html.includes(logic)) html=html.replace(logic,`${NAV_LINK}${logic}`);
    else html=html.replace('</nav>',`${NAV_LINK}</nav>`);
  }

  const heroPattern=/<section class="ref-home-hero">[\s\S]*?<\/section>/;
  const heroMatch=html.match(heroPattern);
  if(!heroMatch) throw new Error('Production homepage hero marker missing');
  html=html.replace(heroMatch[0],`${heroMatch[0]}\n${HOME_PROMO}`);

  if(!html.includes('data-nav-real-investigations')) throw new Error('Real investigations nav item was not preserved');
  if(!html.includes('data-real-investigations-home-promo')) throw new Error('Slim Real Investigations homepage promo was not preserved');
  if(html.includes('data-real-investigations-home-card')) throw new Error('Legacy large Real Investigations homepage card still present');
  if(html.includes('data-real-investigations-launchbar')) throw new Error('Legacy Real Investigations launch bar still present');
  if(html.includes('data-real-investigations-launch>')) throw new Error('Legacy oversized Real Investigations launch still present');
  if(html.includes('data-real-investigations-card')) throw new Error('Legacy Real Investigations format card still present');
  if(html.includes('real-investigations-launch.css')) throw new Error('Hub-only Real Investigations stylesheet leaked into homepage');

  fs.writeFileSync(home,html);
  return {version:'1.3.0',homePatched:true,nav:true,slimPromo:true,legacyLaunchRemoved:true};
}

export function registerRealInvestigationsReleaseFinalizer(siteRoot){
  if(releaseFinalizerRegistered) return;
  releaseFinalizerRegistered=true;
  process.once('beforeExit',()=>{
    preserveRealInvestigationsLaunch(siteRoot);
    finalizeSitemap(siteRoot);
  });
}
