(() => {
  'use strict';

  const cfg = window.KtoVretWeb || {};
  const caseData = cfg.case || {};
  const root = document.querySelector('[data-ktv-root]');
  if (!root || !caseData.id) return;

  // Player-facing calibration after a cognitive audit of the 15 free cases.
  // Canonical case logic is untouched: this layer only corrects expectations
  // about difficulty/time and removes author-facing reasoning taxonomy.
  const CALIBRATION = {
    field_r4_009_calendar_month: { difficulty: 'Лёгкое', minutes: 3 },
    first_r3_004_laptop_two_exits: { difficulty: 'Среднее', minutes: 5 },
    first_r3_005_card_phone_route: { difficulty: 'Среднее', minutes: 5 },
    field_r3_001_four_lockers: { difficulty: 'Среднее', minutes: 5 },
    field_r3_002_courier_route: { difficulty: 'Среднее', minutes: 5 },
    field_r3_003_call_forwarding: { difficulty: 'Среднее', minutes: 5 },
    field_r3_004_five_folders: { difficulty: 'Среднее', minutes: 5 },
    field_r3_005_turnstile_balance: { difficulty: 'Среднее', minutes: 5 },
    field_r3_006_code_285: { difficulty: 'Среднее', minutes: 5 },
    field_r3_007_three_time_sources: { difficulty: 'Среднее', minutes: 5 },
    field_r3_008_bus_full_cycle: { difficulty: 'Среднее', minutes: 5 },
  };

  const calibration = CALIBRATION[caseData.id];
  if (calibration) {
    caseData.difficulty = calibration.difficulty;
    caseData.estimatedMinutes = calibration.minutes;
  }

  const apply = () => {
    const chips = [...root.querySelectorAll('.ktv-hero .ktv-meta .ktv-chip')];
    if (chips[0] && calibration) chips[0].textContent = calibration.difficulty;

    // logicType is useful to authors/search copy, but labels such as
    // “остаток от деления” or “система ограничений” make the play surface
    // feel like a school worksheet. Keep category + difficulty only.
    if (chips.length >= 3) chips.slice(2).forEach((node) => node.remove());
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  apply();
})();
