(() => {
  'use strict';

  const cfg = window.KtoVretWeb || {};
  const caseData = cfg.case || {};
  const root = document.querySelector('[data-ktv-root]');
  if (!root || !caseData.id) return;

  // Player-facing calibration from the first real web cohort.
  // Canonical answers and deduction logic stay untouched: this layer only
  // corrects expectations and removes avoidable presentation ambiguity.
  const CALIBRATION = {
    first_r3_001_four_archive_entries: { difficulty: 'Среднее', minutes: 6 },
    first_r3_002_unsynced_logs: { difficulty: 'Сложное', minutes: 7 },
    first_r3_003_five_folders_gap: { difficulty: 'Сложное', minutes: 6 },
    first_r3_004_laptop_two_exits: { difficulty: 'Среднее', minutes: 5 },
    first_r3_005_card_phone_route: { difficulty: 'Среднее', minutes: 4 },
    field_r4_009_calendar_month: { difficulty: 'Лёгкое', minutes: 5 },
    field_r4_010_bead_bracelet: { difficulty: 'Лёгкое', minutes: 4 },
    field_r3_001_four_lockers: { difficulty: 'Среднее', minutes: 5 },
    field_r3_002_courier_route: { difficulty: 'Среднее', minutes: 4 },
    field_r3_003_call_forwarding: { difficulty: 'Среднее', minutes: 5 },
    field_r3_004_five_folders: { difficulty: 'Среднее', minutes: 5 },
    field_r3_005_turnstile_balance: { difficulty: 'Среднее', minutes: 5 },
    field_r3_006_code_285: { difficulty: 'Среднее', minutes: 6 },
    field_r3_007_three_time_sources: { difficulty: 'Среднее', minutes: 5 },
    field_r3_008_bus_full_cycle: { difficulty: 'Среднее', minutes: 6 },
  };

  const calibration = CALIBRATION[caseData.id];
  if (calibration) {
    caseData.difficulty = calibration.difficulty;
    caseData.estimatedMinutes = calibration.minutes;
  }

  // Real players struggled disproportionately with case 002. The deduction is
  // sound, but its old timeline mixed source-clock timestamps and corrected
  // real timestamps in the same visual column. Keep the puzzle intact and make
  // every conversion explicit before the game runtime renders the timeline.
  if (caseData.id === 'first_r3_002_unsynced_logs' && Array.isArray(caseData.timeline)) {
    caseData.timeline = [
      { time: '19:08 → 19:12', title: 'Пакет ещё на месте', detail: 'Камера показывает 19:08; её часы отстают на 4 минуты, поэтому реальное время — 19:12.', source: 'Камера' },
      { time: '19:16 → 19:14', title: 'Сработал датчик', detail: 'Датчик показывает 19:16; он спешит на 2 минуты, поэтому реальное время — 19:14.', source: 'Датчик движения' },
      { time: '19:14 → 19:18', title: 'Пустой тамбур', detail: 'Камера показывает 19:14; после поправки это 19:18 реального времени.', source: 'Камера' },
      { time: '19:17', title: 'Вход Антона', detail: 'Турникет показывает точное реальное время.', source: 'Турникет' },
    ];
  }

  // Case 004 uses the same raw-camera/corrected-time mechanic. Its error rate is
  // lower, but the same notation should be consistent across the product.
  if (caseData.id === 'first_r3_004_laptop_two_exits' && Array.isArray(caseData.timeline)) {
    caseData.timeline = caseData.timeline.map((item) => {
      if (item?.source !== 'Камера') return item;
      return {
        ...item,
        time: '16:04 → 16:06',
        detail: 'Камера показывает 16:04; она отстаёт на 2 минуты, поэтому реальное время — 16:06.',
      };
    });
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