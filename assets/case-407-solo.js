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

  const soloStages = {
    1: {
      title: 'Первые двадцать минут',
      objective: 'Соберите первые противоречия и зафиксируйте рабочую гипотезу. Пока не защищайте её: следующий пакет должен попытаться её разрушить.'
    },
    2: {
      title: 'След после тревоги',
      objective: 'Проверьте рабочую гипотезу первого этапа по новым материалам. Разделяйте маршрут человека, маршрут устройств и свойства физического пространства.'
    },
    3: {
      title: 'Последние подтверждения',
      objective: 'Последний пакет — стресс-тест вашей версии. Ищите не подтверждение, а независимый факт, который способен её опровергнуть.'
    }
  };

  const checkpoints = {
    1: {
      question: 'Какой вывод вы сейчас готовы взять в работу?',
      options: [
        ['camera','Камера C4 исправно фиксировала обе двери, поэтому надписи на них точно соответствуют физическим комнатам.'],
        ['ids','Надпись на двери, H-код таблички и L-код контроллера требуют отдельной сверки перед выводом о физической комнате.'],
        ['service','Материалы уже подтверждают, что Марта покинула этаж через скрытый служебный проход после тревоги.'],
        ['denis','Следы отвёртки и спор с Мартой уже позволяют связать перестановку табличек именно с Денисом Левиным.'],
      ], answer: 'ids'
    },
    2: {
      question: 'Какой вывод вы готовы проверить последним пакетом?',
      options: [
        ['forced','Правильный код тревоги и оставленный телефон доказывают, что Марту принудили участвовать в происходящем.'],
        ['same','Сеансы телефона и часов показывают один и тот же маршрут Марты от номера до закрытой зоны B1.'],
        ['zones','Телефон остаётся наверху, часы уходят в закрытые зоны, а физический 407 имеет отдельный служебный выход.'],
        ['token','Маршрут закрытых зон уже доказывает, что мастер-токен HK-44 всё время находился у Елены Раевой.'],
      ], answer: 'zones'
    },
    3: {
      question: 'Как вы сейчас трактуют журнал HK-44?',
      options: [
        ['route','Журнал HK-44 подтверждает последовательность SVC-407 → служебный лифт → LOADING-B1 в заданном окне.'],
        ['owner','Журнал HK-44 сам по себе не доказывает, что владелец токена физически прошёл за ним весь маршрут.'],
        ['time','Журнал HK-44 подтверждает, что все три события доступа пришлись на окно между 01:14 и 01:19.'],
        ['b1','Журнал HK-44 подтверждает, что цепочка служебного доступа заканчивается открытием зоны LOADING-B1.'],
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

  const soloFinal = {
    intro: 'Соберите причинно-следственную версию. Игра примет любое полное заключение и не будет исправлять вас до раскрытия. После подписи каждое звено будет проверено по материалам дела.',
    questions: [
      {
        id: 'room',
        title: 'Какой физический номер охрана осмотрела в 01:16?',
        options: [
          ['407','Физический 407: табличка, контроллер и номер сейфа указывали на одну комнату.'],
          ['409','Физический 409: на его двери стояла переставленная табличка «407», поэтому охрана открыла другую комнату.'],
          ['405','Физический 405: старый план люкса показывает переход, из-за которого охрана ошиблась дверью.'],
          ['unknown','Физический номер установить нельзя: камера и электронные журналы расходятся без достаточной независимой сверки.']
        ],
        answer: '409'
      },
      {
        id: 'alarm',
        title: 'Что лучше всего объясняет тревогу S-407 в 01:12?',
        options: [
          ['force','Сейф открыли под физическим принуждением: правильный код ввели, чтобы не повредить замок.'],
          ['mistake','Тревогу вызвала ошибка при вводе: дополнительная цифра не была осознанным сигналом.'],
          ['duress','Правильный код ввели намеренно и добавили цифру 9, чтобы запустить тихую тревогу.'],
          ['remote','Тревогу отправили удалённо через служебную систему, а ввод кода лишь совпал по времени.']
        ],
        answer: 'duress'
      },
      {
        id: 'route',
        title: 'Какой маршрут после 01:12 лучше всего подтверждён материалами?',
        options: [
          ['window','Через окно и внешнюю аварийную лестницу, оставаясь вне поля коридорной камеры.'],
          ['service','Через служебную дверь физического 407, внутренний лифт и закрытую зону B1.'],
          ['corridor','Через гостевой коридор в короткий технический интервал, когда запись камеры была недоступна.'],
          ['never_left','Этаж никто не покидал до прихода охраны; сетевые события относятся только к оставленным устройствам.']
        ],
        answer: 'service'
      },
      {
        id: 'sequence',
        title: 'Какая версия лучше всего объясняет подготовку сцены и вывоз футляра?',
        options: [
          ['denis','Денис организовал кражу, а несвязанные нарушения Марты и Елены создали впечатление общего плана.'],
          ['elena_force','Один сотрудник подготовил подмену и заставил Марту действовать, после чего самостоятельно вывез футляр.'],
          ['collusion','Марта и сотрудник заранее согласовали постановку, служебный маршрут и вывоз футляра после тревоги.'],
          ['security','Охрана провела Марту через коридор и скрыла запись, а служебные события относятся к другой операции.']
        ],
        answer: 'collusion'
      }
    ]
  };

  const FINAL_LABELS = {
    room: 'Физическая комната',
    alarm: 'Тихая тревога',
    route: 'Маршрут после 01:12',
    sequence: 'Подготовка и участники'
  };
  const FINAL_PROOF = {
    room: 'H-409 на снятой табличке, архивный реестр L-кодов и камера C4 вместе показывают: охрана открыла физический 409 под табличкой «407».',
    alarm: 'S-407 открылся корректным кодом без повреждений; журнал фиксирует добавленную 9, а Марта знала режим тихой тревоги.',
    route: 'Часы уходят WEST-4 → STAFF-4 → LOADING-B1, а HK-44 подтверждает SVC-407 → служебный лифт → B1.',
    sequence: 'Тележка несла футляр, аудит и билеты связывают Марту с Еленой, а отключение B1 с ER-02 и телематика машины независимо фиксируют действия Елены.'
  };
  const FINAL_BREAKS = {
    room: {
      '407': 'Эта версия ломается на сверке H-409 с архивным реестром и L-кодами: цифра на двери была переставлена и не совпадала с физической комнатой.',
      '405': 'Старый план объясняет служебный выход физического 407, но не переносит сцену в 405. H/L-сверка и камера однозначно ведут к физическому 409, который открыла охрана.',
      unknown: 'Материалов достаточно: H-409, реестр оборудования, L-407/L-409 и камера C4 позволяют независимо установить физическую дверь.'
    },
    alarm: {
      force: 'Сейф не повреждён и открылся верным кодом. Дополнительная 9 — штатная команда тихой тревоги, которую Марта знала по инструктажу.',
      mistake: 'Журнал не фиксирует ошибок ввода: сначала принят верный код, затем отдельно введена 9 — осмысленная команда тревоги.',
      remote: 'Удалённое действие Елены относится к камере B1 позже. Сама тревога возникла в S-407 после правильного кода Марты и добавленной 9.'
    },
    route: {
      window: 'Окно найдено закрытым изнутри, а часы Марты последовательно фиксируются в STAFF-4 и LOADING-B1. Служебный журнал даёт тот же внутренний маршрут.',
      corridor: 'Камера C4 исправна и не имеет пропусков в гостевом коридоре. Независимые Wi-Fi и access-события уводят маршрут в служебную инфраструктуру.',
      never_left: 'Часы Марты появляются в LOADING-B1, затем машина Елены уезжает с занятым пассажирским сиденьем. Физический маршрут после 01:12 подтверждён несколькими источниками.'
    },
    sequence: {
      denis: 'Денис непрерывно подтверждён вне отеля после 00:36. Зато утренний аудит, два билета, черновик и действия ER-02 связывают подготовку Марты и Елены.',
      elena_force: 'Версия принуждения не объясняет заранее купленные два билета, вопрос Марты о служебных дверях и её собственный план времени «01:12 → лифт». Эти материалы показывают предварительное согласование.',
      security: 'C4 не показывает выхода через гостевой коридор, а камера B1 отключена с телефона Елены. Её машина и цифровой ключ продолжают ту же цепочку без участия Зорина.'
    }
  };
  const DIRECT_EVIDENCE = new Set(['s1-i2','s1-a1','s1-a2','s2-i0','s2-a0','s2-a1','s3-i0','s3-i1','s3-a0','s3-a1','s3-a2']);

  const cleanState = () => ({ started:false, stage:1, unlocked:[], opened:[], pinned:[], checkpoints:{}, checkpointAnswers:{}, hintsUsed:0, hintsByStage:{}, currentHint:'', finalAnswers:{}, solved:false });
  const load = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
      return {
        ...cleanState(),
        ...stored,
        checkpoints: { ...(stored.checkpoints || {}) },
        checkpointAnswers: { ...(stored.checkpointAnswers || {}) },
        hintsByStage: { ...(stored.hintsByStage || {}) },
        finalAnswers: { ...(stored.finalAnswers || {}) },
      };
    } catch { return cleanState(); }
  };
  let state = load();
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const esc = (value='') => String(value).replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const emit = (name, detail={}) => { try { window.dispatchEvent(new CustomEvent(`ml:${name}`, { detail:{ caseId:'solo:407', ...detail } })); } catch {} };
  const optionText = (options, value) => options.find(([id]) => id === value)?.[1] || value || 'не зафиксировано';

  if (!document.getElementById('ml-solo407-hardening-v2')) {
    const style = document.createElement('style');
    style.id = 'ml-solo407-hardening-v2';
    style.textContent = `
      .solo407-hypothesis-note{margin:10px 0 0;color:#91a7b4;line-height:1.55}
      .solo407-theory-review{display:grid;gap:12px;margin:24px 0}
      .solo407-theory-link{padding:16px 18px;border:1px solid rgba(210,174,115,.16);border-radius:14px;background:rgba(255,255,255,.018)}
      .solo407-theory-link header{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:8px}
      .solo407-theory-link header strong{font-family:Georgia,serif;font-size:18px;font-weight:500}
      .solo407-theory-link header span{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#d2ae73}
      .solo407-theory-link.is-broken header span{color:#d89a94}
      .solo407-theory-link p{margin:0 0 8px;line-height:1.55}
      .solo407-theory-link small{display:block;color:#91a7b4;line-height:1.55}
      .solo407-proof-chain{margin:26px 0;padding:20px 22px;border:1px solid rgba(210,174,115,.22);border-radius:16px;background:rgba(8,20,30,.68)}
      .solo407-proof-chain h3{margin:0 0 14px;font-family:Georgia,serif;font-size:24px;font-weight:500}
      .solo407-proof-chain ol{display:grid;gap:10px;margin:0;padding-left:22px}
      .solo407-proof-chain li{padding-left:4px;line-height:1.55}
      .solo407-reveal-summary{margin:18px 0;padding:16px 18px;border-left:2px solid #d2ae73;background:rgba(210,174,115,.045);line-height:1.6}
      .solo407-reveal-details{margin:22px 0;border-top:1px solid rgba(210,174,115,.16);border-bottom:1px solid rgba(210,174,115,.16)}
      .solo407-reveal-details summary{cursor:pointer;padding:14px 0;font-weight:700}
      .solo407-reveal-details[open]{padding-bottom:12px}
      .solo407-reveal-trail{display:grid;gap:9px;margin:10px 0 4px}
      .solo407-reveal-trail div{padding:10px 12px;background:rgba(255,255,255,.018);border-radius:10px;line-height:1.45}
    `;
    document.head.appendChild(style);
  }

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
    const selected = state.checkpointAnswers?.[String(stage)];
    return `<section class="solo407-checkpoint ${passed ? 'is-passed' : ''}">
      <p class="solo407-kicker">Рабочая гипотеза</p><h3>${esc(cp.question)}</h3>
      ${passed ? `<p class="solo407-pass"><strong>Гипотеза зафиксирована.</strong> ${selected ? esc(optionText(cp.options, selected)) : 'Это прохождение было начато в предыдущей версии игры.'}</p><p class="solo407-hypothesis-note">Игра не оценивает её сейчас. Следующий пакет должен попытаться её опровергнуть.</p>` : `<p class="solo407-hypothesis-note">Выберите позицию, которую считаете наиболее сильной сейчас. Это не экзамен: после фиксации игра откроет следующий пакет, не сообщая, правы ли вы.</p><form data-checkpoint="${stage}">${cp.options.map(([v,t]) => `<label><input type="radio" name="answer" value="${v}" required><span>${esc(t)}</span></label>`).join('')}<button class="solo407-primary" type="submit">Зафиксировать гипотезу</button></form>`}
    </section>`;
  }

  function renderStage(stage) {
    const plan = plans[stage];
    const ids = plan.initial.concat(plan.requests.filter((id) => state.unlocked.includes(id)));
    const available = plan.requests.filter((id) => !state.unlocked.includes(id));
    const stageData = soloStages[stage];
    return `<section class="solo407-stage-card">
      <div class="solo407-stage-heading"><div><p class="solo407-kicker">Этап ${stage} из 3</p><h2>${esc(stageData.title)}</h2><p>${esc(stageData.objective)}</p></div><div class="solo407-stage-count">${openedCountFor(stage)} / ${stageTotal(stage)}</div></div>
      <div class="solo407-evidence-list">${ids.map((id) => renderMaterial(byId[id])).join('')}</div>
      ${available.length ? `<section class="solo407-requests"><p class="solo407-kicker">Следственные действия</p><h3>Что запросить дальше?</h3><div class="solo407-request-grid">${available.map((id) => `<button type="button" data-request="${id}">${esc(requestLabel(id))}<small>${esc(byId[id].title)}</small></button>`).join('')}</div></section>` : ''}
      ${renderCheckpoint(stage)}
    </section>`;
  }

  function renderReveal() {
    const answers = state.finalAnswers || {};
    const complete = soloFinal.questions.every((q) => Boolean(answers[q.id]));
    const allHeld = complete && soloFinal.questions.every((q) => answers[q.id] === q.answer);
    const directPinned = state.pinned.filter((id) => DIRECT_EVIDENCE.has(id)).length;
    const trail = [1,2,3].map((stage) => {
      const answer = state.checkpointAnswers?.[String(stage)];
      if (!answer) return '';
      return `<div><strong>После этапа ${stage}:</strong> ${esc(optionText(checkpoints[stage].options, answer))}</div>`;
    }).filter(Boolean).join('');
    const review = complete ? soloFinal.questions.map((q) => {
      const chosen = answers[q.id];
      const held = chosen === q.answer;
      const explanation = held ? FINAL_PROOF[q.id] : (FINAL_BREAKS[q.id]?.[chosen] || FINAL_PROOF[q.id]);
      return `<article class="solo407-theory-link ${held ? 'is-held' : 'is-broken'}"><header><strong>${esc(FINAL_LABELS[q.id])}</strong><span>${held ? 'выдержал проверку' : 'не выдержал'}</span></header><p><b>Ваша версия:</b> ${esc(optionText(q.options, chosen))}</p><small>${esc(explanation)}</small></article>`;
    }).join('') : '';
    return `<section class="solo407-reveal"><p class="solo407-kicker">Дело закрыто · ваша версия проверена</p><h2>${esc(data.reveal.title)}</h2>
      <div class="solo407-reveal-summary">${allHeld ? '<strong>Ваша реконструкция выдержала проверку по всем ключевым звеньям.</strong>' : '<strong>Часть вашей реконструкции выдержала проверку, часть сломалась на независимых материалах.</strong>'}${state.pinned.length ? ` На доске у вас было ${state.pinned.length} материалов; ${directPinned} из них входят в прямую доказательную цепочку раскрытия.` : ''}</div>
      ${review ? `<div class="solo407-theory-review">${review}</div>` : ''}
      <section class="solo407-proof-chain"><h3>Пять звеньев, на которых держится дело</h3><ol><li><b>Физическая комната.</b> H-409, L-коды и C4 показывают подмену табличек и ошибку охраны.</li><li><b>Намеренная тревога.</b> Верный код + 9 превращает 01:12 в запущенный Мартой таймер.</li><li><b>Служебный маршрут.</b> Часы и HK-44 независимо ведут из физического 407 через SVC и лифт в B1.</li><li><b>Футляр.</b> Волокна BR-220 и ювелирный воск остаются в тележке, дошедшей до B1.</li><li><b>Действие Елены.</b> ER-02 отключает камеру, открывает машину, а аудит, билеты и черновик объясняют общий план.</li></ol></section>
      ${trail ? `<details class="solo407-reveal-details"><summary>Как менялась ваша версия по ходу расследования</summary><div class="solo407-reveal-trail">${trail}</div></details>` : ''}
      <details class="solo407-reveal-details"><summary>Проверить полную доказательную реконструкцию</summary>${data.reveal.body.map((p) => `<p>${esc(p)}</p>`).join('')}</details>
      <p class="solo407-closing">${esc(data.reveal.closing)}</p><a class="solo407-primary" href="../">Другие расследования для одного</a></section>`;
  }

  function renderFinal() {
    if (!allStagesComplete()) return '';
    if (state.solved) return renderReveal();
    return `<section class="solo407-final"><p class="solo407-kicker">Финальное заключение</p><h2>Подпишите версию, которую готовы защищать</h2><p>${esc(soloFinal.intro)}</p><div class="solo407-proof-meter"><strong>${state.pinned.length}</strong><span>материалов на вашей доске доказательств</span><small>Рекомендуем оставить 5–7 самых сильных. Это не подсказка к ответу.</small></div>
      <form data-final>${soloFinal.questions.map((q,qi) => `<fieldset><legend>${qi+1}. ${esc(q.title)}</legend>${q.options.map(([v,t]) => `<label><input type="radio" name="${esc(q.id)}" value="${esc(v)}" ${state.finalAnswers?.[q.id] === v ? 'checked' : ''} required><span>${esc(t)}</span></label>`).join('')}</fieldset>`).join('')}<button class="solo407-primary" type="submit">Подписать заключение и открыть дело</button></form></section>`;
  }

  function renderDesk() {
    ensureStage(state.stage); save();
    const progress = Math.round((state.opened.length / ordered.length) * 100);
    root.innerHTML = `<div class="solo407-desk">
      <aside class="solo407-rail"><p class="solo407-kicker">Дело ML-0407 · solo</p><h1>Номер 407</h1><p>Вы — единственный следователь. Материалы приходят по мере ваших запросов.</p><div class="solo407-progress"><i style="width:${progress}%"></i></div><small>${state.opened.length} из ${ordered.length} материалов изучено</small>
      <nav>${[1,2,3].map((n) => `<button type="button" data-stage-nav="${n}" ${n > state.stage ? 'disabled' : ''} class="${n === state.stage ? 'is-active' : ''}"><span>0${n}</span><b>${esc(soloStages[n].title)}</b>${stageComplete(n) ? '<em>✓</em>' : ''}</button>`).join('')}</nav>
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
    if (hint) {
      const list = hints[state.stage] || [];
      const used = Number(state.hintsByStage?.[state.stage] || 0);
      state.currentHint = list[Math.min(used, list.length - 1)] || 'Перепроверьте, что именно доказывает каждый источник, а чего он не доказывает.';
      state.hintsByStage = { ...(state.hintsByStage || {}), [state.stage]: used + 1 };
      state.hintsUsed += 1;
      save(); emit('solo_hint', { stage:state.stage, stageHintNumber:used + 1, hintsUsed:state.hintsUsed }); render(); return;
    }
    const hintClose = event.target.closest('[data-hint-close]');
    if (hintClose) { state.currentHint = ''; save(); render(); return; }
    const reset = event.target.closest('[data-reset]');
    if (reset && confirm('Стереть прогресс этого расследования и начать заново?')) { state = cleanState(); save(); render(); }
  });

  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-final] input[type="radio"]');
    if (!input?.name) return;
    state.finalAnswers = { ...(state.finalAnswers || {}), [input.name]: input.value };
    save();
  });

  root.addEventListener('submit', (event) => {
    const cp = event.target.closest('[data-checkpoint]');
    if (cp) {
      event.preventDefault();
      const stage = Number(cp.dataset.checkpoint);
      const answer = new FormData(cp).get('answer');
      if (!answer) return;
      state.checkpoints[String(stage)] = true;
      state.checkpointAnswers = { ...(state.checkpointAnswers || {}), [String(stage)]: String(answer) };
      state.currentHint = '';
      if (stage < 3) { state.stage = stage + 1; ensureStage(state.stage); }
      save();
      emit('solo_checkpoint', { stage, hypothesis:String(answer), matchedCanonical:String(answer) === checkpoints[stage].answer });
      render();
      return;
    }
    const final = event.target.closest('[data-final]');
    if (final) {
      event.preventDefault();
      const fd = new FormData(final);
      const answers = {};
      for (const q of soloFinal.questions) {
        const answer = fd.get(q.id);
        if (!answer) return;
        answers[q.id] = String(answer);
      }
      state.finalAnswers = answers;
      state.solved = true;
      const canonicalLinks = soloFinal.questions.filter((q) => answers[q.id] === q.answer).length;
      save();
      emit('solo_complete', { canonicalLinks, totalLinks:soloFinal.questions.length, hintsUsed:state.hintsUsed });
      render();
    }
  });

  window.MLSolo407ReleaseGate = Object.freeze({
    revision: '2.0',
    playerOwnedCheckpoints: true,
    wrongFinalAccepted: true,
    finalTheoryComparedAtReveal: true,
    refreshPreservesFinal: true,
    fullForensicSecondLayer: true
  });

  render();
})();