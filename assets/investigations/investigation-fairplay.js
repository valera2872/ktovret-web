(function (root) {
  'use strict';

  const core = root.MysteryLogicInvestigationCore;
  const definition = root.MysteryLogicInvestigationCase;
  if (!core || !definition) {
    return;
  }

  const storageKey = `mysterylogic:investigation:v1:${definition.id}`;

  function readState() {
    try {
      const raw = localStorage.getItem(storageKey);
      return core.normalizeState(definition, raw ? JSON.parse(raw) : null);
    } catch (_) {
      return core.createInitialState(definition);
    }
  }

  function showNotice(text) {
    const notice = document.querySelector('[data-mli-notice]');
    if (!notice) {
      return;
    }
    notice.textContent = text;
    notice.classList.add('is-visible');
    clearTimeout(showNotice.timer);
    showNotice.timer = setTimeout(() => notice.classList.remove('is-visible'), 4200);
  }

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target.closest?.('[data-audit-version]');
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();

      const state = readState();
      if (!state.selectedSuspectId) {
        showNotice('Сначала выберите, кого вы считаете исполнителем.');
        return;
      }

      const missing = core.missingProofs(definition, state, 'strong');
      if (missing.length > 0) {
        showNotice(`В вашей доказательной конструкции пока не подтверждено звено «${missing[0].label}». Это не оценка выбранной фамилии — только проверка приложенных материалов.`);
        return;
      }

      showNotice('Все критические звенья собраны из выбранных вами материалов. Совпадает ли с ними личность исполнителя, будет проверено только при итоговом предъявлении.');
    },
    true,
  );
})(typeof globalThis !== 'undefined' ? globalThis : window);
