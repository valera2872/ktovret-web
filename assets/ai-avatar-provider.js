(()=>{"use strict";
const DEFAULT_CONFIG={enabled:false,provider:"heygen",sessionEndpoint:"",suspects:{}};
const ALLOWED_STAGES=new Set(["composed","defensive","cornered","breaking","confessed"]);
class AvatarProvider{
  constructor(config={}){this.config=config;this.connected=false;this.suspectId="";this.stage="composed";this.video=null}
  async connect(){throw new Error("avatar_provider_not_implemented")}
  async setSuspect(id){this.suspectId=id||""}
  async setStage(stage){this.stage=ALLOWED_STAGES.has(stage)?stage:"composed"}
  async speak(_text){return false}
  async disconnect(){this.connected=false}
}
class DisabledProvider extends AvatarProvider{
  async connect(){return false}
}
class HeyGenLiveAvatarProvider extends AvatarProvider{
  async connect({video,suspectId}={}){
    this.video=video||null;this.suspectId=suspectId||this.suspectId;
    if(!this.config.enabled)return false;
    const factory=window.MLHeyGenLiveAvatarFactory;
    if(typeof factory!=="function")throw new Error("heygen_factory_missing");
    const avatarId=this.config.suspects?.[this.suspectId]?.avatarId;
    if(!avatarId)throw new Error("heygen_avatar_id_missing");
    const endpoint=this.config.sessionEndpoint||"";
    if(!endpoint)throw new Error("avatar_session_endpoint_missing");
    const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"heygen",avatar_id:avatarId,suspect_id:this.suspectId,mode:"lite"})});
    const session=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(session.error||session.message||"avatar_session_failed");
    this.client=await factory({session,video:this.video,avatarId,suspectId:this.suspectId});
    if(!this.client||typeof this.client.connect!=="function"||typeof this.client.speak!=="function")throw new Error("heygen_factory_invalid");
    await this.client.connect();this.connected=true;return true
  }
  async setSuspect(id){if(id===this.suspectId)return;await this.disconnect();this.suspectId=id||""}
  async setStage(stage){await super.setStage(stage);if(this.connected&&typeof this.client?.setStage==="function")await this.client.setStage(this.stage)}
  async speak(text){if(!this.connected||!text)return false;await this.client.speak(String(text),{stage:this.stage,suspectId:this.suspectId});return true}
  async disconnect(){try{if(this.client&&typeof this.client.disconnect==="function")await this.client.disconnect()}finally{this.client=null;this.connected=false}}
}
function config(){return {...DEFAULT_CONFIG,...(window.ML_AVATAR_CONFIG||{}),suspects:{...DEFAULT_CONFIG.suspects,...(window.ML_AVATAR_CONFIG?.suspects||{})}}}
function makeProvider(cfg){if(!cfg.enabled)return new DisabledProvider(cfg);if(cfg.provider==="heygen")return new HeyGenLiveAvatarProvider(cfg);throw new Error("avatar_provider_unknown")}
class AvatarBridge{
  constructor(){this.cfg=config();this.provider=makeProvider(this.cfg);this.root=null;this.video=null;this.activeSuspect="";this.activeStage="composed";this.started=false;this.observer=null}
  async start(root=document){if(this.started)return;this.started=true;this.root=root;this.video=root.querySelector?.("[data-avatar-video]")||document.querySelector("[data-avatar-video]");this.observe();this.syncFromDom();if(this.cfg.enabled)await this.ensureConnected().catch(err=>this.fail(err))}
  observe(){const shell=this.root.querySelector?.("[data-avatar-stage]")||document.querySelector("[data-avatar-stage]");const transcript=this.root.querySelector?.("[data-transcript]")||document.querySelector("[data-transcript]");if(shell){this.observer=new MutationObserver(()=>this.syncFromDom());this.observer.observe(shell,{attributes:true,attributeFilter:["data-suspect","data-stage","data-answering"]})}if(transcript){this.transcriptObserver=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes){if(!(n instanceof HTMLElement)||!n.matches(".aid-message.is-suspect"))continue;const text=n.textContent?.trim();if(text&&!n.matches(".aid-typing"))this.speak(text)}});this.transcriptObserver.observe(transcript,{childList:true})}}
  syncFromDom(){const shell=this.root.querySelector?.("[data-avatar-stage]")||document.querySelector("[data-avatar-stage]");if(!shell)return;const suspect=shell.dataset.suspect||"";const stage=ALLOWED_STAGES.has(shell.dataset.stage)?shell.dataset.stage:"composed";if(suspect&&suspect!==this.activeSuspect){this.activeSuspect=suspect;Promise.resolve(this.provider.setSuspect(suspect)).then(()=>this.ensureConnected()).catch(err=>this.fail(err))}if(stage!==this.activeStage){this.activeStage=stage;Promise.resolve(this.provider.setStage(stage)).catch(err=>this.fail(err))}}
  async ensureConnected(){if(!this.cfg.enabled||this.provider.connected||!this.activeSuspect)return false;return this.provider.connect({video:this.video,suspectId:this.activeSuspect})}
  async speak(text){if(!this.cfg.enabled)return false;try{await this.ensureConnected();await this.provider.setStage(this.activeStage);return await this.provider.speak(text)}catch(err){this.fail(err);return false}}
  fail(err){console.warn("[Mystery Logic avatar]",err);const shell=this.root?.querySelector?.("[data-avatar-stage]")||document.querySelector("[data-avatar-stage]");if(shell)shell.dataset.avatarError=err?.message||"avatar_error"}
  async stop(){this.observer?.disconnect();this.transcriptObserver?.disconnect();await this.provider.disconnect();this.started=false}
}
window.MLAvatarProvider={AvatarProvider,DisabledProvider,HeyGenLiveAvatarProvider,AvatarBridge,config};
window.MLAvatarBridge=new AvatarBridge();
window.addEventListener("DOMContentLoaded",()=>window.MLAvatarBridge.start(document),{once:true});
})();
