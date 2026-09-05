(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MysteryLogicInterrogationCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normalizeQuestion(value) {
    return String(value || '')
      .toLocaleLowerCase('ru-RU')
      .replaceAll('ё', 'е')
      .replace(/[^a-zа-я0-9.:-]+/gi, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function requirementsMet(facts, item) {
    const factSet = facts instanceof Set ? facts : new Set(facts || []);
    const all = item?.requiresAllFacts || [];
    const any = item?.requiresAnyFacts || [];
    return all.every((fact) => factSet.has(fact))
      && (any.length === 0 || any.some((fact) => factSet.has(fact)));
  }

  function topicById(contract, topicId) {
    return (contract?.topics || []).find((topic) => topic.id === topicId) || null;
  }

  function classifyLocal(contract, question) {
    const normalized = normalizeQuestion(question);
    const fallback = contract?.fallbackTopicId || 'unknown';
    if (!normalized) return fallback;

    let bestId = fallback;
    let bestScore = 0;
    for (const topic of contract?.topics || []) {
      if (topic.id === fallback) continue;
      let score = 0;
      for (const keyword of topic.keywords || []) {
        const candidate = normalizeQuestion(keyword);
        if (!candidate || !normalized.includes(candidate)) continue;
        score += candidate.includes(' ') || candidate.length >= 8 ? 3 : 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestId = topic.id;
      }
    }
    return bestId;
  }

  function bestStage(topic, facts) {
    let selected = null;
    let selectedWeight = -1;
    for (const stage of topic?.stages || []) {
      if (!requirementsMet(facts, stage)) continue;
      const weight = (stage.requiresAllFacts || []).length * 2 + (stage.requiresAnyFacts || []).length;
      if (weight > selectedWeight) {
        selected = stage;
        selectedWeight = weight;
      }
    }
    return selected;
  }

  function responseMaterial(definition, topic, action) {
    const materialId = topic?.materialId || action?.revealsMaterials?.[0] || '';
    const material = (definition?.materials || []).find((item) => item.id === materialId) || null;
    return { materialId, material };
  }

  function resolveTurn(core, definition, state, contract, question, classifiedTopicId) {
    const requestedTopic = topicById(contract, classifiedTopicId);
    const topicId = requestedTopic ? requestedTopic.id : classifyLocal(contract, question);
    const topic = topicById(contract, topicId) || topicById(contract, contract?.fallbackTopicId);
    if (!topic) {
      return { topicId: 'unknown', stance: 'boundary', response: 'На этот вопрос у персонажа нет авторского ответа.', actionId: null, materialId: null };
    }

    const action = topic.actionId ? core.actionById(definition, topic.actionId) : null;
    if (action && action.characterId === contract.characterId) {
      const { materialId, material } = responseMaterial(definition, topic, action);
      if ((state.performedActions || []).includes(action.id) && material) {
        return {
          topicId: topic.id,
          stance: topic.afterActionStance || 'admission',
          response: material.body,
          actionId: null,
          materialId,
        };
      }
      const isAvailable = core.availableActions(definition, state).some((candidate) => candidate.id === action.id);
      if (isAvailable && material) {
        return {
          topicId: topic.id,
          stance: topic.afterActionStance || 'admission',
          response: '',
          actionId: action.id,
          materialId,
        };
      }
    }

    const stage = bestStage(topic, state.facts || []);
    return {
      topicId: topic.id,
      stance: stage?.stance || 'boundary',
      response: stage?.response || topic.defaultResponse,
      actionId: null,
      materialId: null,
    };
  }

  function applyTurn(core, definition, state, contract, turn) {
    if (!turn?.actionId) {
      return { state, turn: { ...turn, unlocked: false } };
    }
    const action = core.actionById(definition, turn.actionId);
    if (!action || action.characterId !== contract.characterId) {
      return { state, turn: { ...turn, actionId: null, unlocked: false } };
    }
    const outcome = core.performAction(definition, state, action.id);
    if (!outcome.action) {
      return { state, turn: { ...turn, actionId: null, unlocked: false } };
    }
    const { materialId, material } = responseMaterial(definition, topicById(contract, turn.topicId), action);
    const nextState = material ? core.openMaterial(definition, outcome.state, materialId) : outcome.state;
    return {
      state: nextState,
      turn: {
        ...turn,
        actionId: null,
        materialId: materialId || null,
        response: material?.body || 'Показания изменились после предъявления материалов.',
        unlocked: true,
      },
    };
  }

  function auditContract(definition, contract) {
    const errors = [];
    const topicIds = new Set();
    const factIds = new Set([
      ...(definition?.initialFacts || []),
      ...(definition?.materials || []).flatMap((item) => item.grantsFacts || []),
      ...(definition?.actions || []).flatMap((item) => item.grantsFacts || []),
    ]);
    const actionIds = new Set((definition?.actions || []).map((item) => item.id));
    const actions = new Map((definition?.actions || []).map((item) => [item.id, item]));
    const materialIds = new Set((definition?.materials || []).map((item) => item.id));

    if (!(definition?.characters || []).some((item) => item.id === contract?.characterId)) {
      errors.push(`Unknown interrogation character: ${contract?.characterId || 'missing'}`);
    }
    for (const topic of contract?.topics || []) {
      if (!topic.id || topicIds.has(topic.id)) errors.push(`Duplicate or empty interrogation topic: ${topic.id || 'missing'}`);
      topicIds.add(topic.id);
      if (!Array.isArray(topic.keywords)) errors.push(`Topic ${topic.id} must define keywords`);
      if (!topic.defaultResponse) errors.push(`Topic ${topic.id} must define a default response`);
      if (topic.actionId && !actionIds.has(topic.actionId)) errors.push(`Topic ${topic.id} references missing action ${topic.actionId}`);
      if (topic.actionId && actions.get(topic.actionId)?.characterId !== contract.characterId) {
        errors.push(`Topic ${topic.id} references an action outside character ${contract.characterId}`);
      }
      if (topic.materialId && !materialIds.has(topic.materialId)) errors.push(`Topic ${topic.id} references missing material ${topic.materialId}`);
      if (topic.actionId && topic.materialId && !actions.get(topic.actionId)?.revealsMaterials?.includes(topic.materialId)) {
        errors.push(`Topic ${topic.id} material ${topic.materialId} is not revealed by ${topic.actionId}`);
      }
      for (const stage of topic.stages || []) {
        if (!stage.response) errors.push(`Topic ${topic.id} has an empty authored response`);
        for (const fact of [...(stage.requiresAllFacts || []), ...(stage.requiresAnyFacts || [])]) {
          if (!factIds.has(fact)) errors.push(`Topic ${topic.id} references unknown fact ${fact}`);
        }
      }
    }
    if (!topicIds.has(contract?.fallbackTopicId)) errors.push(`Missing fallback topic ${contract?.fallbackTopicId || 'unknown'}`);
    return errors;
  }

  return Object.freeze({
    normalizeQuestion,
    requirementsMet,
    classifyLocal,
    resolveTurn,
    applyTurn,
    auditContract,
  });
});
