(()=>{
  'use strict';
  if(window.__ML_AI_AVATAR_SESSION_TRANSPORT_PATCHED)return;
  const params=new URL(location.href).searchParams;
  const isOwnerPreview=/\/detektivnaya-igra-s-ii\/?$/.test(location.pathname)
    &&params.get('live')==='1'
    &&params.get('admin_preview')==='1';
  if(!isOwnerPreview)return;

  const SESSION_PATH='/functions/v1/ai-avatar-session';
  const nativeFetch=window.fetch.bind(window);
  window.__ML_AI_AVATAR_SESSION_TRANSPORT_PATCHED=true;
  window.fetch=(input,init)=>{
    try{
      const url=typeof input==='string'?input:(input instanceof URL?input.href:String(input?.url||''));
      const method=String(init?.method||'GET').toUpperCase();
      if(method==='POST'&&url.includes(SESSION_PATH)&&typeof init?.body==='string'){
        // ai-avatar-session has verify_jwt=false and authenticates access_token + origin itself.
        // Send a CORS-safelisted request so Chromium/Yandex does not insert a fragile OPTIONS gate.
        return nativeFetch(input,{
          method:'POST',
          body:init.body,
          cache:'no-store',
          credentials:'omit',
          mode:'cors'
        });
      }
    }catch{}
    return nativeFetch(input,init);
  };
})();
