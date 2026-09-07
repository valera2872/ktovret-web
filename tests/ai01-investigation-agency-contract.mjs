import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const client=fs.readFileSync('assets/ai-detective-vslice.js','utf8');
const feedback=fs.readFileSync('assets/ai01-feedback.js','utf8');
const edge=fs.readFileSync('supabase/functions/ai-interrogation-v1/index.ts','utf8');

assert.ok(html.includes('Следственный протокол'),'right rail must be framed as a neutral protocol');
assert.ok(html.includes('Здесь сохраняются полученные на допросах сведения без готовых выводов'),'protocol copy must preserve player interpretation');
assert.ok(html.includes('<span data-turn-counter hidden>0 / 30 вопросов</span>'),'turn counter must start hidden while preserving the hard cap contract');
assert.ok(client.includes('const TURN_WARNING_AT=25'),'turn warning threshold must be explicit');
assert.ok(client.includes("const hidden=state.turns<TURN_WARNING_AT&&!exhausted;el.hidden=hidden;if(!hidden)el.textContent="),'turn counter must stay hidden and inert until the warning threshold');
assert.ok(client.includes("source:'Протокол'"),'system discoveries must use neutral protocol language');
assert.ok(client.includes("composer.classList.remove('is-closed')"),'confession must not close the interrogation composer');
assert.ok(client.includes("theoryBtn.textContent=confessed?'Собрать финальную версию':'Собрать версию'"),'confession must lead to the player theory rather than bypass it');
assert.ok(client.includes("root.querySelectorAll('[data-action=\"theory\"]').forEach(btn=>btn.addEventListener('click',openTheory))"),'all theory actions must open the player reconstruction');
assert.ok(!client.includes("hasConfession()?openBonus():openTheory()"),'confession must never bypass the theory step');
assert.ok(client.includes("if(!state.verdict?.correct){openTheory();return}"),'reward must stay locked until the theory is confirmed');

assert.ok(html.includes('Похищение ценного документа'),'incident card must describe the crime naturally');
assert.ok(html.includes('СТРАХОВАЯ ОЦЕНКА'),'document value must be visible as an initial fact');
assert.ok(html.includes('26 000 €'),'document value must be concrete enough to support motive reasoning');
assert.ok(html.includes('ПЕРИОД ИСЧЕЗНОВЕНИЯ'),'case timing label must use natural Russian');
assert.ok(!html.includes('ОКНО ПРОПАЖИ'),'awkward Russian label must not return');
assert.ok(!html.includes('нет сигнала 21:27–21:35'),'camera downtime must not be described as a vague signal loss');
assert.ok(feedback.includes("cameraStamp:'Камеры наблюдения были недоступны из-за планового перезапуска · 21:27–21:35'"),'camera stamp must explain what happened in plain Russian');
assert.ok(feedback.includes("evidenceTitle:'Недоступность камер наблюдения'"),'dynamic evidence title must describe the player-facing fact, not the maintenance action');
assert.ok(feedback.includes('камеры наблюдения были недоступны из-за планового перезапуска. Запись в этот период не велась.'),'camera evidence must state unavailability and its cause directly');
assert.ok(feedback.includes("title.textContent='Время перезапуска было известно'"),'final reconstruction must avoid technical-jargon window wording');

assert.ok(edge.includes('function isMotiveReference'),'free interrogation must recognize motive questions');
assert.ok(edge.includes('N-MARINA-MOTIVE'),'motive must be persistent investigation state');
assert.ok(edge.includes('просроченный долг около 9 000 €'),'Marina motive must be concrete rather than generic greed');
assert.ok(edge.includes('На следующий день документ должны были перевести в хранилище с двойным контролем'),'motive must also explain why the crime happened on this shift');
assert.ok(edge.includes('Вы установили кто и как — но пока не зачем'),'final reconstruction must reject a version with no motive');
assert.ok(edge.includes('const motiveMentioned='),'final theory must synthesize motive in the player explanation');
assert.ok(html.includes('Кто похитил письмо — и зачем?'),'theory screen must ask for motive explicitly');
assert.ok(html.includes('<small>МОТИВ</small>'),'final reconstruction must include motive as a first-class line');

assert.ok(html.includes('Что вам понравилось?'),'post-case feedback poll missing');
assert.ok(html.includes('Что стоит улучшить?'),'post-case improvement question missing');
assert.ok(html.includes('Хотите ещё такие AI-расследования?'),'future-demand question missing');
for(const eventName of ['ai01_feedback_submitted','ai01_feedback_like','ai01_feedback_improve','ai01_feedback_more']) {
  assert.ok(feedback.includes(eventName),`feedback analytics event missing: ${eventName}`);
}

console.log('AI-01 investigation agency contract OK');