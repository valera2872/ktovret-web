export const PARTNER_CASE_ID = 'MLP001_NE_PUBLIKOVAT_PREVIEW';
export const PARTNER_CASE_TITLE = 'Не публиковать';
export const PARTNER_CASE_PATH = '/ru/cases/ne-publikovat/';

export type PartnerRole = 'archive' | 'sources';
export type PartnerBoardType = 'fact' | 'contradiction' | 'hypothesis' | 'proven' | 'disproven';

export type PartnerEvidenceDef = {
  id: string;
  owner: PartnerRole;
  kind: 'document' | 'audio' | 'metadata' | 'forensic' | 'log';
  title: string;
  kicker: string;
  teaser: string;
  body: string;
  findings: { id: string; label: string }[];
};

export type PartnerBoardItem = {
  id: string;
  type: PartnerBoardType;
  label: string;
  source_role: PartnerRole | 'system';
  evidence_ids: string[];
  created_sequence: number;
};

export type PartnerEvidenceState = {
  unlocked: boolean;
  opened: boolean;
  findings_published: string[];
  presented_to: string[];
};

export type PartnerCharacterState = {
  available: boolean;
  state: number;
  statement_version: number;
  disclosure_level: number;
  global_stress: number;
  evidence_exposure: string[];
  contradictions: string[];
  trust: Record<PartnerRole, number>;
  cooperation_state: 'guarded' | 'cooperative';
};

export type PartnerState = {
  schema_version: 1;
  case_id: string;
  narrative_state: string;
  milestones: string[];
  facts: string[];
  evidence: Record<string, PartnerEvidenceState>;
  board: PartnerBoardItem[];
  deductions: Record<string, { result: 'untried' | 'confirmed' | 'contradicted' | 'insufficient'; attempts: number; selected: string | null }>;
  characters: { roman: PartnerCharacterState };
  sequence: number;
  completed: boolean;
};

export type PartnerAction = Record<string, unknown> & { type?: string };

