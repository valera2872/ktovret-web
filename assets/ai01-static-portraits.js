(() => {
  'use strict';
  const root=document.querySelector('[data-ai-detective]');
  const stage=root?.querySelector('[data-avatar-stage]');
  const video=stage?.querySelector('[data-avatar-video]');
  if(!stage)return;

  const SPRITE_URL='../assets/ai01-suspects-strip.jpg?v=0.1.0';
  const setVisible=()=>{
    stage.hidden=false;
    stage.setAttribute('aria-hidden','false');
  };
  const syncVideo=()=>{
    const stream=video?.srcObject;
    const tracks=stream&&typeof stream.getVideoTracks==='function'?stream.getVideoTracks():[];
    const live=Boolean(tracks.length&&tracks.some(track=>track.readyState==='live')&&!video.paused);
    stage.classList.toggle('has-live-video',live);
    if(!live)setVisible();
  };
  const markPortraitReady=()=>{
    stage.style.setProperty('--ai01-portrait-sprite',`url("${SPRITE_URL}")`);
    stage.classList.add('ai01-static-portrait-ready');
    setVisible();
    syncVideo();
  };

  const sprite=new Image();
  sprite.decoding='async';
  sprite.onload=markPortraitReady;
  sprite.onerror=()=>{
    setVisible();
    stage.classList.remove('ai01-static-portrait-ready');
  };
  sprite.src=SPRITE_URL;
  if(sprite.complete&&sprite.naturalWidth>0)markPortraitReady();

  if(video){
    for(const eventName of ['playing','loadedmetadata','pause','emptied','abort'])video.addEventListener(eventName,syncVideo,{passive:true});
  }
  new MutationObserver(()=>{if(!stage.classList.contains('has-live-video'))setVisible();syncVideo()})
    .observe(stage,{attributes:true,attributeFilter:['data-suspect','hidden']});
})();