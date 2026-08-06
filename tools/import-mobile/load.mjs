import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {slugify,estimate} from './common.mjs';
const knownSlugs=new Map([
['first_r3_001_four_archive_entries','chetyre-vhoda-v-arhiv'],['first_r3_002_unsynced_logs','tri-nesinhronnyh-zhurnala'],['first_r3_003_five_folders_gap','pyat-papok-i-pustoe-mesto'],['first_r3_004_laptop_two_exits','noutbuk-u-dvuh-vyhodov'],['first_r3_005_card_phone_route','karta-telefon-i-vosem-minut'],['volume1_066','zapis-do-vskrytiya-konteynera']]);
const knownStorage=new Map([
['first_r3_001_four_archive_entries','ktovret:web:demo:v4:first_r3_001_four_archive_entries'],['first_r3_002_unsynced_logs','ktovret:web:demo:v4:first_r3_002_unsynced_logs'],['first_r3_003_five_folders_gap','ktovret:web:demo:v4:first_r3_003_five_folders_gap'],['first_r3_004_laptop_two_exits','ktovret:web:demo:v4:first_r3_004_laptop_two_exits'],['first_r3_005_card_phone_route','ktovret:web:demo:v4:first_r3_005_card_phone_route'],['volume1_066','ktovret:web:demo:v3:volume1_066']]);
export function loadLibrary(sourceRoot,sourceCommit){
 const pubspec=fs.readFileSync(path.join(sourceRoot,'pubspec.yaml'),'utf8');
 const assets=[...pubspec.matchAll(/^\s*-\s+(assets\/content\/[^\s]+)$/gm)].map(m=>m[1]);
 if(!assets.length) throw new Error('Контентные assets не найдены');
 const sets=new Map(),casesById=new Map();let sourceEntries=0;
 for(const rel of assets){const bytes=fs.readFileSync(path.join(sourceRoot,rel));const text=rel.endsWith('.gz')?zlib.gunzipSync(bytes).toString('utf8'):bytes.toString('utf8');const bundle=JSON.parse(text);for(const set of bundle.sets||[])sets.set(set.id,set);for(const item of bundle.cases||[]){sourceEntries+=1;if(!item?.id)throw new Error(`Дело без ID в ${rel}`);casesById.set(item.id,{...item,__asset:rel});}}
 const raw=[...casesById.values()];
 if(raw.length!==100)throw new Error(`После применения обновлений ожидалось 100 дел: исходных записей ${sourceEntries}, уникальных активных ${raw.length}`);
 const setFor=(item)=>sets.get(item.setId)||{id:item.setId||'other',title:'Другие расследования',description:'',order:999,isPremium:true,isListed:true};
 const free=raw.filter(x=>setFor(x).isPremium===false),premium=raw.filter(x=>setFor(x).isPremium!==false);
 if(free.length!==15||premium.length!==85)throw new Error(`Неверное разделение активных дел: ${free.length} бесплатных / ${premium.length} платных`);
 const used=new Set();
 const cases=[...free,...premium].map((item,index)=>{const number=String(index+1).padStart(3,'0');let slug=knownSlugs.get(item.id)||`${number}-${slugify(item.title)}`;if(used.has(slug))slug+=`-${number}`;used.add(slug);const set=setFor(item);const characters=(item.characters||[]).filter(x=>x?.id&&!String(x.id).startsWith('__'));const correctOptionId=item.explanation?.correctOptionId||item.answerStages?.[0]?.correctOptionIds?.[0]||'';if(!item.id||!item.title||!item.intro||!item.explanation?.fullReason)throw new Error(`Неполное дело ${item.id||item.__asset}`);if(characters.length<2||!characters.some(x=>x.id===correctOptionId))throw new Error(`Неверные варианты в ${item.id}`);return{...item,number,slug,path:`delo/${slug}/`,storageKey:knownStorage.get(item.id)||`ktovret:web:v5:${item.id}`,access:set.isPremium===false?'free':'premium',set:{id:set.id,title:set.title||'Расследования',description:set.description||'',order:Number(set.order??999),isListed:set.isListed!==false},characters,correctOptionId};});
 const meta=cases.map(x=>({id:x.id,number:x.number,title:x.title,difficulty:x.difficulty||'Среднее',category:x.category||'Логика',logicType:x.logicType||x.category||'Логическое противоречие',setId:x.set.id,setTitle:x.set.title,setOrder:x.set.order,setListed:x.set.isListed,access:x.access,path:x.path,storageKey:x.storageKey,witnessCount:x.characters.length,estimatedMinutes:estimate(x.difficulty),dailyEligible:x.dailyEligible===true}));
 return{sourceCommit,assets,sourceEntries,cases,meta,freeMeta:meta.filter(x=>x.access==='free')};
}
