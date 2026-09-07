const PREVIEW_AUTH_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/solo-preview-auth';
const LEGACY_OWNER_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial';
const OWNER_KEY='mysterylogic:review-admin-token:v1';

const nativeFetch=window.fetch.bind(window);
let previewToken='';
let previewCaseId='';

try{
  const saved=sessionStorage.getItem(OWNER_KEY)||'';
  if(saved && !saved.startsWith('MLPREVIEW-')) sessionStorage.removeItem(OWNER_KEY);
}catch{}

function fillPreviewCredentials(){
  const access=document.querySelector('[data-access-token]');
  const caseInput=document.querySelector('[data-case-id]');
  if(access && previewToken) access.value=previewToken;
  if(caseInput && previewCaseId) caseInput.value=previewCaseId;
}

function captureOwnerToken(){
  previewToken=String(document.querySelector('[data-owner-token]')?.value||'').trim();
  queueMicrotask(fillPreviewCredentials);
}

document.querySelector('[data-owner-form]')?.addEventListener('submit',captureOwnerToken,true);

window.fetch=async(input,init={})=>{
  const url=typeof input==='string'?input:String(input?.url||'');
  if(url.startsWith(LEGACY_OWNER_ENDPOINT)){
    const response=await nativeFetch(PREVIEW_AUTH_ENDPOINT,{...init,method:'GET',body:undefined});
    if(response.ok){
      try{
        const data=await response.clone().json();
        previewCaseId=String(data?.caseId||'').trim();
        const auth=String(init?.headers?.authorization||init?.headers?.Authorization||'');
        const bearer=auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()||'';
        if(bearer)previewToken=bearer;
        queueMicrotask(fillPreviewCredentials);
      }catch{}
    }
    return response;
  }
  return nativeFetch(input,init);
};

const app=document.querySelector('[data-solo-app]');
if(app){
  new MutationObserver(()=>{if(!app.hidden)fillPreviewCredentials()}).observe(app,{attributes:true,attributeFilter:['hidden']});
}
