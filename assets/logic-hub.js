(() => {
  'use strict';

  const solvedKey = 'mysterylogic:logic:solved:v1';
  const getSolved = () => {
    try { return new Set(JSON.parse(localStorage.getItem(solvedKey) || '[]')); } catch { return new Set(); }
  };
  const saveSolved = (set) => {
    try { localStorage.setItem(solvedKey, JSON.stringify([...set])); } catch {}
  };
  const track = (eventName, metadata = {}, target = '') => {
    try { window.MysteryLogicFunnel?.track?.(eventName, metadata, target); } catch {}
  };

  const normalize = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '');

  function bindSolver(root) {
    const puzzleId = root.dataset.logicPuzzle || '';
    const answer = normalize(root.dataset.logicAnswer || '');
    const input = root.querySelector('[data-logic-answer-input]');
    const submit = root.querySelector('[data-logic-submit]');
    const feedback = root.querySelector('[data-logic-feedback]');
    const reveal = root.querySelector('[data-logic-reveal]');
    const hint = root.querySelector('[data-logic-hint]');
    if (!input || !submit || !answer) return;

    const solved = getSolved();
    if (solved.has(puzzleId)) {
      root.dataset.logicSolved = 'true';
      if (feedback) {
        feedback.textContent = 'Уже раскрыто. Можно решить ещё раз или открыть разбор.';
        feedback.classList.add('is-ok');
      }
    }

    const check = () => {
      const value = normalize(input.value);
      if (!value) {
        if (feedback) {
          feedback.textContent = 'Введите ответ.';
          feedback.className = 'logic-feedback is-bad';
        }
        return;
      }
      const ok = value === answer;
      if (feedback) {
        feedback.textContent = ok ? 'Верно. Решение единственное — отличный ход.' : 'Пока не сходится. Проверьте, использовали ли вы каждую подсказку.';
        feedback.className = `logic-feedback ${ok ? 'is-ok' : 'is-bad'}`;
      }
      track('logic_answer_attempt', { puzzle_id: puzzleId, correct: ok }, puzzleId);
      if (ok) {
        solved.add(puzzleId);
        saveSolved(solved);
        root.dataset.logicSolved = 'true';
        if (reveal) reveal.hidden = false;
        track('logic_complete', { puzzle_id: puzzleId }, puzzleId);
        updateProgress();
      }
    };

    submit.addEventListener('click', check);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') check();
    });
    hint?.addEventListener('click', () => {
      const target = root.querySelector('[data-logic-hint-copy]');
      if (target) target.hidden = !target.hidden;
      track('logic_hint_open', { puzzle_id: puzzleId }, puzzleId);
    });
    root.querySelector('[data-logic-solution-toggle]')?.addEventListener('click', () => {
      if (reveal) reveal.hidden = !reveal.hidden;
      track('logic_solution_open', { puzzle_id: puzzleId }, puzzleId);
    });
  }

  function updateProgress() {
    const solved = getSolved();
    document.querySelectorAll('[data-logic-progress]').forEach((node) => {
      const total = Number(node.dataset.logicTotal || 3);
      const count = [...solved].filter((id) => id.startsWith('logic:')).length;
      node.textContent = `${Math.min(count, total)} из ${total} раскрыто`;
    });
    document.querySelectorAll('[data-puzzle-card]').forEach((card) => {
      const id = card.dataset.puzzleCard;
      if (solved.has(id)) {
        card.dataset.solved = 'true';
        const badge = card.querySelector('[data-card-badge]');
        if (badge) badge.textContent = '✓ Раскрыто';
      }
    });
  }

  document.querySelectorAll('[data-logic-puzzle]').forEach(bindSolver);
  updateProgress();

  document.addEventListener('click', (event) => {
    const telegram = event.target.closest?.('[data-telegram-cta]');
    if (telegram) track('telegram_click', { placement: telegram.dataset.telegramCta || 'logic' }, 't.me/mysterylogic');
  }, true);
})();
