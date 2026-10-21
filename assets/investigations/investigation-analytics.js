(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  const core = root.MysteryLogicInvestigationCore;
  if (!definition || !core) return;

  const params = new URLSearchParams(location.search);
  if (params.has('previewEvidence') || params.has('previewResult')) return;

  const storageKey = `mysterylogic:investigation:v1:${definition.id}`;
  const analyticsKey = `mysterylogic:investigation:analytics:v1:${definition.id}`;

  function readState() {
    try {
      const raw = localStorage.getItem(storageKey);
      return core.normalizeState(definition, raw ? JSON.parse(raw) : null);
    } catch (_) {
      return core.createInitialState(definition);
    }
  }

  function readAnalyticsState() {
    try {
      return JSON.parse(sessionStorage.getItem(analyticsKey) || '{}');
    } catch (_) {
      return {};
    }
  }

  function writeAnalyticsState(value) {
    try { sessionStorage.setItem(analyticsKey, JSON.stringify(value)); } catch (_) {}
  }

  function track(event, payload) {
    const detail = {
      case_id: definition.id,
      case_type: 'advanced_investigation',
      language: 'ru',
      ...payload,
    };

    if (root.MysteryLogicAnalytics?.track) {
      root.MysteryLogicAnalytics.track(event, detail);
      return;
    }

    try {
      root.dataLayer = root.dataLayer || [];
      root.dataLayer.push({ event, ...detail });
    } catch (_) {}
    try {
      if (typeof root.gtag === 'function') root.gtag('event', event, detail);
    } catch (_) {}
    try {
      const counterId = Number(root.MYSTERYLOGIC_YM_COUNTER || 0);
      if (counterId > 0 && typeof root.ym === 'function') root.ym(counterId, 'reachGoal', event, detail);
    } catch (_) {}
    try {
      root.dispatchEvent(new CustomEvent('mysterylogic:analytics', { detail: { event, ...detail } }));
    } catch (_) {}
  }

  function statementSnapshot(state) {
    const facts = new Set(state.facts || []);
    const result = {};
    for (const character of definition.characters || []) {
      result[character.id] = core.statementFor(character, facts);
    }
    return result;
  }

  function emitStatementChanges(before, after) {
    if (!before || !after) return;
    for (const character of definition.characters || []) {
      if (before[character.id] && after[character.id] && before[character.id] !== after[character.id]) {
        track('investigation_statement_changed', { character_id: character.id });
      }
    }
  }

  let analyticsState = readAnalyticsState();
  let currentState = readState();
  let currentStatements = statementSnapshot(currentState);

  if (!analyticsState.viewTracked) {
    track('investigation_view', { resumed: currentState.performedActions?.length > 0 || currentState.viewedMaterials?.length > 0 ? 1 : 0 });
    analyticsState.viewTracked = true;
    writeAnalyticsState(analyticsState);
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest?.('button,a,[data-material],[data-action]');
    if (!target) return;

    if (target.matches('[data-mli-intro-start]')) {
      track('investigation_started', { resumed: 0 });
      return;
    }

    if (target.matches('[data-material]')) {
      const materialId = target.dataset.material || '';
      const wasViewed = (currentState.viewedMaterials || []).includes(materialId);
      track('investigation_material_opened', { material_id: materialId, first_open: wasViewed ? 0 : 1 });
      setTimeout(() => {
        currentState = readState();
        currentStatements = statementSnapshot(currentState);
      }, 0);
      return;
    }

    if (target.matches('[data-action]')) {
      const actionId = target.dataset.action || '';
      const action = (definition.actions || []).find((item) => item.id === actionId);
      track('investigation_action_performed', {
        action_id: actionId,
        character_id: action?.characterId || '',
      });
      const beforeStatements = currentStatements;
      setTimeout(() => {
        currentState = readState();
        const afterStatements = statementSnapshot(currentState);
        emitStatementChanges(beforeStatements, afterStatements);
        currentStatements = afterStatements;
      }, 0);
      return;
    }

    if (target.matches('[data-suspect]')) {
      const suspectId = target.dataset.suspect || '';
      track('investigation_hypothesis_changed', {
        suspect_id: suspectId,
        change_index: (currentState.hypothesisHistory || []).length + 1,
      });
      setTimeout(() => {
        currentState = readState();
        currentStatements = statementSnapshot(currentState);
      }, 0);
      return;
    }

    if (target.matches('[data-audit-version]')) {
      setTimeout(() => {
        const state = readState();
        const missing = core.missingProofs(definition, state, 'strong');
        track('investigation_theory_audited', {
          suspect_id: state.selectedSuspectId || '',
          missing_critical_links: missing.length,
          viewed_materials: state.viewedMaterials?.length || 0,
          performed_actions: state.performedActions?.length || 0,
        });
      }, 0);
      return;
    }

    if (target.matches('[data-finalize]')) {
      setTimeout(() => {
        const state = readState();
        track('investigation_completed', {
          result_tier: state.resultTier || '',
          suspect_id: state.selectedSuspectId || '',
          viewed_materials: state.viewedMaterials?.length || 0,
          performed_actions: state.performedActions?.length || 0,
          hypothesis_changes: state.hypothesisHistory?.length || 0,
        });
      }, 0);
    }
  }, true);

  root.MysteryLogicInvestigationAnalytics = Object.freeze({ track });
})(typeof globalThis !== 'undefined' ? globalThis : window);