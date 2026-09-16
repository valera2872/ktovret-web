import {
  createInitialFullPartnerState,
  mapDuelRoleToFullPartner,
  normalizeFullPartnerState,
  processFullPartnerAction,
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
  processFullPartnerAction,
  type FullPartnerState,
  type FullPartnerAction,
};

export function safeFullPartnerView(state:FullPartnerState,role:PartnerRole,partner:{joined:boolean;name:string|null},revision:number){
  const view=unsafeView(state,role,partner,revision) as Record<string,any>;
  const publicMilestones=Array.isArray(view.milestones)?view.milestones.filter((id:string)=>id==='VERA_ALIVE'):[];
  return {...view,milestones:publicMilestones};
}

export function characterSpeakingContext(state:FullPartnerState,id:CharacterId){
  const ctx=unsafeSpeakingContext(state,id) as Record<string,any>;
  if(!ctx.available)return ctx;
  const {coreTruth:_coreTruth,motive:_motive,...safe}=ctx;
  return safe;
}
