import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {slugify,estimate} from './common.mjs';
import {SEO_POLICY,buildEditorialCollections,isSeoPublishedCase} from './seo-policy.mjs';

const FREE_CASE_COUNT=10;
const VOLUME_SIZE=50;
const EXPECTED_SOURCE_CASES=100;
const SUPPLEMENT_PATH=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../content/who-lied-volume-2-supplement.json');

const known=new Map([
  ['first_r3_001_four_archive_entries',['chetyre-vhoda-v-arhiv','ktovret:web:demo:v4:first_r3_001_four_archive_entries']],
  ['first_r3_002_unsynced_logs',['tri-nesinhronnyh-zhurnala','ktovret:web:demo:v4:first_r3_002_unsynced_logs']],
  ['first_r3_003_five_folders_gap',['pyat-papok-i-pustoe-mesto','ktovret:web:demo:v4:first_r3_003_five_folders_gap']],
  ['first_r3_004_laptop_two_exits',['noutbuk-u-dvuh-vyhodov','ktovret:web:demo:v4:first_r3_004_laptop_two_exits']],
  ['first_r3_005_card_phone_route',['karta-telefon-i-vosem-minut','ktovret:web:demo:v4:first_r3_005_card_phone_route']],
  ['volume1_066',['zapis-do-vskrytiya-konteynera','ktovret:web:demo:v3:volume1_066']]
]);

const shortText=(value,max=165)=>{
  const compact=String(value||'').replace(/\s+/g,' ').trim();
  if(compact.length<=max)return compact;
  const cut=compact.slice(0,max-1).replace(/\s+\S*$/u,'').trim();
  return `${cut||compact.slice(0,max-1)}…`;
};

