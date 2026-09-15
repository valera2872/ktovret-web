#!/usr/bin/env node
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../supabase/functions/ai-moreno-investigator-v9/index.ts',import.meta.url),'utf8');
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
for(const token of required)if(!src.includes(token))throw new Error(`missing v0.24 contract token: ${token}`);
for(const guard of ['кто врёт','кто виноват','найдите противоречия'])if(!src.includes(guard))throw new Error(`missing player-led guard: ${guard}`);
console.log('Moreno v0.24 semantic action source contract passed');
