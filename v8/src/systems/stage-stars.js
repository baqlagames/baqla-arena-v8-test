const EMPTY_COUNTS = { total: 0, tanks: 0, healers: 0, meleeDps: 0 };

export function arena_stageStarRule(stageN) {
  const rules = [
    { id: 'max_one_tank', title: '1 tank or less', label: 'Challenge: clear with 1 tank or less', requirement: 'Use 1 tank or less.' },
    { id: 'max_one_healer', title: '1 healer or less', label: 'Challenge: clear with 1 healer or less', requirement: 'Use 1 healer or less.' },
    { id: 'no_healers', title: 'No healers', label: 'Challenge: clear with no healers', requirement: 'Do not use healer units.' },
    { id: 'no_melee_dps', title: 'No melee DPS', label: 'Challenge: clear without melee DPS', requirement: 'Do not use melee DPS units.' },
    { id: 'small_squad', title: 'Small squad', label: 'Challenge: clear with 5 units or fewer', requirement: 'Use 5 total units or fewer.' },
  ];
  return rules[Math.max(0, (stageN || 1) - 1) % rules.length];
}

export function countSquadCells(cells, { playerUnits, heroUnit } = {}) {
  const out = { ...EMPTY_COUNTS };
  if (!cells) return out;
  for (const k in cells) {
    const c = cells[k];
    if (!c || c.unitIdx == null) continue;
    const u = c.unitRef;
    const def = c.unitIdx === 99 ? heroUnit : playerUnits && playerUnits[c.unitIdx];
    const arch = (u && u.arch) || (def && def.arch) || '';
    out.total++;
    if (arch === 'tank' || (u && u.taunt)) out.tanks++;
    if (arch === 'healer') out.healers++;
    if (arch === 'melee' || arch === 'paladin') out.meleeDps++;
  }
  return out;
}

export function recordStageChallengeUsage(arenaState, counts) {
  if (!arenaState) return;
  const c = counts || EMPTY_COUNTS;
  if (!arenaState._stageMaxSquadCounts) arenaState._stageMaxSquadCounts = { ...EMPTY_COUNTS };
  arenaState._stageMaxSquadCounts.total = Math.max(arenaState._stageMaxSquadCounts.total || 0, c.total);
  arenaState._stageMaxSquadCounts.tanks = Math.max(arenaState._stageMaxSquadCounts.tanks || 0, c.tanks);
  arenaState._stageMaxSquadCounts.healers = Math.max(arenaState._stageMaxSquadCounts.healers || 0, c.healers);
  arenaState._stageMaxSquadCounts.meleeDps = Math.max(arenaState._stageMaxSquadCounts.meleeDps || 0, c.meleeDps);
  if (c.healers > 0) arenaState._stageEverHealer = true;
  if (c.meleeDps > 0) arenaState._stageEverMeleeDps = true;
}

export function isStageStarRuleMet(rule, { arenaState, counts } = {}) {
  if (!rule) return false;
  const c = counts || EMPTY_COUNTS;
  const m = (arenaState && arenaState._stageMaxSquadCounts) || c;
  if (rule.id === 'max_one_tank') return (m.tanks || 0) <= 1;
  if (rule.id === 'max_one_healer') return (m.healers || 0) <= 1;
  if (rule.id === 'no_healers') return !(arenaState && arenaState._stageEverHealer) && c.healers === 0;
  if (rule.id === 'no_melee_dps') return !(arenaState && arenaState._stageEverMeleeDps) && c.meleeDps === 0;
  if (rule.id === 'small_squad') return (m.total || 0) <= 5;
  return false;
}

export function arena_starText(n) {
  n = Math.max(0, Math.min(3, n || 0));
  return '\u2605'.repeat(n) + '\u2606'.repeat(3 - n);
}

export function arena_stageStarCriteria(stageN, result) {
  const rule = arena_stageStarRule(stageN || 1);
  const hasResult = !!result;
  return [
    { star: 1, title: 'Clear the stage', requirement: 'Win all waves.', met: hasResult ? !!result.clear : null },
    { star: 2, title: 'No base damage', requirement: 'Do not let the King/base lose HP.', met: hasResult ? !!result.noBaseDamage : null },
    { star: 3, title: rule.title, requirement: rule.requirement, met: hasResult ? !!result.challenge : null },
  ];
}

export function computeStageStars({ won, currentStage, playerCastle, arenaState, counts } = {}) {
  if (!won || !currentStage) {
    return {
      stars: 0,
      clear: false,
      noBaseDamage: false,
      challenge: false,
      rule: arena_stageStarRule((currentStage && currentStage.n) || 1),
    };
  }
  const rule = arena_stageStarRule(currentStage.n || 1);
  const clear = true;
  const noBaseDamage = !!(playerCastle && arenaState && !arenaState._stageBaseDamaged);
  const challenge = isStageStarRuleMet(rule, { arenaState, counts });
  const stars = (clear ? 1 : 0) + (noBaseDamage ? 1 : 0) + (challenge ? 1 : 0);
  return { stars, clear, noBaseDamage, challenge, rule };
}
