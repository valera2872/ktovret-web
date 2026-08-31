(()=>{"use strict";
const SDK_URL="./vendor/liveavatar-web-sdk.mjs";
const PCM_SAMPLE_RATE=24000;
const PCM_BYTES_PER_SAMPLE=2;
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
window.MLHeyGenLiveAvatarFactory=async({session,video,suspectId,ttsEndpoint,auth={}})=>{
  const sdk=await import(SDK_URL);
  const LiveAvatarSession=sdk.LiveAvatarSession;
  if(typeof LiveAvatarSession!=="function")throw new Error("liveavatar_sdk_invalid");
  const token=session?.session_token||"";
  const speechToken=session?.speech_token||"";
  if(!token||!speechToken)throw new Error("liveavatar_session_invalid");
  if(!ttsEndpoint)throw new Error("avatar_tts_endpoint_missing");
  let live=null;let connected=false;let stage="composed";let unlock=null;
  const attach=()=>{
    if(!live||!video)return;
    try{live.attach(video);video.muted=false;video.autoplay=true;video.playsInline=true;void video.play().catch(()=>{})}catch{}
  };
  return {
    async connect(){
      if(connected)return true;
      live=new LiveAvatarSession(token,{voiceChat:false});
      if(sdk.SessionEvent?.SESSION_STREAM_READY)live.on(sdk.SessionEvent.SESSION_STREAM_READY,attach);
      unlock=()=>{if(video){video.muted=false;void video.play().catch(()=>{})}};
      window.addEventListener("pointerdown",unlock,{passive:true});
      await live.start();
      attach();
      connected=true;
      return true;
    },
    async setStage(next){stage=next||"composed"},
    async speak(text,meta={}){
      if(!connected||!live||!text)return {ok:false,durationMs:0};
      const response=await fetch(ttsEndpoint,{
        method:"POST",
        headers:{"content-type":"application/json",...auth},
        body:JSON.stringify({suspect_id:suspectId,text:String(text),stage:meta.stage||stage,speech_token:speechToken,utterance_id:utteranceId()})
      });
      if(!response.ok){let err={};try{err=await response.json()}catch{}throw new Error(err.error||err.message||"avatar_tts_failed")}
      const pcm=await response.arrayBuffer();
      if(!pcm.byteLength)throw new Error("avatar_tts_empty");
      const durationMs=pcmDurationMs(pcm);
      try{live.interrupt()}catch{}
      live.repeatAudio(toBase64(pcm));
      return {ok:true,durationMs};
    },
    async disconnect(){
      if(unlock)window.removeEventListener("pointerdown",unlock);unlock=null;
      try{if(live)await live.stop()}catch{}finally{live=null;connected=false;if(video){video.srcObject=null}}
    }
  };
};
})();