const EVIDENCE: PartnerEvidenceDef[] = [
  {
    id: 'E01', owner: 'archive', kind: 'document', kicker: 'Дело №17-1148', title: 'Официальная сводка',
    teaser: 'Следствие квалифицировало смерть Нины Корнеевой как самоубийство.',
    body: `17 ноября в 20:53 сотрудником охраны обнаружено тело Нины Корнеевой у нижней площадки внутренней служебной лестницы фонда «Маяк». Причина смерти — травмы после падения. Следов присутствия посторонних лиц непосредственно на месте обнаружения не установлено. Коллеги описывали подавленное эмоциональное состояние. В материалах дела имеется личная аудиозапись, содержание которой было истолковано как прощальное сообщение. Итоговая квалификация: самоубийство.`,
    findings: [{ id: 'F01', label: 'Официальная версия: смерть Нины признана самоубийством.' }],
  },
  {
    id: 'E02', owner: 'sources', kind: 'audio', kicker: 'Звонок · 17 ноября · 18:32', title: 'Нина ↔ Павел',
    teaser: 'Обычный семейный разговор за несколько часов до смерти.',
    body: `Павел: «Ты всё-таки приедешь в субботу?» Нина: «Если переживу эту неделю». Павел смеётся: «Так всё плохо?» Нина: «На работе — да. Потом расскажу». Они обсуждают подарок матери, корм для кошки и встречу в субботу в 14:00. Нина заканчивает: «Только напомни утром». В контексте фраза «если переживу эту неделю» звучит как бытовое преувеличение, а не прощание.`,
    findings: [{ id: 'F02', label: 'За несколько часов до смерти Нина обсуждала конкретные планы на выходные.' }],
  },
  {
    id: 'E03', owner: 'archive', kind: 'forensic', kicker: 'СМЭ', title: 'Заключение судмедэксперта',
    teaser: 'В старом заключении есть отдельная травма, происхождение которой точно не установлено.',
    body: `Смерть наступила вследствие тяжёлой черепно-мозговой травмы при падении. На внутренней поверхности левого запястья обнаружен локальный кровоподтёк овальной формы приблизительно 34 × 17 мм. Комментарий следователя: «вероятно получен при падении». Отдельного механизма возникновения кровоподтёка экспертиза не устанавливала.`,
    findings: [{ id: 'F03', label: 'На левом запястье Нины был отдельный кровоподтёк неясного происхождения.' }],
  },
  {
    id: 'E04', owner: 'archive', kind: 'log', kicker: 'Цифровой след', title: 'Журнал печати',
    teaser: 'За 39 минут до встречи на лестнице Нина печатала внутренний финансовый аудит.',
    body: `17:21 — 2 страницы. 17:36 — 1 страница. 18:14 — 4 страницы — FIN_Q3_INTERNAL_AUDIT. 18:17 — 1 страница. Поиск по материалам старого уголовного дела: FIN_Q3_INTERNAL_AUDIT отсутствует.`,
    findings: [{ id: 'F04', label: 'Незадолго до смерти Нина распечатала внутренний финансовый аудит, отсутствующий в деле.' }],
  },
  {
    id: 'E05', owner: 'sources', kind: 'audio', kicker: 'Архив телеканала', title: 'Интервью Елены Мирской',
    teaser: 'Через неделю после смерти директор фонда отрицала связь Нины с финансовыми документами.',
    body: `Ведущий: «Нина работала с финансовыми документами фонда?» Елена: «Нет. Нина занималась операционной частью. Расчёты, аудит, бухгалтерия — совершенно не её участок». Ведущий: «То есть конфликтов из-за денег у неё быть не могло?» Елена: «Насколько мне известно — нет».`,
    findings: [{ id: 'F05', label: 'Елена утверждала, что Нина не занималась аудитом и финансовыми документами.' }],
  },
  {
    id: 'E06', owner: 'archive', kind: 'metadata', kicker: 'final_message.wav', title: 'Метаданные «прощальной записи»',
    teaser: 'Главный аудиофайл старого дела создан уже после смерти Нины.',
    body: `Имя: final_message.wav. Создан: 18 ноября, 11:43. Изменён: 18 ноября, 12:07. Длительность: 00:31. Нина Корнеева погибла вечером 17 ноября. Поздняя дата сама по себе ещё допускает экспорт, восстановление или перекодирование — она не доказывает монтаж содержания.`,
    findings: [{ id: 'F06', label: 'Файл «прощальной записи» создан после смерти Нины.' }],
  },
  {
    id: 'E07', owner: 'sources', kind: 'audio', kicker: 'Исходник 01', title: 'VOICE_01',
    teaser: 'Старая голосовая заметка Нины.',
    body: `Нина: «Я больше не могу смотреть, как эти счета проводят задним числом. Это уже не ошибка».`,
    findings: [{ id: 'F07', label: 'Фраза «Я больше не могу» существовала раньше и относилась к финансовым счетам.' }],
  },
  {
    id: 'E08', owner: 'sources', kind: 'audio', kicker: 'Исходник 02', title: 'VOICE_02',
    teaser: 'Ещё одна старая заметка с фразой из «прощального» файла.',
    body: `Нина: «Я устала объяснять одно и то же. Цифры не сходятся, потому что кто-то специально делает так, чтобы они не сходились».`,
    findings: [{ id: 'F08', label: 'Фраза «Я устала» существовала раньше и относилась к расхождениям в цифрах.' }],
  },
  {
    id: 'E09', owner: 'sources', kind: 'audio', kicker: 'Исходник 03', title: 'VOICE_03',
    teaser: 'Третья фраза «прощального» файла в исходном контексте.',
    body: `Нина: «Это должно закончиться. В понедельник я отдам всё внешнему аудитору».`,
    findings: [{ id: 'F09', label: 'Фраза «Это должно закончиться» относилась к передаче материалов аудитору.' }],
  },
  {
    id: 'E10', owner: 'archive', kind: 'document', kicker: 'Invoice №4839', title: '€1 400 · Vedenin Audio Services',
    teaser: 'Фонд заплатил Роману на следующий день после смерти Нины.',
    body: `Дата: 18 ноября. Получатель: Vedenin Audio Services. Сумма: €1 400. Назначение: Emergency audio restoration / media processing. Заказчик: Mayak Foundation. Это связывает Романа с аудиоматериалами, но само по себе не доказывает, что именно он сделал с записью.`,
    findings: [{ id: 'F10', label: 'На следующий день после смерти фонд заплатил Роману €1 400 за срочную обработку аудио.' }],
  },
  {
    id: 'E11', owner: 'archive', kind: 'log', kicker: 'Проверка алиби', title: 'Доступ и мобильные данные Романа',
    teaser: 'Человек, который подделывал аудио, физически отсутствовал в здании вечером смерти.',
    body: `Последнее использование пропуска Романа в фонде 17 ноября — 15:12. После этого его пропуск в здании не фиксировался. Сотовые данные вечером помещают его в другом районе города. Эти данные не оправдывают фальсификацию аудио, но серьёзно противоречат версии, что Роман лично столкнул Нину на лестнице.`,
    findings: [{ id: 'F11', label: 'Роман отсутствовал в здании фонда в момент смерти Нины.' }],
  },
];

