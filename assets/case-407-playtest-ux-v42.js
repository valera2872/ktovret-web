(() => {
  'use strict';
  const root = document.querySelector('[data-case407-app]');
  if (!root) return;

  const patchStage1Handoff = (scope) => {
    scope.querySelectorAll('.case2317-handoff').forEach((section) => {
      const input = section.querySelector('input[data-handoff-key="stage1"]');
      if (!input || input.placeholder !== 'ID контроллера') return;
      const copy = [...section.children].find((node) => node.tagName === 'P' && !node.classList.contains('case2317-eyebrow'));
      if (copy && !section.classList.contains('is-complete')) {
        copy.textContent = 'Сначала сообщите Аналитику заводской H-код с вашей таблички. После того как его реестр найдёт связанный LOCK ID, получите этот L-код и введите его здесь.';
      }
    });
  };

  const patchDecision = (scope) => {
    scope.querySelectorAll('.case2317-decision').forEach((section) => {
      const heading = section.querySelector('h3')?.textContent || '';
      if (!heading.includes('Какой срочный запрос сделать первым')) return;
      const copy = [...section.children].find((node) => node.tagName === 'P' && !node.classList.contains('case2317-eyebrow'));
      if (copy && copy.textContent.includes('Сверьтесь с напарником')) {
        copy.textContent = 'Сначала договоритесь с напарником об одном запросе; затем каждый подтвердите тот же вариант на своём экране. Первый запрос бесплатный, второй после ошибки снизит итоговый балл.';
      }
    });
  };

  const patchFinalEvidenceLabels = (scope) => {
    scope.querySelectorAll('input[name="evidence"][value="shared_plan"]').forEach((input) => {
      const label = input.closest('label');
      if (!label) return;
      const textNode = [...label.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
      const suffix = ' Подтверждает общий план, но не заменяет независимое доказательство личного действия Елены.';
      if (textNode && !textNode.nodeValue.includes('не заменяет независимое')) textNode.nodeValue = `${textNode.nodeValue.trim()}${suffix}`;
      else if (!label.textContent.includes('не заменяет независимое')) label.append(document.createTextNode(suffix));
    });
  };

  const scan = (scope = root) => {
    if (!(scope instanceof Element)) return;
    patchStage1Handoff(scope);
    patchDecision(scope);
    patchFinalEvidenceLabels(scope);
  };

  root.addEventListener('submit', (event) => {
    const form = event.target?.closest?.('.case2317-final form');
    if (!form) return;
    const picks = new FormData(form).getAll('evidence').map(String);
    if (picks.length !== 5 || picks.includes('night_mgr')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    form.querySelector('[data-playtest-evidence-error]')?.remove();
    const feedback = document.createElement('div');
    feedback.className = 'case2317-feedback is-wrong';
    feedback.dataset.playtestEvidenceError = '1';
    feedback.textContent = 'В наборе нет независимого доказательства личного действия Елены. Переписка, билеты и общий мотив показывают план, но для обвинения нужен отдельный факт её действия в критическое окно.';
    const actions = form.querySelector('.case2317-actions');
    (actions || form).insertAdjacentElement(actions ? 'beforebegin' : 'beforeend', feedback);
    feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, true);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) if (node instanceof Element) scan(node.matches('[data-case407-app]') ? node : root);
    }
  }).observe(root, { childList: true, subtree: true });

  scan();
  window.ML407PlaytestUX = Object.freeze({ revision: '4.2', independentElenaActionRequired: true, pairedDecisionCopy: true });
})();