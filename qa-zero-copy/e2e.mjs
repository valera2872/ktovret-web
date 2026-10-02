import { chromium } from 'playwright';
import crypto from 'node:crypto';
const BASE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/';
const endpoints={room:BASE+'zero-copy-room-v1',session:BASE+'zero-copy-session-v1',ai:BASE+'zero-copy-interrogate-v1',final:BASE+'zero-copy-final-v1'};
const hex=()=>crypto.randomBytes(24).toString('hex');
const expect=(v,m)=>{if(!v)throw new Error(m)};
const browser=await chromium.launch({headless:true});
const c1=await browser.newContext(), c2=await browser.newContext();
const p1=await c1.newPage(), p2=await c2.newPage();
await Promise.all([p1.goto('http://127.0.0.1:4173/qa.html'),p2.goto('http://127.0.0.1:4173/qa.html')]);
async function call(page,url,body){
  return await page.evaluate(async ({url,body})=>{
    const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    let j={}; try{j=await r.json()}catch{}
    return {status:r.status,body:j};
  },{url,body});
}
const k1=hex(),k2=hex();
let r=await call(p1,endpoints.room,{action:'create',browserKey:k1,playerName:'QA Следователь'});
expect(r.status===201&&r.body.ok,'create failed '+JSON.stringify(r)); const code=r.body.room.code;
r=await call(p2,endpoints.room,{action:'join',browserKey:k2,code,playerName:'QA Эксперт'});
expect(r.status===200&&r.body.bothJoined,'join failed '+JSON.stringify(r));
r=await call(p1,endpoints.room,{action:'status',browserKey:k1,code}); expect(r.body.bothJoined,'creator does not see guest');
await call(p1,endpoints.room,{action:'start',browserKey:k1,code}); await call(p2,endpoints.room,{action:'start',browserKey:k2,code});
r=await call(p1,endpoints.room,{action:'search',browserKey:k1,code,query:'доступ Ратникова'});
expect(r.status===200&&r.body.results.some(x=>x.id==='access_hist'),'investigator search failed '+JSON.stringify(r));
r=await call(p2,endpoints.room,{action:'search',browserKey:k2,code,query:'что нашли в коробке'});
expect(r.status===200&&r.body.results.some(x=>x.id==='box_exam'),'archivist search failed '+JSON.stringify(r));
r=await call(p1,endpoints.room,{action:'open',browserKey:k1,code,id:'box_exam'});
expect(r.status===404&&r.body.error==='material_not_available','role isolation failed '+JSON.stringify(r));
r=await call(p1,endpoints.room,{action:'open',browserKey:k1,code,id:'access_hist'}); expect(r.status===200,'open access_hist failed');
r=await call(p2,endpoints.room,{action:'open',browserKey:k2,code,id:'box_exam'}); expect(r.status===200,'open box_exam failed');
r=await call(p1,endpoints.session,{action:'patch',browserKey:k1,code,patch:{add_private_evidence:['box_exam','Z18'],board_note:'QA: проверяем общую доску'}});
expect(r.status===200,'session patch failed '+JSON.stringify(r));
r=await call(p1,endpoints.session,{action:'status',browserKey:k1,code});
expect(r.body.state.mine.evidence.includes('access_hist')&&r.body.state.mine.evidence.includes('Z04'),'server evidence alias missing');
expect(!r.body.state.mine.evidence.includes('box_exam')&&!r.body.state.mine.evidence.includes('Z18'),'client forged evidence accepted');
r=await call(p2,endpoints.session,{action:'status',browserKey:k2,code});
expect(r.body.state.mine.evidence.includes('box_exam')&&r.body.state.mine.evidence.includes('Z18'),'archivist evidence missing');
expect((r.body.state.shared.board||[]).some(x=>x.text.includes('общую доску')),'shared board not synced');
r=await call(p1,endpoints.ai,{browserKey:k1,code,suspect_id:'ratnikov',question:'Когда вы в последний раз видели Анну?',evidence_id:''});
expect(r.status===200&&typeof r.body.reply==='string'&&r.body.reply.length>5,'interrogation failed '+JSON.stringify(r));
r=await call(p1,endpoints.final,{browserKey:k1,code,answers:{who:'Денис Орлов',why:'Он хотел скрыть продажи снимков',how:'Он пришёл и забрал тетрадь',where:'В реставрационной мастерской',when:'Около 22 часов',evidence:'Опираемся на переписку и движение по архиву',lies:'Денис скрывал частные заказы и деньги'}});
expect(r.status===200&&r.body.passed===false&&!r.body.reveal,'wrong/under-evidenced final was accepted '+JSON.stringify(r));
const p1b=await c1.newPage(); await p1b.goto('http://127.0.0.1:4173/qa.html');
r=await call(p1b,endpoints.room,{action:'status',browserKey:k1,code}); expect(r.status===200&&r.body.bothJoined,'re-entry failed');
console.log(JSON.stringify({ok:true,code,checks:['create','join','bothJoined','start','role-search','role-isolation','evidence-state','anti-forgery','board-sync','interrogation','wrong-final-rejected','re-entry']}));
await browser.close();