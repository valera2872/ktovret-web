#!/usr/bin/env node
import {logicExpertPuzzles as puzzles,logicExpertSeo as seo} from './import-mobile/logic-expert-release-data.mjs';

const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
assert(puzzles.length===20,`expected 20 puzzles, got ${puzzles.length}`);
assert(new Set(puzzles.map(p=>p.n)).size===20,'duplicate puzzle numbers');
assert(new Set(puzzles.map(p=>p.slug)).size===20,'duplicate puzzle slugs');
assert(new Set(puzzles.map(p=>p.title)).size===20,'duplicate puzzle titles');
assert(puzzles.every(p=>/^\d{3}$/.test(p.n)),'invalid puzzle number');
assert(puzzles.every(p=>/^[a-z0-9-]+$/.test(p.slug)),'non-SEO-safe slug');
assert(puzzles.every(p=>['input','reveal'].includes(p.mode)),'invalid answer mode');
assert(puzzles.filter(p=>p.mode==='input').every(p=>p.answer),'input puzzle without answer');
assert(puzzles.every(p=>p.summary.length>=80&&p.summary.length<=220),'summary length out of bounds');

// Hard separation from «Кто врёт?»: no suspects, testimony, guilt, lies, alibis or interrogation mechanics.
const forbidden=/подозреваем|показани|винов|алиби|допрос|кто\s+вр[её]т|ложн(?:ое|ая|ый|ые)\s+показан/iu;
for(const p of puzzles){
  const corpus=`${p.title} ${p.category} ${p.summary} ${p.body} ${p.hint}`;
  assert(!forbidden.test(corpus),`detective crossover leaked into Logic ${p.n}: ${p.title}`);
}

const hubs=[seo.mainHub,seo.adultHub,seo.expertHub];
assert(new Set(hubs.map(h=>h.slug)).size===3,'duplicate hub slugs');
for(const h of hubs){
  assert(h.title.length>=35&&h.title.length<=85,`hub title length ${h.slug}: ${h.title.length}`);
  assert(h.description.length>=100&&h.description.length<=210,`hub description length ${h.slug}: ${h.description.length}`);
  assert(/^[a-z0-9-]+$/.test(h.slug),`invalid hub slug ${h.slug}`);
}
assert(seo.mainHub.slug==='golovolomki-onlayn','Wordstat primary hub must be /golovolomki-onlayn/');
assert(seo.adultHub.slug==='zagadki-na-logiku-dlya-vzroslyh','adult Wordstat hub mismatch');
assert(seo.expertHub.slug==='logicheskie-zadachi','Expert catalog route mismatch');

console.log(JSON.stringify({ok:true,puzzles:puzzles.length,hubs:hubs.map(h=>h.slug),categories:new Set(puzzles.map(p=>p.category)).size},null,2));
