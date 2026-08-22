import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.0';

export function applyCaseEntryReference(siteRoot){
  const casesRoot=path.join(siteRoot,'delo');
  if(!fs.existsSync(casesRoot)) return {pages:0,version:VERSION};
  let pages=0;
  for(const entry of fs.readdirSync(casesRoot,{withFileTypes:true})){
    if(!entry.isDirectory()) continue;
    const file=path.join(casesRoot,entry.name,'index.html');
    if(!fs.existsSync(file)) continue;
    let html=fs.readFileSync(file,'utf8');
    if(!html.includes('data-ktv-root')||!html.includes('window.KtoVretWeb=')) continue;
    if(!html.includes('case-entry-reference-v1.css')){
      html=html.replace('</head>',`<link rel="stylesheet" href="../../assets/case-entry-reference-v1.css?v=${VERSION}">\n</head>`);
    }
    if(!html.includes('case-entry-reference-v1.js')){
      html=html.replace('</body>',`<script src="../../assets/case-entry-reference-v1.js?v=${VERSION}"></script></body>`);
    }
    if(!html.includes('case-entry-reference-v1.css')||!html.includes('case-entry-reference-v1.js')){
      throw new Error(`Case entry reference injection failed: ${entry.name}`);
    }
    fs.writeFileSync(file,html);
    pages+=1;
  }
  return {pages,version:VERSION};
}
