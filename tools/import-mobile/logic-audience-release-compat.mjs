import fs from 'node:fs';
import path from 'node:path';

export function preserveLogicAudienceLaunchMarker(siteRoot){
  const file=path.join(path.resolve(siteRoot),'index.html');
  if(!fs.existsSync(file)) return false;
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('data-logic-family-home')||html.includes('data-logic-home-launch')) return false;
  html=html.replace('data-logic-family-home','data-logic-family-home data-logic-home-launch');
  fs.writeFileSync(file,html);
  return true;
}
