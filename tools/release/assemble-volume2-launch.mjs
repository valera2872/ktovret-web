#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const sourceDir=path.join(root,'content','volume2-launch');
const target=path.join(root,'content','who-lied-volume-2-supplement.json');
const files=fs.readdirSync(sourceDir).filter(name=>/^case-(10[1-9]|110)\.json$/.test(name)).sort();
if(files.length!==10) throw new Error(`Expected 10 launch cases, found ${files.length}`);
const cases=files.map(name=>JSON.parse(fs.readFileSync(path.join(sourceDir,name),'utf8')));
const ids=new Set();
for(const item of cases){
  if(!item?.id||!item?.title||!item?.intro||!item?.explanation?.fullReason) throw new Error(`Incomplete launch case: ${item?.id||'unknown'}`);
  if(ids.has(item.id)) throw new Error(`Duplicate launch case id: ${item.id}`);
  ids.add(item.id);
  const stages=Array.isArray(item.answerStages)?item.answerStages:[];
  if(stages.length<2) throw new Error(`Launch case must have >=2 answer stages: ${item.id}`);
  for(const stage of stages){
    const optionIds=new Set((stage.options||[]).map(option=>option.id));
    const correct=stage.correctOptionIds||[];
    if(optionIds.size<2||!correct.length||correct.some(id=>!optionIds.has(id))) throw new Error(`Invalid answer stage ${stage.id} in ${item.id}`);
  }
}
const payload={schemaVersion:2,sets:[{id:'web_volume2_new_2026_09',title:'Новые расследования',description:'Десять новых дел на документы, маршруты, цифровые следы, несинхронные часы и скрытые источники знания.',order:990,isPremium:true,isListed:true}],cases};
fs.writeFileSync(target,JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify({target,cases:cases.length,ids:[...ids]},null,2));
