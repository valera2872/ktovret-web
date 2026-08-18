(function () {
  'use strict';

  const requested = new URLSearchParams(location.search).get('previewResult');
  if (!['S', 'A', 'B', 'C'].includes(requested)) return;

  const core = globalThis.MysteryLogicInvestigationCore;
  const definition = globalThis.MysteryLogicInvestigationCase;
  if (!core || !definition) return;

  let state = core.createInitialState(definition);
  let changed = true;
  let guard = 0;
  while (changed && guard < 100) {
    guard += 1;
    changed = false;
    for (const material of core.availableMaterials(definition, state)) {
      if (!state.viewedMaterials.includes(material.id)) {
        state = core.openMaterial(definition, state, material.id);
        changed = true;
      }
    }
    for (const action of core.availableActions(definition, state)) {
      const outcome = core.performAction(definition, state, action.id);
      if (outcome.action) {
        state = outcome.state;
        changed = true;
      }
    }
  }

  const attachProof = (proof) => {
    const requiredFacts = new Set([...(proof.allOf || []), ...((proof.anyOfGroups || []).flat())]);
    for (const material of definition.materials) {
      if (!state.viewedMaterials.includes(material.id)) continue;
      if ((material.grantsFacts || []).some((fact) => requiredFacts.has(fact))) {
        state = core.toggleEvidence(definition, state, proof.id, material.id);
      }
    }
  };

  if (requested === 'C') {
    state = core.selectSuspect(state, 'timur');
  } else {
    state = core.selectSuspect(state, 'timur');
    state = core.selectSuspect(state, 'roman');
    if (requested === 'A' || requested === 'S') {
      for (const proof of definition.proofFamilies) {
        if (requested === 'S' || proof.requiredForStrongCase) attachProof(proof);
      }
    }
  }

  state = core.finalize(definition, state);
  if (state.resultTier !== requested) {
    console.error(`Preview requested ${requested}, engine produced ${state.resultTier}`);
    return;
  }

  try {
    localStorage.setItem(`mysterylogic:investigation:v1:${definition.id}`, JSON.stringify(state));
  } catch (_) {}
})();
