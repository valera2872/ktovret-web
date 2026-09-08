const PREVIEW_AUTH_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/solo-preview-auth';
const LEGACY_OWNER_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial';
const OWNER_KEY='mysterylogic:review-admin-token:v1';

const nativeFetch=window.fetch.bind(window);
let previewToken='';
let previewCaseId='';
let autoStarted=false;
let fragmentCredential=false;

function tokenFromFragment(){
  const raw=decodeURIComponent(String(location.hash||'').replace(/^#/,''));
  return raw.startsWith('MLPREVIEW-')?raw:'';
}

try{
  const fromFragment=tokenFromFragment();
  if(fromFragment){
    previewToken=fromFragment;
    fragmentCredential=true;
  }else{
    const saved=sessionStorage.getItem(OWNER_KEY)||'';
    if(saved.startsWith('MLPREVIEW-'))previewToken=saved;
    else if(saved)sessionStorage.removeItem(OWNER_KEY);
  }
}catch{}

function fillPreviewCredentials(){
  const owner=document.querySelector('[data-owner-token]');
  const access=document.querySelector('[data-access-token]');
  const caseInput=document.querySelector('[data-case-id]');
  if(owner && previewToken)owner.value=previewToken;
  if(access && previewToken)access.value=previewToken;
  if(caseInput && previewCaseId)caseInput.value=previewCaseId;
}

function clearFragmentAfterSuccessfulAuth(){
  if(!fragmentCredential)return;
  try{history.replaceState(null,'',`${location.pathname}${location.search}`)}catch{}
  fragmentCredential=false;
}

function autoStartCase(){
  if(autoStarted||!previewToken||!previewCaseId)return;
  autoStarted=true;
  setTimeout(()=>{
    fillPreviewCredentials();
    const start=document.querySelector('[data-start]');
    if(start && !start.disabled)start.click();
  },0);
}

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
        fillPreviewCredentials();
        clearFragmentAfterSuccessfulAuth();
        autoStartCase();
      }catch{}
    }
    return response;
  }
  return nativeFetch(input,init);
};

const app=document.querySelector('[data-solo-app]');
if(app){
  new MutationObserver(()=>{if(!app.hidden){fillPreviewCredentials();autoStartCase()}}).observe(app,{attributes:true,attributeFilter:['hidden']});
}

window.addEventListener('load',()=>{
  fillPreviewCredentials();
  const form=document.querySelector('[data-owner-form]');
  const error=document.querySelector('[data-owner-error]');
  if(previewToken){
    if(error)error.textContent='Подключение…';
    form?.requestSubmit();
  }else if(error){
    error.textContent='Откройте стенд по персональной ссылке из чата.';
  }
},{once:true});