const ROMAN_STATEMENTS: Record<number, string> = {
  1: `Вы почти не знали Нину. Несколько раз пересекались в фонде, где вы делали звук для мероприятий. Вы знаете о существовании «прощальной записи», но утверждаете: «К её созданию я отношения не имел». Вы не называете Елену и не признаёте работу с этим файлом.`,
  2: `Вам уже предъявили материальный след, связывающий вас с аудио. Теперь вы признаёте, что фонд платил вам за обработку нескольких файлов, но настаиваете: это была обычная реставрация. На прямой вопрос о монтаже отвечаете уклончиво.`,
  3: `Вы уже понимаете, что следователи доказали происхождение фраз и связали вас с оплатой. Вы признаёте, что получили исходные голосовые файлы и «приводили материал в порядок», но всё ещё избегаете слова «сфабриковал» и пытаетесь утверждать, что голос-то настоящий.`,
  4: `Основная ложь разрушена. Вы признаёте: «Да, я собирал этот файл. Но Нина уже была мертва. Мне сказали, что она покончила с собой». Вы подчёркиваете, что не убивали Нину и в тот вечер не находились в здании. Имя заказчика пока без адвоката не называете.`,
};

const DEDUCTIONS = {
  D_FINANCE_CONTRADICTION: {
    prompt: 'Какое противоречие следует из журнала печати и интервью Елены?',
    options: [
      ['finance_conflict', 'Нина работала с финансовым аудитом, хотя Елена утверждала обратное.'],
      ['no_conflict', 'Документы подтверждают слова Елены.'],
    ],
    expected: 'finance_conflict',
  },
  D_AUDIO_FABRICATION: {
    prompt: 'Какое объяснение лучше всего соответствует дате файла и найденным исходным фразам?',
    options: [
      ['prepared', 'Нина заранее подготовила прощальное сообщение.'],
      ['damaged', 'Файл просто случайно повредился.'],
      ['montage', 'После смерти Нины кто-то собрал новую запись из более ранних материалов.'],
      ['unknown', 'Никакого вывода сделать нельзя.'],
    ],
    expected: 'montage',
  },
  D_ROMAN_MURDER: {
    prompt: 'Что меняет проверка алиби Романа?',
    options: [
      ['still_killer', 'Ничего: монтаж автоматически доказывает убийство.'],
      ['not_present', 'Роман связан с фальсификацией, но версия о его личном участии в падении Нины серьёзно ослабевает.'],
    ],
    expected: 'not_present',
  },
} as const;

function unique(values: string[]) { return [...new Set(values)]; }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, Math.round(value))); }
function addUnique(list: string[], value: string) { if (value && !list.includes(value)) list.push(value); }
function evidenceDef(id: string) { return EVIDENCE.find((item) => item.id === id) || null; }
function roleForMember(rawRole: string): PartnerRole { return rawRole === 'creator' ? 'archive' : 'sources'; }

