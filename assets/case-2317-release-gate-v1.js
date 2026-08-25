(() => {
  'use strict';
  const data = window.MLCase2317;
  const root = document.querySelector('[data-case2317-app]');
  if (!data || !root) return;

  data.releaseGateRevision = '1.0';
  data.brief.mission = 'Восстановите события после звонка, проверьте показания участников и установите, какие действия подтверждаются независимыми материалами двух ролей.';
  if (data.stages?.[1]) {
    data.stages[1].title = 'Сверка хронологии';
    data.stages[1].objective = 'Сопоставьте временные метки, камеры, доступ и цифровые следы. Для каждого вывода отделяйте прямой факт от предположения о человеке или действии.';
  }
  if (data.stages?.[2]) {
    data.stages[2].title = 'Последние подтверждения';
    data.stages[2].objective = 'Свяжите конкретных людей с ключевыми действиями и закройте оставшиеся разрывы в хронологии независимыми материалами напарника.';
  }

  if (data.final?.questions) {
    data.final.intro = 'Соберите одну непротиворечивую реконструкцию. Каждый ключевой вывод должен опираться на прямой материал и независимое подтверждение.';
    const sequence = data.final.questions.find((question) => question.id === 'sequence');
    if (sequence) {
      sequence.title = 'Какая реконструкция лучше всего выдерживает все материалы?';
      sequence.options = [
        ['abduction', 'Илья прибыл к дому, после звонка перехватил Веру; автомобиль позже оказался на Сервисном проезде, а цифровые следы отражают действия участников после похищения.'],
        ['escape', 'Илья прибыл к дому; Вера после звонка покинула дом с Мариной, а автомобиль позже переместил Роман; независимые материалы фиксируют эти действия отдельно.'],
        ['staged', 'Вера заранее подготовила исчезновение, после звонка действовала вместе с Мариной, а автомобиль был перемещён как часть постановки, не связанной с действиями Ильи.'],
        ['mistake', 'Вера уехала с Мариной без заранее согласованного плана, а автомобиль позже переместил технический сотрудник; совпадение следов создало ложную связь между событиями.']
      ];
    }
  }

  const EVIDENCE_LABELS = {
    ilya_camera: 'Q7-29 · исходный кадр CAM-N2, 23:12:18',
    tracker: '4F-7719 · физический маяк и карточка резервной копии',
    roman_route: 'CAM-S1/S2 + SP-3 · сервисная зона и последующий маршрут',
    tea: 'Кафе «Север» · операция по карте и фототаблица',
    seat: 'Осмотр автомобиля · кресло, зеркало и грунт',
    draft: 'Черновик Веры · 22:52'
  };

  const patchFinal = (scope) => {
    scope.querySelectorAll('input[name="evidence"]').forEach((input) => {
      const text = EVIDENCE_LABELS[input.value];
      const span = input.closest('label')?.querySelector('span');
      if (text && span && span.textContent !== text) span.textContent = text;
    });
    const box = scope.querySelector('.case2317-final-evidence');
    if (box) {
      const title = box.querySelector('h3');
      const lead = [...box.children].find((node) => node.tagName === 'P' && !node.classList.contains('case2317-final-counter'));
      if (title && title.textContent !== 'Выберите 3 опорных материала') title.textContent = 'Выберите 3 опорных материала';
      const safe = 'Выберите три материала, которые в совокупности лучше всего выдерживают альтернативные объяснения. Не дублируйте один и тот же тезис несколькими косвенными фактами.';
      if (lead && lead.textContent !== safe) lead.textContent = safe;
    }
  };

  const patchFeedback = (scope) => {
    scope.querySelectorAll('.case2317-feedback.is-wrong').forEach((node) => {
      const text = node.textContent || '';
      if (text.includes('Разделите три маршрута')) {
        node.textContent = 'В реконструкции остаётся противоречие с одним из временных или идентификационных фактов. Перепроверьте, что каждый ключевой вывод опирается на прямой материал.';
      }
    });
  };

  const patch = () => {
    patchFinal(root);
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

  window.ML2317ReleaseGate = Object.freeze({ revision: '1.0', blindSpoilerNeutral: true, finalEvidenceNeutral: true, balancedFinalOptions: true });
})();
