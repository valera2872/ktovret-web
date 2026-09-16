import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const HOME_SHA='10b470028546a3de6bf82aff6d9c70821574e06effb3f2a3e9f91a137c992f4b';
const MOBILE_SHA='294692a5f1d4e9f344a7f457938f9f1a4ee7cb531845040666fdf47f079bac41';
const HOME_SIZE=85254;
const MOBILE_SIZE=41182;

const HOME_BANNER=`<section class="ml-ai01-feature ml-ai01-feature--home" aria-label="Новое бесплатное AI-расследование">
  <a class="ml-ai01-feature-link" href="./detektivnaya-igra-s-ii/" data-ai01-feature="home">
    <picture><source media="(max-width: 640px)" srcset="./assets/ai01-mobile-banner.webp"><img src="./assets/ai01-home-banner.webp" width="1200" height="400" loading="eager" decoding="async" alt="Восемь минут без камеры — бесплатное AI-расследование Mystery Logic: допрашивайте подозреваемых голосом или текстом"></picture>
    <span class="ml-ai01-feature-badge">AI · бесплатно</span><span class="ml-ai01-feature-sr">Открыть расследование «Восемь минут без камеры»</span>
  </a>
</section>`;

const SOLO_BANNER=`<section class="ml-ai01-feature ml-ai01-feature--solo" aria-label="AI-расследование для одного игрока"><a class="ml-ai01-feature-link" href="../detektivnaya-igra-s-ii/" data-ai01-feature="solo"><picture><source media="(max-width: 640px)" srcset="../assets/ai01-mobile-banner.webp"><img src="../assets/ai01-home-banner.webp" width="1200" height="400" loading="eager" decoding="async" alt="Восемь минут без камеры — бесплатное AI-расследование для одного игрока"></picture><span class="ml-ai01-feature-badge">AI · бесплатно</span><span class="ml-ai01-feature-sr">Начать расследование «Восемь минут без камеры»</span></a></section>`;

function readPart(repoRoot,name){
  const file=path.join(repoRoot,'content','ai01-approved',name);
  if(!fs.existsSync(file)) throw new Error(`Approved AI banner source part missing: ${file}`);
  return fs.readFileSync(file,'utf8').trim();
}

function decodeExact(encoded,label){
  if(encoded.length%4!==0) throw new Error(`${label}: invalid base64 length ${encoded.length}`);
  const bytes=Buffer.from(encoded,'base64');
  if(bytes.toString('base64')!==encoded) throw new Error(`${label}: base64 source is not exact`);
  return bytes;
}

