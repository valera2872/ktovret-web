import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.0';
const COGNITIVE_VERSION='1.1.0';

function addBodyClass(html,className){
  return html.replace(/<body([^>]*)>/,(_,attrs='')=>{
    const wanted=className.trim().split(/\s+/).filter(Boolean);
    const classMatch=attrs.match(/\sclass=(['"])(.*?)\1/);
    if(classMatch){
      const classes=[...new Set([...classMatch[2].split(/\s+/).filter(Boolean),...wanted])].join(' ');
      const next=attrs.replace(classMatch[0],` class=${classMatch[1]}${classes}${classMatch[1]}`);
      return `<body${next}>`;
    }
    return `<body${attrs} class="${wanted.join(' ')}">`;
  });
}

function addStyle(html,href,needle){
  if(html.includes(needle)) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="${href}">\n</head>`);
}

function addCognitiveShortCase(html,prefix){
  if(html.includes('cognitive-short-case.js')) return html;
  const app=/<script src="[^"]*ktovret-game\/assets\/app\.js[^>]*><\/script>/;
  if(!app.test(html)) throw new Error('Short-case app runtime missing before cognitive calibration');
  return html.replace(app,match=>`<script src="${prefix}assets/cognitive-short-case.js?v=${COGNITIVE_VERSION}"></script>${match}`);
}

function header(){
  return `<header class="ref-header ref-wrap ktv-ref-header"><a class="ref-brand" href="../../" aria-label="Mystery Logic — главная"><span class="ref-brand-mark">ML</span><span class="ref-brand-copy"><strong>Mystery Logic</strong><small>Детективные дела</small></span></a><nav class="ref-nav" aria-label="Основная навигация"><a href="../../">Главная</a><a href="../../dela/">Архив дел</a><a class="is-active" href="../../kto-vret/">Кто врёт?</a><a href="../../tom-1/">Первый том</a></nav><a class="ref-login" href="../../tom-1/"><span class="ref-login-icon" aria-hidden="true"></span>Доступ</a></header>`;
}

function footer(){
  return `<footer class="ref-footer ref-wrap"><span>© 2026 Mystery Logic</span><span><a href="../../dela/">Архив дел</a><a href="../../kto-vret/">Кто врёт?</a><a href="../../tom-1/">Первый том</a><a href="../../offer/">Условия</a></span></footer>`;
}

export function applyCaseV4(siteRoot){
  const root=path.join(siteRoot,'delo');
  if(!fs.existsSync(root)) return {pages:0,version:VERSION};
  let pages=0;
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    if(!entry.isDirectory()) continue;
    const file=path.join(root,entry.name,'index.html');
    if(!fs.existsSync(file)) continue;
    let html=fs.readFileSync(file,'utf8');
    if(!html.includes('window.KtoVretWeb=')||!html.includes('data-ktv-root')) continue;
    html=addStyle(html,'../../assets/storefront-reference.css?v=4.0.1','storefront-reference.css');
    html=addStyle(html,`../../assets/case-v4.css?v=${VERSION}`,'case-v4.css');
    html=addStyle(html,`../../assets/case-v4-polish.css?v=${VERSION}`,'case-v4-polish.css');
    html=addBodyClass(html,'ref-storefront ktv-case-v4');
    html=html.replace(/<div class="ml-brand-strip">[\s\S]*?<\/div>\s*<\/div>/,header());
    html=html.replace(/<footer class="ml-case-footer">[\s\S]*?<\/footer>/,footer());
    if(!html.includes('ktv-ref-header')){
      html=html.replace(/<body[^>]*>/,match=>`${match}${header()}`);
    }
    if(!html.includes('class="ref-footer ref-wrap"')){
      html=html.replace('</body>',`${footer()}</body>`);
    }
    html=addCognitiveShortCase(html,'../../');
    const markers=['ktv-case-v4','case-v4.css','case-v4-polish.css','ktv-ref-header','data-ktv-root','window.KtoVretWeb=','cognitive-short-case.js'];
    for(const marker of markers) if(!html.includes(marker)) throw new Error(`Case v4 missing ${marker}: ${entry.name}`);
    fs.writeFileSync(file,html);
    pages+=1;
  }

  // SEO-native free cases use a deeper route and do not get the V4 chrome,
  // but the same player-facing cognitive calibration must apply there.
  const seoRoot=path.join(siteRoot,'ru','cases');
  if(fs.existsSync(seoRoot)){
    for(const entry of fs.readdirSync(seoRoot,{withFileTypes:true})){
      if(!entry.isDirectory()) continue;
      const file=path.join(seoRoot,entry.name,'index.html');
      if(!fs.existsSync(file)) continue;
      let html=fs.readFileSync(file,'utf8');
      if(!html.includes('window.KtoVretWeb=')||!html.includes('data-ktv-root')) continue;
      html=addCognitiveShortCase(html,'../../../');
      if(!html.includes('cognitive-short-case.js')) throw new Error(`SEO case missing cognitive calibration: ${entry.name}`);
      fs.writeFileSync(file,html);
    }
  }

  return {pages,version:VERSION};
}