import {
  createInitialFullPartnerState,
  mapDuelRoleToFullPartner,
  normalizeFullPartnerState,
  processFullPartnerAction as unsafeProcess,
  safeFullPartnerView as unsafeView,
  characterSpeakingContext as unsafeSpeakingContext,
  type FullPartnerState,
  type FullPartnerAction,
} from './partner-engine-v2.ts';
import type { CharacterId, PartnerRole } from './partner-ne-publikovat-content-v2.ts';

export {
  createInitialFullPartnerState,
  mapDuelRoleToFullPartner,
  normalizeFullPartnerState,
  type FullPartnerState,
  type FullPartnerAction,
};

export function processFullPartnerAction(state:FullPartnerState,role:PartnerRole,action:FullPartnerAction){
  const type=String(action.type||'').trim().toUpperCase();
  const deduction=String(action.deduction_id||'').trim();
  if(type==='ATTEMPT_DEDUCTION'&&deduction==='D_NINA_ELENA'&&!state.characters.elena?.contradictions?.includes('ELENA_PAST')){
    throw new Error('partner_elena_confrontation_required');
  }
  return unsafeProcess(state,role,action);
}

export function safeFullPartnerView(state:FullPartnerState,role:PartnerRole,partner:{joined:boolean;name:string|null},revision:number){
  const view=unsafeView(state,role,partner,revision) as Record<string,any>;
  const publicMilestones=Array.isArray(view.milestones)?view.milestones.filter((id:string)=>id==='VERA_ALIVE'):[];
  if(view.deductions?.D_NINA_ELENA&&!state.characters.elena?.contradictions?.includes('ELENA_PAST')){
    view.deductions.D_NINA_ELENA={...view.deductions.D_NINA_ELENA,available:false};
  }
  return {...view,milestones:publicMilestones};
}

export function characterSpeakingContext(state:FullPartnerState,id:CharacterId){
  const ctx=unsafeSpeakingContext(state,id) as Record<string,any>;
  if(!ctx.available)return ctx;
  const {coreTruth:_coreTruth,motive:_motive,...safe}=ctx;
  return safe;
}
