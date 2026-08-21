import fs from 'node:fs';
import path from 'node:path';

const VERSION='3.0.0';
const STYLE=`storefront-v3.css?v=${VERSION}`;

const addStyle=(html,href)=>html.includes(STYLE)?html:html.replace('</head>',`  <link rel="stylesheet" href="${href}">\n</head>`);
const addClass=(html)=>html.replace(/<body class="([^"]*)">/,(_,classes)=>`<body class="${classes.includes('mx-v3')?classes:`${classes} mx-v3`}">`);
const hero=(src,alt)=>`<figure class="mx-hero-figure"><img src="${src}" alt="${alt}" width="920" height="760" decoding="async"></figure>`;

function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,`./assets/${STYLE}`));
  html=html.replace(/<aside class="sf-stage"[\s\S]*?<\/aside>/,hero('./assets/storefront-v3-archive-hero.svg','Премиальный архив расследований Mystery Logic: папки, карточки дел и материалы расследования'));
  if(!html.includes('mx-hero-figure')||!html.includes('storefront-v3-archive-hero.svg')) throw new Error('storefront v3 home hero failed');
  fs.writeFileSync(file,html);
}

function patchCatalog(siteRoot){
  const file=path.join(siteRoot,'dela/index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,`../assets/${STYLE}`));
  html=html.replace(/<aside class="sf-catalog-art"[\s\S]*?<\/aside>/,hero('../assets/storefront-v3-archive-hero.svg','Архив ста детективных дел Mystery Logic'));
  if(!html.includes('mx-hero-figure')||!html.includes('Архивы первого тома')) throw new Error('storefront v3 catalog contract failed');
  fs.writeFileSync(file,html);
}

function patchVolume(siteRoot){
  const file=path.join(siteRoot,'tom-1/index.html');
  let html=fs.readFileSync(file,'utf8');
  html=addClass(addStyle(html,`../assets/${STYLE}`));
  html=html.replace(/<aside class="sf-volume-object"[\s\S]*?<\/aside>/,hero('../assets/storefront-v3-archive-hero.svg','Первый том Mystery Logic — премиальный архив из ста расследований'));
  if(!html.includes('mx-hero-figure')||!html.includes('data-volume-buy')) throw new Error('storefront v3 volume contract failed');
  fs.writeFileSync(file,html);
}

export function applyStorefrontV3(siteRoot){
  patchHome(siteRoot);patchCatalog(siteRoot);patchVolume(siteRoot);
  return {pages:3,version:VERSION};
}
