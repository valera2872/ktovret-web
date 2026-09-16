import crypto from 'node:crypto';

const BASE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1';
const ACCESS=`${BASE}/partner-access-v1`;
const DUEL=`${BASE}/duel-room`;
const SESSION=`${BASE}/partner-session-v2`;
const AI=`${BASE}/partner-interrogate-v2`;
const CHECKOUT=`${BASE}/create-checkout-partner-v1`;
const PAYSTATUS=`${BASE}/payment-status-partner-v1`;
const CASE_ID='MLP001_NE_PUBLIKOVAT';
const CASE_TITLE='Не публиковать';
const CASE_PATH='/ru/cases/ne-publikovat/';
const seed='qa-partner-access-pr323-v1';
const accessToken=`ml_partner_${crypto.createHash('sha256').update(seed).digest('hex')}`;
const browser=()=>crypto.randomBytes(24).toString('hex');
const owner1=browser(),owner2=browser(),guest=browser(),fakeOwner=browser();

async function request(url,body,{token=null}={}){
  const headers={'content-type':'application/json','origin':'https://mysterylogic.com'};
  if(token)headers.authorization=`Bearer ${token}`;
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
  const text=await response.text();let data={};try{data=JSON.parse(text)}catch{data={raw:text}};
  return{status:response.status,data};
}
function ok(condition,label){if(!condition)throw new Error(`ASSERT:${label}`)}

let r=await request(ACCESS,{action:'STATUS'},{token:accessToken});
ok(r.status===200&&r.data.entitled===true,'entitlement status');
ok(r.data.productId==='partner_ne_publikovat'&&r.data.priceRub===599,'commercial contract');

r=await request(ACCESS,{action:'CREATE_OR_RESUME',browserKey:owner1,playerName:'QA Owner'},{token:accessToken});
ok(r.status===200&&r.data.room?.code,'paid room create');
ok(r.data.restored===false,'first create is not restore');
const paidCode=r.data.room.code;

r=await request(ACCESS,{action:'CREATE_OR_RESUME',browserKey:owner2,playerName:'QA Owner Restored'},{token:accessToken});
ok(r.status===200&&r.data.room?.code===paidCode,'restore same paid room');
ok(r.data.restored===true,'restore flag');

r=await request(DUEL,{action:'join',browserKey:guest,code:paidCode,playerName:'QA Guest'});
ok(r.status===200&&r.data.bothJoined===true,'guest joins without entitlement');

const ownerStart=await request(SESSION,{action:'START',code:paidCode,browserKey:owner2});
const guestStart=await request(SESSION,{action:'START',code:paidCode,browserKey:guest});
ok(ownerStart.status===200&&ownerStart.data.role==='archive','paid owner session');
ok(guestStart.status===200&&guestStart.data.role==='sources','paid guest session');
ok((ownerStart.data.evidence||[]).map(x=>x.id).sort().join(',')==='E01,E03,E04','owner scoped evidence');
ok((guestStart.data.evidence||[]).map(x=>x.id).sort().join(',')==='E02,E05','guest scoped evidence');

const ownerOld=await request(SESSION,{action:'SNAPSHOT',code:paidCode,browserKey:owner1});
ok(ownerOld.status===403&&ownerOld.data.error==='partner_not_joined','old owner key revoked on restore');

const statusAfter=await request(ACCESS,{action:'STATUS'},{token:accessToken});
ok(statusAfter.status===200&&statusAfter.data.room?.code===paidCode,'status returns bound room');

const fake=await request(DUEL,{action:'create',browserKey:fakeOwner,caseId:CASE_ID,caseTitle:CASE_TITLE,casePath:CASE_PATH,playerName:'QA Bypass'});
ok(fake.status===201&&fake.data.room?.code,'generic room can still be created');
const fakeCode=fake.data.room.code;
const bypassSession=await request(SESSION,{action:'SNAPSHOT',code:fakeCode,browserKey:fakeOwner});
ok(bypassSession.status===403&&bypassSession.data.error==='partner_access_required','generic room blocked by session entitlement gate');
const bypassAI=await request(AI,{code:fakeCode,browserKey:fakeOwner,character_id:'roman',question:'Что произошло?',recent_history:[]});
ok(bypassAI.status===403&&bypassAI.data.error==='partner_access_required','generic room blocked before AI model call');

const badCheckout=await request(CHECKOUT,{accessToken,requestId:crypto.randomUUID(),email:'bad-email',returnUrl:'https://mysterylogic.com/ru/cases/ne-publikovat/',offerAccepted:true,privacyAcknowledged:true},{token:null});
ok(badCheckout.status===400&&badCheckout.data.error==='invalid_email','checkout input gate live without bank call');
const absentOrder=await request(PAYSTATUS,{orderId:crypto.randomUUID()},{token:accessToken});
ok(absentOrder.status===404&&absentOrder.data.error==='order_not_found','payment status token ownership path live');

console.log('PREMIUM PARTNER PAID ACCESS LIVE SMOKE OK');
console.log(JSON.stringify({paidCode,fakeCode,ownerRole:ownerStart.data.role,guestRole:guestStart.data.role,priceRub:statusAfter.data.priceRub,bypassSession:bypassSession.data.error,bypassAI:bypassAI.data.error},null,2));
