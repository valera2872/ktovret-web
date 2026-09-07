const clone = (value) => structuredClone(value);
const unique = (values) => [...new Set(values)];
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

export const SOLO_ENGINE_SCHEMA_VERSION = 2;

export function createInitialSoloState(caseDef, options = {}) {
  const initialEvidence = new Set(caseDef.initialEvidence || []);
  const evidence = {};
  for (const item of caseDef.evidence || []) {
    evidence[item.id] = {
      unlocked: initialEvidence.has(item.id) || !item.unlockRule,
      opened: false,
      examined: false,
      addedToBoard: false,
      presentedTo: {},
      sections: {},
    };
    for (const section of item.sections || []) evidence[item.id].sections[section] = { unlocked: false, opened: false };
  }
  const characters = {};
  for (const character of caseDef.characters || []) {
    characters[character.id] = {
      state: 0,
      stress: 0,
      trust: 0,
      disclosureLevel: 0,
      evidenceExposure: [],
      contradictions: [],
      statementVersion: character.states?.[0]?.statementVersion || 1,
      confessionAvailable: false,
    };
  }
  const deductions = {};
  for (const deduction of caseDef.deductions || []) {
    deductions[deduction.id] = {
      available: !deduction.unlockRule,
      attempts: 0,
      result: 'untried',
      selectedChoice: null,
    };
  }
  const timeline = {};
  for (const fact of caseDef.timeline || []) timeline[fact.id] = { established: false, visible: false };
  const interactions = {};
  for (const interaction of caseDef.interactions || []) interactions[interaction.id] = { triggered: false };

  const state = {
    schemaVersion: SOLO_ENGINE_SCHEMA_VERSION,
    caseId: caseDef.id,
    caseVersion: caseDef.version,
    entitlement: options.entitlement || 'demo',
    milestones: unique(['CASE_STARTED', ...(options.milestones || [])]),
    facts: [],
    evidence,
    characters,
    deductions,
    timeline,
    interactions,
    proofClasses: {},
    hypotheses: [],
    hintsUsed: [],
    reconstruction: {},
    events: [],
    sequence: 0,
    completed: false,
  };
  return recomputeDerived(caseDef, state);
}

function presentedMatch(state, spec) {
  const evidenceId = typeof spec === 'string' ? spec : spec?.evidenceId;
  const characterId = typeof spec === 'object' ? spec?.characterId : null;
  if (!evidenceId || !state.evidence[evidenceId]) return false;
  if (!characterId) return Object.values(state.evidence[evidenceId].presentedTo || {}).some(Boolean);
  return Boolean(state.evidence[evidenceId].presentedTo?.[characterId]);
}

export function evaluateRule(rule, state, caseDef) {
  if (!rule) return true;
  if (Array.isArray(rule)) return rule.every((item) => evaluateRule(item, state, caseDef));
  if (rule.all) return asArray(rule.all).every((item) => evaluateRule(item, state, caseDef));
  if (rule.any) return asArray(rule.any).some((item) => evaluateRule(item, state, caseDef));
  if (rule.not) return !evaluateRule(rule.not, state, caseDef);
  if ('evidenceOpened' in rule) return Boolean(state.evidence[rule.evidenceOpened]?.opened);
  if ('evidenceUnlocked' in rule) return Boolean(state.evidence[rule.evidenceUnlocked]?.unlocked);
  if ('evidencePresented' in rule) return presentedMatch(state, rule.evidencePresented);
  if ('evidenceSectionUnlocked' in rule) {
    const spec = rule.evidenceSectionUnlocked;
    return Boolean(state.evidence[spec?.evidenceId]?.sections?.[spec?.section]?.unlocked);
  }
  if ('evidenceSectionOpened' in rule) {
    const spec = rule.evidenceSectionOpened;
    return Boolean(state.evidence[spec?.evidenceId]?.sections?.[spec?.section]?.opened);
  }
  if ('deductionConfirmed' in rule) return state.deductions[rule.deductionConfirmed]?.result === 'confirmed';
  if ('milestoneReached' in rule) return state.milestones.includes(rule.milestoneReached);
  if ('fact' in rule || 'customFact' in rule) return state.facts.includes(rule.fact || rule.customFact);
  if ('contradictionFound' in rule) {
    const spec = rule.contradictionFound;
    if (typeof spec === 'string') return Object.values(state.characters).some((c) => c.contradictions.includes(spec));
    return Boolean(state.characters[spec?.characterId]?.contradictions.includes(spec?.contradictionId));
  }
  if ('characterStateAtLeast' in rule) {
    const spec = rule.characterStateAtLeast;
    const characterId = Array.isArray(spec) ? spec[0] : spec?.characterId;
    const threshold = Number(Array.isArray(spec) ? spec[1] : spec?.state);
    return Number(state.characters[characterId]?.state || 0) >= threshold;
  }
  if ('timelineFactEstablished' in rule) return Boolean(state.timeline[rule.timelineFactEstablished]?.established);
  if ('entitlement' in rule) return asArray(rule.entitlement).includes(state.entitlement);
  if ('proofClass' in rule) return Boolean(state.proofClasses[rule.proofClass]);
  if ('interactionTriggered' in rule) return Boolean(state.interactions[rule.interactionTriggered]?.triggered);
  throw new Error(`solo_rule_unknown:${JSON.stringify(rule)}`);
}

