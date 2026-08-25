(() => {
  'use strict';
  const data = window.MLCase407;
  const root = document.querySelector('[data-case407-app]');
  if (!data || !root) return;

  data.releaseGateRevision = '1.0';
  data.brief.mission = 'Сопоставьте тревогу, журналы доступа, камеры и вещественные следы. Установите, что произошло после 01:12 и чьи действия подтверждаются независимыми материалами.';
  if (data.stages?.[0]) {
    data.stages[0].title = 'Первые двадцать минут';
    data.stages[0].objective = 'Сведите по времени тревогу, осмотр, записи камеры и электронные журналы. Отмечайте прямые факты и расхождения между независимыми источниками.';
  }
  if (data.stages?.[1]) {
    data.stages[1].title = 'След после тревоги';
    data.stages[1].objective = 'Сопоставьте план этажа, движение устройств и доступные технические данные. Проверьте несколько возможных маршрутов, не принимая один косвенный след за готовый ответ.';
  }
  if (data.stages?.[2]) {
    data.stages[2].title = 'Последние четыре минуты';
    data.stages[2].objective = 'Сопоставьте точный журнал доступа с вещественными и цифровыми материалами. Для каждого действия требуйте независимую привязку к человеку, а не только к его устройству или пропуску.';
  }

  if (data.final?.questions) {
    data.final.intro = 'Соберите непротиворечивую версию из независимых материалов. Принадлежность устройства, общий мотив или один технический журнал сами по себе не доказывают личное действие.';
    const sequence = data.final.questions.find((question) => question.id === 'sequence');
    if (sequence) {
      sequence.title = 'Какая версия лучше всего выдерживает все материалы?';
      sequence.options = [
        ['denis', 'Денис вернулся в отель после спора, забрал сапфир через служебную зону, а Марта и Елена скрывали отдельные нарушения, не связанные с исчезновением камня.'],
        ['elena_force', 'Елена подготовила события вокруг тревоги, принудила Марту покинуть этаж и самостоятельно вывезла футляр, используя служебный доступ и автомобиль.'],
        ['collusion', 'Марта и Елена заранее согласовали постановку; Марта прошла служебным маршрутом с футляром, а Елена подготовила окно наблюдения и затем вывезла их из B1.'],
        ['security', 'Зорин помог Марте покинуть этаж через служебную инфраструктуру, после чего Елена лишь предоставила автомобиль, не участвуя в подготовке событий вокруг тревоги.']
      ];
    }
  }

  const EVIDENCE_LABELS = {
    room_swap: 'H-код таблички + реестр L-кодов · сверка оборудования',
    duress: 'S-407 · последовательность кода и инструкция режима тревоги',
    service_route: 'Часы + HK-44 · события служебного доступа 01:14–01:19',
    br220: 'BR-220 · волокна и ювелирный воск в тележке №6',
    night_mgr: 'NIGHT-MGR + ER-02 · команда режима камеры B1',
    shared_plan: 'Удалённый черновик + билеты на 06:40',
    audit: 'Акт внутренней сверки · 08:30',
    denis_alibi: 'Такси + городские камеры + домофон · маршрут после 00:36'
  };

  const patchEvidence = (scope) => {
    scope.querySelectorAll('input[name="evidence"]').forEach((input) => {
      const label = input.closest('label');
      const span = label?.querySelector('span');
      const text = EVIDENCE_LABELS[input.value];
      if (text && span && span.textContent !== text) span.textContent = text;
      if (label) [...label.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()).forEach((node) => node.remove());
    });
    const box = scope.querySelector('.case2317-final-evidence');
    if (box) {
      const title = box.querySelector('h3');
      const lead = [...box.children].find((node) => node.tagName === 'P' && !node.classList.contains('case2317-final-counter'));
      if (title && title.textContent !== 'Выберите 5 опорных материалов') title.textContent = 'Выберите 5 опорных материалов';
      const safe = 'Выберите пять материалов, которые покрывают разные части вашей реконструкции. Общий мотив или несколько документов об одном событии не заменяют независимое подтверждение другого действия.';
      if (lead && lead.textContent !== safe) lead.textContent = safe;
    }
  };

  const patchStageUi = (scope) => {
    const guidance = scope.querySelector('.case407-guidance p');
    if (guidance && guidance.textContent.includes('участие Елены')) {
      guidance.textContent = 'Используйте открытый журнал доступа как одну из линий. Отдельно проверьте путь вещественного объекта и то, какие действия можно надёжно связать с конкретным человеком.';
    }
    const active = scope.querySelector('.case2317-stage-tabs button.is-active')?.textContent || '';
    if (/^\s*1\./.test(active)) {
      scope.querySelectorAll('.case2317-handoff.is-complete').forEach((section) => {
        const strong = section.querySelector('.case2317-handoff-result strong');
        const copy = [...section.children].find((node) => node.tagName === 'P' && !node.classList.contains('case2317-eyebrow'));
        if (strong) strong.textContent = 'Сверка H/L-кодов завершена';
        if (copy) copy.textContent = 'H-код с таблички и L-код из реестра относятся к одной записи оборудования. Зафиксируйте это соответствие и сопоставьте его с камерой, осмотром и журналами.';
      });
    }
  };

  const patchFeedback = (scope) => {
    scope.querySelectorAll('.case2317-feedback.is-wrong').forEach((node) => {
      const text = node.textContent || '';
      if (text.includes('Елены') || text.includes('намеренность Марты') || text.includes('путь из 407')) {
        node.textContent = 'Версия пока не выдерживает один из независимых материалов. Перепроверьте хронологию, прямые идентификации и то, не заменяете ли вы доказательство действия принадлежностью устройства или общим мотивом.';
      }
    });
  };

  const patch = () => {
    patchEvidence(root);
    patchStageUi(root);
    patchFeedback(root);
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; patch(); });
  };
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  patch();

  window.ML407ReleaseGate = Object.freeze({ revision: '1.0', blindSpoilerNeutral: true, finalEvidenceNeutral: true, balancedFinalOptions: true });
})();
