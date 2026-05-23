export function isInvalidPlayerOffensiveTarget(target) {
  return !target ||
    target.hp <= 0 ||
    target.untargetable ||
    target._dragonJudgmentImmune ||
    target.hidden ||
    target._hidden ||
    target.phased ||
    target._phased ||
    target.phaseOut ||
    target._phaseOut ||
    target.isBarrier ||
    target.burrowing ||
    target.charmed;
}

export function isValidPlayerOffensiveTarget(target) {
  return !isInvalidPlayerOffensiveTarget(target);
}
