export function isInvalidPlayerOffensiveTarget(target) {
  return !target ||
    target.hp <= 0 ||
    target.untargetable ||
    target._dragonJudgmentImmune ||
    target.isBarrier ||
    target.burrowing ||
    target.charmed;
}

export function isValidPlayerOffensiveTarget(target) {
  return !isInvalidPlayerOffensiveTarget(target);
}
