#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(here,'..');
const route='realnye-dela/pozharnaya-lestnica-1991/index.html';
const htmlFile=path.join(root,route);
const jsFile=path.join(root,'assets','real-case-moreno-investigator.js');
const cssFile=path.join(root,'assets','real-case-moreno-investigator.css');
const outDir=path.join(root,'artifacts','real-case-moreno');
fs.mkdirSync(outDir,{recursive:true});
for(const f of [htmlFile,jsFile,cssFile]) if(!fs.existsSync(f)) throw new Error(`missing ${path.relative(root,f)}`);
const html=fs.readFileSync(htmlFile,'utf8');
const js=fs.readFileSync(jsFile,'utf8');
const css=fs.readFileSync(cssFile,'utf8');

for(const m of ['noindex,follow','real-case-moreno-investigator.css?v=0.2.0','real-case-moreno-investigator.js?v=0.2.0','data-moreno-app']) if(!html.includes(m)) throw new Error(`html missing ${m}`);
for(const m of ["const VERSION='0.2.0'",'Заказать криминалистическую реконструкцию','Искать свидетелей по дому','Проверить оружие и угрозы','Проверить алиби бойфренда','Собрать версию сейчас','НЕ ЗАКРЫТ ГЛАВНЫЙ ВОПРОС СЦЕНЫ',"if(!has('forensics'))",'window.MLMorenoInvestigator']) if(!js.includes(m)) throw new Error(`engine missing ${m}`);
for(const bad of ['Ход 1','Ход 2','Ход 3','ЗОНА A','ЗОНА B','ЗОНА C','Свидетель A','Свидетель B','2+ источника','Проверить классификацию']) if(js.includes(bad)) throw new Error(`legacy guided flow leaked: ${bad}`);
for(const m of ['.mi-order-grid','.mi-order-card','.mi-report','.mi-diagram','.mi-deadend','.mi-evidence','@media(max-width:720px)']) if(!css.includes(m)) throw new Error(`css missing ${m}`);

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(x=>fs.existsSync(x));
if(!chrome) throw new Error('Chrome/Chromium not found');
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml']]);
const server=http.createServer((req,res)=>{const u=new URL(req.url||'/','http://127.0.0.1');const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');const file=path.resolve(root,rel||'index.html');if(!file.startsWith(`${root}${path.sep}`)||!fs.existsSync(file))return res.writeHead(404).end('Not found');res.setHeader('Content-Type',types.get(path.extname(file))||'application/octet-stream');res.end(fs.readFileSync(file));});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const run=(args)=>new Promise((resolve,reject)=>{const p=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',c=>out+=c);p.stderr.on('data',c=>err+=c);p.on('error',reject);p.on('close',code=>code===0?resolve(out):reject(new Error(err.slice(-1800))));});
const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--virtual-time-budget=1800'];
const dump=async(stage='')=>run([...common,'--dump-dom',`http://127.0.0.1:${port}/${route}${stage?`?smokeStage=${stage}`:''}`]);
const check=(label,dom,marks,forbidden=[])=>{for(const m of marks)if(!dom.includes(m))throw new Error(`${label} missing ${m}`);for(const m of forbidden)if(dom.includes(m))throw new Error(`${label} leaked ${m}`);if(dom.includes('data-rc-overflow="true"'))throw new Error(`${label} overflow`)};
try{
  check('opening',await dump(),['ТРЕТИЙ ЭТАЖ','Patricia “Tricia” Moreno','Принять дело'],['RODNEY DANIELS','Rodney Daniels']);
  check('desk',await dump('desk'),['ЧТО ПРОВЕРЯТЬ ДАЛЬШЕ?','Заказать криминалистическую реконструкцию','Искать свидетелей по дому','Проверить алиби бойфренда','Попробовать закрыть дело'],['RODNEY DANIELS','ЗОНА A']);
  check('forensics',await dump('forensics'),['ЭКСПЕРТЫ ВЕРНУЛИСЬ НА АДРЕС','нисходящее направление','Теперь ваш вывод','Район дверного проёма'],['RODNEY DANIELS','ТРАЕКТОРИЯ ВЕДЁТ К ДВЕРИ']);
  check('witness',await dump('witness'),['СВИДЕТЕЛЬ ЭТАЖОМ НИЖЕ','Что это действительно доказывает?'],['Rodney Daniels']);
  check('alibi',await dump('alibi'),['Я СПАЛ В КРЕСЛЕ','ЧТО ДАЛА ВАША ПРОВЕРКА'],['Rodney Daniels']);
  check('conclusion',await dump('conclusion'),['ЗАКРЫВАЕТСЯ ЛИ ДЕЛО?','Криминалистика','Что вы делаете?'],['RODNEY DANIELS']);
  check('deadend',await dump('deadend'),['НЕ ЗАКРЫТ ГЛАВНЫЙ ВОПРОС СЦЕНЫ','Это результат ваших решений'],['RODNEY DANIELS']);
  check('reveal',await dump('reveal'),['RODNEY DANIELS','16 августа 2023','присяжные признали его виновным']);
}finally{await new Promise(r=>server.close(r));}
fs.writeFileSync(path.join(outDir,'smoke-report.json'),JSON.stringify({version:'0.2.0',mode:'investigator-orders',agency:true,forensicsOptionalButCritical:true,deadEnd:true,linearSteps:false},null,2));
console.log(JSON.stringify({version:'0.2.0',agency:true,deadEnd:true},null,2));
