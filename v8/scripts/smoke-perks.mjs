#!/usr/bin/env node

import {
  ARENA_PERKS,
  canUnlockPerk,
  getPerkEffects,
  normalizeSelectedPerks,
  normalizeUnlockedPerks,
  perkById,
  perkSlotCount,
  stageBeansReward,
  toggleSelectedPerk,
  unlockPerk,
} from '../src/systems/perks.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(ARENA_PERKS.length >= 5, 'perk list should include current unlock set');
const ids = new Set();
for (const perk of ARENA_PERKS) {
  assert(perk.id && !ids.has(perk.id), `perk id should be unique: ${perk.id}`);
  ids.add(perk.id);
  assert(perkById(perk.id) === perk, `perkById should resolve ${perk.id}`);
  assert(perk.name && perk.desc && perk.tag, `${perk.id} should have visible text metadata`);
  assert(Number.isFinite(perk.unlockStage) && perk.unlockStage >= 1, `${perk.id} should have a valid unlock stage`);
  assert(Number.isFinite(perk.cost) && perk.cost >= 0, `${perk.id} should have a valid cost`);
  assert(perk.effects && Object.keys(perk.effects).length > 0, `${perk.id} should expose effects`);
}

const unlocked = normalizeUnlockedPerks([]);
assert(unlocked.includes('openingLedger'), 'default unlocked perks should include Opening Ledger');
assert(normalizeSelectedPerks([], unlocked, 1)[0] === 'openingLedger', 'selection should default to Opening Ledger');
assert(perkSlotCount(1) === 1, 'stage 1 should allow one perk slot');
assert(perkSlotCount(6) === 2, 'stage 6 should allow two perk slots');

const selectedAll = ARENA_PERKS.map(perk => perk.id);
const effects = getPerkEffects(selectedAll);
assert(effects.startingGold === 25, 'Opening Ledger should grant 25 starting gold');
assert(effects.tankHpMult === 0.08, 'Iron Seed should grant 8% tank HP');
assert(effects.dpsDamageMult === 0.05, 'Sharp Sprout should grant 5% DPS damage');
assert(effects.healerOutputMult === 0.08, 'Calm Bloom should grant 8% healer output');
assert(effects.beansBonusPct === 0.15, 'Bean Magnet should grant 15% beans');

let progress = { beans: 200, maxStage: 6, unlockedPerks: ['openingLedger'], selectedPerks: ['openingLedger'] };
const iron = perkById('ironSeed');
assert(canUnlockPerk(iron, progress), 'Iron Seed should be unlockable with enough beans and stage');
const unlockResult = unlockPerk('ironSeed', progress);
assert(unlockResult.ok, 'unlockPerk should unlock Iron Seed');
progress = unlockResult.progress;
assert(progress.beans === 170 && progress.unlockedPerks.includes('ironSeed'), 'unlock should spend beans and add perk');

const toggleResult = toggleSelectedPerk('ironSeed', progress);
assert(toggleResult.ok, 'toggleSelectedPerk should select unlocked Iron Seed');
assert(toggleResult.progress.selectedPerks.includes('ironSeed'), 'selected perks should include Iron Seed');

const baseReward = stageBeansReward({ stage: { n: 6 }, stars: 3, firstClear: true, selectedPerks: [] });
const magnetReward = stageBeansReward({ stage: { n: 6 }, stars: 3, firstClear: true, selectedPerks: ['beanMagnet'] });
assert(magnetReward > baseReward, 'Bean Magnet should increase stage bean rewards');

console.log(`Perk smoke passed for ${ARENA_PERKS.length} perks.`);
