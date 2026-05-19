import { ARENA_ABILITIES } from '../src/data/abilities.js';
import { createArenaSpellRuntime } from '../src/systems/arena-spell-runtime.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const crystalSurgeIdx = ARENA_ABILITIES.findIndex(ability => ability.name === 'Crystal Surge');
const stasisIdx = ARENA_ABILITIES.findIndex(ability => ability.name === 'Crystal Stasis');
const flowIdx = ARENA_ABILITIES.findIndex(ability => ability.name === 'Signature Flow');
assert(crystalSurgeIdx >= 0, 'Crystal Surge spell should exist');
assert(stasisIdx >= 0, 'Crystal Stasis spell should exist');
assert(flowIdx >= 0, 'Signature Flow spell should exist');

const state = {
  width: 500,
  height: 900,
  arenaTop: 100,
  gold: 999,
  crystal: 0,
  arena: { spellUsed: [] },
  selectedSpells: [crystalSurgeIdx, stasisIdx, flowIdx],
  abilityUsed: [false, false, false],
  units: [
    { x: 200, y: 650, hp: 100, signature: { cd: 100, t: 40 } },
    { x: 300, y: 650, hp: 100, signature: { cd: 80, t: 0 } },
  ],
  enemies: [
    { x: 250, y: 400, hp: 100, stunned: 0 },
    { x: 260, y: 380, hp: 100, stunned: 0, isBoss: true },
  ],
  bombs: [],
};

const runtime = createArenaSpellRuntime({
  view: () => state,
  setGold: value => { state.gold = value; },
  addCrystal: value => { state.crystal += value; },
  setAbilityTargeting: () => {},
  emitParticle: () => {},
  addHealEffect: () => {},
  applyTrackedHeal: () => {},
  dealDamage: () => {},
  showFlash: () => {},
  shake: () => {},
});

assert(runtime.castAbility(0, 250, 450), 'Crystal Surge should cast');
assert(state.crystal === 3, `Crystal Surge should grant +3 crystals, got ${state.crystal}`);

assert(runtime.castAbility(1, 250, 450), 'Crystal Stasis should cast');
assert(state.enemies[0].stunned === 120, 'Crystal Stasis should stun non-boss enemies for 2s');
assert(state.enemies[1].stunned === 0, 'Crystal Stasis should not stun bosses');

assert(runtime.castAbility(2, 250, 450), 'Signature Flow should cast');
assert(state.units[0].signature.t === 58, `Signature Flow should recover 30% remaining cooldown, got ${state.units[0].signature.t}`);
assert(state.units[1].signature.t === 24, `Signature Flow should work from empty cooldown, got ${state.units[1].signature.t}`);

console.log('Spell effects smoke passed for Crystal Surge, Crystal Stasis, and Signature Flow.');
