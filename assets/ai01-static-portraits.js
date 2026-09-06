(() => {
  'use strict';
  const root=document.querySelector('[data-ai-detective]');
  const stage=root?.querySelector('[data-avatar-stage]');
  const video=stage?.querySelector('[data-avatar-video]');
  if(!stage)return;

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

  fetch('../assets/ai01-suspects-strip.b64.txt',{cache:'force-cache',credentials:'same-origin'})
    .then(response=>{
      if(!response.ok)throw new Error('portrait_sprite_unavailable');
      return response.text();
    })
    .then(value=>{
      const encoded=String(value||'').trim();
      if(!encoded||!/^[A-Za-z0-9+/=]+$/.test(encoded))throw new Error('portrait_sprite_invalid');
      stage.style.setProperty('--ai01-portrait-sprite',`url("data:image/jpeg;base64,${encoded}")`);
      stage.classList.add('ai01-static-portrait-ready');
      setVisible();
      syncVideo();
    })
    .catch(()=>{
      setVisible();
      stage.classList.remove('ai01-static-portrait-ready');
    });

  if(video){
    for(const eventName of ['playing','loadedmetadata','pause','emptied','abort'])video.addEventListener(eventName,syncVideo,{passive:true});
  }
  new MutationObserver(()=>{if(!stage.classList.contains('has-live-video'))setVisible();syncVideo()})
    .observe(stage,{attributes:true,attributeFilter:['data-suspect','hidden']});
})();