export function mapDuelRoleToPartner(rawRole: string): PartnerRole { return roleForMember(rawRole); }
export function partnerEvidenceDefinitions() { return EVIDENCE.map((item) => structuredClone(item)); }
export function romanStatement(version: number) { return ROMAN_STATEMENTS[version] || ROMAN_STATEMENTS[1]; }
export function partnerDeductionDefinitions() { return structuredClone(DEDUCTIONS); }

function newEvidenceState(): Record<string, PartnerEvidenceState> {
  const out: Record<string, PartnerEvidenceState> = {};
  for (const item of EVIDENCE) out[item.id] = { unlocked: false, opened: false, findings_published: [], presented_to: [] };
  for (const id of ['E01','E02','E03','E04','E05']) out[id].unlocked = true;
  return out;
}

export function createInitialPartnerState(): PartnerState {
  return {
    schema_version: 1,
    case_id: PARTNER_CASE_ID,
    narrative_state: 'STATE_02_SUICIDE_CASE',
    milestones: ['CASE_STARTED'],
    facts: [],
    evidence: newEvidenceState(),
    board: [],
    deductions: Object.fromEntries(Object.keys(DEDUCTIONS).map((id) => [id, { result: 'untried', attempts: 0, selected: null }])),
    characters: {
      roman: {
        available: false,
        state: 0,
        statement_version: 1,
        disclosure_level: 0,
        global_stress: 26,
        evidence_exposure: [],
        contradictions: [],
        trust: { archive: 35, sources: 35 },
        cooperation_state: 'guarded',
      },
    },
    sequence: 0,
    completed: false,
  };
}

export function normalizePartnerState(value: unknown): PartnerState {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
  if (Number(raw.schema_version) !== 1 || raw.case_id !== PARTNER_CASE_ID) return createInitialPartnerState();
  const fresh = createInitialPartnerState();
  fresh.narrative_state = typeof raw.narrative_state === 'string' ? raw.narrative_state.slice(0, 80) : fresh.narrative_state;
  fresh.milestones = unique(Array.isArray(raw.milestones) ? raw.milestones.filter((v: any) => typeof v === 'string').slice(0, 100) : fresh.milestones);
  fresh.facts = unique(Array.isArray(raw.facts) ? raw.facts.filter((v: any) => typeof v === 'string').slice(0, 200) : []);
  fresh.sequence = Number.isInteger(raw.sequence) && raw.sequence >= 0 ? raw.sequence : 0;
  fresh.completed = Boolean(raw.completed);
  for (const item of EVIDENCE) {
    const src = raw.evidence?.[item.id] || {};
    const dst = fresh.evidence[item.id];
    dst.unlocked = Boolean(src.unlocked) || dst.unlocked;
    dst.opened = Boolean(src.opened);
    dst.findings_published = unique(Array.isArray(src.findings_published) ? src.findings_published.filter((v: any) => typeof v === 'string') : []);
    dst.presented_to = unique(Array.isArray(src.presented_to) ? src.presented_to.filter((v: any) => typeof v === 'string') : []);
  }
  fresh.board = Array.isArray(raw.board) ? raw.board.slice(0, 200).map((item: any) => ({
    id: String(item?.id || '').slice(0, 100),
    type: ['fact','contradiction','hypothesis','proven','disproven'].includes(item?.type) ? item.type : 'fact',
    label: String(item?.label || '').slice(0, 600),
    source_role: ['archive','sources','system'].includes(item?.source_role) ? item.source_role : 'system',
    evidence_ids: Array.isArray(item?.evidence_ids) ? item.evidence_ids.filter((v: any) => typeof v === 'string').slice(0, 20) : [],
    created_sequence: Number(item?.created_sequence) || 0,
  })).filter((item: PartnerBoardItem) => item.id && item.label) : [];
  for (const id of Object.keys(DEDUCTIONS)) {
    const src = raw.deductions?.[id] || {};
    fresh.deductions[id] = {
      result: ['untried','confirmed','contradicted','insufficient'].includes(src.result) ? src.result : 'untried',
      attempts: Number.isInteger(src.attempts) ? Math.max(0, src.attempts) : 0,
      selected: typeof src.selected === 'string' ? src.selected.slice(0, 80) : null,
    };
  }
  const rc = raw.characters?.roman || {};
  fresh.characters.roman = {
    available: Boolean(rc.available),
    state: clamp(Number(rc.state) || 0, 0, 10),
    statement_version: clamp(Number(rc.statement_version) || 1, 1, 10),
    disclosure_level: clamp(Number(rc.disclosure_level) || 0, 0, 5),
    global_stress: clamp(Number(rc.global_stress) || 26, 0, 100),
    evidence_exposure: unique(Array.isArray(rc.evidence_exposure) ? rc.evidence_exposure.filter((v: any) => typeof v === 'string') : []),
    contradictions: unique(Array.isArray(rc.contradictions) ? rc.contradictions.filter((v: any) => typeof v === 'string') : []),
    trust: {
      archive: clamp(Number(rc.trust?.archive) || 35, 0, 100),
      sources: clamp(Number(rc.trust?.sources) || 35, 0, 100),
    },
    cooperation_state: rc.cooperation_state === 'cooperative' ? 'cooperative' : 'guarded',
  };
  return recomputePartnerState(fresh);
}

