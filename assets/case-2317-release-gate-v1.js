(() => {
  'use strict';
  const data = window.MLCase2317;
  const root = document.querySelector('[data-case2317-app]');
  if (!data || !root) return;

  data.releaseGateRevision = '2.0';
  data.brief.mission = 'Восстановите события после звонка и соберите одну версию, которую сможете защитить перед напарником.';
  if (data.stages?.[0]) {
    data.stages[0].objective = 'Соберите первые минуты после звонка. У вас разные источники; не спешите сводить их в одну историю.';
  }
  if (data.stages?.[1]) {
    data.stages[1].title = 'Сверка хронологии';
    data.stages[1].objective = 'Сверьте новые материалы и решите, какую линию сейчас стоит проверять в первую очередь.';
  }
  if (data.stages?.[2]) {
    data.stages[2].title = 'Последние подтверждения';
    data.stages[2].objective = 'Последний пакет — проверка вашей рабочей версии. Ищите не подтверждение, а факт, который способен её разрушить.';
  }

  const sequence = data.final?.questions?.find((question) => question.id === 'sequence');
  if (data.final && sequence) {
    data.final.intro = 'Сначала договоритесь об одной версии вслух. Затем оба зафиксируйте её на своих устройствах и выберите три материала, на которых она держится. До раскрытия игра не будет исправлять ваш вывод.';
    sequence.title = 'Какую общую версию вы готовы подписать?';
    sequence.options = [
      ['abduction', 'Илья приехал к дому и перехватил Веру после звонка. Марина и Роман позже помогли переместить следы и автомобиль, поэтому маршрут машины расходится с первоначальным нападением.'],
      ['escape', 'Илья приехал к дому и отслеживал Веру через маяк. Вера ушла с Мариной по запасному плану, а Роман отдельно увёл отслеживаемый автомобиль, создавая ложный маршрут.'],
      ['staged', 'Вера и Марина заранее разыграли исчезновение, чтобы заставить Илью выдать слежку. Роман помог с автомобилем, но реального участия Ильи у дома в самой операции не было.'],
      ['mistake', 'Вера ушла с Мариной из-за страха перед Ильёй, а Роман переместил автомобиль по отдельной технической причине. Несколько независимых событий случайно сложились в видимость общего плана.']
    ];
    data.final.questions = [sequence];
  }

  const EVIDENCE_LABELS = {
    ilya_camera: 'Q7-29 · исходный кадр CAM-N2, 23:12:18',
    tracker: '4F-7719 · физический маяк и карточка резервной копии',
    roman_route: 'CAM-S1/S2 + SP-3 · сервисная зона и последующий маршрут',
    tea: 'Кафе «Север» · операция по карте и фототаблица',
    seat: 'Осмотр автомобиля · кресло, зеркало и грунт',
    draft: 'Черновик Веры · 22:52'
  };
  const CANONICAL_EVIDENCE = new Set(['ilya_camera', 'tracker', 'roman_route']);
  const DECISION_LABELS = {
    ilya: 'линия Ильи',
    marina: 'линия Марины',
    parking: 'линия автомобиля и паркинга'
  };
  const THEORY_LABELS = {
    abduction: 'Илья перехватил Веру после звонка',
    escape: 'Вера ушла с Мариной, а машина пошла отдельным маршрутом',
    staged: 'исчезновение было постановкой без реального участия Ильи',
    mistake: 'события совпали, но общего плана перемещения машины не было'
  };
  const THEORY_BREAKS = {
    abduction: 'Эта версия ломается на личной фиксации Веры с Мариной в кафе и на её подтверждённом контакте после выключения телефона.',
    staged: 'Эта версия ломается на двух независимых связках с Ильёй: Q7-29 лично ставит его у дома, а 4F-7719 связывает маяк с его приложением мониторинга.',
    mistake: 'Эта версия ломается на CAM-S1/S2: Марина передаёт Роману ключ, Роман открывает именно автомобиль Веры и начинает тот маршрут, который заранее объяснён в черновике Веры.'
  };

  const roomCode = () => (new URL(location.href).searchParams.get('room') || 'preview').trim().toUpperCase();
  const role = () => (root.querySelector('.case2317-role-label b')?.textContent || '').includes('Аналитик') ? 'guest' : 'creator';
  const progressKey = () => `mysterylogic:2317:v2:${roomCode()}:${role()}`;
  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem(progressKey()) || '{}') || {}; }
    catch { return {}; }
  };
  const saveProgress = (progress) => {
    try { localStorage.setItem(progressKey(), JSON.stringify(progress)); } catch {}
  };
  const setText = (node, text) => { if (node && node.textContent !== text) node.textContent = text; };

  if (!document.getElementById('ml2317-product-hardening')) {
    const style = document.createElement('style');
    style.id = 'ml2317-product-hardening';
    style.textContent = `
      .case2317-facts{display:none!important}
      .case2317-reveal-payoff{margin:20px 0 18px;padding:20px 22px;border:1px solid rgba(210,174,106,.26);border-radius:16px;background:rgba(10,25,39,.68)}
      .case2317-reveal-payoff>strong{display:block;font-family:Georgia,serif;font-size:clamp(22px,3vw,32px);line-height:1.15;font-weight:600}
      .case2317-reveal-payoff p{margin:10px 0 0;line-height:1.62}
      .case2317-theory-result{margin:16px 0;padding:15px 17px;border-left:2px solid rgba(210,174,106,.55);background:rgba(255,255,255,.025)}
      .case2317-theory-result strong{display:block;margin-bottom:5px}
      .case2317-catch-chain{margin:22px 0}
      .case2317-catch-chain h3{margin-bottom:12px}
      .case2317-catch-chain ol{display:grid;gap:9px;margin:0;padding-left:22px}
      .case2317-catch-chain li{padding-left:5px;line-height:1.5}
      .case2317-reveal-details{margin:22px 0;padding:0;border-top:1px solid rgba(210,174,106,.18);border-bottom:1px solid rgba(210,174,106,.18)}
      .case2317-reveal-details summary{cursor:pointer;padding:15px 0;font-weight:700}
      .case2317-reveal-details[open]{padding-bottom:10px}
    `;
    document.head.appendChild(style);
  }

  const patchDecision = () => {
    const section = root.querySelector('.case2317-decision');
    if (!section) return;
    setText(section.querySelector('h3'), 'Какую линию вы считаете приоритетной?');
    const lead = [...section.children].find((node) => node.tagName === 'P' && !node.classList.contains('case2317-eyebrow'));
    setText(lead, 'Зафиксируйте одну рабочую линию после обсуждения. Следующий пакет проверит её, но сейчас игра не скажет, правы ли вы.');

    const progress = readProgress();
    const chosen = progress.productDecision;
    const feedback = section.querySelector('.case2317-decision-feedback');
    if (chosen && feedback) {
      feedback.classList.remove('is-right', 'is-wrong');
      setText(feedback, `Рабочая линия зафиксирована: ${DECISION_LABELS[chosen] || chosen}. Не защищайте её любой ценой — следующий пакет должен попытаться её опровергнуть.`);
      setText(section.querySelector('.case2317-drop strong'), 'Версия принята как рабочая. Откройте последний пакет и проведите стресс-тест.');
    }
  };

  const patchStageThree = () => {
    const active = root.querySelector('.case2317-stage-tabs button.is-active')?.textContent || '';
    if (!/^\s*3\./.test(active)) return;
    const progress = readProgress();
    const chosen = progress.productDecision;
    const lead = root.querySelector('.case2317-stage-head p');
    if (!lead) return;
    const prefix = chosen ? `Вы выбрали ${DECISION_LABELS[chosen] || 'рабочую линию'}. ` : '';
    setText(lead, `${prefix}Не ищите подтверждение — найдите материал, который способен разрушить эту версию. Если она выдержит последний пакет, только тогда несите её в финал.`);
  };

  const patchFinal = () => {
    root.querySelectorAll('input[name="evidence"]').forEach((input) => {
      const text = EVIDENCE_LABELS[input.value];
      const span = input.closest('label')?.querySelector('span');
      if (text) setText(span, text);
    });
    const box = root.querySelector('.case2317-final-evidence');
    if (box) {
      setText(box.querySelector('h3'), 'Выберите 3 опоры вашей версии');
      const lead = [...box.children].find((node) => node.tagName === 'P' && !node.classList.contains('case2317-final-counter'));
      setText(lead, 'Выберите любые три материала, на которых держится ваша версия. Это не тест на «правильную тройку»: качество выбора станет видно только после раскрытия.');
    }
    const progress = readProgress();
    if (progress.productFinalTheory) {
      const radio = root.querySelector(`input[name="sequence"][value="${progress.productFinalTheory}"]`);
      if (radio && !radio.checked) radio.checked = true;
    }
    if (Array.isArray(progress.productFinalEvidence) && progress.productFinalEvidence.length === 3) {
      root.querySelectorAll('input[name="evidence"]').forEach((input) => { input.checked = progress.productFinalEvidence.includes(input.value); });
      setText(root.querySelector('[data-pick-counter]'), 'Выбрано: 3 из 3');
    }
  };

  const patchReveal = () => {
    const reveal = root.querySelector('.case2317-reveal');
    if (!reveal || reveal.dataset.productHardening === '1') return;
    reveal.dataset.productHardening = '1';
    const progress = readProgress();
    const theory = progress.productFinalTheory || '';
    const picks = Array.isArray(progress.productFinalEvidence) ? progress.productFinalEvidence : [];
    const strongCount = picks.filter((id) => CANONICAL_EVIDENCE.has(id)).length;
    const heading = reveal.querySelector('h2');
    setText(heading, 'Илья следил. Вера ушла. Машина поехала вместо неё.');

    const payoff = document.createElement('div');
    payoff.className = 'case2317-reveal-payoff';
    payoff.innerHTML = '<strong>Илья Кравцов действительно приехал к дому и отслеживал автомобиль Веры через маяк. Но Вера ушла с Мариной, а Роман увёл отслеживаемую машину отдельным маршрутом.</strong><p>Ловушка дела была не в одном скрытом документе, а в том, что после звонка человек, телефон и автомобиль перестали двигаться как единое целое.</p>';
    heading?.after(payoff);

    const theoryBox = document.createElement('div');
    theoryBox.className = 'case2317-theory-result';
    if (theory === 'escape') {
      theoryBox.innerHTML = `<strong>Ваша версия выдержала стресс-тест.</strong><p>Вы зафиксировали: ${THEORY_LABELS.escape}. ${strongCount === 3 ? 'И все три выбранные опоры были прямыми звеньями доказательной цепочки.' : `Из трёх выбранных опор ${strongCount} ${strongCount === 1 ? 'была прямым ключевым звеном' : 'были прямыми ключевыми звеньями'}; остальные поддерживали историю, но не доказывали её сами.`}</p>`;
    } else if (theory) {
      theoryBox.innerHTML = `<strong>Ваша рабочая версия не выдержала последнюю сверку.</strong><p>Вы подписали: «${THEORY_LABELS[theory] || theory}». ${THEORY_BREAKS[theory] || 'В полном наборе материалов остаётся факт, который с этой версией несовместим.'} ${strongCount === 3 ? 'При этом опорные материалы вы выбрали сильные.' : `Из трёх выбранных опор прямыми ключевыми звеньями были ${strongCount}.`}</p>`;
    } else {
      theoryBox.innerHTML = '<strong>Сверьте свою версию с доказательной цепочкой.</strong><p>Ниже видно, какие независимые материалы превращают набор совпадений в доказанную реконструкцию.</p>';
    }
    payoff.after(theoryBox);

    const chain = document.createElement('div');
    chain.className = 'case2317-catch-chain';
    chain.innerHTML = '<h3>Пять звеньев, на которых держится решение</h3><ol><li>Q7-29 лично ставит Илью у дома — уже не только его автомобиль.</li><li>4F-7719 связывает физический маяк с приложением Ильи и запросом координат.</li><li>В 23:44:36 Вера лично находится в кафе, пока её автомобиль одновременно идёт по Сервисному проезду.</li><li>CAM-S1/S2 показывает передачу ключа Роману и его посадку в автомобиль до открытия RB-17.</li><li>00:16 и звонок 00:18 подтверждают: Вера с Мариной в безопасности, а отдельный маршрут машины был отвлекающим.</li></ol>';
    theoryBox.after(chain);

    const bodyParagraphs = [...reveal.children].filter((node) => node.tagName === 'P' && !node.classList.contains('case2317-eyebrow'));
    const closing = reveal.querySelector('.case2317-closing');
    if (bodyParagraphs.length || closing) {
      const details = document.createElement('details');
      details.className = 'case2317-reveal-details';
      details.innerHTML = '<summary>Проверить полную доказательную реконструкцию</summary>';
      bodyParagraphs.forEach((node) => details.appendChild(node));
      if (closing) details.appendChild(closing);
      chain.after(details);
    }
  };

  const patch = () => {
    patchDecision();
    patchStageThree();
    patchFinal();
    patchReveal();
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-action="decision"][data-decision]');
    if (!button || !root.contains(button)) return;
    const actual = button.dataset.decision || '';
    if (!Object.hasOwn(DECISION_LABELS, actual)) return;
    const progress = readProgress();
    if (!progress.productDecision) progress.productDecision = actual;
    progress.decisionMistakes = 0;
    saveProgress(progress);
    try { window.ym?.(111664459, 'reachGoal', 'coop_2317_working_line', { page_type: 'coop_2317', room_code: roomCode(), line: actual }); } catch {}
    button.dataset.decision = 'parking';
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form.matches?.('[data-final-form]') || !root.contains(form)) return;
    const fd = new FormData(form);
    const theory = String(fd.get('sequence') || '');
    const picks = fd.getAll('evidence').map(String);
    if (!theory || picks.length !== 3) return;

    const progress = readProgress();
    progress.productFinalTheory = theory;
    progress.productFinalEvidence = picks;
    progress.productFinalTheoryCorrect = theory === 'escape';
    progress.productFinalEvidenceStrength = picks.filter((id) => CANONICAL_EVIDENCE.has(id)).length;
    progress.finalAttempts = 0;
    progress.decisionMistakes = 0;
    saveProgress(progress);
    try { window.ym?.(111664459, 'reachGoal', 'coop_2317_final_theory', { page_type: 'coop_2317', room_code: roomCode(), theory, evidence_strength: progress.productFinalEvidenceStrength }); } catch {}

    form.querySelectorAll('input[name="sequence"]').forEach((input) => { input.checked = input.value === 'escape'; });
    form.querySelectorAll('input[name="evidence"]').forEach((input) => { input.checked = CANONICAL_EVIDENCE.has(input.value); });
  }, true);

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; patch(); });
  };
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  patch();

  window.ML2317ReleaseGate = Object.freeze({
    revision: '2.0',
    playerOwnedDeductions: true,
    visibleFactSummaries: false,
    workingLineAcceptedOnce: true,
    wrongFinalAccepted: true,
    finalTheoryComparedAtReveal: true,
    fullForensicSecondLayer: true
  });
})();
