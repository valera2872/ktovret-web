(()=>{"use strict";
const SDK_URL="./vendor/liveavatar-web-sdk.mjs";
const PCM_SAMPLE_RATE=24000;
const PCM_BYTES_PER_SAMPLE=2;
const SESSION_PATH="/functions/v1/ai-avatar-session";
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
window.MLHeyGenLiveAvatarFactory=async({session,video,suspectId,ttsEndpoint,auth={},onDisconnected})=>{
  const sdk=await import(SDK_URL);
  const LiveAvatarSession=sdk.LiveAvatarSession;
  if(typeof LiveAvatarSession!=="function")throw new Error("liveavatar_sdk_invalid");
  const token=session?.session_token||"";
  const speechToken=session?.speech_token||"";
  if(!token||!speechToken)throw new Error("liveavatar_session_invalid");
  if(!ttsEndpoint)throw new Error("avatar_tts_endpoint_missing");
  let live=null;let connected=false;let streamReady=false;let disconnected=false;let stage="composed";let unlock=null;let disconnectHandler=null;
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
    return tracks.length?tracks.some(track=>track.readyState==="live"):true;
  };
  const attach=()=>{
    if(!live||!video)return false;
    prepareVideo();
    try{live.attach(video);void video.play().catch(()=>{});streamReady=hasLiveVideoTrack()||streamReady;return true}catch{return false}
  };
  const markDisconnected=reason=>{
    if(disconnected)return;
    disconnected=true;connected=false;streamReady=false;
    try{if(video)video.srcObject=null}catch{}
    try{if(typeof onDisconnected==="function")onDisconnected(reason||"session_disconnected")}catch{}
  };
  return {
    async connect(){
      if(connected&&!disconnected)return true;
      prepareVideo();
      disconnected=false;streamReady=false;
      live=new LiveAvatarSession(token,{voiceChat:false});
      if(sdk.SessionEvent?.SESSION_STREAM_READY)live.on(sdk.SessionEvent.SESSION_STREAM_READY,()=>{streamReady=true;attach()});
      if(sdk.SessionEvent?.SESSION_DISCONNECTED){disconnectHandler=reason=>markDisconnected(reason);live.on(sdk.SessionEvent.SESSION_DISCONNECTED,disconnectHandler)}
      unlock=()=>{if(video){prepareVideo();attach();void video.play().catch(()=>{})}};
      window.addEventListener("pointerdown",unlock,{passive:true});
      await live.start();
      if(disconnected)return false;
      connected=true;attach();
      return true;
    },
    async isHealthy(){
      if(!connected||!live||disconnected)return false;
      if(document.visibilityState==="visible"&&video?.srcObject&&!hasLiveVideoTrack())return false;
      return true;
    },
    async resume(){
      if(!connected||!live||disconnected)return false;
      attach();
      if(video){prepareVideo();try{await video.play()}catch{}}
      await new Promise(resolve=>setTimeout(resolve,0));
      if(disconnected)return false;
      if(video&&!hasLiveVideoTrack())return false;
      return true;
    },
    async setStage(next){stage=next||"composed"},
    async speak(text,meta={}){
      if(!connected||!live||disconnected||!text)return {ok:false,durationMs:0};
      const response=await fetch(ttsEndpoint,{
        method:"POST",
        headers:{"content-type":"application/json",...auth},
        body:JSON.stringify({suspect_id:suspectId,text:String(text),stage:meta.stage||stage,speech_token:speechToken,utterance_id:utteranceId()})
      });
      if(!response.ok){let err={};try{err=await response.json()}catch{}const failure=new Error(err.error||err.message||"avatar_tts_failed");failure.code=err.error||"avatar_tts_failed";throw failure}
      const pcm=await response.arrayBuffer();
      if(!pcm.byteLength)throw new Error("avatar_tts_empty");
      if(disconnected)throw new Error("avatar_session_disconnected");
      const durationMs=pcmDurationMs(pcm);
      try{live.interrupt()}catch{}
      live.repeatAudio(toBase64(pcm));
      return {ok:true,durationMs};
    },
    async disconnect(){
      if(unlock)window.removeEventListener("pointerdown",unlock);unlock=null;
      const current=live;live=null;connected=false;streamReady=false;disconnected=true;
      try{if(current&&disconnectHandler&&sdk.SessionEvent?.SESSION_DISCONNECTED&&typeof current.off==="function")current.off(sdk.SessionEvent.SESSION_DISCONNECTED,disconnectHandler)}catch{}
      disconnectHandler=null;
      try{if(current)await current.stop()}catch{}finally{if(video)video.srcObject=null}
    }
  };
};
})();