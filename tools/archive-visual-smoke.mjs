#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=path.resolve(here,'..');
const outDir=path.join(siteRoot,'artifacts','storefront-reference-smoke');
fs.mkdirSync(outDir,{recursive:true});
const volumeCardAsset=path.join(siteRoot,'assets','reference-format-volume-archive.webp');
const materialCssFile=path.join(siteRoot,'assets','storefront-v4-material.css');
const volumeSalesCssFile=path.join(siteRoot,'assets','storefront-volume-sales.css');
const volumeStorefrontFile=path.join(siteRoot,'assets','volume-storefront.js');
if(!fs.existsSync(volumeCardAsset)||fs.statSync(volumeCardAsset).size<30000)throw new Error('First Volume card artwork missing or suspiciously small');
if(!fs.readFileSync(materialCssFile,'utf8').includes('reference-format-volume-archive.webp'))throw new Error('First Volume card artwork is not wired into material CSS');
if(!fs.readFileSync(volumeSalesCssFile,'utf8').includes('.ref-access-strip.is-checkout-open'))throw new Error('Expanded checkout layout guard missing');
if(!fs.readFileSync(volumeStorefrontFile,'utf8').includes('syncCheckoutLayout'))throw new Error('Expanded checkout runtime guard missing');
const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(candidate=>fs.existsSync(candidate));
if(!chrome)throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);
const contentTypes=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.json','application/json; charset=utf-8'],['.svg','image/svg+xml'],['.webp','image/webp'],['.png','image/png'],['.xml','application/xml; charset=utf-8']]);
const qaCode=`(()=>{const checkout=()=>setTimeout(()=>{const cfg=window.MysteryLogicPaidAccessConfig||{},email=document.querySelector('[data-volume-email]'),offer=document.querySelector('[data-volume-offer-accept]'),privacy=document.querySelector('[data-volume-privacy-ack]'),buy=document.querySelector('[data-volume-buy]');document.documentElement.setAttribute('data-ml-checkout-config',String(Boolean(cfg.checkoutEnabled))+':'+String(Boolean(cfg.checkoutEndpoint)));document.documentElement.setAttribute('data-ml-checkout-elements',String(Boolean(email&&offer&&privacy&&buy)));if(email&&offer&&privacy&&buy){email.value='qa@mysterylogic.test';offer.checked=true;privacy.checked=true;email.dispatchEvent(new Event('input',{bubbles:true}));offer.dispatchEvent(new Event('change',{bubbles:true}));privacy.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>document.documentElement.setAttribute('data-ml-checkout-ready',String(!buy.disabled)),100)}},250);const openCheckout=()=>{if(new URL(location.href).searchParams.get('qa')!=='checkout')return;setTimeout(()=>{const details=document.querySelector('.ref-checkout');if(!details)return;details.open=true;document.documentElement.setAttribute('data-ml-checkout-open','true');setTimeout(()=>{const panel=details.querySelector('.ref-checkout-panel');const strip=details.closest('.ref-access-strip');const panelRect=panel?.getBoundingClientRect();const stripRect=strip?.getBoundingClientRect();const visible=Boolean(panelRect&&stripRect&&panelRect.bottom<=stripRect.bottom+1);document.documentElement.setAttribute('data-ml-checkout-visible',String(visible));if(innerWidth<=700)panel?.scrollIntoView({block:'center'})},180)},450)};const openCase=()=>{if(new URL(location.href).searchParams.get('qa')!=='open')return;let attempts=0;const tryOpen=()=>{const button=document.querySelector('[data-action="accept"]');if(button){button.click();document.documentElement.setAttribute('data-ml-case-open','true');return}if(attempts++<20)setTimeout(tryOpen,100)};setTimeout(tryOpen,150)};const run=()=>{checkout();openCheckout();openCase()};if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true})})();`;
const qaTag='<script src="/__qa__/checkout-smoke.js"></script>';
const server=http.createServer((request,response)=>{const requestUrl=new URL(request.url||'/','http://127.0.0.1');if(requestUrl.pathname==='/__qa__/checkout-smoke.js'){response.setHeader('Content-Type','text/javascript; charset=utf-8');response.setHeader('Cache-Control','no-store');return response.end(qaCode)}let relative=decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');if(!relative||relative.endsWith('/'))relative+='index.html';const filePath=path.resolve(siteRoot,relative);if(!filePath.startsWith(`${siteRoot}${path.sep}`)&&filePath!==siteRoot)return response.writeHead(403).end('Forbidden');if(!fs.existsSync(filePath)||!fs.statSync(filePath).isFile())return response.writeHead(404).end('Not found');const ext=path.extname(filePath).toLowerCase();response.setHeader('Content-Type',contentTypes.get(ext)||'application/octet-stream');if(ext==='.html'){let html=fs.readFileSync(filePath,'utf8');html=html.replace('</body>',`${qaTag}</body>`);return response.end(html)}response.end(fs.readFileSync(filePath));});
const listen=()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const chromeTimeoutMs=Number(process.env.ML_CHROME_TIMEOUT_MS||20000);
const runChrome=(args)=>new Promise((resolve,reject)=>{const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe'],detached:true});let stdout='',stderr='',settled=false;const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);fn(value)};const timer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL')}catch{}finish(reject,new Error(`Chrome timed out after ${chromeTimeoutMs}ms: ${stderr.slice(-1800)}`))},chromeTimeoutMs);child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',error=>finish(reject,error));child.on('close',code=>code===0?finish(resolve,{stdout,stderr}):finish(reject,new Error(`Chrome exited ${code}: ${stderr.slice(-1800)}`)));});
const pngDimensions=(filePath)=>{const bytes=fs.readFileSync(filePath);if(bytes.length<24||bytes.toString('hex',0,8)!=='89504e470d0a1a0a')throw new Error(`${filePath} is not a PNG`);return{width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};};
const viewports=[{name:'reference',width:1055,height:1491,scale:1},{name:'mobile',width:390,height:844,scale:1},{name:'desktop',width:1440,height:1100,scale:1}];
const retinaViewport={name:'retina',width:1055,height:1491,scale:2};
const functionalNav=['data-functional-nav="v2"','>Игры<','data-nav-coop','Игры для двоих','ref-nav-coop-short','>15 бесплатных дел<','>Первый том<','>Метод<','Открыть досье'];
const homeCtrNav=['data-functional-nav="v2"','>Играть бесплатно<','data-nav-coop','>Для двоих<','>Все дела<','>Как играть<','>Первый том<'];
const liveFreeGrid=['class="ref-case-grid ml-material-archive ref-free-grid"','ml-live-number','ml-live-badge'];
const pages=[
{name:'home',path:'/',required:['ref-storefront-v41','data-reference-asset="home-hero"','data-reference-asset="home-lower"','data-material-ui="home-lower"','data-material-ui="live-evidence"','ml-material-formats','data-reference-asset="volume-archive-photo"','storefront-v4-material.css','Детективные игры онлайн','Получить первое досье','Открыть 15 бесплатных дел','Посмотреть Первый том','data-functional-method="v2"',...homeCtrNav],forbidden:['class="ref-snapshot ref-home-lower"']},
{name:'catalog',path:'/dela/',required:['ref-storefront-v41','data-reference-asset="archive-hero"','data-reference-asset="archive-grid"','storefront-v4-material.css','ref-catalog-extra','15 полноценных расследований','data-free-case-count="15"','data-catalog-progress','data-catalog-random','id="case-search"','id="case-difficulty"','id="case-category"','id="case-unsolved"','data-premium-archive-summaries','Ещё 85 дел — одной покупкой',...liveFreeGrid,...functionalNav],forbidden:['class="ref-snapshot ref-archive-snapshot"']},
{name:'volume',path:'/tom-1/',required:['ref-storefront-v41','data-reference-asset="archive-hero"','storefront-v4-material.css','storefront-volume-sales.css','data-volume-email','data-volume-offer-accept','data-volume-privacy-ack','data-volume-buy','data-ml-checkout-config="true:true"','data-ml-checkout-elements="true"','data-ml-checkout-ready="true"','100 детективных дел','99 ₽','data-free-case-count="15"','data-volume-sales-v3','ref-volume-trial-v4','Получить 85 дел за 99 ₽','в полном томе','data-volume-premium-archives','data-volume-archive-art="c1"','data-volume-archive-art="c8"','id="volume-access"','85 дел в тематических архивах','data-functional-volume-faq','data-volume-closing-cta','data-volume-scroll-buy','Получить 85 дел за 99 ₽ ↑',...functionalNav],forbidden:['class="ref-snapshot ref-archive-snapshot"','ref-volume-free-head','class="ref-case-grid ml-material-archive ref-free-grid"','ref-volume-included-stats','>закрыты<']},
{name:'volume-checkout',path:'/tom-1/?qa=checkout',required:['ref-storefront-v41','data-ml-checkout-open="true"','data-ml-checkout-visible="true"','is-checkout-open','data-volume-email','data-volume-offer-accept','data-volume-privacy-ack','data-volume-buy','data-ml-checkout-ready="true"',...functionalNav],forbidden:['ref-volume-included-stats','>закрыты<']},
{name:'who',path:'/kto-vret/',required:['data-storefront-v4-who="1.0.0"','storefront-reference-v41.css','storefront-v4-who.css','storefront-v4-material.css','data-reference-asset="who-approved-art"','data-reference-asset="archive-grid"','15 бесплатных дел','Как проходит расследование','Кто врёт?','data-free-case-count="15"','data-functional-duel="v2"',...liveFreeGrid,...functionalNav],forbidden:['class="ref-snapshot ref-archive-snapshot"']},
{name:'case-cover',path:'/delo/chetyre-vhoda-v-arhiv/',required:['ktv-case-v4','case-v4.css','ktv-ref-header','Принять дело','Четыре входа в архив',...functionalNav],forbidden:[]},
{name:'case-open',path:'/delo/chetyre-vhoda-v-arhiv/?qa=open',required:['ktv-case-v4','data-ml-case-open="true"','Хронология происшествия','03 · Ваша версия',...functionalNav],forbidden:[]},
];
const port=await listen();const results=[];
async function render(page,viewport){
  const url=`http://127.0.0.1:${port}${page.path}`;
  const captureViewport=page.name==='volume-checkout'&&viewport.name==='mobile'?{...viewport,height:1400}:viewport;
  const scale=captureViewport.scale||1;
  const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',`--force-device-scale-factor=${scale}`,`--window-size=${captureViewport.width},${captureViewport.height}`,'--virtual-time-budget=3800'];
  const screenshot=path.join(outDir,`${page.name}-${viewport.name}.png`);
  await runChrome([...common,`--screenshot=${screenshot}`,url]);
  const{stdout:dom}=await runChrome([...common,'--dump-dom',url]);
  const dimensions=pngDimensions(screenshot);
  const expectedWidth=captureViewport.width*scale,expectedHeight=captureViewport.height*scale;
  if(dimensions.width!==expectedWidth||dimensions.height!==expectedHeight)throw new Error(`${page.name}/${viewport.name}: unexpected screenshot dimensions ${dimensions.width}x${dimensions.height}, expected ${expectedWidth}x${expectedHeight}`);
  if(dimensions.bytes<(scale===1?18000:60000))throw new Error(`${page.name}/${viewport.name}: screenshot suspiciously small (${dimensions.bytes})`);
  for(const marker of page.required)if(!dom.includes(marker)){const qa=dom.match(/data-ml-(?:checkout|case)-(?:config|elements|ready|open)="[^"]*"/g)?.join(', ')||'no QA markers';throw new Error(`${page.name}/${viewport.name}: missing marker ${marker}; ${qa}`)}
  for(const marker of page.forbidden||[])if(dom.includes(marker))throw new Error(`${page.name}/${viewport.name}: forbidden marker remains: ${marker}`);
  if(dom.includes('ReferenceError')||dom.includes('TypeError:'))throw new Error(`${page.name}/${viewport.name}: runtime failure detected`);
  results.push({page:page.name,path:page.path,viewport:viewport.name,scale,width:dimensions.width,height:dimensions.height,cssWidth:captureViewport.width,cssHeight:captureViewport.height,bytes:dimensions.bytes,screenshot:path.relative(siteRoot,screenshot)});
}
try{
  for(const page of pages)for(const viewport of viewports)await render(page,viewport);
  for(const page of pages.filter(item=>item.name==='home'||item.name==='catalog'))await render(page,retinaViewport);
}finally{await new Promise(resolve=>server.close(resolve));}
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({chrome,results},null,2));console.log(JSON.stringify({results},null,2));
// Approved storefront baselines remain protected. Smoke locks restored functional UX, validates the CTR-first homepage nav separately, verifies the dedicated First Volume sales page and live case grids, forbids whole-page raster UI snapshots and adds 2x Retina captures for the two most image-sensitive storefront pages.
