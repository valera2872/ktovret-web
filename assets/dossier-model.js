(function initMysteryLogicDossier(globalScope, factory) {
  'use strict';

  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (globalScope) {
    globalScope.MysteryLogicDossier = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const makeCase = (data) => Object.freeze({
    ...data,
    achievementKey: `ktovret:achievement:v1:${data.id}`,
  });

  const cases = Object.freeze([
    makeCase({ id: 'first_r3_001_four_archive_entries', number: '001', title: 'Четыре входа в архив', storageKey: 'ktovret:web:demo:v4:first_r3_001_four_archive_entries', path: 'delo/chetyre-vhoda-v-arhiv/' }),
    makeCase({ id: 'first_r3_002_unsynced_logs', number: '002', title: 'Три несинхронных журнала', storageKey: 'ktovret:web:demo:v4:first_r3_002_unsynced_logs', path: 'delo/tri-nesinhronnyh-zhurnala/' }),
    makeCase({ id: 'first_r3_003_five_folders_gap', number: '003', title: 'Пять папок и пустое место', storageKey: 'ktovret:web:demo:v4:first_r3_003_five_folders_gap', path: 'delo/pyat-papok-i-pustoe-mesto/' }),
    makeCase({ id: 'first_r3_004_laptop_two_exits', number: '004', title: 'Ноутбук у двух выходов', storageKey: 'ktovret:web:demo:v4:first_r3_004_laptop_two_exits', path: 'delo/noutbuk-u-dvuh-vyhodov/' }),
    makeCase({ id: 'first_r3_005_card_phone_route', number: '005', title: 'Карта, телефон и восемь минут', storageKey: 'ktovret:web:demo:v4:first_r3_005_card_phone_route', path: 'delo/karta-telefon-i-vosem-minut/' }),
    makeCase({ id: 'volume1_066', number: '066', title: 'Запись до вскрытия контейнера', storageKey: 'ktovret:web:demo:v3:volume1_066', path: 'delo/zapis-do-vskrytiya-konteynera/' }),
  ]);

  const emptyStorage = Object.freeze({
    getItem: () => null,
    removeItem: () => undefined,
  });

  const parseState = (rawValue) => {
    if (!rawValue) return {};

    try {
      const value = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  };

  const getStorage = (storage) => storage || (typeof localStorage !== 'undefined' ? localStorage : emptyStorage);

  const safeGet = (source, key) => {
    try {
      return source.getItem(key);
    } catch {
      return null;
    }
  };

  const readRecords = (storage) => {
    const source = getStorage(storage);

    return cases.map((item) => ({
      ...item,
      state: parseState(safeGet(source, item.storageKey)),
      achievement: parseState(safeGet(source, item.achievementKey)),
    }));
  };

  const elapsedMinutes = (state) => {
    const startedAt = Number(state?.startedAt || 0);
    const solvedAt = Number(state?.solvedAt || 0);
    if (!startedAt || !solvedAt || solvedAt < startedAt) return 0;
    return Math.max(1, Math.round((solvedAt - startedAt) / 60000));
  };

  const rankForSolved = (solvedCount) => {
    if (solvedCount >= cases.length) return 'Эксперт Mystery Logic';
    if (solvedCount >= 5) return 'Старший следователь';
    if (solvedCount >= 3) return 'Следователь';
    if (solvedCount >= 1) return 'Младший аналитик';
    return 'Стажёр бюро';
  };

  const isFirstCompletionClean = (record) => {
    const achievement = record?.achievement || {};
    if (Object.prototype.hasOwnProperty.call(achievement, 'firstCompletionClean')) {
      return achievement.firstCompletionClean === true;
    }

    const state = record?.state || {};
    return state.solved === true
      && state.firstAnswerCorrect === true
      && Number(state.attempts || 0) === 1
      && Number(state.hintsUsed || 0) === 0;
  };

  const summarize = (records = readRecords()) => {
    const solvedRecords = records.filter((item) => item.state.solved === true);
    const activeCase = records.find((item) => item.state.accepted === true && item.state.solved !== true) || null;
    const firstUnsolved = records.find((item) => item.state.solved !== true) || null;
    const solvedCount = solvedRecords.length;
    const cleanCount = solvedRecords.filter(isFirstCompletionClean).length;
    const totalAttempts = solvedRecords.reduce((sum, item) => sum + Number(item.state.attempts || 0), 0);
    const totalHints = solvedRecords.reduce((sum, item) => sum + Number(item.state.hintsUsed || 0), 0);
    const totalMinutes = solvedRecords.reduce((sum, item) => sum + elapsedMinutes(item.state), 0);

    return {
      solvedCount,
      cleanCount,
      totalAttempts,
      totalHints,
      totalMinutes,
      activeCase,
      nextCase: activeCase || firstUnsolved || records[0] || null,
      allSolved: records.length > 0 && solvedCount === records.length,
      rank: rankForSolved(solvedCount),
      totalCases: records.length,
    };
  };

  const nextUnsolvedAfter = (records, currentId) => {
    if (!Array.isArray(records) || records.length === 0) return null;
    const currentIndex = records.findIndex((item) => item.id === currentId);
    if (currentIndex < 0) return records.find((item) => item.state.solved !== true) || null;

    const following = [...records.slice(currentIndex + 1), ...records.slice(0, currentIndex)];
    return following.find((item) => item.state.solved !== true) || null;
  };

  const normalizeRandom = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(0.999999999, Math.max(0, number));
  };

  const pickRandomCase = (records, randomValue = Math.random()) => {
    if (!Array.isArray(records) || records.length === 0) return null;
    const unsolved = records.filter((item) => item.state.solved !== true);
    const pool = unsolved.length ? unsolved : records;
    return pool[Math.floor(normalizeRandom(randomValue) * pool.length)] || pool[0] || null;
  };

  const clearProgress = (storage) => {
    const target = getStorage(storage);
    cases.forEach((item) => {
      try {
        target.removeItem(item.storageKey);
        target.removeItem(item.achievementKey);
      } catch {
        // Browsers can deny storage access in strict privacy modes.
      }
    });
  };

  const buildShareText = (summary) => {
    const result = summary || summarize();
    if (result.allSolved) {
      return `Я завершил «Первое досье» Mystery Logic: ${result.solvedCount} дел, ${result.cleanCount} чистых раскрытий. Сможете повторить?`;
    }
    return `Мой прогресс в «Первом досье» Mystery Logic: ${result.solvedCount} из ${result.totalCases} дел. Текущий ранг — ${result.rank}.`;
  };

  return Object.freeze({
    cases,
    parseState,
    readRecords,
    elapsedMinutes,
    rankForSolved,
    isFirstCompletionClean,
    summarize,
    nextUnsolvedAfter,
    pickRandomCase,
    clearProgress,
    buildShareText,
  });
});
