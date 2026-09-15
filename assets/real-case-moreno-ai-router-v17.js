(()=>{
'use strict';
const FROM='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v2';
const TO='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v3';
const original=window.fetch.bind(window);
window.fetch=(input,init)=>{
  if(typeof input==='string'&&input===FROM)return original(TO,init);
  if(input instanceof Request&&input.url===FROM)return original(new Request(TO,input),init);
  return original(input,init);
};
window.MLMorenoAIRouterV17={version:'1.7.0',from:FROM,to:TO};
})();
