(function initMysteryLogicDossier(globalScope, factory) {
  'use strict';
  const api = factory(globalScope);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (globalScope) globalScope.MysteryLogicDossier = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, (globalScope) => {
  'use strict';
  const fallbackCases = [
    {id:'first_r3_001_four_archive_entries',number:'001',title:'Четыре входа в архив',storageKey:'ktovret:web:demo:v4:first_r3_001_four_archive_entries',path:'delo/chetyre-vhoda-v-arhiv/'},
    {id:'first_r3_002_unsynced_logs',number:'002',title:'Три несинхронных журнала',storageKey:'ktovret:web:demo:v4:first_r3_002_unsynced_logs',path:'delo/tri-nesinhronnyh-zhurnala/'},
    {id:'first_r3_003_five_folders_gap',number:'003',title:'Пять папок и пустое место',storageKey:'ktovret:web:demo:v4:first_r3_003_five_folders_gap',path:'delo/pyat-papok-i-pustoe-mesto/'},
    {id:'first_r3_004_laptop_two_exits',number:'004',title:'Ноутбук у двух выходов',storageKey:'ktovret:web:demo:v4:first_r3_004_laptop_two_exits',path:'delo/noutbuk-u-dvuh-vyhodov/'},
    {id:'first_r3_005_card_phone_route',number:'005',title:'Карта, телефон и восемь минут',storageKey:'ktovret:web:demo:v4:first_r3_005_card_phone_route',path:'delo/karta-telefon-i-vosem-minut/'},
  ];
  const catalogCases=Array.isArray(globalScope?.KtoVretCatalog?.freeCases)?globalScope.KtoVretCatalog.freeCases:fallbackCases;
  const cases=Object.freeze(catalogCases.map(item=>Object.freeze({id:item.id,number:String(item.number||'').padStart(3,'0'),title:item.title,storageKey:item.storageKey||`ktovret:web:v5:${item.id}`,path:item.path,achievementKey:`ktovret:achievement:v1:${item.id}`})));
  const emptyStorage=Object.freeze({getItem:()=>null,removeItem:()=>undefined});
  const parseState=(raw)=>{if(!raw)return{};try{const value=typeof raw==='string'?JSON.parse(raw):raw;return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return{}}};
  const getStorage=(storage)=>storage||(typeof localStorage!=='undefined'?localStorage:emptyStorage);
  const safeGet=(source,key)=>{try{return source.getItem(key)}catch{return null}};
  const readRecords=(storage)=>{const source=getStorage(storage);return cases.map(item=>({...item,state:parseState(safeGet(source,item.storageKey)),achievement:parseState(safeGet(source,item.achievementKey))}))};
  const elapsedMinutes=(state)=>{const started=Number(state?.startedAt||0),solved=Number(state?.solvedAt||0);if(!started||!solved||solved<started)return 0;return Math.max(1,Math.round((solved-started)/60000))};
  const rankForSolved=(count)=>{const total=Math.max(1,cases.length);if(count>=total)return'Эксперт Mystery Logic';if(count>=Math.ceil(total*.75))return'Старший следователь';if(count>=Math.ceil(total*.4))return'Следователь';if(count>=1)return'Младший аналитик';return'Стажёр бюро'};
  const isFirstCompletionClean=(record)=>{const achievement=record?.achievement||{};if(Object.prototype.hasOwnProperty.call(achievement,'firstCompletionClean'))return achievement.firstCompletionClean===true;const state=record?.state||{};return state.solved===true&&state.firstAnswerCorrect===true&&Number(state.attempts||0)===1&&Number(state.hintsUsed||0)===0};
  const summarize=(records=readRecords())=>{const solved=records.filter(item=>item.state.solved===true),active=records.find(item=>item.state.accepted===true&&item.state.solved!==true)||null,first=records.find(item=>item.state.solved!==true)||null,count=solved.length,clean=solved.filter(isFirstCompletionClean).length;return{solvedCount:count,cleanCount:clean,totalAttempts:solved.reduce((s,x)=>s+Number(x.state.attempts||0),0),totalHints:solved.reduce((s,x)=>s+Number(x.state.hintsUsed||0),0),totalMinutes:solved.reduce((s,x)=>s+elapsedMinutes(x.state),0),activeCase:active,nextCase:active||first||records[0]||null,allSolved:records.length>0&&count===records.length,rank:rankForSolved(count),totalCases:records.length}};
  const nextUnsolvedAfter=(records,currentId)=>{if(!Array.isArray(records)||!records.length)return null;const index=records.findIndex(item=>item.id===currentId);if(index<0)return records.find(item=>item.state.solved!==true)||null;return[...records.slice(index+1),...records.slice(0,index)].find(item=>item.state.solved!==true)||null};
  const pickRandomCase=(records,randomValue=Math.random())=>{if(!Array.isArray(records)||!records.length)return null;const unsolved=records.filter(item=>item.state.solved!==true),pool=unsolved.length?unsolved:records,value=Number.isFinite(Number(randomValue))?Math.min(.999999999,Math.max(0,Number(randomValue))):0;return pool[Math.floor(value*pool.length)]||pool[0]||null};
  const clearProgress=(storage)=>{const target=getStorage(storage);cases.forEach(item=>{try{target.removeItem(item.storageKey);target.removeItem(item.achievementKey)}catch{}})};
  const buildShareText=(summary)=>{const result=summary||summarize();return result.allSolved?`Я завершил бесплатное досье Mystery Logic: ${result.solvedCount} дел, ${result.cleanCount} чистых раскрытий. Сможете повторить?`:`Мой прогресс в «Кто врёт?» Mystery Logic: ${result.solvedCount} из ${result.totalCases} бесплатных дел. Текущий ранг — ${result.rank}.`};
  return Object.freeze({cases,parseState,readRecords,elapsedMinutes,rankForSolved,isFirstCompletionClean,summarize,nextUnsolvedAfter,pickRandomCase,clearProgress,buildShareText});
});
