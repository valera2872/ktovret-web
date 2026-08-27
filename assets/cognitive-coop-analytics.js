(() => {
  'use strict';

  const root = document.querySelector('[data-case2317-app],[data-case407-app],[data-casearia-app]');
  if (!root) return;

  const caseId = root.matches('[data-case407-app]') ? 'coop:407'
    : root.matches('[data-casearia-app]') ? 'coop:last-aria'
      : 'coop:2317';

  const stage = () => {
    const active = root.querySelector('[data-action="stage"].is-active');
    if (active?.dataset?.stage) return Number(active.dataset.stage) || 0;
    const ariaPackage = root.querySelector('.casearia-brief aside small')?.textContent || '';
    const match = ariaPackage.match(/(?:Пакет|Этап)\s+(\d+)/i);
    return match ? Number(match[1]) || 0 : 0;
  };

  const send = (action, label = '') => {
    const track = window.MysteryLogicFunnel?.track;
    if (typeof track !== 'function') {
      setTimeout(() => send(action, label), 250);
      return;
    }
    track('diagnostic_choice', {
      case_id: caseId,
      choice: `${caseId}:${String(action).slice(0, 90)}`,
      label: String(label || action).slice(0, 120),
      position: stage(),
    }, 'coop-cognitive');
  };

  document.addEventListener('click', (event) => {
    const node = event.target?.closest?.('[data-action]');
    if (!node || !root.contains(node)) return;
    const action = String(node.dataset.action || '');
    if (!['stage','hint','next-stage','handoff','decision','copy','back-stage','refresh-room'].includes(action)) return;
    send(action, node.textContent?.replace(/\s+/g, ' ').trim() || action);
  }, true);

  document.addEventListener('submit', (event) => {
    if (!root.contains(event.target)) return;
    if (event.target.matches('[data-final-form],.casearia-final-form')) send('final-submit', 'Проверил финальную версию');
    else if (event.target.matches('[data-decision-form]')) send('decision-submit', 'Проверил промежуточную версию');
  }, true);
})();
