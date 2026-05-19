import { ARENA_PERKS, DEFAULT_UNLOCKED_PERKS, perkById, perkSlotCount } from '../data/perks.js';

export function normalizePerkIds(ids) {
  const seen = new Set();
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    if (!perkById(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function normalizeUnlockedPerks(ids) {
  const out = normalizePerkIds(ids);
  for (const id of DEFAULT_UNLOCKED_PERKS) {
    if (!out.includes(id)) out.unshift(id);
  }
  return out;
}

export function normalizeSelectedPerks(ids, unlockedIds, maxStage) {
  const unlocked = new Set(normalizeUnlockedPerks(unlockedIds));
  const slots = perkSlotCount(maxStage || 1);
  const selected = normalizePerkIds(ids).filter(id => unlocked.has(id)).slice(0, slots);
  if (!selected.length && unlocked.has(DEFAULT_UNLOCKED_PERKS[0])) selected.push(DEFAULT_UNLOCKED_PERKS[0]);
  return selected.slice(0, slots);
}

export function getPerkEffects(selectedPerks) {
  const effects = {
    startingGold: 0,
    tankHpMult: 0,
    dpsDamageMult: 0,
    healerOutputMult: 0,
    beansBonusPct: 0,
  };
  for (const id of selectedPerks || []) {
    const perk = perkById(id);
    if (!perk || !perk.effects) continue;
    for (const key of Object.keys(effects)) effects[key] += perk.effects[key] || 0;
  }
  return effects;
}

export function isPerkVisible(perk, maxStage) {
  return perk.unlockStage <= Math.max(1, maxStage || 1);
}

export function canUnlockPerk(perk, { beans, maxStage, unlockedPerks }) {
  if (!perk || !isPerkVisible(perk, maxStage)) return false;
  if ((unlockedPerks || []).includes(perk.id)) return false;
  return (beans || 0) >= (perk.cost || 0);
}

export function unlockPerk(perkId, progress) {
  const perk = perkById(perkId);
  if (!perk || !canUnlockPerk(perk, progress)) return { ok: false, progress };
  const unlockedPerks = normalizeUnlockedPerks(progress.unlockedPerks);
  unlockedPerks.push(perk.id);
  return {
    ok: true,
    progress: {
      ...progress,
      beans: Math.max(0, (progress.beans || 0) - (perk.cost || 0)),
      unlockedPerks,
    },
    perk,
  };
}

export function toggleSelectedPerk(perkId, progress) {
  const perk = perkById(perkId);
  const unlockedPerks = normalizeUnlockedPerks(progress.unlockedPerks);
  if (!perk || !unlockedPerks.includes(perkId)) return { ok: false, progress };
  const slots = perkSlotCount(progress.maxStage || 1);
  let selectedPerks = normalizeSelectedPerks(progress.selectedPerks, unlockedPerks, progress.maxStage);
  if (selectedPerks.includes(perkId)) {
    selectedPerks = selectedPerks.filter(id => id !== perkId);
  } else {
    if (selectedPerks.length >= slots) selectedPerks.shift();
    selectedPerks.push(perkId);
  }
  if (!selectedPerks.length) selectedPerks = normalizeSelectedPerks([], unlockedPerks, progress.maxStage);
  return { ok: true, progress: { ...progress, selectedPerks }, perk };
}

export function stageBeansReward({ stage, stars, firstClear, selectedPerks }) {
  const stageN = stage && stage.n ? stage.n : 1;
  const starCount = Math.max(1, Math.min(3, stars || 1));
  const base = 8 + Math.ceil(stageN * 1.25);
  const starBonus = (starCount - 1) * 4;
  const firstClearBonus = firstClear ? 6 : 0;
  const effects = getPerkEffects(selectedPerks);
  return Math.max(1, Math.round((base + starBonus + firstClearBonus) * (1 + effects.beansBonusPct)));
}

export { ARENA_PERKS, perkById, perkSlotCount };
