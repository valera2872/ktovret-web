(()=>{"use strict";
const DEFAULT_CONFIG={enabled:false,provider:"heygen",sessionEndpoint:"",ttsEndpoint:""};
const ALLOWED_STAGES=new Set(["composed","defensive","cornered","breaking","confessed"]);
function authHeaders(){const anon=window.ML_AI_PUBLIC_AUTH?.anon||"";return anon?{"authorization":`Bearer ${anon}`,"apikey":anon}:{}}
class AvatarProvider{
  constructor(config={}){this.config=config;this.connected=false;this.suspectId="";this.stage="composed";this.video=null}
  async connect(){throw new Error("avatar_provider_not_implemented")}
  async setSuspect(id){this.suspectId=id||""}
  async setStage(stage){this.stage=ALLOWED_STAGES.has(stage)?stage:"composed"}
  async speak(_text){return false}
  async disconnect(){this.connected=false}
}
class DisabledProvider extends AvatarProvider{async connect(){return false}}
class HeyGenLiveAvatarProvider extends AvatarProvider{
  async connect({video,suspectId}={}){
    this.video=video||null;this.suspectId=suspectId||this.suspectId;
    if(!this.config.enabled)return false;
    const factory=window.MLHeyGenLiveAvatarFactory;
    if(typeof factory!=="function")throw new Error("heygen_factory_missing");
    const endpoint=this.config.sessionEndpoint||"";
    if(!endpoint)throw new Error("avatar_session_endpoint_missing");
    const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json",...authHeaders()},body:JSON.stringify({provider:"liveavatar",suspect_id:this.suspectId,mode:"lite"})});
    const session=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(session.error||session.message||"avatar_session_failed");
    this.client=await factory({session,video:this.video,suspectId:this.suspectId});
    if(!this.client||typeof this.client.connect!=="function"||typeof this.client.speak!=="function")throw new Error("heygen_factory_invalid");
    await this.client.connect();this.connected=true;return true
  }
  async setSuspect(id){if(id===this.suspectId)return;await this.disconnect();this.suspectId=id||""}
  async setStage(stage){await super.setStage(stage);if(this.connected&&typeof this.client?.setStage==="function")await this.client.setStage(this.stage)}
  async speak(text){if(!this.connected||!text)return false;await this.client.speak(String(text),{stage:this.stage,suspectId:this.suspectId});return true}
  async disconnect(){try{if(this.client&&typeof this.client.disconnect==="function")await this.client.disconnect()}finally{this.client=null;this.connected=false}}
}
function config(){return {...DEFAULT_CONFIG,...(window.ML_AVATAR_CONFIG||{})}}
function makeProvider(cfg){if(!cfg.enabled)return new DisabledProvider(cfg);if(cfg.provider==="heygen"||cfg.provider==="liveavatar")return new HeyGenLiveAvatarProvider(cfg);throw new Error("avatar_provider_unknown")}
class AvatarBridge{
  constructor(){this.cfg=config();this.provider=makeProvider(this.cfg);this.root=null;this.shell=null;this.workspace=null;this.video=null;this.activeSuspect="";this.activeStage="composed";this.started=false;this.observer=null;this.workspaceObserver=null;this.speakListener=null;this.connecting=null}
  async start(root=document){
    if(this.started)return;this.started=true;this.root=root;
    this.shell=root.querySelector?.("[data-avatar-stage]")||document.querySelector("[data-avatar-stage]");
    this.workspace=root.querySelector?.('[data-view="workspace"]')||document.querySelector('[data-view="workspace"]');
    this.video=root.querySelector?.("[data-avatar-video]")||document.querySelector("[data-avatar-video]");
    if(this.cfg.enabled&&this.shell){this.shell.hidden=false;this.shell.setAttribute("aria-hidden","false");this.shell.dataset.avatarStatus="idle"}
    this.observe();this.syncFromDom();await this.syncAvailability();
  }
  observe(){
    if(this.shell){this.observer=new MutationObserver(()=>this.syncFromDom());this.observer.observe(this.shell,{attributes:true,attributeFilter:["data-suspect","data-stage","data-answering"]})}
    if(this.workspace){this.workspaceObserver=new MutationObserver(()=>{void this.syncAvailability()});this.workspaceObserver.observe(this.workspace,{attributes:true,attributeFilter:["hidden"]})}
    this.speakListener=event=>{const detail=event?.detail||{};if(!detail.text||detail.suspectId!==this.activeSuspect)return;if(ALLOWED_STAGES.has(detail.stage)){this.activeStage=detail.stage;void this.provider.setStage(detail.stage).catch(err=>this.fail(err))}void this.speak(detail.text)};
    window.addEventListener("ml:avatar-speak",this.speakListener);
  }
  isWorkspaceActive(){return !!this.workspace&&!this.workspace.hidden}
  syncFromDom(){
    if(!this.shell)return;
    const suspect=this.shell.dataset.suspect||"";
    const stage=ALLOWED_STAGES.has(this.shell.dataset.stage)?this.shell.dataset.stage:"composed";
    if(suspect&&suspect!==this.activeSuspect){this.activeSuspect=suspect;this.shell.dataset.avatarStatus="idle";Promise.resolve(this.provider.setSuspect(suspect)).then(()=>this.syncAvailability()).catch(err=>this.fail(err))}
    if(stage!==this.activeStage){this.activeStage=stage;Promise.resolve(this.provider.setStage(stage)).catch(err=>this.fail(err))}
  }
  async syncAvailability(){
    if(!this.cfg.enabled)return false;
    if(!this.isWorkspaceActive()){if(this.provider.connected)await this.provider.disconnect();if(this.shell)this.shell.dataset.avatarStatus="idle";return false}
    return this.ensureConnected();
  }
  async ensureConnected(){
    if(!this.cfg.enabled||!this.isWorkspaceActive()||this.provider.connected||!this.activeSuspect)return false;
    if(this.connecting)return this.connecting;
    if(this.shell)this.shell.dataset.avatarStatus="connecting";
    this.connecting=this.provider.connect({video:this.video,suspectId:this.activeSuspect}).then(ok=>{if(this.shell)this.shell.dataset.avatarStatus=ok?"connected":"idle";return ok}).catch(err=>{this.fail(err);return false}).finally(()=>{this.connecting=null});
    return this.connecting;
  }
  async speak(text){if(!this.cfg.enabled||!this.isWorkspaceActive())return false;try{await this.ensureConnected();if(!this.provider.connected)return false;await this.provider.setStage(this.activeStage);return await this.provider.speak(text)}catch(err){this.fail(err);return false}}
  fail(err){console.warn("[Mystery Logic avatar]",err);if(this.shell){this.shell.dataset.avatarError=err?.message||"avatar_error";this.shell.dataset.avatarStatus="unavailable"}}
  async stop(){this.observer?.disconnect();this.workspaceObserver?.disconnect();if(this.speakListener)window.removeEventListener("ml:avatar-speak",this.speakListener);await this.provider.disconnect();this.started=false}
}
window.MLAvatarProvider={AvatarProvider,DisabledProvider,HeyGenLiveAvatarProvider,AvatarBridge,config};
window.MLAvatarBridge=new AvatarBridge();
window.addEventListener("DOMContentLoaded",()=>window.MLAvatarBridge.start(document),{once:true});
})();
