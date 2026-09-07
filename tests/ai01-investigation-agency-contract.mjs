import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const client=fs.readFileSync('assets/ai-detective-vslice.js','utf8');
const feedback=fs.readFileSync('assets/ai01-feedback.js','utf8');

assert.ok(html.includes('Следственный протокол'),'right rail must be framed as a neutral protocol');
assert.ok(html.includes('Здесь сохраняются полученные на допросах сведения без готовых выводов'),'protocol copy must preserve player interpretation');
assert.ok(html.includes('<span data-turn-counter hidden>0 / 30 вопросов</span>'),'turn counter must start hidden while preserving the hard cap contract');
assert.ok(client.includes('const TURN_WARNING_AT=25'),'turn warning threshold must be explicit');
assert.ok(client.includes("el.hidden=state.turns<TURN_WARNING_AT&&!exhausted"),'turn counter must stay hidden until the warning threshold');
assert.ok(client.includes("source:'Протокол'"),'system discoveries must use neutral protocol language');
assert.ok(client.includes("composer.classList.remove('is-closed')"),'confession must not close the interrogation composer');
assert.ok(client.includes("theoryBtn.textContent=confessed?'Собрать финальную версию':'Собрать версию'"),'confession must lead to the player theory rather than bypass it');
assert.ok(client.includes("root.querySelectorAll('[data-action=\"theory\"]').forEach(btn=>btn.addEventListener('click',openTheory))"),'all theory actions must open the player reconstruction');
assert.ok(!client.includes("hasConfession()?openBonus():openTheory()"),'confession must never bypass the theory step');
assert.ok(client.includes("if(!state.verdict?.correct){openTheory();return}"),'reward must stay locked until the theory is confirmed');
assert.ok(html.includes('Что вам понравилось?'),'post-case feedback poll missing');
assert.ok(html.includes('Что стоит улучшить?'),'post-case improvement question missing');
assert.ok(html.includes('Хотите ещё такие AI-расследования?'),'future-demand question missing');
for(const eventName of ['ai01_feedback_submitted','ai01_feedback_like','ai01_feedback_improve','ai01_feedback_more']) {
  assert.ok(feedback.includes(eventName),`feedback analytics event missing: ${eventName}`);
}

console.log('AI-01 investigation agency contract OK');
