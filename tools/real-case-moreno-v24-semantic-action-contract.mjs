#!/usr/bin/env node
import fs from 'node:fs';
const semantic=fs.readFileSync(new URL('../supabase/functions/ai-moreno-investigator-v9/index.ts',import.meta.url),'utf8');
const front=fs.readFileSync(new URL('../supabase/functions/ai-moreno-investigator-v10/index.ts',import.meta.url),'utf8');
const required=[
  'semantic_action_parser:true',
  'bounded_operation_registry:true',
  'automatic_evidence_ranking:false',
  'mode:"semantic_action_routing"',
  'compare_description',
  'unsupported_forensic',
  'forensic_trajectory',
  'check_relationships',
  'check_alibi',
  'check_weapon'
];
for(const token of required)if(!semantic.includes(token))throw new Error(`missing v0.24 contract token: ${token}`);
for(const guard of ['кто врёт','кто виноват','найдите противоречия'])if(!semantic.includes(guard))throw new Error(`missing player-led guard: ${guard}`);
for(const token of ['identity_inference_guardrail','automatic_identity_inference:false','Описание из материалов дела само по себе не устанавливает личность'])if(!front.includes(token))throw new Error(`missing identity guardrail token: ${token}`);
console.log('Moreno v0.24 semantic action + identity guard source contract passed');
