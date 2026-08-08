#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {ensureDir} from './import-mobile/common.mjs';
import {loadLibrary} from './import-mobile/load-active.mjs';
import {writeCasePages} from './import-mobile/case-pages.mjs';
import {enhanceGeneratedCases} from './import-mobile/witness-postprocess.mjs';
import {writeCatalog} from './import-mobile/catalog.mjs';
import {writeSeoPages,seoSlugs} from './import-mobile/seo-pages.mjs';
import {writeCollectionPages} from './import-mobile/collection-pages.mjs';
import {postprocessSeoNativeCases} from './import-mobile/seo-native-postprocess.mjs';

const tokens=process.argv.slice(2),args={};for(let i=0;i<tokens.length;i++)if(tokens[i].startsWith('--'))args[tokens[i].slice(2)]=tokens[i+1]&&!tokens[i+1].startsWith('--')?tokens[++i]:'true';
const sourceRoot=path.resolve(args.source||'../mobile-source'),siteRoot=path.resolve(args.site||'.'),mode=args.mode||'public',sourceCommit=args.commit||'51c178f4dceba7bdb859e1e5d0c3244150438c0d',editorial=mode==='editorial';
const lib=loadLibrary(sourceRoot,sourceCommit),generated=path.join(siteRoot,'assets/generated');
ensureDir(generated);
const seoNativeCaseCount=lib.meta.filter(item=>item.seoPublished===true).length,indexableCollectionCount=lib.collections.filter(item=>item.indexable===true&&item.status==='published').length;
const index={schemaVersion:4,sourceCommit,mode,totalCases:100,freeCount:15,premiumCount:85,seoNativeCaseCount,indexableCollectionCount,cases:lib.meta,freeCases:lib.freeMeta,collections:lib.collections};
fs.writeFileSync(path.join(generated,'cases-index.json'),JSON.stringify(index,null,2));
fs.writeFileSync(path.join(generated,'cases-index.js'),`window.KtoVretCatalog=${JSON.stringify(index)};\n`);
writeCasePages(siteRoot,lib.cases,editorial);
const witnessEnhancedPages=enhanceGeneratedCases(siteRoot,lib.cases,editorial);
const seoNativePostprocessedPages=postprocessSeoNativeCases(siteRoot,lib.cases,lib.collections);
const collectionPages=writeCollectionPages(siteRoot,lib.collections,lib.cases);
writeCatalog(siteRoot,lib.cases,lib.freeMeta,editorial);
writeSeoPages(siteRoot,lib.freeMeta);

const product=path.join(siteRoot,'kto-vret/index.html');
if(fs.existsSync(product)){
  let html=fs.readFileSync(product,'utf8');
  html=html.replace(/<script src="\.\.\/assets\/(generated\/cases-index|dossier-model|dossier-progress|dossier-achievements)\.js[^>]*><\/script>/g,'');
  html=html.replace('</body>','<script src="../assets/generated/cases-index.js?v=1.1.0"></script><script src="../assets/dossier-model.js?v=1.1.0"></script><script src="../assets/dossier-progress.js?v=1.1.0"></script><script src="../assets/dossier-achievements.js?v=1.1.0"></script></body>');
  fs.writeFileSync(product,html);
}

const base='https://valera2872.github.io/ktovret-web/';
const collectionUrls=collectionPages.map(item=>`${base}${item.route}`);
const urls=[base,`${base}kto-vret/`,`${base}dela/`,...seoSlugs.map(slug=>`${base}${slug}/`),...collectionUrls,...lib.freeMeta.map(item=>`${base}${item.path}`)];
const lastmod=new Date().toISOString().slice(0,10);
fs.writeFileSync(path.join(siteRoot,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`<url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
const report={sourceCommit,mode,packages:lib.assets.length,sourceEntries:lib.sourceEntries,deprecatedIds:lib.deprecatedCount,totalCases:100,freeCases:15,premiumCases:85,seoNativeCases:seoNativeCaseCount,indexableCollections:indexableCollectionCount,collectionPages:collectionPages.length,playablePages:editorial?100:15,lockedPages:editorial?0:85,indexableUrls:urls.length,seoLandingPages:seoSlugs.length,witnessEnhancedPages,seoNativePostprocessedPages};
fs.writeFileSync(path.join(generated,'import-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
