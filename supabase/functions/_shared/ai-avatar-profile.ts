import { createClient } from "npm:@supabase/supabase-js@2";

export type AiAvatarProfile={
  caseId:string;
  suspectId:string;
  provider:"liveavatar";
  avatarId:string;
  ttsVoice:string;
  ttsInstructions:string;
  source:"database"|"legacy_ai01";
};

const LEGACY_CASE_ID="AI-01";
const LEGACY:Record<string,{avatarId:string;ttsVoice:string;ttsInstructions:string}>={
  marina:{
    avatarId:Deno.env.get("AI_AVATAR_MARINA_ID")||"",
    ttsVoice:Deno.env.get("AI_AVATAR_MARINA_VOICE")||"marin",
    ttsInstructions:"Женский русский голос, естественный и сдержанный. Говори как человек на серьёзном допросе, без дикторской интонации."
  },
  anton:{
    avatarId:Deno.env.get("AI_AVATAR_ANTON_ID")||"",
    ttsVoice:Deno.env.get("AI_AVATAR_ANTON_VOICE")||"onyx",
    ttsInstructions:"Мужской русский голос технического специалиста. Спокойно, конкретно, без театральности."
  },
  lev:{
    avatarId:Deno.env.get("AI_AVATAR_LEV_ID")||"",
    ttsVoice:Deno.env.get("AI_AVATAR_LEV_VOICE")||"echo",
    ttsInstructions:"Мужской русский голос образованного исследователя. Сдержанно, немного колко, без переигрывания."
  }
};

function clean(value:unknown,max=1600){return typeof value==="string"?value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max):""}

export async function loadAiAvatarProfile(input:{supabaseUrl:string;serviceRole:string;caseId:string;suspectId:string}):Promise<AiAvatarProfile|null>{
  const caseId=clean(input.caseId,160);
  const suspectId=clean(input.suspectId,80).toLowerCase();
  if(!caseId||!suspectId)return null;

  if(input.supabaseUrl&&input.serviceRole){
    const admin=createClient(input.supabaseUrl,input.serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await admin.from("ai_case_avatar_profiles")
      .select("case_id,suspect_id,status,provider,avatar_id,tts_voice,tts_instructions")
      .eq("case_id",caseId)
      .eq("suspect_id",suspectId)
      .eq("status","published")
      .maybeSingle();
    if(error){
      console.error("ai_avatar_profile_lookup_failed",error.message);
      if(caseId!==LEGACY_CASE_ID)throw new Error("avatar_profile_store_unavailable");
    }else if(data){
      const provider=clean(data.provider,32);
      const avatarId=clean(data.avatar_id,256);
      const ttsVoice=clean(data.tts_voice,80);
      const ttsInstructions=clean(data.tts_instructions,1600);
      if(provider!=="liveavatar"||!avatarId||!ttsVoice)throw new Error("avatar_profile_invalid");
      return {caseId,suspectId,provider:"liveavatar",avatarId,ttsVoice,ttsInstructions,source:"database"};
    }
  }

  if(caseId!==LEGACY_CASE_ID)return null;
  const legacy=LEGACY[suspectId];
  if(!legacy)return null;
  return {caseId,suspectId,provider:"liveavatar",avatarId:legacy.avatarId,ttsVoice:legacy.ttsVoice,ttsInstructions:legacy.ttsInstructions,source:"legacy_ai01"};
}
