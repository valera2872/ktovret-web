#!/usr/bin/env node
import fs from 'node:fs';
const ui=fs.readFileSync(new URL('../assets/real-case-moreno-final-v25.js',import.meta.url),'utf8');
const gate=fs.readFileSync(new URL('../supabase/functions/ai-moreno-investigator-v11/index.ts',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../realnye-dela/pozharnaya-lestnica-1991-premium/index.html',import.meta.url),'utf8');
for(const token of ['РАБОЧАЯ ВЕРСИЯ ГОТОВА','Перейти к итоговой версии','ИТОГОВАЯ РЕКОНСТРУКЦИЯ','Кого вы считаете причастным?','Что произошло по вашей версии?','На какие материалы вы опираетесь?','Что остаётся недоказанным или неизвестным?','Передать дело'])if(!ui.includes(token))throw new Error(`missing final UX token: ${token}`);
for(const token of ['player_final_reconstruction','record_hypothesis','submit_case','automatic_solution_inference:false','automatic_evidence_ranking:false'])if(!gate.includes(token))throw new Error(`missing final routing token: ${token}`);
if(!html.includes('real-case-moreno-final-v25.js'))throw new Error('premium route does not load v0.25 final UX');
console.log('Moreno v0.25 final reconstruction contract passed');