function boardHas(state: PartnerState, id: string) { return state.board.some((item) => item.id === id); }
function addBoard(state: PartnerState, item: Omit<PartnerBoardItem, 'created_sequence'>) {
  if (boardHas(state, item.id)) return;
  state.sequence += 1;
  state.board.push({ ...item, created_sequence: state.sequence });
}
function unlock(state: PartnerState, ...ids: string[]) { for (const id of ids) if (state.evidence[id]) state.evidence[id].unlocked = true; }

export function recomputePartnerState(input: PartnerState): PartnerState {
  const state = input;
  if (state.milestones.includes('ELENA_FINANCE_CONTRADICTION')) unlock(state, 'E06');
  if (state.facts.includes('F06')) unlock(state, 'E07','E08','E09');
  if (state.milestones.includes('AUDIO_FABRICATION_PROVEN')) {
    unlock(state, 'E10');
    state.characters.roman.available = true;
    state.narrative_state = 'STATE_05_ROMAN';
  }

  const roman = state.characters.roman;
  const exposed = new Set(roman.evidence_exposure);
  const sourceShown = ['E07','E08','E09'].some((id) => exposed.has(id));
  let targetState = 0;
  if (exposed.has('E10') || sourceShown) targetState = 1;
  if (exposed.has('E10') && sourceShown && state.milestones.includes('AUDIO_FABRICATION_PROVEN')) targetState = 2;
  if (roman.contradictions.includes('ROMAN_DENIED_AUDIO_ROLE')) targetState = 3;
  if (targetState > roman.state) roman.state = targetState;
  roman.statement_version = Math.min(4, roman.state + 1);
  roman.disclosure_level = roman.state >= 3 ? 3 : roman.state;
  if (roman.state >= 3) {
    addUnique(state.milestones, 'ROMAN_CONFESSED_EDIT');
    unlock(state, 'E11');
  }
  if (state.facts.includes('F11')) state.narrative_state = 'STATE_06_ROMAN_ALIBI';
  if (state.milestones.includes('ROMAN_MURDER_THEORY_WEAKENED')) {
    addUnique(state.milestones, 'VERTICAL_SLICE_COMPLETE');
    state.narrative_state = 'STATE_06_ROMAN_ALIBI';
  }
  return state;
}

function requireOwnedEvidence(state: PartnerState, role: PartnerRole, evidenceId: string) {
  const def = evidenceDef(evidenceId);
  if (!def || def.owner !== role || !state.evidence[evidenceId]?.unlocked) throw new Error('partner_evidence_access_denied');
  return def;
}

