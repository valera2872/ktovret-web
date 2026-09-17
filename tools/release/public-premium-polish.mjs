import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.0';
const HIDDEN_CASE_ROUTE=path.join('detektivnye-igry-dlya-dvoih','ne-publikovat');
const HIDDEN_CASE_ASSETS=[
  'partner-premium-v2.css',
  'partner-premium-commerce-v1.css',
  'partner-premium-v2.js',
  'partner-premium-commerce-v1.js',
];

function read(file){return fs.readFileSync(file,'utf8');}
function write(file,text){fs.writeFileSync(file,text);}
function requireFile(file,label){if(!fs.existsSync(file)) throw new Error(`${label} missing: ${file}`);}
function addStyle(html,href,marker='data-public-premium-polish'){
  if(html.includes(marker)) return html;
  return html.replace(/<\/head>/i,`<link ${marker} rel="stylesheet" href="${href}?v=${VERSION}">\n</head>`);
}
function addAiFeatureStyle(html,href){
  if(html.includes('data-ai01-feature-banner')) return html;
  return html.replace(/<\/head>/i,`<link data-ai01-feature-banner rel="stylesheet" href="${href}?v=1.5.0">\n</head>`);
}

function patchHomepage(siteRoot){
  const file=path.join(siteRoot,'index.html');
  requireFile(file,'homepage');
  let html=read(file);
  html=addStyle(html,'./assets/public-premium-polish.css');
  html=html.replaceAll('Реальные расследования Mystery Logic — реальные события, AI-допрос и собственная версия','Реальные расследования Mystery Logic — реальные события, вопросы свидетелям текстом и собственная версия');
  if(!html.includes('data-real-investigations-approved-home')) throw new Error('public polish: Real Investigations homepage banner missing');
  if(!html.includes('data-ai01-feature="home"')) throw new Error('public polish: AI homepage banner missing');
  write(file,html);
}

function patchSolo(siteRoot){
  const file=path.join(siteRoot,'detektivnye-igry-dlya-odnogo','index.html');
  requireFile(file,'Solo hub');
  let html=read(file);
  html=addStyle(html,'../assets/public-premium-polish.css');
  html=html.replaceAll('Реальные расследования Mystery Logic — реальные события, AI-допрос, игрок ведёт следствие','Реальные расследования Mystery Logic — реальные события, текстовый допрос, игрок ведёт следствие');

  const bannerPattern=/<section class="ml-ai01-feature ml-ai01-feature--solo"[\s\S]*?<\/section>/;
  const match=html.match(bannerPattern);
  if(!match) throw new Error('public polish: Solo AI banner missing');
  const banner=match[0];
  html=html.replace(banner,'');
  const paidMarker='<section class="sp-bridge" data-solo-paid-bridge>';
  if(!html.includes(paidMarker)) throw new Error('public polish: Solo paid bridge marker missing');
  html=html.replace(paidMarker,`${banner}\n${paidMarker}`);

  const heroAt=html.indexOf('data-solo-conversion-v3');
  const miniAt=html.indexOf('data-solo-mini-bridge');
  const aiAt=html.indexOf('data-ai01-feature="solo"');
  const paidAt=html.indexOf('data-solo-paid-bridge');
  if(!(heroAt>=0&&miniAt>heroAt&&aiAt>miniAt&&paidAt>aiAt)) throw new Error('public polish: Solo product hierarchy is incorrect');
  write(file,html);
}

function patchAiCase(siteRoot){
  const file=path.join(siteRoot,'detektivnaya-igra-s-ii','index.html');
  requireFile(file,'AI investigation page');
  let html=read(file);
  html=addAiFeatureStyle(html,'../assets/ai01-feature-banner.css');
  html=addStyle(html,'../assets/public-premium-polish.css');
  if(!html.includes('data-ai01-feature="case"')){
    const marker='<main class="aid-app" data-ai-detective>';
    if(!html.includes(marker)) throw new Error('public polish: AI page main marker missing');
    const banner=`<section class="ml-ai01-feature ml-ai01-feature--case" aria-label="AI-расследование «Восемь минут без камеры»"><div class="ml-ai01-feature-link" data-ai01-feature="case"><picture><source media="(max-width: 640px)" srcset="../assets/ai01-mobile-banner.webp"><img src="../assets/ai01-home-banner.webp" width="1200" height="400" loading="eager" decoding="async" alt="Восемь минут без камеры — бесплатное AI-расследование Mystery Logic: допрашивайте подозреваемых голосом или текстом"></picture><span class="ml-ai01-feature-badge">AI · бесплатно</span><span class="ml-ai01-feature-sr">AI-расследование «Восемь минут без камеры»</span></div></section>`;
    html=html.replace(marker,`${marker}\n${banner}`);
  }
  if(!html.includes('голосом или текстом')) throw new Error('public polish: AI voice/text proposition must remain explicit');
  if(!html.includes('data-ai01-feature="case"')) throw new Error('public polish: AI page hero banner missing');
  write(file,html);
}

function patchRealHub(siteRoot){
  const file=path.join(siteRoot,'realnye-dela','index.html');
  requireFile(file,'Real Investigations hub');
  let html=read(file);
  html=addStyle(html,'../assets/public-premium-polish.css');
  html=html.replaceAll('Изучайте материалы дела, разговаривайте со свидетелями свободным языком, заказывайте проверки и собирайте собственную доказательственную цепочку.','Изучайте материалы дела, задавайте свидетелям вопросы текстом своими словами, заказывайте проверки и собирайте собственную доказательственную цепочку.');
  html=html.replaceAll('<span>AI-допрос</span>','<span>текстовый допрос</span>');
  if(html.includes('AI-допрос')) throw new Error('public polish: ambiguous AI interrogation label remains on Real Investigations hub');
  if(/голос(?:ом|овой|а)?/iu.test(html)) throw new Error('public polish: voice wording leaked into Real Investigations hub');
  if(!html.includes('вопросы текстом своими словами')) throw new Error('public polish: typed-interrogation wording missing on Real Investigations hub');
  write(file,html);
}

function quarantineUnverifiedCase(siteRoot){
  const dir=path.join(siteRoot,HIDDEN_CASE_ROUTE);
  requireFile(path.join(dir,'index.html'),'unverified case guard route');
  const tombstone=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Материал недоступен — Mystery Logic</title></head><body><main><h1>Материал недоступен</h1><p>Это расследование ещё не опубликовано.</p><p><a href="../../">Вернуться в Mystery Logic</a></p></main></body></html>`;
  write(path.join(dir,'index.html'),tombstone);
  write(path.join(dir,'.htaccess'),'Redirect 404 /detektivnye-igry-dlya-dvoih/ne-publikovat/\n');
  for(const name of HIDDEN_CASE_ASSETS) fs.rmSync(path.join(siteRoot,'assets',name),{force:true});
  const guarded=read(path.join(dir,'index.html'));
  if(guarded.includes('partner-premium')||!guarded.includes('ещё не опубликовано')) throw new Error('public polish: unverified case was not quarantined');
}

export function applyPublicPremiumPolish(siteRoot){
  const root=path.resolve(siteRoot);
  requireFile(path.join(root,'assets','public-premium-polish.css'),'public premium stylesheet');
  patchHomepage(root);
  patchSolo(root);
  patchAiCase(root);
  patchRealHub(root);
  quarantineUnverifiedCase(root);
  return {version:VERSION,homepage:true,solo:true,aiCase:true,realHub:true,unverifiedCasePublic:false};
}
