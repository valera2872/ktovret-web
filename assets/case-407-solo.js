(() => {
  const data = window.MLCase407;
  const root = document.querySelector('[data-solo407-app]');
  if (!data || !root) return;

  const STORAGE_KEY = 'ml:solo:407:v1';
  const ordered = [];
  data.stages.forEach((stage) => {
    (stage.investigator || []).forEach((item, index) => ordered.push({ ...item, id: `s${stage.id}-i${index}`, stage: stage.id }));
    (stage.analyst || []).forEach((item, index) => ordered.push({ ...item, id: `s${stage.id}-a${index}`, stage: stage.id }));
  });
  const byId = Object.fromEntries(ordered.map((item) => [item.id, item]));

  const plans = {
    1: { initial: ['s1-i0','s1-i1','s1-a0'], requests: ['s1-a1','s1-i2','s1-a2'] },
    2: { initial: ['s2-i0','s2-a0'], requests: ['s2-i1','s2-a1','s2-i2','s2-a2'] },
    3: { initial: ['s3-a0','s3-i0'], requests: ['s3-a1','s3-i1','s3-a2','s3-i2'] },
  };
  const checkpoints = {
    1: {
      question: 'Какой вывод уже можно считать доказанным?',
      options: [
        ['camera','Камера C4 дала сбой и пропустила выход Марты.'],
        ['ids','Надпись на двери и физический контроллер нельзя считать одним идентификатором без сверки.'],
        ['service','Марта уже доказанно покинула этаж через служебную зону.'],
        ['denis','Денис Левин переставил номерные таблички.'],
      ], answer: 'ids'
    },
    2: {
      question: 'Что независимо подтверждают материалы второго этапа?',
      options: [
        ['forced','Марту заставили оставить телефон и вызвать тревогу.'],
        ['same','Телефон и часы Марты всё время двигались вместе.'],
        ['zones','После тревоги часы уходят в закрытые служебные зоны, пока телефон остаётся наверху; у физического 407 есть служебный выход.'],
        ['token','Елена лично несла HK-44 по всему маршруту.'],
      ], answer: 'zones'
    },
    3: {
      question: 'Какой вывод нельзя строить только на журнале HK-44?',
      options: [
        ['route','Что был использован маршрут SVC-407 → служебный лифт → LOADING-B1.'],
        ['owner','Что именно Елена держала токен в руке на каждом событии доступа.'],
        ['time','Что события доступа пришлись на окно 01:14–01:19.'],
        ['b1','Что маршрут заканчивается в зоне B1.'],
      ], answer: 'owner'
    }
  };
  const hints = {
    1: [
      'Разведите четыре идентификатора: надпись на двери, H-код таблички, L-код контроллера и номер сейфа.',
      'Сравните, что фиксирует камера, а что — электронный журнал. Они могут описывать разные признаки одной физической двери.'
    ],
    2: [
      'Отделите маршрут устройства от маршрута человека: телефон и часы дают разные сигналы.',
      'Сначала установите направление движения. Точный журнал дверей появится позже.'
    ],
    3: [
      'Принадлежность пропуска не равна доказанному действию владельца. Ищите независимое цифровое действие.',
      'Ложь подозреваемого сама по себе не доказывает причастность к критическому окну.'
    ]
  };

  const cleanState = () => ({ started:false, stage:1, unlocked:[], opened:[], pinned:[], checkpoints:{}, hintsUsed:0, currentHint:'', finalAnswers:{}, solved:false });
  const load = () => { try { return { ...cleanState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return cleanState(); } };
  let state = load();
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const esc = (value='') => String(value).replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const emit = (name, detail={}) => { try { window.dispatchEvent(new CustomEvent(`ml:${name}`, { detail:{ caseId:'solo:407', ...detail } })); } catch {} };

  function ensureStage(stage) {
    for (const id of plans[stage].initial) if (!state.unlocked.includes(id)) state.unlocked.push(id);
  }
  if (state.started) ensureStage(state.stage);

  const openedCountFor = (stage) => plans[stage].initial.concat(plans[stage].requests).filter((id) => state.opened.includes(id)).length;
  const stageTotal = (stage) => plans[stage].initial.length + plans[stage].requests.length;
  const stageComplete = (stage) => state.checkpoints[String(stage)] === true;
  const allStagesComplete = () => [1,2,3].every(stageComplete);

  function renderMaterial(item) {
    const opened = state.opened.includes(item.id);
    const pinned = state.pinned.includes(item.id);
    const paragraphs = (item.body || []).map((p) => `<p>${esc(p)}</p>`).join('');
    const messages = (item.messages || []).map(([who,text]) => `<div class="solo407-message"><strong>${esc(who)}</strong><span>${esc(text)}</span></div>`).join('');
    return `<article class="solo407-evidence ${opened ? 'is-open' : ''}" data-evidence="${item.id}">
      <button class="solo407-evidence-head" type="button" data-open="${item.id}" aria-expanded="${opened}">
        <span><small>${esc(item.tag || 'Материал дела')}</small><strong>${esc(item.title)}</strong></span><i>${opened ? '−' : '+'}</i>
      </button>
      ${opened ? `<div class="solo407-evidence-body">${item.image ? `<img src="${esc(item.image)}" alt="${esc(item.alt || '')}">` : ''}${paragraphs}${messages}${item.stamp ? `<b class="solo407-stamp">${esc(item.stamp)}</b>` : ''}
      <div class="solo407-evidence-actions"><button type="button" class="solo407-pin ${pinned ? 'is-pinned' : ''}" data-pin="${item.id}">${pinned ? 'Убрать с доски' : 'На доску доказательств'}</button></div></div>` : ''}
    </article>`;
  }

  function requestLabel(id) {
    const item = byId[id];
    const map = { camera:'Запросить запись камеры', registry:'Сверить цифровой реестр', statement:'Повторно опросить персонал', forensic:'Назначить лабораторную проверку', log:'Запросить электронный журнал', network:'Получить карту служебной сети', audit:'Поднять внутреннюю проверку', alibi:'Проверить алиби', route:'Запросить телематику', message:'Восстановить удалённый черновик' };
    return map[item?.type] || `Получить: ${item?.title || 'материал'}`;
  }

  function renderCheckpoint(stage) {
    if (openedCountFor(stage) < stageTotal(stage)) return '';
    const cp = checkpoints[stage];
    const passed = stageComplete(stage);
    return `<section class="solo407-checkpoint ${passed ? 'is-passed' : ''}">
      <p class="solo407-kicker">Контрольная точка</p><h3>${esc(cp.question)}</h3>
      ${passed ? `<p class="solo407-pass">Вывод выдерживает проверку. Следующая часть дела открыта.</p>` : `<form data-checkpoint="${stage}">${cp.options.map(([v,t]) => `<label><input type="radio" name="answer" value="${v}" required><span>${esc(t)}</span></label>`).join('')}<button class="solo407-primary" type="submit">Зафиксировать вывод</button></form><p class="solo407-checkpoint-error" hidden>Вывод пока не выдерживает все материалы. Перепроверьте формулировку.</p>`}
    </section>`;
  }

  function renderStage(stage) {
    const plan = plans[stage];
    const ids = plan.initial.concat(plan.requests.filter((id) => state.unlocked.includes(id)));
    const available = plan.requests.filter((id) => !state.unlocked.includes(id));
    const stageData = data.stages.find((s) => s.id === stage);
    return `<section class="solo407-stage-card">
      <div class="solo407-stage-heading"><div><p class="solo407-kicker">Этап ${stage} из 3</p><h2>${esc(stageData.title)}</h2><p>${esc(stageData.objective)}</p></div><div class="solo407-stage-count">${openedCountFor(stage)} / ${stageTotal(stage)}</div></div>
      <div class="solo407-evidence-list">${ids.map((id) => renderMaterial(byId[id])).join('')}</div>
      ${available.length ? `<section class="solo407-requests"><p class="solo407-kicker">Следственные действия</p><h3>Что запросить дальше?</h3><div class="solo407-request-grid">${available.map((id) => `<button type="button" data-request="${id}">${esc(requestLabel(id))}<small>${esc(byId[id].title)}</small></button>`).join('')}</div></section>` : ''}
      ${renderCheckpoint(stage)}
    </section>`;
  }

  function renderFinal() {
    if (!allStagesComplete()) return '';
    if (state.solved) return `<section class="solo407-reveal"><p class="solo407-kicker">Дело закрыто</p><h2>${esc(data.reveal.title)}</h2>${data.reveal.body.map((p) => `<p>${esc(p)}</p>`).join('')}<p class="solo407-closing">${esc(data.reveal.closing)}</p><a class="solo407-primary" href="../">Другие расследования для одного</a></section>`;
    return `<section class="solo407-final"><p class="solo407-kicker">Финальное заключение</p><h2>Соберите версию, которая объясняет всю цепочку</h2><p>${esc(data.final.intro)}</p><div class="solo407-proof-meter"><strong>${state.pinned.length}</strong><span>материалов на вашей доске доказательств</span><small>Рекомендуем оставить 5–7 самых сильных. Это не подсказка к ответу.</small></div>
      <form data-final>${data.final.questions.map((q,qi) => `<fieldset><legend>${qi+1}. ${esc(q.title)}</legend>${q.options.map(([v,t]) => `<label><input type="radio" name="${esc(q.id)}" value="${esc(v)}" required><span>${esc(t)}</span></label>`).join('')}</fieldset>`).join('')}<button class="solo407-primary" type="submit">Передать заключение</button></form><div class="solo407-final-feedback" hidden></div></section>`;
  }

  function renderDesk() {
    ensureStage(state.stage); save();
    const progress = Math.round((state.opened.length / ordered.length) * 100);
    root.innerHTML = `<div class="solo407-desk">
      <aside class="solo407-rail"><p class="solo407-kicker">Дело ML-0407 · solo</p><h1>Номер 407</h1><p>Вы — единственный следователь. Материалы приходят по мере ваших запросов.</p><div class="solo407-progress"><i style="width:${progress}%"></i></div><small>${state.opened.length} из ${ordered.length} материалов изучено</small>
      <nav>${[1,2,3].map((n) => `<button type="button" data-stage-nav="${n}" ${n > state.stage ? 'disabled' : ''} class="${n === state.stage ? 'is-active' : ''}"><span>0${n}</span><b>${esc(data.stages[n-1].title)}</b>${stageComplete(n) ? '<em>✓</em>' : ''}</button>`).join('')}</nav>
      <button type="button" class="solo407-hint-button" data-hint>Нужен ориентир</button>${state.currentHint ? `<div class="solo407-hint-panel"><small>Ориентир · без раскрытия ответа</small><p>${esc(state.currentHint)}</p><button type="button" data-hint-close>Закрыть</button></div>` : ''}<button type="button" class="solo407-reset" data-reset>Начать дело заново</button></aside>
      <div class="solo407-work"><section class="solo407-brief"><p class="solo407-kicker">${esc(data.brief.kicker)}</p><h2>Что произошло</h2><p>${esc(data.brief.lead)}</p><div><strong>Задача</strong><span>Восстановите непротиворечивую цепочку событий и отделите доказанное от предположений.</span></div></section>${renderStage(state.stage)}${renderFinal()}</div>
      <aside class="solo407-board"><p class="solo407-kicker">Доска доказательств</p><h3>Ваши опорные материалы</h3>${state.pinned.length ? state.pinned.map((id) => `<button type="button" data-open="${id}"><span>${esc(byId[id]?.tag || '')}</span><strong>${esc(byId[id]?.title || '')}</strong></button>`).join('') : '<p>Пока пусто. Открывайте материалы и отмечайте те, на которых строите версию.</p>'}</aside>
    </div>`;
  }

  function renderBoot() {
    root.innerHTML = `<section class="solo407-entry"><div class="solo407-entry-visual"><span>CASE FILE · ML-0407</span><b>407</b><small>SILENT ALARM · 01:12</small></div><div class="solo407-entry-copy"><p class="solo407-kicker">Большое расследование · 1 игрок · бесплатно</p><h1>Номер <em>407</em></h1><p class="solo407-entry-lead">В 01:12 сейф подаёт тихую тревогу. Через четыре минуты охрана открывает запертую комнату — она пуста. Хранительница сапфира исчезла, камера не видела выхода.</p><div class="solo407-solo-promise"><strong>Вы расследуете дело один.</strong><span>Никаких комнат, кодов и приглашений. Вы сами решаете, какие материалы запросить и когда зафиксировать вывод.</span></div><div class="solo407-entry-facts"><span>50–70 минут</span><span>18 материалов</span><span>без регистрации</span><span>прогресс сохраняется</span></div><button class="solo407-primary" type="button" data-start>Начать расследование</button><a href="../../detektivnye-igry-dlya-dvoih/407/">Хотите пройти это дело вдвоём? Открыть версию для двух игроков</a></div></section>`;
  }

  function render() { state.started ? renderDesk() : renderBoot(); }

  root.addEventListener('click', (event) => {
    const start = event.target.closest('[data-start]');
    if (start) { state.started = true; ensureStage(1); save(); emit('solo_start'); render(); return; }
    const open = event.target.closest('[data-open]');
    if (open) { const id = open.dataset.open; if (!state.opened.includes(id)) state.opened.push(id); save(); emit('solo_evidence_open', { evidenceId:id }); render(); return; }
    const request = event.target.closest('[data-request]');
    if (request) { const id = request.dataset.request; if (!state.unlocked.includes(id)) state.unlocked.push(id); if (!state.opened.includes(id)) state.opened.push(id); save(); emit('solo_request', { evidenceId:id }); render(); return; }
    const pin = event.target.closest('[data-pin]');
    if (pin) { const id = pin.dataset.pin; state.pinned = state.pinned.includes(id) ? state.pinned.filter((x) => x !== id) : [...state.pinned, id]; save(); render(); return; }
    const nav = event.target.closest('[data-stage-nav]');
    if (nav && !nav.disabled) { state.stage = Number(nav.dataset.stageNav); state.currentHint = ''; save(); render(); return; }
    const hint = event.target.closest('[data-hint]');
    if (hint) { const list = hints[state.stage] || []; state.currentHint = list[Math.min(state.hintsUsed, list.length - 1)] || 'Перепроверьте, что именно доказывает каждый источник, а чего он не доказывает.'; state.hintsUsed += 1; save(); emit('solo_hint', { stage:state.stage, hintsUsed:state.hintsUsed }); render(); return; }
    const hintClose = event.target.closest('[data-hint-close]');
    if (hintClose) { state.currentHint = ''; save(); render(); return; }
    const reset = event.target.closest('[data-reset]');
    if (reset && confirm('Стереть прогресс этого расследования и начать заново?')) { state = cleanState(); save(); render(); }
  });

  root.addEventListener('submit', (event) => {
    const cp = event.target.closest('[data-checkpoint]');
    if (cp) {
      event.preventDefault(); const stage = Number(cp.dataset.checkpoint); const answer = new FormData(cp).get('answer');
      if (answer === checkpoints[stage].answer) { state.checkpoints[String(stage)] = true; state.currentHint = ''; if (stage < 3) { state.stage = stage + 1; ensureStage(state.stage); } save(); emit('solo_checkpoint', { stage, passed:true }); render(); }
      else { const error = cp.parentElement.querySelector('.solo407-checkpoint-error'); if (error) error.hidden = false; emit('solo_checkpoint', { stage, passed:false }); }
      return;
    }
    const final = event.target.closest('[data-final]');
    if (final) {
      event.preventDefault(); const fd = new FormData(final); let score = 0; data.final.questions.forEach((q) => { if (fd.get(q.id) === q.answer) score += 1; });
      const feedback = final.parentElement.querySelector('.solo407-final-feedback');
      if (score === data.final.questions.length) { state.solved = true; save(); emit('solo_complete', { score, hintsUsed:state.hintsUsed }); render(); }
      else if (feedback) { feedback.hidden = false; feedback.innerHTML = `<strong>${score} из ${data.final.questions.length} звеньев выдерживают проверку.</strong><span>Я не покажу, какое именно слабое: иначе это станет подсказкой. Вернитесь к доске доказательств и проверьте всю цепочку.</span>`; emit('solo_final_attempt', { score }); }
    }
  });

  render();
})();