function deductionAvailable(state: PartnerState, id: string) {
  if (id === 'D_FINANCE_CONTRADICTION') return state.facts.includes('F04') && state.facts.includes('F05');
  if (id === 'D_AUDIO_FABRICATION') return ['F06','F07','F08','F09'].every((fact) => state.facts.includes(fact));
  if (id === 'D_ROMAN_MURDER') return state.facts.includes('F11');
  return false;
}

export function processPartnerAction(input: PartnerState, role: PartnerRole, action: PartnerAction): PartnerState {
  const state = normalizePartnerState(structuredClone(input));
  if (state.completed) throw new Error('partner_case_completed');
  const type = String(action.type || '').trim().toUpperCase();
  if (!type || type === 'SNAPSHOT' || type === 'START') return state;

  if (type === 'OPEN_EVIDENCE') {
    const id = String(action.evidence_id || '').trim();
    requireOwnedEvidence(state, role, id);
    state.evidence[id].opened = true;
    return recomputePartnerState(state);
  }

  if (type === 'PUBLISH_FINDING') {
    const id = String(action.evidence_id || '').trim();
    const findingId = String(action.finding_id || '').trim();
    const def = requireOwnedEvidence(state, role, id);
    if (!state.evidence[id].opened) throw new Error('partner_evidence_not_opened');
    const finding = def.findings.find((item) => item.id === findingId);
    if (!finding) throw new Error('partner_finding_invalid');
    addUnique(state.evidence[id].findings_published, findingId);
    addUnique(state.facts, findingId);
    addBoard(state, { id: findingId, type: 'fact', label: finding.label, source_role: role, evidence_ids: [id] });
    return recomputePartnerState(state);
  }

  if (type === 'ATTEMPT_DEDUCTION') {
    const id = String(action.deduction_id || '').trim() as keyof typeof DEDUCTIONS;
    const selected = String(action.selected || '').trim();
    const def = DEDUCTIONS[id];
    if (!def) throw new Error('partner_deduction_invalid');
    const rt = state.deductions[id];
    if (rt.result === 'confirmed') return state;
    rt.attempts += 1;
    rt.selected = selected;
    if (!deductionAvailable(state, id)) {
      rt.result = 'insufficient';
      return state;
    }
    if (selected !== def.expected) {
      rt.result = 'contradicted';
      return state;
    }
    rt.result = 'confirmed';
    if (id === 'D_FINANCE_CONTRADICTION') {
      addUnique(state.milestones, 'ELENA_FINANCE_CONTRADICTION');
      addBoard(state, { id: 'C01', type: 'contradiction', label: 'Нина работала с финансовым аудитом, хотя Елена публично утверждала обратное.', source_role: 'system', evidence_ids: ['E04','E05'] });
      state.narrative_state = 'STATE_03_AUDIO_SUSPICIOUS';
    }
    if (id === 'D_AUDIO_FABRICATION') {
      addUnique(state.milestones, 'AUDIO_FABRICATION_PROVEN');
      addBoard(state, { id: 'P_AUDIO', type: 'proven', label: '«Прощальная запись» была собрана после смерти Нины из более ранних голосовых материалов.', source_role: 'system', evidence_ids: ['E06','E07','E08','E09'] });
      state.narrative_state = 'STATE_04_AUDIO_FABRICATED';
    }
    if (id === 'D_ROMAN_MURDER') {
      addUnique(state.milestones, 'ROMAN_MURDER_THEORY_WEAKENED');
      addBoard(state, { id: 'D_ROMAN_KILLER', type: 'disproven', label: 'Роман связан с фальсификацией, но данные о местоположении серьёзно противоречат версии, что он лично столкнул Нину.', source_role: 'system', evidence_ids: ['E10','E11'] });
    }
    return recomputePartnerState(state);
  }

  if (type === 'PRESENT_EVIDENCE') {
    const evidenceId = String(action.evidence_id || '').trim();
    const characterId = String(action.character_id || '').trim();
    if (characterId !== 'roman' || !state.characters.roman.available) throw new Error('partner_character_unavailable');
    requireOwnedEvidence(state, role, evidenceId);
    if (!state.evidence[evidenceId].opened) throw new Error('partner_evidence_not_opened');
    addUnique(state.evidence[evidenceId].presented_to, characterId);
    addUnique(state.characters.roman.evidence_exposure, evidenceId);
    state.characters.roman.global_stress = clamp(state.characters.roman.global_stress + 18, 0, 100);
    return recomputePartnerState(state);
  }

  if (type === 'CHALLENGE_ROMAN') {
    const roman = state.characters.roman;
    if (!roman.available || roman.state < 2) throw new Error('partner_challenge_unavailable');
    addUnique(roman.contradictions, 'ROMAN_DENIED_AUDIO_ROLE');
    roman.global_stress = clamp(roman.global_stress + 15, 0, 100);
    addBoard(state, { id: 'C_ROMAN_01', type: 'contradiction', label: 'Роман сначала отрицал участие в создании записи, а после предъявления материалов признал работу с исходниками.', source_role: 'system', evidence_ids: roman.evidence_exposure.slice() });
    return recomputePartnerState(state);
  }

  throw new Error('partner_action_invalid');
}

