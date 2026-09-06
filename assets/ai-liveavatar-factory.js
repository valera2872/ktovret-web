(()=>{"use strict";
const SDK_URL="./vendor/liveavatar-web-sdk.mjs";
const PCM_SAMPLE_RATE=24000;
const PCM_BYTES_PER_SAMPLE=2;
const SESSION_PATH="/functions/v1/ai-avatar-session";
const STREAM_READY_TIMEOUT_MS=12000;
function installSessionTransport(){
  if(window.__ML_AI_AVATAR_SESSION_TRANSPORT_PATCHED)return;
  const nativeFetch=window.fetch.bind(window);
  window.__ML_AI_AVATAR_SESSION_TRANSPORT_PATCHED=true;
  window.fetch=(input,init)=>{
    try{
      const url=typeof input==="string"?input:(input instanceof URL?input.href:String(input?.url||""));
      const method=String(init?.method||"GET").toUpperCase();
      if(method==="POST"&&url.includes(SESSION_PATH)&&typeof init?.body==="string"){
        // ai-avatar-session has verify_jwt=false and authenticates origin + opaque Live entitlement itself.
        // Strip non-safelisted browser headers so Chromium/Yandex sends POST directly without OPTIONS.
        return nativeFetch(input,{method:"POST",body:init.body,cache:"no-store",credentials:"omit",mode:"cors"});
      }
    }catch{}
    return nativeFetch(input,init);
  };
}
installSessionTransport();
function toBase64(buffer){
  const bytes=new Uint8Array(buffer);let binary="";const size=0x8000;
  for(let i=0;i<bytes.length;i+=size)binary+=String.fromCharCode(...bytes.subarray(i,i+size));
  return btoa(binary);
}
function utteranceId(){
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  const bytes=new Uint8Array(16);globalThis.crypto?.getRandomValues?.(bytes);
  if(!bytes.some(Boolean))for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
  return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
}
function pcmDurationMs(buffer){return Math.max(500,Math.ceil(buffer.byteLength/(PCM_SAMPLE_RATE*PCM_BYTES_PER_SAMPLE)*1000))}
function telemetry(phase,detail={}){
  try{window.dispatchEvent(new CustomEvent("ml:avatar-telemetry",{detail:{phase,at:Date.now(),...detail}}))}catch{}
}
function normalizeLiveError(error){
  const message=String(error?.message||error||"");
  if(/insufficient\s+credits|not\s+enough\s+credits|credit\s+balance/i.test(message)){
    const failure=new Error("avatar_budget_exhausted");
    failure.code="avatar_budget_exhausted";
    failure.providerMessage=message;
    return failure;
  }
  return error;
}
window.MLHeyGenLiveAvatarFactory=async({session,video,suspectId,ttsEndpoint,auth={},onDisconnected})=>{
  const sdk=await import(SDK_URL);
  const LiveAvatarSession=sdk.LiveAvatarSession;
  if(typeof LiveAvatarSession!=="function")throw new Error("liveavatar_sdk_invalid");
  const token=session?.session_token||"";
  const speechToken=session?.speech_token||"";
  if(!token||!speechToken)throw new Error("liveavatar_session_invalid");
  if(!ttsEndpoint)throw new Error("avatar_tts_endpoint_missing");
  let live=null;let connected=false;let streamReady=false;let disconnected=false;let stage="composed";let unlock=null;let disconnectHandler=null;
  let streamReadyResolve=null;let streamReadyPromise=null;let streamReadyHandler=null;let speakStartedHandler=null;let speakEndedHandler=null;
  const resetStreamReady=()=>{
    streamReady=false;
    streamReadyPromise=new Promise(resolve=>{streamReadyResolve=resolve});
  };
  resetStreamReady();
  const prepareVideo=()=>{
    if(!video)return;
    video.muted=false;video.autoplay=true;video.playsInline=true;
    try{video.disablePictureInPicture=true;video.setAttribute("disablepictureinpicture","")}catch{}
    try{video.disableRemotePlayback=true;video.setAttribute("disableremoteplayback","")}catch{}
    try{video.setAttribute("playsinline","");video.setAttribute("webkit-playsinline","");video.setAttribute("controlslist","nopictureinpicture noremoteplayback")}catch{}
  };
  const hasLiveVideoTrack=()=>{
    const stream=video?.srcObject;
    if(!stream)return false;
    const tracks=typeof stream.getVideoTracks==="function"?stream.getVideoTracks():[];
    return tracks.length?tracks.some(track=>track.readyState==="live"):false;
  };
  const attach=()=>{
    if(!live||!video)return false;
    prepareVideo();
    try{live.attach(video);void video.play().catch(()=>{});return true}catch{return false}
  };
  const markStreamReady=()=>{
    if(streamReady)return;
    streamReady=true;
    attach();
    if(streamReadyResolve)streamReadyResolve(true);
    streamReadyResolve=null;
    telemetry("stream_ready",{suspectId});
  };
  const waitForStreamReady=async(timeoutMs=STREAM_READY_TIMEOUT_MS)=>{
    if(streamReady)return true;
    const result=await Promise.race([
      streamReadyPromise,
      new Promise(resolve=>setTimeout(()=>resolve(false),timeoutMs))
    ]);
    if(result===true&&streamReady)return true;
    const failure=new Error("avatar_session_unhealthy");
    failure.code="avatar_session_unhealthy";
    failure.cause="stream_ready_timeout";
    telemetry("stream_ready_timeout",{suspectId,timeoutMs});
    throw failure;
  };
  const markDisconnected=reason=>{
    if(disconnected)return;
    disconnected=true;connected=false;streamReady=false;
    if(streamReadyResolve)streamReadyResolve(false);
    streamReadyResolve=null;
    try{if(video)video.srcObject=null}catch{}
    telemetry("disconnected",{suspectId,reason:String(reason||"session_disconnected")});
    try{if(typeof onDisconnected==="function")onDisconnected(reason||"session_disconnected")}catch{}
  };
  const removeLiveHandlers=current=>{
    if(!current||typeof current.off!=="function")return;
    try{if(streamReadyHandler&&sdk.SessionEvent?.SESSION_STREAM_READY)current.off(sdk.SessionEvent.SESSION_STREAM_READY,streamReadyHandler)}catch{}
    try{if(disconnectHandler&&sdk.SessionEvent?.SESSION_DISCONNECTED)current.off(sdk.SessionEvent.SESSION_DISCONNECTED,disconnectHandler)}catch{}
    try{if(speakStartedHandler&&sdk.AgentEventsEnum?.AVATAR_SPEAK_STARTED)current.off(sdk.AgentEventsEnum.AVATAR_SPEAK_STARTED,speakStartedHandler)}catch{}
    try{if(speakEndedHandler&&sdk.AgentEventsEnum?.AVATAR_SPEAK_ENDED)current.off(sdk.AgentEventsEnum.AVATAR_SPEAK_ENDED,speakEndedHandler)}catch{}
  };
  return {
    async connect(){
      if(connected&&!disconnected&&streamReady)return true;
      prepareVideo();
      disconnected=false;connected=false;resetStreamReady();
      const connectStarted=Date.now();
      telemetry("sdk_start_begin",{suspectId});
      live=new LiveAvatarSession(token,{voiceChat:false});
      if(sdk.SessionEvent?.SESSION_STREAM_READY){streamReadyHandler=()=>markStreamReady();live.on(sdk.SessionEvent.SESSION_STREAM_READY,streamReadyHandler)}
      if(sdk.SessionEvent?.SESSION_DISCONNECTED){disconnectHandler=reason=>markDisconnected(reason);live.on(sdk.SessionEvent.SESSION_DISCONNECTED,disconnectHandler)}
      if(sdk.AgentEventsEnum?.AVATAR_SPEAK_STARTED){speakStartedHandler=event=>telemetry("avatar_speak_started",{suspectId,eventId:String(event?.event_id||"")});live.on(sdk.AgentEventsEnum.AVATAR_SPEAK_STARTED,speakStartedHandler)}
      if(sdk.AgentEventsEnum?.AVATAR_SPEAK_ENDED){speakEndedHandler=event=>telemetry("avatar_speak_ended",{suspectId,eventId:String(event?.event_id||"")});live.on(sdk.AgentEventsEnum.AVATAR_SPEAK_ENDED,speakEndedHandler)}
      unlock=()=>{if(video){prepareVideo();attach();void video.play().catch(()=>{})}};
      window.addEventListener("pointerdown",unlock,{passive:true});
      try{await live.start()}catch(error){const failure=normalizeLiveError(error);telemetry("sdk_start_error",{suspectId,code:String(failure?.code||failure?.message||"avatar_start_failed"),providerMessage:String(failure?.providerMessage||error?.message||"")});throw failure}
      telemetry("sdk_start_done",{suspectId,elapsedMs:Date.now()-connectStarted});
      if(disconnected)return false;
      connected=true;
      attach();
      await waitForStreamReady();
      telemetry("connect_ready",{suspectId,elapsedMs:Date.now()-connectStarted});
      return true;
    },
    async isHealthy(){
      if(!connected||!live||disconnected||!streamReady)return false;
      if(document.visibilityState==="visible"&&video&&!hasLiveVideoTrack())return false;
      return true;
    },
    async resume(){
      if(!connected||!live||disconnected||!streamReady)return false;
      attach();
      if(video){prepareVideo();try{await video.play()}catch{}}
      await new Promise(resolve=>setTimeout(resolve,0));
      if(disconnected||!streamReady)return false;
      if(video&&!hasLiveVideoTrack())return false;
      return true;
    },
    async setStage(next){stage=next||"composed"},
    async speak(text,meta={}){
      if(!connected||!live||disconnected||!text)return {ok:false,durationMs:0};
      await waitForStreamReady(5000);
      const ttsStarted=Date.now();
      telemetry("tts_begin",{suspectId});
      const response=await fetch(ttsEndpoint,{
        method:"POST",
        headers:{"content-type":"application/json",...auth},
        body:JSON.stringify({suspect_id:suspectId,text:String(text),stage:meta.stage||stage,speech_token:speechToken,utterance_id:utteranceId()})
      });
      if(!response.ok){let err={};try{err=await response.json()}catch{}const failure=new Error(err.error||err.message||"avatar_tts_failed");failure.code=err.error||"avatar_tts_failed";telemetry("tts_error",{suspectId,code:failure.code,elapsedMs:Date.now()-ttsStarted});throw failure}
      const pcm=await response.arrayBuffer();
      telemetry("tts_done",{suspectId,elapsedMs:Date.now()-ttsStarted,bytes:pcm.byteLength});
      if(!pcm.byteLength)throw new Error("avatar_tts_empty");
      if(disconnected||!streamReady){const failure=new Error("avatar_session_disconnected");failure.code="avatar_session_disconnected";throw failure}
      const durationMs=pcmDurationMs(pcm);
      try{live.interrupt()}catch{}
      let eventId="";
      try{eventId=live.repeatAudio(toBase64(pcm))||""}catch(error){throw normalizeLiveError(error)}
      telemetry("repeat_audio_sent",{suspectId,eventId:String(eventId),durationMs,totalElapsedMs:Date.now()-ttsStarted});
      return {ok:true,durationMs};
    },
    async disconnect(){
      if(unlock)window.removeEventListener("pointerdown",unlock);unlock=null;
      const current=live;live=null;connected=false;streamReady=false;disconnected=true;
      if(streamReadyResolve)streamReadyResolve(false);streamReadyResolve=null;
      removeLiveHandlers(current);
      streamReadyHandler=null;disconnectHandler=null;speakStartedHandler=null;speakEndedHandler=null;
      try{if(current)await current.stop()}catch{}finally{if(video)video.srcObject=null}
    }
  };
};
})();