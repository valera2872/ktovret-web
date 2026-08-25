#!/usr/bin/env node
const ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/coop-last-aria';
const ORIGIN='https://mysterylogic.com';
const LAST_ARIA_TOKEN='ml_gate_yS0H7EcjslB8D22wX-hy72-w4r2uQqMH9YI5MFHCDwKZEiVUUZCRByl1JwxiPRDr';
const VOLUME1_TOKEN='ml_gate_IyM9hj5PMYruToEiNVvXP-ctTNkA8RjUMt6puAnNIveUMMdMcbH6EydpM9dHM66q';
const CREATOR='4098ed6abd1f6bf93d8529db066a19da89e2960b4276384e';
const GUEST='97ea765110866762a0e8ae4c0f800eb859f188f125b23e01';
const THIRD='b'.repeat(48);
const OUTSIDER='c'.repeat(48);
const expect=(condition,message)=>{if(!condition)throw new Error(message);};
async function call(body,browserKey,{token,expected}={}){
  const headers={'content-type':'application/json','origin':ORIGIN};
  if(token)headers.authorization=`Bearer ${token}`;
  const response=await fetch(ENDPOINT,{method:'POST',headers,body:JSON.stringify({...body,browserKey})});
  let data={}; try{data=await response.json();}catch{}
  if(expected!=null)expect(response.status===expected,`${body.action}: expected HTTP ${expected}, got ${response.status} ${JSON.stringify(data)}`);
  return {status:response.status,data};
}

const noPay=await call({action:'create',playerName:'Gate No Pay'},CREATOR,{expected:402});
expect(noPay.data.error==='payment_required','no-token create did not return payment_required');

const wrongProduct=await call({action:'create',playerName:'Gate Wrong Product'},CREATOR,{token:VOLUME1_TOKEN,expected:402});
expect(wrongProduct.data.error==='payment_required','volume1 entitlement opened Last Aria');

const created=await call({action:'create',playerName:'Gate Creator'},CREATOR,{token:LAST_ARIA_TOKEN,expected:201});
const code=created.data?.room?.code;
expect(/^[A-HJ-NP-Z2-9]{8}$/.test(code||''),'created room code invalid');
expect(created.data?.me?.role==='creator','creator role missing');
expect(created.data?.opponent?.joined===false,'room unexpectedly has opponent');

const preview=await call({action:'preview',code},GUEST,{expected:200});
expect(preview.data?.room?.code===code,'guest preview failed');
expect(preview.data?.roomFull===false,'fresh room unexpectedly full');

const joined=await call({action:'join',code,playerName:'Gate Guest'},GUEST,{expected:200});
expect(joined.data?.me?.role==='guest','guest role missing');
expect(joined.data?.bothJoined===true,'bothJoined not true after join');

const roomFull=await call({action:'join',code,playerName:'Gate Third'},THIRD,{expected:409});
expect(roomFull.data.error==='room_full','third player was not rejected');

const outsider=await call({action:'status',code},OUTSIDER,{expected:403});
expect(outsider.data.error==='not_joined','outsider status was not rejected');

const startCreator=await call({action:'start',code},CREATOR,{expected:200});
expect(startCreator.data?.me?.started===true,'creator did not start');
const startGuest=await call({action:'start',code},GUEST,{expected:200});
expect(startGuest.data?.me?.started===true,'guest did not start');

const badStats=await call({action:'complete',code,elapsedSeconds:0,hintsUsed:0,attempts:1,firstAnswerCorrect:true},CREATOR,{expected:400});
expect(badStats.data.error==='invalid_stats','invalid completion stats were accepted');

const creatorDone=await call({action:'complete',code,elapsedSeconds:2700,hintsUsed:1,attempts:2,firstAnswerCorrect:false},CREATOR,{expected:200});
expect(creatorDone.data?.me?.completed===true,'creator completion missing');
expect(creatorDone.data?.bothCompleted===false,'bothCompleted too early');

const guestDone=await call({action:'complete',code,elapsedSeconds:2820,hintsUsed:0,attempts:1,firstAnswerCorrect:true},GUEST,{expected:200});
expect(guestDone.data?.bothCompleted===true,'bothCompleted missing');
expect(guestDone.data?.results?.creator?.elapsedSeconds===2700,'creator result not persisted');
expect(guestDone.data?.results?.guest?.elapsedSeconds===2820,'guest result not persisted');

const finalStatus=await call({action:'status',code},CREATOR,{expected:200});
expect(finalStatus.data?.bothCompleted===true,'completed room not stable on status refresh');
expect(finalStatus.data?.opponent?.completed===true,'opponent completion missing after refresh');

console.log(JSON.stringify({
  verdict:'LIVE_LAST_ARIA_ROOM_GATE_PASS',
  endpoint:ENDPOINT,
  roomCode:code,
  noPaymentBlocked:true,
  wrongProductBlocked:true,
  paidCreatorCreated:true,
  guestJoinedWithoutPayment:true,
  thirdPlayerBlocked:true,
  outsiderBlocked:true,
  invalidStatsBlocked:true,
  bothPlayersCompleted:true,
  refreshStable:true
},null,2));
