#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {ensureDir} from './import-mobile/common.mjs';
import {loadLibrary} from './import-mobile/load-active.mjs';
import {writeCasePages} from './import-mobile/case-pages.mjs';
import {enhanceGeneratedCases} from './import-mobile/witness-postprocess.mjs';
import {attachPaidAccessGateway} from './import-mobile/paid-access-postprocess.mjs';
import {writeCatalog} from './import-mobile/catalog.mjs';
import {writeSeoPages,seoSlugs} from './import-mobile/seo-pages.mjs';
import {writeCollectionPages} from './import-mobile/collection-pages.mjs';
import {postprocessSeoNativeCases} from './import-mobile/seo-native-postprocess.mjs';
import {applyLegalFooter} from './import-mobile/legal-footer-postprocess.mjs';
import {applyWordstatSeoExpansion} from './import-mobile/seo-wordstat-expansion.mjs';
import {applyFinalSitePolish} from './import-mobile/final-site-polish.mjs';
import {applyFinalSeoPostprocess} from './import-mobile/final-seo-postprocess.mjs';
import {applyTwoPlayerRoom} from './import-mobile/two-player-room-postprocess.mjs';
import {applyTwoPlayer2317} from './import-mobile/two-player-2317-postprocess.mjs';
import {applyArchiveVisualSystem} from './import-mobile/archive-visual-postprocess.mjs';
import {applyStorefrontV2Contracts} from './import-mobile/storefront-v2-contract-postprocess.mjs';
import {applyStorefrontReference} from './import-mobile/storefront-reference-postprocess.mjs';
import {applyStorefrontReferenceV41} from './import-mobile/storefront-reference-v41-postprocess.mjs';
import {applyStorefrontV4Who} from './import-mobile/storefront-v4-who-postprocess.mjs';
import {registerSiteOriginFinalizer} from './import-mobile/site-origin-postprocess.mjs';

registerSiteOriginFinalizer();

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
const paidGatewayPages=attachPaidAccessGateway(siteRoot,lib.cases,editorial);
const seoNativePostprocessedPages=postprocessSeoNativeCases(siteRoot,lib.cases,lib.collections);
const collectionPages=writeCollectionPages(siteRoot,lib.collections,lib.cases);
writeCatalog(siteRoot,lib.cases,lib.freeMeta,editorial);
writeSeoPages(siteRoot,lib.freeMeta);
const seoExpansion=applyWordstatSeoExpansion(siteRoot,lib.cases);
const finalPolish=applyFinalSitePolish(siteRoot);
const finalSeo=applyFinalSeoPostprocess(siteRoot);
const twoPlayerRoom=applyTwoPlayerRoom(siteRoot,lib.cases);
const twoPlayer2317=applyTwoPlayer2317(siteRoot);
const archiveVisual=applyArchiveVisualSystem(siteRoot);
const storefrontContracts=applyStorefrontV2Contracts(siteRoot);
const storefrontReference=applyStorefrontReference(siteRoot,lib.cases);
const storefrontReferenceV41=applyStorefrontReferenceV41(siteRoot,lib.cases);
const storefrontV4Who=applyStorefrontV4Who(siteRoot,lib.cases);

const volume=path.join(siteRoot,'tom-1/index.html');
if(fs.existsSync(volume)){
  let html=fs.readFileSync(volume,'utf8');
  html=html.replace('<meta name="robots" content="noindex,follow">','');
  if(html.includes('name="robots" content="noindex')) throw new Error('tom-1 must be indexable at SEO launch');
  fs.writeFileSync(volume,html);
}

const product=path.join(siteRoot,'kto-vret/index.html');
if(fs.existsSync(product)){
  let html=fs.readFileSync(product,'utf8');
  html=html.replace(/<script src="\.\.\/assets\/(generated\/cases-index|dossier-model|dossier-progress|dossier-achievements)\.js[^>]*><\/script>/g,'');
  html=html.replace('</body>','<script src="../assets/generated/cases-index.js?v=1.1.0"></script><script src="../assets/dossier-model.js?v=1.1.0"></script><script src="../assets/dossier-progress.js?v=1.1.0"></script><script src="../assets/dossier-achievements.js?v=1.1.0"></script></body>');
  fs.writeFileSync(product,html);
}

const legalFooterPages=applyLegalFooter(siteRoot);
const base='https://valera2872.github.io/ktovret-web/';
const collectionUrls=collectionPages.map(item=>`${base}${item.route}`);
const urls=[base,`${base}kto-vret/`,`${base}dela/`,`${base}tom-1/`,...seoSlugs.map(slug=>`${base}${slug}/`),...collectionUrls,...seoExpansion.hubSlugs.map(slug=>`${base}${slug}/`),...seoExpansion.caseRoutes.map(route=>`${base}${route}`)];
const lastmod=new Date().toISOString().slice(0,10);
fs.writeFileSync(path.join(siteRoot,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`<url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
const report={sourceCommit,mode,packages:lib.assets.length,sourceEntries:lib.sourceEntries,deprecatedIds:lib.deprecatedCount,totalCases:100,freeCases:15,premiumCases:85,seoNativeCases:seoNativeCaseCount,indexableCollections:indexableCollectionCount,collectionPages:collectionPages.length,playablePages:editorial?100:15,lockedPages:editorial?0:85,paidGatewayPages,indexableUrls:urls.length,seoLandingPages:seoSlugs.length,wordstatHubPages:seoExpansion.newHubPages,seoCasePages:seoExpansion.caseRoutes.length,premiumSeoTeaserPages:seoExpansion.premiumTeaserPages,wordstatUpdatedFreeCasePages:seoExpansion.updatedFreeCasePages,wordstatUpdatedHubPages:seoExpansion.updatedHubPages,finalPolishCaseTitles:finalPolish.caseTitles,finalPolishHubTitles:finalPolish.hubTitles,finalPolishRussianPages:finalPolish.russianPages,finalPolishVolumeChallenge:finalPolish.volumeChallenge,finalSeoCasePages:finalSeo.casePages,finalSeoHubPages:finalSeo.hubPages,finalSeoMaxCaseTitle:finalSeo.maxCaseTitle,finalSeoMaxCaseDescription:finalSeo.maxCaseDescription,finalSeoMaxHubTitle:finalSeo.maxHubTitle,finalSeoMaxHubDescription:finalSeo.maxHubDescription,twoPlayerRoomPage:twoPlayerRoom.page,twoPlayerRoomFreeCases:twoPlayerRoom.freeCases,twoPlayerSpecialCase:twoPlayer2317.route,archiveVisualPages:archiveVisual.pages,archiveVisualVersion:archiveVisual.version,storefrontContractPages:storefrontContracts.pages,storefrontReferencePages:storefrontReference.pages,storefrontReferenceVersion:storefrontReference.version,storefrontReferenceV41Pages:storefrontReferenceV41.pages,storefrontReferenceV41Version:storefrontReferenceV41.version,storefrontV4WhoPages:storefrontV4Who.pages,storefrontV4WhoVersion:storefrontV4Who.version,witnessEnhancedPages,seoNativePostprocessedPages,legalFooterPages};
fs.writeFileSync(path.join(generated,'import-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