function normalizeWebp(bytes,label){
  if(bytes.length<30||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP') throw new Error(`${label}: invalid WebP/RIFF header`);
  const declared=bytes.readUInt32LE(4)+8;
  if(declared>bytes.length) throw new Error(`${label}: truncated WebP, RIFF declares ${declared}, file has ${bytes.length}`);
  if(declared<bytes.length) bytes=bytes.subarray(0,declared);
  return bytes;
}

function webpDimensions(bytes,label){
  if(bytes.toString('ascii',12,16)!=='VP8 '||bytes[23]!==0x9d||bytes[24]!==0x01||bytes[25]!==0x2a) throw new Error(`${label}: unexpected WebP encoding`);
  return {width:bytes.readUInt16LE(26)&0x3fff,height:bytes.readUInt16LE(28)&0x3fff};
}

function fingerprint(bytes,label){
  const dimensions=webpDimensions(bytes,label);
  return {bytes:bytes.length,width:dimensions.width,height:dimensions.height,digest:createHash('sha256').update(bytes).digest('hex')};
}

function validateFingerprint(info,label,sha,size,width,height){
  const failures=[];
  if(info.bytes!==size) failures.push(`size expected ${size}, got ${info.bytes}`);
  if(info.width!==width||info.height!==height) failures.push(`dimensions expected ${width}x${height}, got ${info.width}x${info.height}`);
  if(info.digest!==sha) failures.push(`sha expected ${sha}, got ${info.digest}`);
  if(failures.length) throw new Error(`${label}: approved fingerprint mismatch: ${failures.join('; ')}`);
}

function rebuildArtwork(siteRoot,repoRoot){
  const homeEncoded=[
    readPart(repoRoot,'home.part01.b64'),
    readPart(repoRoot,'home.part02.b64'),
    readPart(repoRoot,'home.part03.b64'),
    'X',readPart(repoRoot,'home.part04.b64'),
    'C',readPart(repoRoot,'home.part05.b64'),
    readPart(repoRoot,'home.part06.b64'),
  ].join('');
  const mobileEncoded=[
    readPart(repoRoot,'mobile.head01.b64'),
    readPart(repoRoot,'mobile.head02.b64'),
    readPart(repoRoot,'mobile.head03.b64'),
    readPart(repoRoot,'mobile.head04.b64'),
    'L',readPart(repoRoot,'mobile.part02.b64'),
    readPart(repoRoot,'mobile.part02-tail.b64'),
    readPart(repoRoot,'mobile.part03.b64'),
  ].join('');
  const home=normalizeWebp(decodeExact(homeEncoded,'AI desktop banner'),'AI desktop banner');
  const mobile=normalizeWebp(decodeExact(mobileEncoded,'AI mobile banner'),'AI mobile banner');
  const homeInfo=fingerprint(home,'AI desktop banner');
  const mobileInfo=fingerprint(mobile,'AI mobile banner');
  if(homeInfo.bytes!==HOME_SIZE||homeInfo.digest!==HOME_SHA||homeInfo.width!==1200||homeInfo.height!==400||mobileInfo.bytes!==MOBILE_SIZE||mobileInfo.digest!==MOBILE_SHA||mobileInfo.width!==360||mobileInfo.height!==640){
    throw new Error(`Approved AI artwork fingerprints changed. home=${JSON.stringify(homeInfo)} mobile=${JSON.stringify(mobileInfo)}`);
  }
  validateFingerprint(homeInfo,'AI desktop banner',HOME_SHA,HOME_SIZE,1200,400);
  validateFingerprint(mobileInfo,'AI mobile banner',MOBILE_SHA,MOBILE_SIZE,360,640);
  const assets=path.join(siteRoot,'assets');
  fs.mkdirSync(assets,{recursive:true});
  fs.writeFileSync(path.join(assets,'ai01-home-banner.webp'),home);
  fs.writeFileSync(path.join(assets,'ai01-mobile-banner.webp'),mobile);
  return {home:homeInfo,mobile:mobileInfo};
}

function addCss(html,href){
  if(html.includes('data-ai01-feature-banner')) return html;
  return html.replace('</head>',`<link data-ai01-feature-banner rel="stylesheet" href="${href}"></head>`);
}

function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addCss(html,'./assets/ai01-feature-banner.css?v=20260916ai01');
  if(!html.includes('data-ai01-feature="home"')){
    const marker='<section class="ref-home-hero">';
    if(!html.includes(marker)) throw new Error('AI banner: homepage hero marker missing');
    html=html.replace(marker,`${HOME_BANNER}\n${marker}`);
  }
  if(!html.includes('data-ai01-feature="home"')||!html.includes('AI · бесплатно')) throw new Error('AI banner: homepage markup missing');
  fs.writeFileSync(file,html);
}

function patchSolo(siteRoot){
  const file=path.join(siteRoot,'detektivnye-igry-dlya-odnogo','index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addCss(html,'../assets/ai01-feature-banner.css?v=20260916ai01');
  if(!html.includes('data-ai01-feature="solo"')){
    const marker='<main class="solo407-shell solo407-hub">';
    if(!html.includes(marker)) throw new Error('AI banner: Solo main marker missing');
    html=html.replace(marker,`${marker}\n${SOLO_BANNER}`);
  }
  if(!html.includes('data-ai01-feature="solo"')||!html.includes('AI · бесплатно')) throw new Error('AI banner: Solo markup missing');
  fs.writeFileSync(file,html);
}

export function applyApprovedAi01(siteRoot,repoRoot=process.cwd()){
  const required=[
    path.join(siteRoot,'index.html'),
    path.join(siteRoot,'detektivnye-igry-dlya-odnogo','index.html'),
    path.join(siteRoot,'assets','ai01-feature-banner.css'),
  ];
  const missing=required.filter(file=>!fs.existsSync(file));
  if(missing.length) throw new Error(`AI banner release asset missing: ${missing[0]}`);
  const art=rebuildArtwork(siteRoot,repoRoot);
  patchHome(siteRoot);
  patchSolo(siteRoot);
  return {version:'1.2.0',home:true,solo:true,correctedSpelling:true,art};
}