export function safePartnerView(stateInput: PartnerState, role: PartnerRole, partner: { joined: boolean; name: string | null }, revision: number) {
  const state = normalizePartnerState(stateInput);
  const evidence = EVIDENCE.filter((item) => item.owner === role && state.evidence[item.id]?.unlocked).map((item) => ({
    id: item.id,
    kind: item.kind,
    kicker: item.kicker,
    title: item.title,
    teaser: item.teaser,
    body: state.evidence[item.id].opened ? item.body : '',
    opened: state.evidence[item.id].opened,
    findings: item.findings.map((finding) => ({ ...finding, published: state.evidence[item.id].findings_published.includes(finding.id) })),
    presentedToRoman: state.evidence[item.id].presented_to.includes('roman'),
  }));
  const roman = state.characters.roman;
  return {
    caseId: PARTNER_CASE_ID,
    title: PARTNER_CASE_TITLE,
    role,
    roleLabel: role === 'archive' ? 'АРХИВ' : 'ИСТОЧНИКИ',
    partner,
    revision,
    narrativeState: state.narrative_state,
    milestones: state.milestones,
    board: state.board,
    evidence,
    deductions: Object.fromEntries(Object.entries(DEDUCTIONS).map(([id, def]) => [id, {
      id,
      prompt: def.prompt,
      options: def.options.map(([value,label]) => ({ value, label })),
      available: deductionAvailable(state, id),
      result: state.deductions[id].result,
      attempts: state.deductions[id].attempts,
    }])),
    roman: {
      available: roman.available,
      disclosureLevel: roman.disclosure_level,
      stressBand: roman.global_stress >= 86 ? 'crisis' : roman.global_stress >= 71 ? 'high' : roman.global_stress >= 51 ? 'defensive' : roman.global_stress >= 26 ? 'cautious' : 'calm',
      statementVersion: roman.statement_version,
      canChallenge: roman.state >= 2 && !roman.contradictions.includes('ROMAN_DENIED_AUDIO_ROLE'),
      exposedCount: roman.evidence_exposure.length,
    },
    sliceComplete: state.milestones.includes('VERTICAL_SLICE_COMPLETE'),
  };
}

export function romanSpeakingContext(stateInput: PartnerState) {
  const state = normalizePartnerState(stateInput);
  const roman = state.characters.roman;
  const shown = roman.evidence_exposure.map((id) => evidenceDef(id)).filter(Boolean).map((item) => ({ id: item!.id, title: item!.title, body: item!.body }));
  return {
    available: roman.available,
    statementVersion: roman.statement_version,
    statement: romanStatement(roman.statement_version),
    stress: roman.global_stress,
    disclosureLevel: roman.disclosure_level,
    contradictions: roman.contradictions.slice(),
    shown,
  };
}
