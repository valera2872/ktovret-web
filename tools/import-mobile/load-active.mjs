import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {slugify,estimate} from './common.mjs';
const known=new Map([
['first_r3_001_four_archive_entries',['chetyre-vhoda-v-arhiv','ktovret:web:demo:v4:first_r3_001_four_archive_entries']],
['first_r3_002_unsynced_logs',['tri-nesinhronnyh-zhurnala','ktovret:web:demo:v4:first_r3_002_unsynced_logs']],
['first_r3_003_five_folders_gap',['pyat-papok-i-pustoe-mesto','ktovret:web:demo:v4:first_r3_003_five_folders_gap']],
['first_r3_004_laptop_two_exits',['noutbuk-u-dvuh-vyhodov','ktovret:web:demo:v4:first_r3_004_laptop_two_exits']],
['first_r3_005_card_phone_route',['karta-telefon-i-vosem-minut','ktovret:web:demo:v4:first_r3_005_card_phone_route']],
['volume1_066',['zapis-do-vskrytiya-konteynera','ktovret:web:demo:v3:volume1_066']]
]);
function deprecatedIds(root){const source=fs.readFileSync(path.join(root,'lib/data/case_repository.dart'),'utf8');const start=source.indexOf('_deprecatedCaseIds'),open=source.indexOf('{',start),close=source.indexOf('};',open);if(start<0||open<0||close<0)throw new Error('Не найден список устаревших дел');return new Set([...source.slice(open+1,close).matchAll(/'([^']+)'/g)].map(item=>item[1]));}
export function loadLibrary(sourceRoot,sourceCommit){
 const pubspec=fs.readFileSync(path.join(sourceRoot,'pubspec.yaml'),'utf8');const assets=[...pubspec.matchAll(/^\s*-\s+(assets\/content\/[^\s]+)$/gm)].map(item=>item[1]);
 const deprecated=deprecatedIds(sourceRoot),sets=new Map(),active=[],ids=new Set();let sourceEntries=0;
 for(const rel of assets){const bytes=fs.readFileSync(path.join(sourceRoot,rel));const text=rel.endsWith('.gz')?zlib.gunzipSync(bytes).toString('utf8'):bytes.toString('utf8');const bundle=JSON.parse(text);for(const set of bundle.sets||[])if(!sets.has(set.id))sets.set(set.id,set);for(const item of bundle.cases||[]){sourceEntries+=1;if(deprecated.has(item.id))continue;if(ids.has(item.id))throw new Error(`Повтор активного ID: ${item.id}`);ids.add(item.id);active.push({...item,__asset:rel});}}
 if(active.length!==100)throw new Error(`Исходных записей ${sourceEntries}, устаревших ID ${deprecated.size}, активных дел ${active.length}`);
 const setFor=item=>sets.get(item.setId)||{id:item.setId||'other',title:'Другие расследования',description:'',order:999,isPremium:true,isListed:true};const free=active.filter(item=>setFor(item).isPremium===false),premium=active.filter(item=>setFor(item).isPremium!==false);if(free.length!==15||premium.length!==85)throw new Error(`Активные дела: ${free.length} бесплатных / ${premium.length} платных`);
 const used=new Set();let structuredCount=0;
 const cases=[...free,...premium].map((item,index)=>{const number=String(index+1).padStart(3,'0'),saved=known.get(item.id);let slug=saved?.[0]||`${number}-${slugify(item.title)}`;if(used.has(slug))slug+=`-${number}`;used.add(slug);const set=setFor(item),characters=(item.characters||[]).filter(value=>value?.id&&!String(value.id).startsWith('__'));const stages=Array.isArray(item.answerStages)?item.answerStages:[];if(stages.length)structuredCount+=1;if(stages.length>1||stages.some(stage=>(stage.maxSelections||1)>1||(stage.selectionMode||'single')==='multiple'))throw new Error(`Нужен многоэтапный веб-ответ: ${item.id}`);const answerOptions=stages[0]?.options||characters;const correctIds=stages[0]?.correctOptionIds||[item.explanation?.correctOptionId].filter(Boolean);if(!item.id||!item.title||!item.intro||!item.explanation?.fullReason)throw new Error(`Неполное дело ${item.id||item.__asset}`);if(answerOptions.length<2||!correctIds.length||!correctIds.every(id=>answerOptions.some(option=>option.id===id)))throw new Error(`Неверный ответ в ${item.id}`);return{...item,number,slug,path:`delo/${slug}/`,storageKey:saved?.[1]||`ktovret:web:v5:${item.id}`,access:set.isPremium===false?'free':'premium',set:{id:set.id,title:set.title||'Расследования',description:set.description||'',order:Number(set.order??999),isListed:set.isListed!==false},characters,correctOptionId:correctIds[0]};});
 const meta=cases.map(item=>({id:item.id,number:item.number,title:item.title,difficulty:item.difficulty||'Среднее',category:item.category||'Логика',logicType:item.logicType||item.category||'Логическое противоречие',setId:item.set.id,setTitle:item.set.title,setOrder:item.set.order,setListed:item.set.isListed,access:item.access,path:item.path,storageKey:item.storageKey,witnessCount:item.characters.length,estimatedMinutes:estimate(item.difficulty),dailyEligible:item.dailyEligible===true,structuredAnswer:(item.answerStages||[]).length>0}));
 return{sourceCommit,assets,sourceEntries,deprecatedCount:deprecated.size,structuredCount,cases,meta,freeMeta:meta.filter(item=>item.access==='free')};
}
