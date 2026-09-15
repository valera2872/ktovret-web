#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const route='realnye-dela/pozharnaya-lestnica-1991/index.html';
const html=fs.readFileSync(path.join(root,route),'utf8');
const js=fs.readFileSync(path.join(root,'assets','real-case-moreno-ai-v5.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets','real-case-moreno-sandbox.css'),'utf8');
for(const x of ['real-case-moreno-ai-v5.js?v=0.5.0','real-case-moreno-sandbox.css?v=0.5.0','noindex,follow'])if(!html.includes(x))throw new Error(`route missing ${x}`);
for(const x of ["const VERSION='0.5.0'",'ai-moreno-investigator-v1','контекстное понимание','lastTarget','executeIntent'])if(!js.includes(x))throw new Error(`v5 missing ${x}`);
for(const banned of ['OPENAI_API_KEY','api.openai.com/v1/responses','real-case-moreno-sandbox-v41.js?v=0.4.1'])if(js.includes(banned)||html.includes(banned))throw new Error(`client secret/legacy leak ${banned}`);
if(!css.includes('.v4-composer'))throw new Error('sandbox styles missing');

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(fs.existsSync);if(!chrome)throw new Error('Chrome not found');
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml']]);
const witnessState={view:'desk',completed:['witnessLocated'],journal:[],hypothesis:'',suspect:'',focus:'',lastTarget:'second_floor_witness',submitted:false,sessionId:'moreno-test-session-001',aiState:'unknown'};
const peopleWitnessState={...witnessState,completed:['people','witnessLocated','canvass']};
const mockScript=`<script>
window.fetch=async function(url,opts){
 const body=JSON.parse(opts&&opts.body||'{}');
 const ok=x=>Promise.resolve({ok:true,json:async()=>x});
 if(body.action==='interpret'){
  const q=String(body.command||'').toLowerCase();
  if(q.includes('вызвать этого свидетеля'))return ok({intent:'start_interview',target:'second_floor_witness',question:null,clarification:null});
  if(q.includes('что он слышал')||q.includes('что он видел'))return ok({intent:'start_interview',target:'second_floor_witness',question:body.command,clarification:null});
  if(q.includes('назначить экспертизу'))return ok({intent:'clarify',target:null,question:null,clarification:'Что именно нужно исследовать и какой вопрос поставить эксперту?'});
  if(q.includes('сопоставить описание'))return ok({intent:'compare_description',target:null,question:null,clarification:null});
  return ok({intent:'unsupported',target:null,question:null,clarification:null});
 }
 if(body.action==='interrogate'){
  const q=String(body.question||'').toLowerCase();
  if(q.includes('как выглядел'))return ok({topic:'description',reply:'В открытом официальном материале точные признаки словесного описания мужчины не опубликованы. Игра не будет их восстанавливать или придумывать.',unlocks:[],mode:'source_limit'});
  return ok({topic:'observation',reply:'По опубликованным материалам, после громкого звука он посмотрел на пожарную лестницу: видел Patricia и мужчину над ней. Затем мужчина отступил обратно в квартиру.',unlocks:['canvass'],mode:'ai_classified'});
 }
 return ok({ai_ready:true});
};
</script>`;
function harness(state,commands=[]){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/mysterylogic.css"><link rel="stylesheet" href="/assets/real-case-moreno-sandbox.css"></head><body class="moreno-body"><main data-moreno-app></main><script>localStorage.setItem('ml-realcase-moreno-ai-v5',JSON.stringify(${JSON.stringify(state)}))</script>${mockScript}<script src="/assets/real-case-moreno-ai-v5.js"></script><script>const cmds=${JSON.stringify(commands)};let i=0;function go(){if(i>=cmds.length)return;const box=document.querySelector('[data-command]');if(!box){setTimeout(go,60);return}box.value=cmds[i++];document.querySelector('[data-command-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));setTimeout(go,600)}setTimeout(go,120)</script></body></html>`}
const server=http.createServer((req,res)=>{const u=new URL(req.url||'/','http://127.0.0.1');if(u.pathname==='/__harness'){const key=u.searchParams.get('state')||'witness';const commands=JSON.parse(u.searchParams.get('cmds')||'[]');res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(harness(key==='people'?peopleWitnessState:witnessState,commands));}const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';const fp=path.resolve(root,rel);if(!fp.startsWith(root+path.sep)||!fs.existsSync(fp)){res.writeHead(404);return res.end('missing')}res.setHeader('Content-Type',types.get(path.extname(fp))||'application/octet-stream');res.end(fs.readFileSync(fp));});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const dump=url=>new Promise((resolve,reject)=>{const c=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--virtual-time-budget=3500','--dump-dom',url]);let out='',err='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>err+=d);c.on('close',code=>code===0?resolve(out):reject(new Error(err)))});
const chk=(label,dom,must=[],mustNot=[])=>{for(const x of must)if(!dom.includes(x))throw new Error(`${label} missing ${x}`);for(const x of mustNot)if(dom.toLowerCase().includes(x.toLowerCase()))throw new Error(`${label} leaked ${x}`)};
try{
 const opening=await dump(`http://127.0.0.1:${port}/${route}`);chk('opening',opening,['ДЕВУШКА НА','Принять дело'],['схема здания','Rodney Daniels']);
 const summon=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['вызвать этого свидетеля']))}`);chk('summon pronoun',summon,['ПРОТОКОЛ ДОПРОСА','житель второго этажа','Допрос начат'],['не поняла распоряжение']);
 const direct=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['что он слышал или видел?']))}`);chk('direct contextual question',direct,['Ответ: житель второго этажа','мужчину над ней'],['не поняла распоряжение']);
 const vague=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['назначить экспертизу']))}`);chk('vague exam',vague,['Уточните распоряжение','Что именно нужно исследовать'],['.38','Баллистическое исследование']);
 const description=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['вызвать этого свидетеля','как выглядел мужчина?']))}`);chk('description boundary',description,['точные признаки словесного описания мужчины не опубликованы'],['СОПОСТАВЛЕНИЕ']);
 const compare=await dump(`http://127.0.0.1:${port}/__harness?state=people&cmds=${encodeURIComponent(JSON.stringify(['сопоставить описание свидетеля с людьми в квартире']))}`);chk('earned comparison',compare,['Сопоставление описания с установленными лицами','соответствующим внешности бойфренда']);
}finally{await new Promise(r=>server.close(r))}

