const norm=(value='')=>String(value).toLowerCase().replaceAll('ё','е').replace(/[.,;:!?()[\]{}"«»]/g,' ').replace(/\s+/g,' ').trim();

export function validateAnswer(id,state={}){
  if(id==='quick:038'){
    const ready=!!(state.dir&&state.dot&&state.strokes);
    return {ready,correct:ready&&state.dir==='right'&&state.dot==='tr'&&Number(state.strokes)===3};
  }
  if(id==='quick:039'){
    const t=norm(state.excluded);
    const ready=t.length>=3;
    return {ready,correct:ready&&t.includes('латун')};
  }
  if(id==='quick:040'){
    const ready=!!(state.cell&&state.dir);
    return {ready,correct:ready&&state.cell==='D3'&&state.dir==='S'};
  }
  if(id==='quick:041'){
    const raw=String(state.number??'').trim(),ready=raw!=='';
    return {ready,correct:ready&&Number(raw)===92};
  }
  if(id==='quick:042'){
    const stack=Array.isArray(state.stack)?state.stack:[];
    return {ready:stack.length===2,correct:stack.length===2&&stack[0]==='A'&&stack[1]==='B'};
  }
  if(id==='quick:043'){
    const route=Array.isArray(state.route)?state.route:[];
    return {ready:route.length===5,correct:route.join('')==='ACBDE'};
  }
  if(id==='quick:044'){
    const lines=new Set(state.lines instanceof Set?[...state.lines]:(Array.isArray(state.lines)?state.lines:[]));
    const ready=lines.size>0;
    return {ready,correct:ready&&lines.size===2&&lines.has('h')&&lines.has('f')};
  }
  if(id==='quick:045'){
    const cards=new Set(state.cards instanceof Set?[...state.cards]:(Array.isArray(state.cards)?state.cards:[]));
    const ready=cards.size>0;
    return {ready,correct:ready&&cards.size===2&&cards.has('K')&&cards.has('7')};
  }
  if(id==='quick:046'){
    const raw=String(state.cycles??'').trim(),ready=raw!=='';
    return {ready,correct:ready&&Number(raw)===0};
  }
  if(id==='quick:047'){
    const ready=state.sheetState==='folded'||state.sheetState==='unfolded';
    return {ready,correct:ready&&state.sheetState==='unfolded'};
  }
  if(id==='quick:048'){
    const raw=String(state.number??'').trim(),ready=raw!=='';
    return {ready,correct:ready&&Number(raw)===1};
  }
  if(id==='quick:049'){
    const counts=state.counts||{};
    const vals=['A','B','C','D'].map(k=>Number(counts[k]));
    const ready=vals.every(Number.isInteger)&&vals.every(n=>n>0);
    return {ready,correct:ready&&new Set(vals).size===4};
  }
  return {ready:false,correct:false};
}

export function weighingDeviations(counts={}){
  return ['A','B','C','D'].flatMap(k=>{
    const n=Number(counts[k]);
    return Number.isFinite(n)?[-n,n]:[];
  });
}
