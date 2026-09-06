(()=>{
  'use strict';

  const api=window.MLAvatarProvider;
  if(!api)return;

  const style=document.createElement('style');
  style.dataset.aiAvatarWaitResume='';
  style.textContent=`
    .aid-avatar-stage[data-avatar-status="connecting"] .aid-avatar-fallback,
    .aid-avatar-stage[data-avatar-status="reconnecting"] .aid-avatar-fallback{
      opacity:0;pointer-events:none
    }
    .aid-avatar-stage[data-avatar-status="connecting"] .aid-avatar-video-shell::before,
    .aid-avatar-stage[data-avatar-status="reconnecting"] .aid-avatar-video-shell::before{
      position:absolute;z-index:8;left:50%;top:50%;width:min(86%,420px);transform:translate(-50%,-50%);
      padding:16px 18px;border:1px solid rgba(240,214,165,.18);border-radius:14px;
      background:rgba(5,14,22,.78);box-shadow:0 14px 42px rgba(0,0,0,.22);
      color:#e9f1f4;text-align:center;white-space:pre-line;
      font:500 14px/1.55 Inter,system-ui,sans-serif;letter-spacing:.01em
    }
    .aid-avatar-stage[data-avatar-status="connecting"] .aid-avatar-video-shell::before{
      content:"Подозреваемый приглашён.\\AСейчас появится."
    }
    .aid-avatar-stage[data-avatar-status="reconnecting"] .aid-avatar-video-shell::before{
      content:"Возвращаем подозреваемого в комнату…\\AСоединение восстанавливается."
    }
    .aid-avatar-stage[data-avatar-status="connecting"] .aid-avatar-video-shell::after,
    .aid-avatar-stage[data-avatar-status="reconnecting"] .aid-avatar-video-shell::after{
      content:"";position:absolute;z-index:9;left:50%;top:calc(50% + 54px);width:20px;height:20px;
      margin-left:-10px;border:2px solid rgba(240,214,165,.2);border-top-color:#f0d6a5;border-radius:50%;
      animation:aid-avatar-wait-spin .8s linear infinite
    }
    @keyframes aid-avatar-wait-spin{to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(style);

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  const liveProto=api.HeyGenLiveAvatarProvider?.prototype;
  if(liveProto&&!liveProto.__mlResumeGracePatched){
    liveProto.__mlResumeGracePatched=true;
    const baseIsHealthy=liveProto.isHealthy;
    liveProto.resume=async function(){
      if(!this.connected||!this.client)return false;
      try{
        if(typeof this.client.resume!=="function")return typeof baseIsHealthy==="function"?!!(await baseIsHealthy.call(this)):true;
        const delays=[0,120,180,260,360];
        for(const delay of delays){
          if(delay)await wait(delay);
          if(!this.connected||!this.client)return false;
          if(await this.client.resume())return true;
        }
      }catch{}
      this.connected=false;
      return false;
    };
  }

  const bridgeProto=api.AvatarBridge?.prototype;
  if(bridgeProto&&!bridgeProto.__mlVisibleResumePatched){
    bridgeProto.__mlVisibleResumePatched=true;
    bridgeProto.recoverVisibleSession=async function(){
      if(document.visibilityState==="hidden"||!this.canUseLive()||!this.isWorkspaceActive()||!this.activeSuspect)return false;
      await this.suspectSync;
      if(document.visibilityState==="hidden"||!this.canUseLive()||!this.isWorkspaceActive()||!this.activeSuspect)return false;
      if(this.shell&&!this.liveDisabled)this.shell.dataset.avatarStatus="reconnecting";
      try{
        let healthy=false;
        const sameSession=!!this.provider?.connected&&this.provider?.suspectId===this.activeSuspect;
        if(sameSession&&typeof this.provider.resume==="function")healthy=await this.provider.resume();
        else healthy=await this.providerHealthy();
        if(healthy){
          if(this.shell&&!this.liveDisabled)this.shell.dataset.avatarStatus="connected";
          return true;
        }
        await this.provider.disconnect();
        if(this.shell&&!this.liveDisabled)this.shell.dataset.avatarStatus="connecting";
        return await this.ensureConnected();
      }catch(err){
        await this.handleFailure(err);
        return false;
      }
    };
  }
})();
