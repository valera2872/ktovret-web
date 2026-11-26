#!/usr/bin/env node
// Read-only audit of publicly served Mystery Logic games. No purchase,
// authentication, room creation, customer session writes or API mutations.
// Third-party analytics/POST are blocked in browser renders.
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const ROOT='https://mysterylogic.com';
const out='artifacts/live-games-audit-20261123';
await fs.mkdir(out,{recursive:true});
const known=[
 '/','/dela/','/kto-vret/','/kto-vret-igra/',
 '/detektivnye-igry-dlya-odnogo/','/detektivnye-igry-dlya-odnogo/mini/',
 '/detektivnye-igry-dlya-odnogo/rassledovaniya/',
 '/detektivnye-igry-dlya-odnogo/407/','/detektivnye-igry-dlya-odnogo/tihaya-noch/',
 '/detektivnye-igry-dlya-dvoih/','/detektivnye-igry-dlya-dvoih/2317/',
 '/detektivnye-igry-dlya-dvoih/407/','/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/',
 '/realnye-dela/','/realnye-dela/pozharnaya-lestnica-1991/',
 '/realnye-dela/pozharnaya-lestnica-1991-premium/',
 '/ai-investigation/','/detektivnaya-igra-s-ii/',
 '/detektivnye-golovolomki/','/igry-dlya-mozga/','/golovolomki-onlayn/',
 '/iq-detektiva/'
];
const required=new Set(known.filter(x=>!['/detektivnaya-igra-s-ii/','/ai-investigation/','/iq-detektiva/','/kto-vret-igra/'].includes(x)));
const freeGame=(p)=>/^\/(?:delo\/|detektivnye-igry-dlya-odnogo\/mini\/|detektivnye-igry-dlya-odnogo\/rassledovaniya\/)/.test(p);
function normPath(link,base){
 try{
  const url=new URL(link,base);
  if(url.origin!==ROOT||!['http:','https:'].includes(url.protocol))return null;
  if(/\.(?:js|css|webp|png|jpg|svg|ico|pdf|xml|json|woff2?|map|txt)$/i.test(url.pathname))return null;
  return url.pathname.endsWith('/')?url.pathname:url.pathname+'/';
 }catch{return null;}
}
const request=async(url,timeout=16000)=>{
 try{
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'MysteryLogic-QA-ReadOnly/2026-11-23','cache-control':'no-cache'},signal:AbortSignal.timeout(timeout)});
  return {status:r.status,type:r.headers.get('content-type')||'',url:r.url,body:await r.text()};
 }catch(e){return {status:0,type:'',url,body:'',error:String(e).slice(0,220)};}
};
const chunks=(array,n)=>Array.from({length:Math.ceil(array.length/n)},(_,i)=>array.slice(i*n,(i+1)*n));
const discover=new Set(known);
const crawlSource=['/','/dela/','/kto-vret/','/detektivnye-igry-dlya-odnogo/','/detektivnye-igry-dlya-odnogo/mini/','/detektivnye-igry-dlya-odnogo/rassledovaniya/','/detektivnye-igry-dlya-dvoih/','/realnye-dela/','/sitemap.xml'];
for(const part of crawlSource){
 const res=await request(ROOT+part);
 const rx=part.includes('sitemap')?/<loc>([^<]+)<\/loc>/gi:/<a\b[^>]*href=["']([^"']+)["']/gi;
 for(const match of res.body.matchAll(rx)){
  const p=normPath(match[1],ROOT+part);
  if(p && (known.includes(p)||freeGame(p)||/^(\/(?:detektivnye-igry-dlya-(?:odnogo|dvoih)\/[^/]+\/|realnye-dela\/[^/]+\/|zero-copy\/|ai-investigation\/|dela\/|kto-vret\/))$/.test(p)))discover.add(p);
 }
 console.log('DISCOVERY',part,'HTTP',res.status,'links',discover.size);
}
const paths=[...discover].slice(0,270);
const pages=[];
for(const batch of chunks(paths,8)){
 const rows=await Promise.all(batch.map(async p=>{
  const r=await request(ROOT+p);
  const title=(r.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]?.replace(/<[^>]+>/g,'').trim()||'';
  const h1=(r.body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]?.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()||'';
  return {path:p,status:r.status,type:r.type,bytes:Buffer.byteLength(r.body),title,h1,error:r.error||'',html:r.body};
 }));
 pages.push(...rows);
}
const assets=new Map();
function addAsset(ref,from,kind){
 if(!ref||/^(?:data:|blob:|javascript:|mailto:|tel:|#)/i.test(ref))return;
 try{
  const u=new URL(ref,ROOT+from);
  if(u.origin!==ROOT || !/^(?:https?:)$/.test(u.protocol))return;
  const key=u.pathname; 
  if(!assets.has(key))assets.set(key,{path:key,kind,from});
 }catch{}
}
for(const page of pages){
 if(page.status!==200||!/html/i.test(page.type))continue;
 const tags=page.html.match(/<(?:script|link|img|source)\b[^>]*>/gi)||[];
 for(const tag of tags){
  const type=tag.match(/^<(\w+)/)?.[1]?.toLowerCase();
  const src=tag.match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i)?.[1];
  if(type==='script')addAsset(src,page.path,'script');
  if(type==='link'&&/stylesheet|icon/i.test(tag))addAsset(src,page.path,'stylesheet/icon');
  if(type==='img'||type==='source'){
   addAsset(src,page.path,'image');
   const set=tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1]||'';
   for(const candidate of set.split(','))addAsset(candidate.trim().split(/\s+/)[0],page.path,'image-srcset');
  }
 }
}
const assetsOut=[];
for(const batch of chunks([...assets.values()],8)){
 const rows=await Promise.all(batch.map(async v=>{
  const r=await request(ROOT+v.path,18000);
  const validImage=!v.kind.startsWith('image')||(!/html/i.test(r.type)&&r.body.length>0);
  return {...v,status:r.status,type:r.type,bytes:Buffer.byteLength(r.body),error:r.error||'',validImage};
 }));
 assetsOut.push(...rows);
}
const browserPaths=[
 '/','/kto-vret/','/dela/','/detektivnye-igry-dlya-odnogo/mini/','/detektivnye-igry-dlya-odnogo/rassledovaniya/',
 '/detektivnye-igry-dlya-odnogo/407/','/detektivnye-igry-dlya-odnogo/tihaya-noch/',
 '/detektivnye-igry-dlya-dvoih/2317/','/detektivnye-igry-dlya-dvoih/407/','/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/',
 '/realnye-dela/pozharnaya-lestnica-1991-premium/','/realnye-dela/','/detektivnye-golovolomki/',
 '/ai-investigation/'
].filter(p=>pages.find(a=>a.path===p&&a.status===200));
const browser=[];
let browserException='';
try{
 const puppeteer=(await import('file:///tmp/ml-live-audit/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')).default;
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
 if(!executable)throw Error('Chrome executable not installed on GitHub runner');
 const app=await puppeteer.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage','--no-first-run']});
 for(const viewport of [{name:'desktop',width:1366,height:900},{name:'mobile',width:390,height:844}]){
  const page=await app.newPage();
  await page.setViewport({width:viewport.width,height:viewport.height,isMobile:viewport.name==='mobile',hasTouch:viewport.name==='mobile'});
  await page.setRequestInterception(true);
  let blockedRequests=0,brokenRequests=[];
  page.on('request',req=>{
   const u=req.url(),method=req.method();
   if(!['GET','HEAD'].includes(method)||/\/(?:funnel-event|analytics|metrics|collect)(?:[/?-]|$)|google-analytics\.com|mc\.yandex/i.test(u)){blockedRequests++;return req.abort('blockedbyclient');}
   req.continue();
  });
  page.on('response',res=>{
   const u=res.url(),status=res.status();
   if(status>=400 && !/google-analytics|mc\.yandex|favicon.ico/.test(u))brokenRequests.push({status,url:u.slice(0,200)});
  });
  for(const route of browserPaths){
   const errors=[];const listener=e=>errors.push(String(e.message||e).slice(0,240));
   page.on('pageerror',listener);
   let navigationStatus=0,timeout='';
   try{
    const response=await page.goto(ROOT+route,{waitUntil:'domcontentloaded',timeout:23000});
    navigationStatus=response?.status()||0;
    await new Promise(resolve=>setTimeout(resolve,1300));
   }catch(e){timeout=String(e).slice(0,180)}
   const info=await page.evaluate(()=>{
    const imgs=[...document.images];
    const failed=imgs.filter(x=>x.complete&&(!x.naturalWidth||!x.naturalHeight)).map(x=>({src:x.currentSrc||x.src,alt:x.alt})).slice(0,8);
    const visible=(el)=>{const rect=el.getBoundingClientRect(),st=getComputedStyle(el);return rect.width>0&&rect.height>0&&st.visibility!=='hidden'&&st.display!=='none'};
    const startButtons=[...document.querySelectorAll('button,a')].filter(visible).map(e=>(e.textContent||'').trim().replace(/\s+/g,' ')).filter(t=>/начать|принять дело|играть|открыть|купить|оплат|продолжить|создать комнату/i.test(t)).slice(0,12);
    return {title:document.title,h1:document.querySelector('h1')?.innerText?.trim().slice(0,120)||'',
      text:document.body?.innerText?.length||0,
      scripts:document.scripts.length,
      visibleButtons:startButtons,
      brokenImages:failed,
      overflow:document.documentElement.scrollWidth>innerWidth+3,
      loading:!!document.querySelector('.moreno-loading,[data-loading]'),
      bodyHasError:/фатальная ошибка|сервер временно не работает|ошибка подключения|что-то пошло не так/i.test(document.body?.innerText||'')};
   }).catch(e=>({error:String(e)}));
   browser.push({path:route,viewport:viewport.name,navigationStatus,timeout,errors:errors.slice(0,8),blockedRequests,networkFailures:brokenRequests.slice(-10),...info});
   console.log('RENDER',viewport.name,route,'HTTP',navigationStatus,'errors',errors.length,'brokenImages',info?.brokenImages?.length||0,'overflow',info?.overflow,'buttons',info?.visibleButtons?.length||0);
   page.off('pageerror',listener);
   blockedRequests=0;brokenRequests=[];
  }
  await page.close();
 }
 await app.close();
}catch(e){browserException=String(e.stack||e).slice(0,800);console.error('BROWSER_RUN_ERROR',browserException);}
const brokenPages=pages.filter(p=>p.status===0||p.status>=400);
const brokenAssets=assetsOut.filter(a=>a.status===0||a.status>=400||!a.validImage);
const brokenImages=browser.filter(x=>x.brokenImages?.length);
const overflows=browser.filter(x=>x.overflow);
const exceptions=browser.filter(x=>x.errors?.length);
const report={
  date:new Date().toISOString(),scope:'LIVE read-only (no checkout/payment/POST)',
  totals:{pages:pages.length,brokenPages:brokenPages.length,assets:assetsOut.length,brokenAssets:brokenAssets.length,
    renders:browser.length,brokenImageRenders:brokenImages.length,horizontalOverflows:overflows.length,renderExceptions:exceptions.length},
  browserException,brokenPages:brokenPages.map(({html,...a})=>a),
  brokenAssets,brokenImages,overflows,exceptions,
  pages:pages.map(({html,...a})=>a),assets:assetsOut,browser
};
await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
const summary=[
 '# Mystery Logic — LIVE read-only audit',
 '',
 'UTC '+report.date,
 '',
 ...Object.entries(report.totals).map(([k,v])=>'- '+k+': **'+v+'**'),
 '',
 'No payment, signup, room create, gameplay session write or analytics POST was allowed.',
 '',
 '## Broken HTML routes',
 ...brokenPages.map(x=>'- HTTP '+x.status+' '+x.path+' '+x.error).slice(0,100),
 '',
 '## Broken assets',
 ...brokenAssets.map(x=>'- HTTP '+x.status+' '+x.path+' from '+x.from+' ('+x.kind+')').slice(0,100),
 '',
 '## Browser errors / broken images / overflow',
 ...[...brokenImages,...overflows,...exceptions].map(x=>'- '+x.viewport+' '+x.path+' images='+x.brokenImages?.length+' overflow='+x.overflow+' errors='+x.errors?.join('|')).slice(0,120),
 '',
 '## Limits',
 '- Browser test inspected initial rendered state only; no live paid checkout or final reconstruction was attempted.',
 '- Exact live site is observed, not inferred from GitHub main. Browser POST blocked to avoid polluting analytics/user sessions.',
 '- Technical asset and initial-render smoke is not proof of end-to-end gameplay correctness.',
 browserException?'BROWSER HARNESS FAILED: '+browserException:''
].join('\n');
await fs.writeFile(out+'/SUMMARY.md',summary);
console.log('SUMMARY',JSON.stringify(report.totals),'browserException',browserException||'none');
console.log('BROKEN PAGES',JSON.stringify(report.brokenPages.slice(0,25)));
console.log('BROKEN ASSETS',JSON.stringify(brokenAssets.slice(0,20)));
console.log('BROKEN IMAGES',JSON.stringify(brokenImages.slice(0,20)));
console.log('OVERFLOWS',JSON.stringify(overflows.slice(0,20)));
console.log('JS EXCEPTIONS',JSON.stringify(exceptions.slice(0,15)));
if(browserException||brokenPages.some(p=>required.has(p.path))||brokenAssets.some(a=>a.kind==='script'||a.kind==='stylesheet/icon')||exceptions.length)process.exitCode=1;
