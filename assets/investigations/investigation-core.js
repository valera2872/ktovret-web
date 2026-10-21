(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MysteryLogicInvestigationCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function unique(values) {
    return Array.from(new Set(values || []));
  }

  function cloneState(state) {
    return {
      caseId: state.caseId,
      facts: unique(state.facts),
      viewedMaterials: unique(state.viewedMaterials),
      revealedMaterials: unique(state.revealedMaterials),
      performedActions: unique(state.performedActions),
      selectedSuspectId: state.selectedSuspectId || null,
      hypothesisHistory: Array.isArray(state.hypothesisHistory)
        ? state.hypothesisHistory.slice()
        : [],
      proofSelections: Object.fromEntries(
        Object.entries(state.proofSelections || {}).map(([key, value]) => [
          key,
          unique(value),
        ]),
      ),
      resultTier: state.resultTier || null,
      startedAt: state.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function createInitialState(definition) {
    return {
      caseId: definition.id,
      facts: unique(definition.initialFacts || []),
      viewedMaterials: [],
      revealedMaterials: unique(
        (definition.materials || [])
          .filter((material) => material.availableFromStart)
          .map((material) => material.id),
      ),
      performedActions: [],
      selectedSuspectId: null,
      hypothesisHistory: [],
      proofSelections: {},
      resultTier: null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function normalizeState(definition, raw) {
    if (!raw || raw.caseId !== definition.id) {
      return createInitialState(definition);
    }
    const state = cloneState(raw);
    const materialIds = new Set((definition.materials || []).map((item) => item.id));
    const actionIds = new Set((definition.actions || []).map((item) => item.id));
    const suspectIds = new Set((definition.suspects || []).map((item) => item.id));
    const proofIds = new Set((definition.proofFamilies || []).map((item) => item.id));

    state.viewedMaterials = state.viewedMaterials.filter((id) => materialIds.has(id));
    state.revealedMaterials = unique([
      ...state.revealedMaterials.filter((id) => materialIds.has(id)),
      ...(definition.materials || [])
        .filter((material) => material.availableFromStart)
        .map((material) => material.id),
    ]);
    state.performedActions = state.performedActions.filter((id) => actionIds.has(id));
    if (state.selectedSuspectId && !suspectIds.has(state.selectedSuspectId)) {
      state.selectedSuspectId = null;
    }
    state.proofSelections = Object.fromEntries(
      Object.entries(state.proofSelections)
        .filter(([proofId]) => proofIds.has(proofId))
        .map(([proofId, ids]) => [
          proofId,
          ids.filter((id) => materialIds.has(id)),
        ]),
    );
    return state;
  }

  function requirementsMet(facts, item) {
    const factSet = facts instanceof Set ? facts : new Set(facts || []);
    const all = item.requiresAllFacts || [];
    const any = item.requiresAnyFacts || [];
    if (!all.every((fact) => factSet.has(fact))) {
      return false;
    }
    return any.length === 0 || any.some((fact) => factSet.has(fact));
  }

  function availableMaterials(definition, state) {
    const revealed = new Set(state.revealedMaterials || []);
    return (definition.materials || []).filter(
      (material) => material.availableFromStart || revealed.has(material.id),
    );
  }

  function availableActions(definition, state) {
    const facts = new Set(state.facts || []);
    const done = new Set(state.performedActions || []);
    return (definition.actions || []).filter((action) => {
      if (done.has(action.id)) {
        return false;
      }
      if ((action.hideWhenAnyFacts || []).some((fact) => facts.has(fact))) {
        return false;
      }
      return requirementsMet(facts, action);
    });
  }

  function materialById(definition, id) {
    return (definition.materials || []).find((material) => material.id === id) || null;
  }

  function actionById(definition, id) {
    return (definition.actions || []).find((action) => action.id === id) || null;
  }

  function proofById(definition, id) {
    return (definition.proofFamilies || []).find((proof) => proof.id === id) || null;
  }

  function openMaterial(definition, state, materialId) {
    const material = materialById(definition, materialId);
    if (!material) {
      return cloneState(state);
    }
    const available = new Set(availableMaterials(definition, state).map((item) => item.id));
    if (!available.has(materialId)) {
      return cloneState(state);
    }
    const next = cloneState(state);
    next.viewedMaterials = unique([...next.viewedMaterials, materialId]);
    next.facts = unique([...next.facts, ...(material.grantsFacts || [])]);
    next.resultTier = null;
    return next;
  }

  function performAction(definition, state, actionId) {
    const action = actionById(definition, actionId);
    if (!action) {
      return { state: cloneState(state), action: null };
    }
    const available = new Set(availableActions(definition, state).map((item) => item.id));
    if (!available.has(actionId)) {
      return { state: cloneState(state), action: null };
    }
    const next = cloneState(state);
    next.performedActions = unique([...next.performedActions, actionId]);
    next.revealedMaterials = unique([
      ...next.revealedMaterials,
      ...(action.revealsMaterials || []),
    ]);
    next.facts = unique([...next.facts, ...(action.grantsFacts || [])]);
    next.resultTier = null;
    return { state: next, action };
  }

  function selectSuspect(state, suspectId) {
    const next = cloneState(state);
    if (next.selectedSuspectId !== suspectId) {
      next.selectedSuspectId = suspectId;
      next.hypothesisHistory = [...next.hypothesisHistory, suspectId];
      next.resultTier = null;
    }
    return next;
  }

  function statementFor(character, facts) {
    const factSet = facts instanceof Set ? facts : new Set(facts || []);
    let best = null;
    for (const candidate of character.statementStates || []) {
      const required = candidate.requiresAllFacts || [];
      if (required.every((fact) => factSet.has(fact))) {
        if (!best || required.length > (best.requiresAllFacts || []).length) {
          best = candidate;
        }
      }
    }
    return best ? best.text : character.initialStatement;
  }

  function proofSatisfied(proof, facts) {
    const factSet = facts instanceof Set ? facts : new Set(facts || []);
    if (!(proof.allOf || []).every((fact) => factSet.has(fact))) {
      return false;
    }
    for (const group of proof.anyOfGroups || []) {
      if (group.length > 0 && !group.some((fact) => factSet.has(fact))) {
        return false;
      }
    }
    return true;
  }

  function selectedEvidenceFacts(definition, state, proofId) {
    const selected = state.proofSelections?.[proofId] || [];
    const facts = [];
    for (const materialId of selected) {
      const material = materialById(definition, materialId);
      if (material) {
        facts.push(...(material.grantsFacts || []));
      }
    }
    return unique(facts);
  }

  function proofSatisfiedBySelection(definition, state, proofId) {
    const proof = proofById(definition, proofId);
    if (!proof) {
      return false;
    }
    return proofSatisfied(proof, selectedEvidenceFacts(definition, state, proofId));
  }

  function toggleEvidence(definition, state, proofId, materialId) {
    const next = cloneState(state);
    const proof = proofById(definition, proofId);
    const viewed = new Set(next.viewedMaterials || []);
    if (!proof || !viewed.has(materialId) || !materialById(definition, materialId)) {
      return next;
    }
    const current = new Set(next.proofSelections[proofId] || []);
    if (current.has(materialId)) {
      current.delete(materialId);
    } else {
      current.add(materialId);
    }
    next.proofSelections[proofId] = Array.from(current);
    next.resultTier = null;
    return next;
  }

  function missingProofs(definition, state, mode) {
    return (definition.proofFamilies || []).filter((proof) => {
      const required = mode === 'complete'
        ? proof.requiredForCompleteCase
        : proof.requiredForStrongCase;
      return required && !proofSatisfiedBySelection(definition, state, proof.id);
    });
  }

  function finalize(definition, state) {
    const next = cloneState(state);
    const culprit = (definition.suspects || []).find((suspect) => suspect.isCanonicalCulprit);
    if (!culprit || next.selectedSuspectId !== culprit.id) {
      next.resultTier = 'C';
      return next;
    }
    if (missingProofs(definition, next, 'strong').length > 0) {
      next.resultTier = 'B';
      return next;
    }
    next.resultTier = missingProofs(definition, next, 'complete').length === 0 ? 'S' : 'A';
    return next;
  }

  function progress(definition, state) {
    const materials = availableMaterials(definition, state);
    const total = definition.materials?.length || 0;
    const viewed = new Set(state.viewedMaterials || []).size;
    const performed = new Set(state.performedActions || []).size;
    return {
      availableMaterials: materials.length,
      totalMaterials: total,
      viewedMaterials: viewed,
      performedActions: performed,
      totalActions: definition.actions?.length || 0,
    };
  }

  function auditDefinition(definition) {
    const errors = [];
    const materialIds = new Set((definition.materials || []).map((item) => item.id));
    const characterIds = new Set((definition.characters || []).map((item) => item.id));
    const producedFacts = new Set(definition.initialFacts || []);

    for (const material of definition.materials || []) {
      for (const fact of material.grantsFacts || []) {
        producedFacts.add(fact);
      }
    }
    for (const action of definition.actions || []) {
      for (const fact of action.grantsFacts || []) {
        producedFacts.add(fact);
      }
      for (const materialId of action.revealsMaterials || []) {
        if (!materialIds.has(materialId)) {
          errors.push(`${action.id} reveals missing material ${materialId}`);
        }
      }
      if (action.characterId && !characterIds.has(action.characterId)) {
        errors.push(`${action.id} targets missing character ${action.characterId}`);
      }
      for (const fact of [
        ...(action.requiresAllFacts || []),
        ...(action.requiresAnyFacts || []),
        ...(action.hideWhenAnyFacts || []),
      ]) {
        if (!producedFacts.has(fact)) {
          errors.push(`${action.id} references unavailable fact ${fact}`);
        }
      }
    }
    for (const proof of definition.proofFamilies || []) {
      for (const fact of [
        ...(proof.allOf || []),
        ...((proof.anyOfGroups || []).flat()),
      ]) {
        if (!producedFacts.has(fact)) {
          errors.push(`${proof.id} requires unavailable fact ${fact}`);
        }
      }
    }
    return errors;
  }

  return {
    createInitialState,
    normalizeState,
    availableMaterials,
    availableActions,
    materialById,
    actionById,
    proofById,
    openMaterial,
    performAction,
    selectSuspect,
    statementFor,
    proofSatisfied,
    selectedEvidenceFacts,
    proofSatisfiedBySelection,
    toggleEvidence,
    missingProofs,
    finalize,
    progress,
    auditDefinition,
  };
});
