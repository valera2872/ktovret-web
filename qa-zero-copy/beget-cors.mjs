const origins=['https://tftanyaf.beget.tech','http://tftanyaf.beget.tech'];
const base='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/';
const eps=['zero-copy-room-v1','zero-copy-session-v1','zero-copy-interrogate-v1','zero-copy-final-v1'];
for(const origin of origins){
  for(const ep of eps){
    const r=await fetch(base+ep,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
    const allow=r.headers.get('access-control-allow-origin');
    const methods=r.headers.get('access-control-allow-methods')||'';
    if(r.status!==204||allow!==origin||!methods.includes('POST')) throw new Error(ep+' '+origin+' preflight failed status='+r.status+' allow='+allow+' methods='+methods);
    console.log(JSON.stringify({ok:true,origin,endpoint:ep,status:r.status,allow,methods}));
  }
}