#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const liveUrl='https://mysterylogic.com/realnye-dela/pozharnaya-lestnica-1991-premium/';
const expectedLive='c726cada177fdda9d04cb75f95491a005e535cc7e63826402da5ce8c645f8c69'; // exact previously delivered Beget ZIP page
const live=await fetch(liveUrl,{headers:{'cache-control':'no-cache','user-agent':'MysteryLogic-ReleaseQA/1.0'},signal:AbortSignal.timeout(18000)});
if(!live.ok)throw Error('LIVE Beget HTML unavailable HTTP '+live.status);
const liveBytes=Buffer.from(await live.arrayBuffer()),liveHash=createHash('sha256').update(liveBytes).digest('hex');
console.log('LIVE_BEGET_SHA256',liveHash,'BYTES',liveBytes.length,'EXPECTED',expectedLive);
if(liveHash!==expectedLive)throw Error('LIVE Beget page changed after owner installed prior ZIP. Stop patch release until reconciled.');
const out='artifacts/moreno-image-qa';await fs.mkdir(out,{recursive:true});
const sources=[
 ['portrait-original','https://www.middlesexda.com/sites/g/files/vyhlif11841/f/styles/news_image/public/news/capture_3.jpg?itok=RK3zkJ6R'],
 ['portrait-oxygen','https://www.oxygen.com/sites/oxygen/files/styles/scale_862/public/2023/08/photo_of_patricia_moreno.jpg?itok=srt5cOer'],
 ['portrait-mediaite','https://am24.mediaite.com/lc/cnt/uploads/2023/08/Patricia-Moreno.jpg'],
 ['fire-original','https://images.unsplash.com/photo-1601785739334-5bc6484d346c?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=74&w=900'],
 ['door-original','https://images.unsplash.com/photo-1534237710431-e2fc698436d0?auto=format&fit=crop&q=55&w=300']
];
let success=0;
for(const [name,url] of sources){
 try{
  const res=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (MysteryLogic source-restoration QA)','accept':'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'},signal:AbortSignal.timeout(18000)});
  const contentType=res.headers.get('content-type')||'';
  const buf=Buffer.from(await res.arrayBuffer());
  const magic=buf.subarray(0,20).toString('hex');
  const ok=res.ok&&buf.length>5000&&(contentType.startsWith('image/')||magic.startsWith('ffd8ff')||magic.startsWith('89504e47')||magic.startsWith('52494646'));
  console.log(name,'HTTP',res.status,'type',contentType,'bytes',buf.length,'signature',magic.slice(0,10),'valid',ok);
  if(ok){const ext=magic.startsWith('89504e47')?'png':magic.startsWith('52494646')?'webp':'jpg';await fs.writeFile(path.join(out,name+'.'+ext),buf);success++;}
 }catch(e){console.log(name,'ERROR',String(e).slice(0,150));}
}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({successful:success,total:sources.length},null,2));
if(success===0)process.exitCode=1;
