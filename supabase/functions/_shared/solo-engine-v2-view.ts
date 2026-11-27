import {
  evaluateSoloRule,
  isSoloEvidenceAccessible,
  safeSoloPayload,
  type SoloAccessMode,
  type SoloRuntime,
  type SoloState,
} from './solo-engine-v2-runtime.ts';

// The first server runtime intentionally uses a conservative content policy.
// Story progress may remain visible after Club expiry, but protected copy must not.
// Until the package schema gains per-statement/timeline/proof access rules, demo mode
// falls back to each character's opening statement and withholds timeline/proof copy.
export function safeSoloClientPayload(runtime: SoloRuntime, state: SoloState, revision: number, accessMode: SoloAccessMode) {
  const base: any = safeSoloPayload(runtime, state, revision, accessMode);

  base.evidence = (base.evidence || []).map((item: any) => {
    if (item.accessible) return item;
    return {
      id: item.id,
      type: item.type,
      locationId: item.locationId,
      unlocked: true,
      accessible: false,
      opened: Boolean(item.opened),
      examined: Boolean(item.examined),
      presentedTo: [],
    };
  });

  base.deductions = (base.deductions || []).map((item: any) => {
    if (item.accessible) return item;
    return {
      id: item.id,
      available: true,
      accessible: false,
      attempts: Number(item.attempts || 0),
      result: item.result || 'untried',
    };
  });

  base.interactions = (base.interactions || []).map((item: any) => item.accessible
    ? item
    : { id: item.id, accessible: false });

  if (accessMode === 'demo') {
    const guestState: SoloState = { ...state, entitlement: 'demo' };
    base.characters = runtime.definition.characters.filter((character) => {
      const rule = character.states[0]?.enter_rule || null;
      return !rule || evaluateSoloRule(rule, guestState);
    }).map((character) => {
      const opening = character.states[0];
      const persisted = state.characters[character.id];
      return {
        id: character.id,
        name: character.name,
        role: character.role,
        state: opening.id,
        disclosureLevel: opening.disclosure_level,
        statementVersion: opening.statement_version,
        statement: character.statements[String(opening.statement_version)] || '',
        contradictionsFound: 0,
        evidenceExposure: (persisted?.evidence_exposure || []).filter((id) => isSoloEvidenceAccessible(runtime.definition, guestState, id)),
      };
    });
    // Guard all payload categories, including opaque identifiers and expired-session results.
    base.evidence = (base.evidence || []).filter((item: any) => item.accessible === true);
    base.deductions = (base.deductions || []).filter((item: any) => item.accessible === true);
    base.interactions = (base.interactions || []).filter((item: any) => item.accessible === true);
    base.timeline = [];
    base.proofClasses = [];
    base.reconstruction = null;
    base.flags = { ...base.flags, confessionObtained: false, reconstructionStoryUnlocked: false, reconstructionAccessible: false };
  }

  return base;
}