const anon=(js.match(/const SUPABASE_ANON='([^']+)'/)||[])[1];
if(!anon)throw new Error('public Supabase anon key missing');
const endpoint='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v1';
async function live(body){const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','apikey':anon,'authorization':`Bearer ${anon}`,'origin':'https://rawcdn.githack.com'},body:JSON.stringify({session_id:'moreno-ci-live-001',...body})});const t=await r.text();if(!r.ok)throw new Error(`live ${r.status}: ${t.slice(0,400)}`);return JSON.parse(t)}
const status=await live({action:'status'});if(!status.ai_ready)throw new Error('Moreno AI reports not ready');
async function expectInterpret(command,predicate,label){let last;for(let i=0;i<2;i++){last=await live({action:'interpret',command,completed:['witnessLocated'],focus:'',last_target:'second_floor_witness'});if(predicate(last))return last;}throw new Error(`${label}: ${JSON.stringify(last)}`)}
const liveSummon=await expectInterpret('вызвать этого свидетеля',x=>x.intent==='start_interview'&&x.target==='second_floor_witness','live summon');
const liveQuestion=await expectInterpret('что он слышал или видел?',x=>x.intent==='start_interview'&&x.target==='second_floor_witness'&&String(x.question||'').length>3,'live contextual question');
const liveVague=await live({action:'interpret',command:'назначить экспертизу',completed:[],focus:'',last_target:''});if(liveVague.intent!=='clarify')throw new Error(`live vague exam should clarify: ${JSON.stringify(liveVague)}`);
const liveInterview=await live({action:'interrogate',target:'second_floor_witness',question:'Что вы слышали или видели после громкого звука?',completed:['witnessLocated']});if(liveInterview.topic!=='observation'||!String(liveInterview.reply||'').includes('мужчин'))throw new Error(`live witness classification failed: ${JSON.stringify(liveInterview)}`);

const report={version:'0.5.0',clientNoOpenAISecret:true,aiReady:true,pronounSummon:liveSummon.intent,contextualQuestion:liveQuestion.intent,vagueExam:liveVague.intent,witnessTopic:liveInterview.topic,deterministicBrowser:true};
fs.mkdirSync(path.join(root,'artifacts','real-case-moreno-v5'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts','real-case-moreno-v5','smoke.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));