function evidenceDefinition(caseDef, evidenceId) {
  return (caseDef.evidence || []).find((item) => item.id === evidenceId) || null;
}

export function isEvidenceAccessible(caseDef, state, evidenceId) {
  const runtime = state.evidence[evidenceId];
  const definition = evidenceDefinition(caseDef, evidenceId);
  if (!runtime?.unlocked || !definition) return false;
  return evaluateRule(definition.accessRule, state, caseDef);
}

export function isDeductionAccessible(caseDef, state, deductionId) {
  const runtime = state.deductions[deductionId];
  const definition = (caseDef.deductions || []).find((item) => item.id === deductionId);
  if (!runtime?.available || !definition) return false;
  return evaluateRule(definition.accessRule, state, caseDef);
}

function addUnique(list, value) {
  if (!list.includes(value)) list.push(value);
}

export function applyEffect(caseDef, state, effect) {
  if (!effect?.type) throw new Error('solo_effect_type_required');
  switch (effect.type) {
    case 'UNLOCK_EVIDENCE':
      if (!state.evidence[effect.evidenceId]) throw new Error(`solo_evidence_unknown:${effect.evidenceId}`);
      state.evidence[effect.evidenceId].unlocked = true;
      break;
    case 'UNLOCK_EVIDENCE_SECTION': {
      const entry = state.evidence[effect.evidenceId];
      if (!entry?.sections?.[effect.section]) throw new Error(`solo_evidence_section_unknown:${effect.evidenceId}:${effect.section}`);
      entry.sections[effect.section].unlocked = true;
      break;
    }
    case 'ADD_FACT':
      addUnique(state.facts, effect.id);
      break;
    case 'ADD_CONTRADICTION': {
      const character = state.characters[effect.characterId];
      if (!character) throw new Error(`solo_character_unknown:${effect.characterId}`);
      addUnique(character.contradictions, effect.contradictionId);
      break;
    }
    case 'SET_CHARACTER_STATE': {
      const character = state.characters[effect.characterId];
      if (!character) throw new Error(`solo_character_unknown:${effect.characterId}`);
      character.state = Math.max(character.state, Number(effect.state) || 0);
      break;
    }
    case 'SET_MILESTONE':
      addUnique(state.milestones, effect.id);
      break;
    case 'ESTABLISH_TIMELINE_FACT':
      if (!state.timeline[effect.id]) throw new Error(`solo_timeline_unknown:${effect.id}`);
      state.timeline[effect.id].established = true;
      break;
    case 'DISPROVE_HYPOTHESIS':
      for (const hypothesis of state.hypotheses) {
        const subjectOk = !effect.matcher?.subjectId || hypothesis.subjectId === effect.matcher.subjectId;
        const claimOk = !effect.matcher?.claim || hypothesis.claim === effect.matcher.claim;
        if (subjectOk && claimOk && hypothesis.status === 'active') {
          hypothesis.status = 'contradicted';
          hypothesis.contradictedBy = unique([...(hypothesis.contradictedBy || []), effect.by || 'engine']);
        }
      }
      break;
    case 'UNLOCK_RECONSTRUCTION':
      addUnique(state.milestones, 'RECONSTRUCTION_AVAILABLE');
      break;
    case 'SET_PROOF_CLASS':
      state.proofClasses[effect.id] = effect.value !== false;
      break;
    default:
      throw new Error(`solo_effect_unknown:${effect.type}`);
  }
}

function applyEffects(caseDef, state, effects = []) {
  for (const effect of effects) applyEffect(caseDef, state, effect);
}

function refreshEvidenceUnlocks(caseDef, state) {
  let changed = false;
  for (const item of caseDef.evidence || []) {
    if (state.evidence[item.id].unlocked) continue;
    if (evaluateRule(item.unlockRule, state, caseDef)) {
      state.evidence[item.id].unlocked = true;
      changed = true;
    }
  }
  return changed;
}

