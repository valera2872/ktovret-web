#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const output=path.resolve(process.argv[3]||path.join(root,'artifacts','volume2-new-payloads.sql'));
const dir=path.join(root,'content','volume2-launch');
const files=fs.readdirSync(dir).filter(name=>/^case-(10[1-9]|110)\.json$/.test(name)).sort();
if(files.length!==10) throw new Error(`Expected 10 cases, got ${files.length}`);

const dollar=(tag,value)=>`$${tag}$${value}$${tag}$`;
const rows=[];
for(const name of files){
  const n=Number(name.match(/case-(\d+)\.json/)[1]);
  const source=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
  const humans=(source.characters||[]).filter(item=>!String(item.id||'').startsWith('__'));
  const exp=source.explanation||{};
  const payload={
    case:{
      id:source.id,
      facts:source.facts||[],
      intro:source.intro,
      title:source.title,
      category:source.category||'Логика',
      question:source.question,
      timeline:source.timeline||[],
      logicType:source.logicType||'Дедукция',
      caseNumber:`№ ${String(n).padStart(3,'0')}`,
      characters:humans,
      difficulty:source.difficulty||'Сложное',
      explanation:{
        fullReason:exp.fullReason||'',
        shortReason:exp.shortReason||'',
        reasoningSteps:exp.reasoningSteps||[],
        evidenceFragments:exp.evidenceFragments||[],
      },
      answerStages:source.answerStages||[],
      witnessCount:humans.length,
      materialsLabel:source.materialsLabel||'Материалы дела',
      estimatedMinutes:9,
    },
    siteName:'Mystery Logic',
    permalink:'',
    storageKey:`ktovret:web:v5:${source.id}`,
  };
  const json=JSON.stringify(payload);
  rows.push(`(${dollar('id',source.id)}, 'volume2', 'ru', 'published', ${dollar('json',json)}::jsonb, 1, now())`);
}
const sql=`BEGIN;\nINSERT INTO public.paid_case_payloads (case_id,product_id,language,status,payload,payload_version,updated_at) VALUES\n${rows.join(',\n')}\nON CONFLICT (case_id) DO UPDATE SET\n product_id=EXCLUDED.product_id, language=EXCLUDED.language, status=EXCLUDED.status,\n payload=EXCLUDED.payload, payload_version=EXCLUDED.payload_version, updated_at=now();\nCOMMIT;\n\n-- postcondition\nSELECT product_id,status,count(*) AS n FROM public.paid_case_payloads WHERE product_id='volume2' GROUP BY product_id,status;\n`;
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,sql);
console.log(JSON.stringify({output,cases:files.length,bytes:Buffer.byteLength(sql)},null,2));
