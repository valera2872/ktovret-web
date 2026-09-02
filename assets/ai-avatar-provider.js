(()=>{"use strict";
const SCRIPT_URL=new URL(document.currentScript?.src||document.baseURI,document.baseURI);
const SCRIPT_BASE=new URL(".",SCRIPT_URL).href;
const SCRIPT_VERSION=SCRIPT_URL.searchParams.get("v")||"";
const PUBLIC_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4";
const DEFAULT_CONFIG={enabled:false,provider:"heygen",sessionEndpoint:"https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-avatar-session",ttsEndpoint:"https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-avatar-tts",publicAnon:PUBLIC_ANON,caseId:"",accessToken:"",experienceTier:"text"};
const ALLOWED_STAGES=new Set(["composed","defensive","cornered","breaking","confessed"]);
const TERMINAL_LIVE_ERRORS=new Set([
  "avatar_budget_exhausted",
  "avatar_disabled",
  "avatar_not_configured",
  "avatar_access_not_configured",
  "avatar_tts_not_configured",
  "live_access_required",
  "live_access_revoked",
  "live_access_not_started",
  "live_access_expired",
  "live_tier_required",
  "live_wrong_case",
  "live_entitlement_invalid",
  "suspect_avatar_unavailable",
  "speech_token_invalid"
]);
const BUDGET_FALLBACK_MESSAGE="Лимит живого допроса на это дело исчерпан. Расследование продолжается текстом.";
const LIVE_FALLBACK_MESSAGE="Живой режим сейчас недоступен. Расследование продолжается текстом.";
const LIVE_RETRY_MESSAGE="Живой режим временно недоступен. Ответ уже показан текстом.";
function authHeaders(cfg){const anon=cfg?.publicAnon||window.ML_AI_PUBLIC_AUTH?.anon||"";return anon?{"authorization":`Bearer ${anon}`,"apikey":anon}:{}}
function accessContext(cfg){
  const paid=window.MysteryLogicPaidAccess||{};
  const root=document.querySelector("[data-ai-detective]")||document.querySelector("[data-ktv-root]");
  return {
    caseId:String(cfg?.caseId||paid.caseId||root?.dataset?.caseId||window.KtoVretPage?.caseId||""),
    accessToken:String(cfg?.accessToken||paid.token||""),
    experienceTier:String(cfg?.experienceTier||paid.experienceTier||root?.dataset?.experienceTier||"text").toLowerCase()==="live"?"live":"text"
  };
}
function errorCode(err){return String(err?.code||err?.message||"avatar_error").trim()||"avatar_error"}
class AvatarProvider{
  constructor(config={}){this.config=config;this.connected=false;this.suspectId="";this.stage="composed";this.video=null}
  async connect(){throw new Error("avatar_provider_not_implemented")}
  async setSuspect(id){this.suspectId=id||""}
  async setStage(stage){this.stage=ALLOWED_STAGES.has(stage)?stage:"composed"}
  async speak(_text){return {ok:false,durationMs:0}}
  async disconnect(){this.connected=false}
}
class DisabledProvider extends AvatarProvider{async connect(){return false}}
class HeyGenLiveAvatarProvider extends AvatarProvider{
  async connect({video,suspectId}={}){
    this.video=video||null;this.suspectId=suspectId||this.suspectId;
    const epoch=(this.connectEpoch||0)+1;this.connectEpoch=epoch;
    if(!this.config.enabled)return false;
    const access=accessContext(this.config);
    if(access.experienceTier!=="live")throw new Error("live_tier_required");
    if(!access.caseId)throw new Error("avatar_case_id_missing");
    if(!access.accessToken)throw new Error("live_access_required");
    let factory=window.MLHeyGenLiveAvatarFactory;
    if(typeof factory!=="function"){
      const factoryUrl=`${SCRIPT_BASE}ai-liveavatar-factory.js${SCRIPT_VERSION?`?v=${encodeURIComponent(SCRIPT_VERSION)}`:""}`;
      await import(factoryUrl);
      factory=window.MLHeyGenLiveAvatarFactory;
    }
    if(epoch!==this.connectEpoch)return false;
    if(typeof factory!=="function")throw new Error("heygen_factory_missing");
    const endpoint=this.config.sessionEndpoint||"";
    if(!endpoint)throw new Error("avatar_session_endpoint_missing");
    const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json",...authHeaders(this.config)},body:JSON.stringify({provider:"liveavatar",suspect_id:this.suspectId,mode:"lite",case_id:access.caseId,access_token:access.accessToken})});
    const session=await response.json().catch(()=>({}));
    if(epoch!==this.connectEpoch)return false;
    if(!response.ok){const err=new Error(session.error||session.message||"avatar_session_failed");err.code=session.error||"avatar_session_failed";err.status=response.status;throw err}
    const client=await factory({session,video:this.video,suspectId:this.suspectId,ttsEndpoint:this.config.ttsEndpoint,auth:authHeaders(this.config)});
    if(!client||typeof client.connect!=="function"||typeof client.speak!=="function")throw new Error("heygen_factory_invalid");
    if(epoch!==this.connectEpoch){try{if(typeof client.disconnect==="function")await client.disconnect()}catch{}return false}
    await client.connect();
    if(epoch!==this.connectEpoch){try{if(typeof client.disconnect==="function")await client.disconnect()}catch{}return false}
    this.client=client;this.connected=true;return true
  }
  async setSuspect(id){if(id===this.suspectId)return;this.connectEpoch=(this.connectEpoch||0)+1;await this.disconnect(false);this.suspectId=id||""}
  async setStage(stage){await super.setStage(stage);if(this.connected&&typeof this.client?.setStage==="function")await this.client.setStage(this.stage)}
  async speak(text){if(!this.connected||!text)return {ok:false,durationMs:0};return await this.client.speak(String(text),{stage:this.stage,suspectId:this.suspectId})}
  async disconnect(invalidate=true){if(invalidate)this.connectEpoch=(this.connectEpoch||0)+1;const client=this.client;this.client=null;this.connected=false;try{if(client&&typeof client.disconnect==="function")await client.disconnect()}catch{}}
}
function config(){return {...DEFAULT_CONFIG,...(window.ML_AVATAR_CONFIG||{})}}
function makeProvider(cfg){if(!cfg.enabled)return new DisabledProvider(cfg);if(cfg.provider==="heygen"||cfg.provider==="liveavatar")return new HeyGenLiveAvatarProvider(cfg);throw new Error("avatar_provider_unknown")}
class AvatarBridge{
  constructor(){this.cfg=config();this.provider=makeProvider(this.cfg);this.root=null;this.shell=null;this.workspace=null;this.transcript=null;this.video=null;this.activeSuspect="";this.activeStage="composed";this.started=false;this.liveEntitled=false;this.liveDisabled=false;this.fallbackReason="";this.observer=null;this.workspaceObserver=null;this.messageObserver=null;this.speakListener=null;this.connecting=null;this.suspectSync=Promise.resolve();this.messageCounts=new Map()}
  canUseLive(){return !!this.cfg.enabled&&this.liveEntitled&&!this.liveDisabled}
  roomStatus(){return this.root?.querySelector?.("[data-room-status]")||document.querySelector("[data-room-status]")}
  setLiveLayout(active){document.body?.classList.toggle("aid-live-mode",!!active)}
  async start(root=document){
    if(this.started)return;this.started=true;this.root=root;
    this.shell=root.querySelector?.("[data-avatar-stage]")||document.querySelector("[data-avatar-stage]");
    this.workspace=root.querySelector?.('[data-view="workspace"]')||document.querySelector('[data-view="workspace"]');
    this.transcript=root.querySelector?.("[data-transcript]")||document.querySelector("[data-transcript]");
    this.video=root.querySelector?.("[data-avatar-video]")||document.querySelector("[data-avatar-video]");
    this.liveEntitled=accessContext(this.cfg).experienceTier==="live";
    if(this.shell){
      const show=this.canUseLive();this.shell.hidden=!show;this.shell.setAttribute("aria-hidden",show?"false":"true");
      if(show)this.shell.dataset.avatarStatus="idle";
    }
    this.setLiveLayout(this.canUseLive()&&this.isWorkspaceActive());this.syncFromDom();this.seedMessageCount();this.observe();await this.syncAvailability();
  }
  suspectMessageNodes(){return this.transcript?[...this.transcript.querySelectorAll(".aid-message.is-suspect:not(.aid-typing)")]:[]}
  seedMessageCount(){const suspect=this.shell?.dataset.suspect||this.activeSuspect;if(suspect)this.messageCounts.set(suspect,this.suspectMessageNodes().length)}
  observe(){
    if(this.shell){this.observer=new MutationObserver(()=>this.syncFromDom());this.observer.observe(this.shell,{attributes:true,attributeFilter:["data-suspect","data-stage"]})}
    if(this.workspace){this.workspaceObserver=new MutationObserver(()=>{void this.syncAvailability()});this.workspaceObserver.observe(this.workspace,{attributes:true,attributeFilter:["hidden"]})}
    if(this.transcript){this.messageObserver=new MutationObserver(()=>this.captureNewReplies());this.messageObserver.observe(this.transcript,{childList:true})}
    this.speakListener=event=>{const detail=event?.detail||{};if(!this.canUseLive()||!detail.text||detail.suspectId!==this.activeSuspect)return;if(ALLOWED_STAGES.has(detail.stage)){this.activeStage=detail.stage;void this.provider.setStage(detail.stage).catch(err=>this.handleFailure(err))}void this.speak(detail.text)};
    window.addEventListener("ml:avatar-speak",this.speakListener);
  }
  captureNewReplies(){
    if(!this.canUseLive())return;
    const suspect=this.shell?.dataset.suspect||this.activeSuspect;if(!suspect)return;
    const nodes=this.suspectMessageNodes();const previous=this.messageCounts.get(suspect);
    if(previous===undefined){this.messageCounts.set(suspect,nodes.length);return}
    this.messageCounts.set(suspect,nodes.length);
    if(nodes.length<=previous)return;
    for(const node of nodes.slice(previous)){
      const text=node.children?.[1]?.textContent?.trim()||"";
      if(text)void this.speak(text);
    }
  }
  isWorkspaceActive(){return !!this.workspace&&!this.workspace.hidden}
  syncFromDom(){
    if(!this.shell)return;
    const suspect=this.shell.dataset.suspect||"";
    const stage=ALLOWED_STAGES.has(this.shell.dataset.stage)?this.shell.dataset.stage:"composed";
    if(suspect&&suspect!==this.activeSuspect){
      this.activeSuspect=suspect;this.shell.dataset.avatarStatus=this.liveDisabled?"text-fallback":"idle";
      const sync=Promise.resolve(this.provider.setSuspect(suspect)).then(()=>{
        if(!this.messageCounts.has(suspect))this.messageCounts.set(suspect,this.suspectMessageNodes().length);
        if(this.canUseLive()&&this.isWorkspaceActive()&&suspect===this.activeSuspect)void this.ensureConnected();
      }).catch(err=>this.handleFailure(err));
      this.suspectSync=sync;
    }
    if(stage!==this.activeStage){this.activeStage=stage;Promise.resolve(this.provider.setStage(stage)).catch(err=>this.handleFailure(err))}
  }
  async syncAvailability(){
    if(!this.canUseLive()){
      this.setLiveLayout(false);await this.provider.disconnect();
      if(this.shell&&!this.liveEntitled){this.shell.hidden=true;this.shell.setAttribute("aria-hidden","true")}
      return false;
    }
    if(!this.isWorkspaceActive()){
      this.setLiveLayout(false);await this.provider.disconnect();if(this.shell)this.shell.dataset.avatarStatus="idle";return false
    }
    this.setLiveLayout(true);await this.ensureConnected();return !!this.provider.connected;
  }
  async enterTextFallback(reason){
    if(this.liveDisabled)return;
    this.liveDisabled=true;this.fallbackReason=reason||"live_unavailable";this.setLiveLayout(false);
    if(this.shell){this.shell.dataset.avatarStatus="text-fallback";this.shell.dataset.avatarFallback=this.fallbackReason;this.shell.hidden=true;this.shell.setAttribute("aria-hidden","true")}
    const status=this.roomStatus();if(status)status.textContent=this.fallbackReason==="avatar_budget_exhausted"?BUDGET_FALLBACK_MESSAGE:LIVE_FALLBACK_MESSAGE;
    window.dispatchEvent(new CustomEvent("ml:avatar-fallback",{detail:{reason:this.fallbackReason,terminal:true}}));
    await this.provider.disconnect();
  }
  async handleFailure(err){
    const code=errorCode(err);
    if(TERMINAL_LIVE_ERRORS.has(code)){await this.enterTextFallback(code);return true}
    this.fail(err);return false;
  }
  async ensureConnected(){
    if(!this.canUseLive()||!this.isWorkspaceActive()||!this.activeSuspect)return false;
    await this.suspectSync;
    if(!this.canUseLive()||!this.isWorkspaceActive()||!this.activeSuspect)return false;
    if(this.provider.connected&&this.provider.suspectId===this.activeSuspect)return true;
    if(this.connecting){
      await this.connecting;
      if(!this.canUseLive()||!this.isWorkspaceActive()||!this.activeSuspect)return false;
      if(this.provider.connected&&this.provider.suspectId===this.activeSuspect)return true;
    }
    const targetSuspect=this.activeSuspect;
    if(this.shell)this.shell.dataset.avatarStatus="connecting";
    const attempt=this.provider.connect({video:this.video,suspectId:targetSuspect}).then(ok=>{if(this.shell&&!this.liveDisabled&&targetSuspect===this.activeSuspect)this.shell.dataset.avatarStatus=ok?"connected":"idle";return ok}).catch(async err=>{if(targetSuspect!==this.activeSuspect)return false;await this.handleFailure(err);return false});
    this.connecting=attempt;
    const ok=await attempt.finally(()=>{if(this.connecting===attempt)this.connecting=null});
    if(targetSuspect!==this.activeSuspect){await this.provider.disconnect();return false}
    return !!ok&&this.provider.connected&&this.provider.suspectId===this.activeSuspect;
  }
  async speak(text){
    if(!this.canUseLive()||!this.isWorkspaceActive())return false;
    try{
      await this.ensureConnected();if(!this.provider.connected||this.liveDisabled)return false;
      await this.provider.setStage(this.activeStage);
      const result=await this.provider.speak(text);
      return !!result?.ok;
    }catch(err){await this.handleFailure(err);return false}
  }
  fail(err){console.warn("[Mystery Logic avatar]",err);if(this.shell){this.shell.dataset.avatarError=errorCode(err);this.shell.dataset.avatarStatus="unavailable"}const status=this.roomStatus();if(status)status.textContent=LIVE_RETRY_MESSAGE}
  async stop(){this.observer?.disconnect();this.workspaceObserver?.disconnect();this.messageObserver?.disconnect();if(this.speakListener)window.removeEventListener("ml:avatar-speak",this.speakListener);await this.provider.disconnect();this.setLiveLayout(false);this.started=false}
}
window.MLAvatarProvider={AvatarProvider,DisabledProvider,HeyGenLiveAvatarProvider,AvatarBridge,config,accessContext};
window.MLAvatarBridge=new AvatarBridge();
window.addEventListener("DOMContentLoaded",()=>window.MLAvatarBridge.start(document),{once:true});
})();