function deprecatedIds(root){
  const source=fs.readFileSync(path.join(root,'lib/data/case_repository.dart'),'utf8');
  const start=source.indexOf('_deprecatedCaseIds'),open=source.indexOf('{',start),close=source.indexOf('};',open);
  if(start<0||open<0||close<0)throw new Error('Не найден список устаревших дел');
  return new Set([...source.slice(open+1,close).matchAll(/'([^']+)'/g)].map(item=>item[1]));
}

function loadCopyOverrides(sourceRoot){
  const overridePath=path.join(sourceRoot,'assets/editorial/russian_copy_overrides.json');
  if(!fs.existsSync(overridePath))return new Map();
  const root=JSON.parse(fs.readFileSync(overridePath,'utf8'));
  const raw=root?.cases&&typeof root.cases==='object'?root.cases:{};
  return new Map(Object.entries(raw));
}

function loadSupplement(){
  if(!fs.existsSync(SUPPLEMENT_PATH))return {sets:[],cases:[]};
  const root=JSON.parse(fs.readFileSync(SUPPLEMENT_PATH,'utf8'));
  const sets=Array.isArray(root?.sets)?root.sets:[];
  const cases=Array.isArray(root?.cases)?root.cases:[];
  return {sets,cases};
}

function mergeObject(target,patch){
  for(const [key,value] of Object.entries(patch||{})){
    if(key==='answerStages')continue;
    const current=target[key];
    if(value&&typeof value==='object'&&!Array.isArray(value)&&current&&typeof current==='object'&&!Array.isArray(current)){
      target[key]=mergeObject({...current},value);
    }else{
      target[key]=value;
    }
  }
  return target;
}

function applyCaseOverride(item,patch){
  if(!patch||typeof patch!=='object')return item;
  const result=mergeObject(structuredClone(item),patch);
  if(!patch.answerStages||!Array.isArray(result.answerStages))return result;
  for(const [stageId,rawStagePatch] of Object.entries(patch.answerStages)){
    const stage=result.answerStages.find(value=>value?.id===stageId);
    if(!stage||!rawStagePatch||typeof rawStagePatch!=='object')continue;
    const stagePatch={...rawStagePatch};
    const labels=stagePatch.optionLabels;
    delete stagePatch.optionLabels;
    mergeObject(stage,stagePatch);
    if(labels&&typeof labels==='object'&&Array.isArray(stage.options)){
      for(const option of stage.options){
        if(Object.prototype.hasOwnProperty.call(labels,option.id))option.label=labels[option.id];
      }
    }
  }
  return result;
}

export function loadLibrary(sourceRoot,sourceCommit){
  const pubspec=fs.readFileSync(path.join(sourceRoot,'pubspec.yaml'),'utf8');
  const assets=[...pubspec.matchAll(/^\s*-\s+(assets\/content\/[^\s]+)$/gm)].map(item=>item[1]);
  const copyOverrides=loadCopyOverrides(sourceRoot);
  const deprecated=deprecatedIds(sourceRoot),sets=new Map(),active=[],ids=new Set();
  let sourceEntries=0,copyOverrideCount=0;

  for(const rel of assets){
    const bytes=fs.readFileSync(path.join(sourceRoot,rel));
    const text=rel.endsWith('.gz')?zlib.gunzipSync(bytes).toString('utf8'):bytes.toString('utf8');
    const bundle=JSON.parse(text);
    for(const set of bundle.sets||[])if(!sets.has(set.id))sets.set(set.id,set);
    for(const rawItem of bundle.cases||[]){
      sourceEntries+=1;
      if(deprecated.has(rawItem.id))continue;
      if(ids.has(rawItem.id))throw new Error(`Повтор активного ID: ${rawItem.id}`);
      ids.add(rawItem.id);
      const patch=copyOverrides.get(rawItem.id);
      if(patch)copyOverrideCount+=1;
      active.push({...applyCaseOverride(rawItem,patch),__asset:rel});
    }
  }

  if(active.length!==EXPECTED_SOURCE_CASES)throw new Error(`Исходных записей ${sourceEntries}, устаревших ID ${deprecated.size}, активных дел ${active.length}; ожидалось ${EXPECTED_SOURCE_CASES}`);
  for(const overrideId of copyOverrides.keys())if(!ids.has(overrideId))throw new Error(`Редакторская правка ссылается на неактивное дело: ${overrideId}`);

  const supplement=loadSupplement();
  for(const set of supplement.sets){
    if(!set?.id)throw new Error('Дополнительный набор без id');
    if(sets.has(set.id))throw new Error(`Повтор ID дополнительного набора: ${set.id}`);
    sets.set(set.id,set);
  }
  for(const rawItem of supplement.cases){
    if(!rawItem?.id)throw new Error('Дополнительное дело без id');
    if(ids.has(rawItem.id))throw new Error(`Повтор активного ID: ${rawItem.id}`);
    ids.add(rawItem.id);
    active.push({...rawItem,__asset:'content/who-lied-volume-2-supplement.json'});
  }

  const setFor=item=>sets.get(item.setId)||{id:item.setId||'other',title:'Другие расследования',description:'',order:999,isPremium:true,isListed:true};
  const sourceFree=active.filter(item=>setFor(item).isPremium===false);
  const sourcePremium=active.filter(item=>setFor(item).isPremium!==false);
  if(sourceFree.length!==15||sourcePremium.length!==(EXPECTED_SOURCE_CASES-15+supplement.cases.length)){
    throw new Error(`Нарушена исходная редакционная группировка: ${sourceFree.length} free-source / ${sourcePremium.length} premium-source`);
  }

  // Commercial packaging is deliberately independent of the legacy mobile sets.
  // Cases 1–10 are the permanent free sampler. Cases 11–60 form Volume I,
  // and 61–110 form Volume II. This keeps the original first 100 case order stable.
  const ordered=[...sourceFree,...sourcePremium];
  const expectedTotal=FREE_CASE_COUNT+(VOLUME_SIZE*2);
  if(ordered.length!==expectedTotal)throw new Error(`Для модели 10 + 50 + 50 нужно ${expectedTotal} дел, найдено ${ordered.length}`);

  const used=new Set();let structuredCount=0,multiStageCount=0,multipleSelectionCount=0;
  const freeCollectionId=SEO_POLICY.collections.find(item=>item.source==='free')?.id||'free-detective-cases';
  const cases=ordered.map((item,index)=>{
    const number=String(index+1).padStart(3,'0'),saved=known.get(item.id);
    let slug=saved?.[0]||`${number}-${slugify(item.title)}`;
    if(used.has(slug))slug+=`-${number}`;
    used.add(slug);
    const set=setFor(item),characters=(item.characters||[]).filter(value=>value?.id&&!String(value.id).startsWith('__'));
    const stages=Array.isArray(item.answerStages)?item.answerStages:[];
    if(stages.length)structuredCount+=1;
    if(stages.length>1)multiStageCount+=1;
    if(stages.some(stage=>(stage.maxSelections||1)>1||(stage.selectionMode||'single')==='multiple'))multipleSelectionCount+=1;
    const checkedStages=stages.length?stages:[{options:characters,correctOptionIds:[item.explanation?.correctOptionId].filter(Boolean)}];
    for(const stage of checkedStages){
      const options=stage.options||[],correct=stage.correctOptionIds||[];
      if(options.length<2||!correct.length||!correct.every(id=>options.some(option=>option.id===id)))throw new Error(`Неверный ответ в ${item.id}`);
    }
    if(!item.id||!item.title||!item.intro||!item.explanation?.fullReason)throw new Error(`Неполное дело ${item.id||item.__asset}`);

    const access=index<FREE_CASE_COUNT?'free':'premium';
    const productId=access==='free'?null:(index<FREE_CASE_COUNT+VOLUME_SIZE?'volume1':'volume2');
    const volumeNumber=productId==='volume1'?1:productId==='volume2'?2:null;
    const status='published',legacyPath=`delo/${slug}/`,language=SEO_POLICY.defaultLanguage||'ru',seoPath=`${language}/cases/${slug}/`;
    const seoPublished=isSeoPublishedCase({access,status}),canonicalPath=seoPublished?seoPath:legacyPath,collectionIds=access==='free'?[set.id,freeCollectionId]:[set.id];
    return{
      ...item,number,slug,path:canonicalPath,seoPath,legacyPath,seoNative:seoPublished,seoPublished,
      shortDescription:shortText(item.shortDescription||item.intro),story:item.intro,language,status,ageGroup:item.ageGroup||'12+',image:item.image||item.cover||'',
      statements:characters.map(character=>({characterId:character.id,characterName:character.name,text:character.statement||''})),
      storageKey:saved?.[1]||`ktovret:web:v5:${item.id}`,access,isFree:access==='free',productId,volumeNumber,
      set:{id:set.id,title:set.title||'Расследования',description:set.description||'',order:Number(set.order??999),isListed:set.isListed!==false},
      collectionIds,characters,correctOptionId:checkedStages[0].correctOptionIds[0],relatedCases:[]
    };
  });

  for(const item of cases){
    const preferred=cases.filter(value=>value.id!==item.id&&value.access==='free'&&value.category===item.category);
    const fallback=cases.filter(value=>value.id!==item.id&&value.access==='free');
    const unique=[];
    for(const value of [...preferred,...fallback])if(!unique.some(existing=>existing.id===value.id))unique.push(value);
    item.relatedCases=unique.slice(0,4).map(value=>value.id);
  }

  const sourceCollections=[...new Map(cases.map(item=>[item.set.id,item.set])).values()].map(set=>({
    id:set.id,title:set.title,description:set.description||'',language:'ru',status:set.isListed?'published':'draft',indexable:false,
    caseIds:cases.filter(item=>item.set.id===set.id).map(item=>item.id),kind:'source'
  }));
  const collections=buildEditorialCollections(cases,sourceCollections);
  const meta=cases.map(item=>({
    id:item.id,number:item.number,title:item.title,slug:item.slug,shortDescription:item.shortDescription,difficulty:item.difficulty||'Среднее',
    category:item.category||'Логика',logicType:item.logicType||item.category||'Логическое противоречие',ageGroup:item.ageGroup,language:item.language,status:item.status,
    setId:item.set.id,setTitle:item.set.title,setOrder:item.set.order,setListed:item.set.isListed,collectionIds:item.collectionIds,access:item.access,isFree:item.isFree,
    productId:item.productId,volumeNumber:item.volumeNumber,
    image:item.image||'',path:item.path,seoPath:item.seoPath,legacyPath:item.legacyPath,seoNative:item.seoNative,seoPublished:item.seoPublished,
    relatedCaseIds:item.relatedCases,storageKey:item.storageKey,witnessCount:item.characters.length,estimatedMinutes:estimate(item.difficulty),dailyEligible:item.dailyEligible===true,
    structuredAnswer:(item.answerStages||[]).length>0
  }));

  const volume1Count=meta.filter(item=>item.productId==='volume1').length;
  const volume2Count=meta.filter(item=>item.productId==='volume2').length;
  if(meta.filter(item=>item.access==='free').length!==FREE_CASE_COUNT||volume1Count!==VOLUME_SIZE||volume2Count!==VOLUME_SIZE){
    throw new Error(`Неверная коммерческая упаковка: free=${meta.filter(item=>item.access==='free').length}, volume1=${volume1Count}, volume2=${volume2Count}`);
  }

  return{
    sourceCommit,assets,sourceEntries,deprecatedCount:deprecated.size,copyOverrideCount,structuredCount,multiStageCount,multipleSelectionCount,
    supplementalCount:supplement.cases.length,totalCases:meta.length,freeCount:FREE_CASE_COUNT,premiumCount:VOLUME_SIZE*2,volume1Count,volume2Count,
    cases,collections,meta,freeMeta:meta.filter(item=>item.access==='free')
  };
}