function refreshDeductionAvailability(caseDef, state) {
  let changed = false;
  for (const item of caseDef.deductions || []) {
    const next = evaluateRule(item.unlockRule, state, caseDef);
    if (next && !state.deductions[item.id].available) {
      state.deductions[item.id].available = true;
      changed = true;
    }
  }
  return changed;
}

function refreshCharacterStates(caseDef, state) {
  let changed = false;
  for (const def of caseDef.characters || []) {
    const runtime = state.characters[def.id];
    for (const candidate of def.states || []) {
      if (Number(candidate.id) <= runtime.state || !candidate.enterRule) continue;
      if (!evaluateRule(candidate.enterRule, state, caseDef)) continue;
      runtime.state = Number(candidate.id);
      runtime.statementVersion = candidate.statementVersion ?? runtime.statementVersion;
      runtime.disclosureLevel = candidate.disclosureLevel ?? runtime.disclosureLevel;
      applyEffects(caseDef, state, candidate.effects || []);
      changed = true;
    }
  }
  return changed;
}

function refreshProofClasses(caseDef, state) {
  let changed = false;
  for (const [id, def] of Object.entries(caseDef.proofClasses || {})) {
    const next = evaluateRule(def.satisfiedBy, state, caseDef);
    if (next && !state.proofClasses[id]) {
      state.proofClasses[id] = true;
      changed = true;
    }
  }
  return changed;
}

function refreshTimeline(caseDef, state) {
  let changed = false;
  for (const def of caseDef.timeline || []) {
    const runtime = state.timeline[def.id];
    const visible = evaluateRule(def.visibilityRule, state, caseDef);
    if (visible && !runtime.visible) {
      runtime.visible = true;
      runtime.established = true;
      changed = true;
    }
  }
  return changed;
}

function refreshMilestoneRules(caseDef, state) {
  let changed = false;
  for (const def of caseDef.milestoneRules || []) {
    if (state.milestones.includes(def.id)) continue;
    if (evaluateRule(def.when, state, caseDef)) {
      addUnique(state.milestones, def.id);
      applyEffects(caseDef, state, def.effects || []);
      changed = true;
    }
  }
  return changed;
}

export function recomputeDerived(caseDef, inputState) {
  const state = inputState;
  for (let pass = 0; pass < 50; pass += 1) {
    const changed = [
      refreshEvidenceUnlocks(caseDef, state),
      refreshDeductionAvailability(caseDef, state),
      refreshCharacterStates(caseDef, state),
      refreshProofClasses(caseDef, state),
      refreshTimeline(caseDef, state),
      refreshMilestoneRules(caseDef, state),
    ].some(Boolean);
    if (!changed) return state;
  }
  throw new Error('solo_recompute_did_not_converge');
}

function recordEvent(state, action, result = {}) {
  state.sequence += 1;
  state.events.push({ sequence: state.sequence, type: action.type, ...result });
}

