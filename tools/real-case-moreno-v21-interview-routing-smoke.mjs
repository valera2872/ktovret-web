const URL='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v7';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4';
async function post(body){
  const r=await fetch(URL,{method:'POST',headers:{'content-type':'application/json',apikey:ANON,authorization:`Bearer ${ANON}`,origin:'https://rawcdn.githack.com'},body:JSON.stringify(body)});
  let data={};try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(`HTTP ${r.status}: ${JSON.stringify(data)}`);
  return data;
}
function assertPlan(data,target,prep){
  if(data.mode!=='deterministic_interview_routing')throw new Error(`not deterministic interview routing: ${JSON.stringify(data)}`);
  const ops=data.operations||[];
  if(prep&&!ops.some(o=>o.op===prep))throw new Error(`missing ${prep}: ${JSON.stringify(data)}`);
  if(!ops.some(o=>o.op==='start_interview'&&o.target===target))throw new Error(`missing start_interview ${target}: ${JSON.stringify(data)}`);
  if(ops.some(o=>o.op==='clarify'))throw new Error(`unexpected clarify: ${JSON.stringify(data)}`);
}
const status=await post({action:'status'});
if(status.version!==7||status.upstream!=='ai-moreno-investigator-v6')throw new Error(`bad v7 status ${JSON.stringify(status)}`);

const cases=[
  ['вызываю бойфренда','boyfriend','identify_people'],
  ['вызвать на допрос приёмную мать','mother','identify_people'],
  ['опросить старшую дочь','older_daughter','identify_people'],
  ['хочу поговорить с младшей дочерью','younger_daughter','identify_people'],
  ['вызвать бывшего жильца второго этажа','second_floor_witness','locate_witnesses']
];
for(const [command,target,prep] of cases){
  const data=await post({action:'plan',command,completed:[],focus:'',last_target:'',memory:{entries:[]}});
  assertPlan(data,target,prep);
}

const known=await post({action:'plan',command:'я вызываю на допрос бойфренда дочери',completed:['people'],focus:'older_daughter',last_target:'older_daughter',memory:{entries:[]}});
assertPlan(known,'boyfriend',null);
if((known.operations||[]).some(o=>o.op==='identify_people'))throw new Error(`known people should not be re-identified: ${JSON.stringify(known)}`);

console.log('Moreno v0.21 generalized interview routing smoke passed');
console.log(JSON.stringify({status,cases:cases.length,known:known.operations},null,2));
