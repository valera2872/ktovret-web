(() => {
  'use strict';

  const send = (choice, metadata = {}) => {
    const track = window.MysteryLogicFunnel?.track;
    if (typeof track !== 'function') {
      setTimeout(() => send(choice, metadata), 250);
      return;
    }
    track('diagnostic_choice', {
      choice,
      case_id: 'solo:407',
      ...metadata,
    }, 'solo-407-cognitive');
  };

  window.addEventListener('ml:solo_evidence_open', (event) => {
    const id = String(event.detail?.evidenceId || '').slice(0, 80);
    if (id) send(`evidence:${id}`, { label: 'Открыл материал' });
  });

  window.addEventListener('ml:solo_request', (event) => {
    const id = String(event.detail?.evidenceId || '').slice(0, 80);
    if (id) send(`request:${id}`, { label: 'Запросил дополнительный материал' });
  });

  window.addEventListener('ml:solo_hint', (event) => {
    const stage = Number(event.detail?.stage || 0);
    const number = Number(event.detail?.stageHintNumber || 0);
    send('hint', {
      label: number ? `Подсказка ${number}` : 'Подсказка',
      position: stage,
    });
  });

  window.addEventListener('ml:solo_checkpoint', (event) => {
    const stage = Number(event.detail?.stage || 0);
    const passed = event.detail?.passed === true;
    send(`checkpoint:${passed ? 'passed' : 'failed'}`, {
      label: passed ? 'Контрольная точка пройдена' : 'Ошибка на контрольной точке',
      position: stage,
    });
  });

  document.addEventListener('click', (event) => {
    const nav = event.target?.closest?.('[data-stage-nav]');
    if (!nav || !document.querySelector('[data-solo407-app]')) return;
    const stage = Number(nav.dataset.stageNav || 0);
    if (stage) send('stage:navigate', { label: 'Перешёл к этапу', position: stage });
  }, true);
})();