export function processSoloAction(caseDef, inputState, action) {
  const state = clone(inputState);
  if (!action?.type) throw new Error('solo_action_type_required');

  switch (action.type) {
    case 'SET_ENTITLEMENT':
      state.entitlement = action.entitlement;
      if (['owned', 'club', 'admin'].includes(action.entitlement)) addUnique(state.milestones, 'PREMIUM_UNLOCKED');
      recordEvent(state, action, { entitlement: action.entitlement });
      break;

    case 'OPEN_EVIDENCE': {
      if (!isEvidenceAccessible(caseDef, state, action.evidenceId)) throw new Error(`solo_evidence_access_denied:${action.evidenceId}`);
      const item = state.evidence[action.evidenceId];
      item.opened = true;
      item.examined = true;
      recordEvent(state, action, { evidenceId: action.evidenceId });
      break;
    }

    case 'OPEN_EVIDENCE_SECTION': {
      const item = state.evidence[action.evidenceId];
      const section = item?.sections?.[action.section];
      if (!isEvidenceAccessible(caseDef, state, action.evidenceId) || !section?.unlocked) {
        throw new Error(`solo_evidence_section_access_denied:${action.evidenceId}:${action.section}`);
      }
      section.opened = true;
      recordEvent(state, action, { evidenceId: action.evidenceId, section: action.section });
      break;
    }

    case 'PRESENT_EVIDENCE': {
      const item = state.evidence[action.evidenceId];
      const character = state.characters[action.characterId];
      if (!isEvidenceAccessible(caseDef, state, action.evidenceId) || !item?.opened || !character) throw new Error('solo_present_invalid');
      item.presentedTo[action.characterId] = true;
      addUnique(character.evidenceExposure, action.evidenceId);
      recordEvent(state, action, { evidenceId: action.evidenceId, characterId: action.characterId });
      break;
    }

    case 'ATTEMPT_DEDUCTION': {
      const def = (caseDef.deductions || []).find((item) => item.id === action.deductionId);
      const runtime = state.deductions[action.deductionId];
      if (!def || !runtime?.available) throw new Error(`solo_deduction_unavailable:${action.deductionId}`);
      if (!isDeductionAccessible(caseDef, state, action.deductionId)) throw new Error(`solo_deduction_access_denied:${action.deductionId}`);
      runtime.attempts += 1;
      runtime.selectedChoice = action.choiceId ?? null;
      if (action.choiceId === def.correctChoice) {
        runtime.result = 'confirmed';
        applyEffects(caseDef, state, def.effectsOnConfirm || []);
      } else if ((def.contradictedChoices || []).includes(action.choiceId)) {
        runtime.result = 'contradicted';
      } else {
        runtime.result = 'insufficient';
      }
      recordEvent(state, action, { deductionId: action.deductionId, result: runtime.result });
      break;
    }

    case 'ADD_HYPOTHESIS':
      state.hypotheses.push({
        id: action.id || `H${state.hypotheses.length + 1}`,
        subjectId: action.subjectId || null,
        claim: action.claim,
        status: 'active',
        supportingEvidence: unique(action.supportingEvidence || []),
        contradictedBy: [],
      });
      recordEvent(state, action, { claim: action.claim });
      break;

    case 'TRIGGER_INTERACTION': {
      const interaction = (caseDef.interactions || []).find((item) => item.id === action.interactionId);
      const runtime = state.interactions[action.interactionId];
      if (!interaction || !runtime || runtime.triggered || !evaluateRule(interaction.unlockRule, state, caseDef) || !evaluateRule(interaction.accessRule, state, caseDef)) {
        throw new Error(`solo_interaction_unavailable:${action.interactionId}`);
      }
      runtime.triggered = true;
      applyEffects(caseDef, state, interaction.effects || []);
      recordEvent(state, action, { interactionId: action.interactionId });
      break;
    }

    case 'USE_HINT':
      addUnique(state.hintsUsed, action.hintId);
      recordEvent(state, action, { hintId: action.hintId });
      break;

    case 'SUBMIT_RECONSTRUCTION': {
      if (!state.milestones.includes('RECONSTRUCTION_AVAILABLE')) throw new Error('solo_reconstruction_locked');
      if (!evaluateRule(caseDef.reconstructionAccessRule, state, caseDef)) throw new Error('solo_reconstruction_access_denied');
      state.reconstruction = clone(action.answers || {});
      const complete = typeof caseDef.isReconstructionCorrect === 'function'
        ? caseDef.isReconstructionCorrect(state.reconstruction)
        : false;
      if (complete) {
        addUnique(state.milestones, 'RECONSTRUCTION_COMPLETE');
        addUnique(state.milestones, 'CASE_COMPLETED');
        state.completed = true;
      }
      recordEvent(state, action, { complete });
      break;
    }

    default:
      throw new Error(`solo_action_unknown:${action.type}`);
  }

  return recomputeDerived(caseDef, state);
}

export function listAvailableSoloActions(caseDef, state) {
  const actions = [];
  for (const item of caseDef.evidence || []) {
    const runtime = state.evidence[item.id];
    const accessible = isEvidenceAccessible(caseDef, state, item.id);
    if (accessible && !runtime.opened) actions.push({ type: 'OPEN_EVIDENCE', evidenceId: item.id });
    if (accessible && runtime.opened) {
      for (const section of item.sections || []) {
        if (runtime.sections?.[section]?.unlocked && !runtime.sections[section].opened) {
          actions.push({ type: 'OPEN_EVIDENCE_SECTION', evidenceId: item.id, section });
        }
      }
      for (const character of caseDef.characters || []) {
        if (!runtime.presentedTo[character.id]) actions.push({ type: 'PRESENT_EVIDENCE', evidenceId: item.id, characterId: character.id });
      }
    }
  }
  for (const deduction of caseDef.deductions || []) {
    const runtime = state.deductions[deduction.id];
    if (runtime?.available && runtime.result !== 'confirmed' && isDeductionAccessible(caseDef, state, deduction.id)) {
      for (const choice of deduction.choices || []) actions.push({ type: 'ATTEMPT_DEDUCTION', deductionId: deduction.id, choiceId: choice });
    }
  }
  for (const interaction of caseDef.interactions || []) {
    if (!state.interactions[interaction.id]?.triggered && evaluateRule(interaction.unlockRule, state, caseDef) && evaluateRule(interaction.accessRule, state, caseDef)) {
      actions.push({ type: 'TRIGGER_INTERACTION', interactionId: interaction.id });
    }
  }
  return actions;
}
