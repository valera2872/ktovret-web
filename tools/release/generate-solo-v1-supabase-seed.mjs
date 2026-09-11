#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const output=path.resolve(process.argv[3]||path.join(root,'artifacts','solo-investigations-v1-payloads.sql'));
const dir=path.join(root,'content','solo-investigations','volume-1');
const files=fs.readdirSync(dir).filter(name=>/^case-\d+\.json$/.test(name)).sort();
if(files.length!==10)throw new Error(`Expected 10 Solo cases, got ${files.length}`);
const dollar=(tag,value)=>`$${tag}$${value}$${tag}$`;
const rows=[];
for(const name of files){
  const source=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
  if(!source.id||!source.title||!Array.isArray(source.answerStages))throw new Error(`Invalid Solo source ${name}`);
  const payload={...source,characters:(source.characters||[]).filter(item=>!String(item.id||'').startsWith('__'))};
  rows.push(`(${dollar('id',source.id)}, 'solo_investigations_v1', 'ru', 'published', ${dollar('json',JSON.stringify(payload))}::jsonb, 1, now())`);
}
const sql=`BEGIN;\nINSERT INTO public.paid_case_payloads (case_id,product_id,language,status,payload,payload_version,updated_at) VALUES\n${rows.join(',\n')}\nON CONFLICT (case_id) DO UPDATE SET\n product_id=EXCLUDED.product_id, language=EXCLUDED.language, status=EXCLUDED.status,\n payload=EXCLUDED.payload, payload_version=EXCLUDED.payload_version, updated_at=now();\nCOMMIT;\n\nSELECT product_id,status,count(*) AS n FROM public.paid_case_payloads WHERE product_id='solo_investigations_v1' GROUP BY product_id,status;\n`;
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,sql);
console.log(JSON.stringify({output,productId:'solo_investigations_v1',cases:files.length,bytes:Buffer.byteLength(sql)},null,2));
