import { ARENA_ABILITIES } from '../src/data/abilities.js';
import { createArenaSpellRuntime } from '../src/systems/arena-spell-runtime.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const bulwarkIdx = ARENA_ABILITIES.findIndex(ability => ability.name === 'Bulwark Charm');
const stasisIdx = ARENA_ABILITIES.findIndex(ability => ability.name === 'Stasis Pulse');
const flowIdx = ARENA_ABILITIES.findIndex(ability => ability.name === 'Signature Flow');
assert(bulwarkIdx >= 0, 'Bulwark Charm spell should exist');
assert(stasisIdx >= 0, 'Stasis Pulse spell should exist');
assert(flowIdx >= 0, 'Signature Flow spell should exist');
assert(!ARENA_ABILITIES.some(ability => /crystal/i.test(ability.name) || /crystal/i.test(ability.desc || '')), 'spell list should not include crystal-resource spells');

const state = {
  width: 500,
  height: 900,
  arenaTop: 100,
  gold: 999,
  arena: { spellUsed: [] },
  selectedSpells: [bulwarkIdx, stasisIdx, flowIdx],
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
  addGoldShield: (unit, amount, duration, cap, noExpireHeal) => {
    const current = unit._goldShield && unit._goldShield.amt > 0 ? unit._goldShield.amt : 0;
    unit._goldShield = { amt: Math.min(cap, current + amount), timer: duration, maxTimer: duration, noExpireHeal };
  },
  setAbilityTargeting: () => {},
  emitParticle: () => {},
  addHealEffect: () => {},
  applyTrackedHeal: () => {},
  dealDamage: () => {},
  showFlash: () => {},
  shake: () => {},
});

assert(runtime.castAbility(0, 250, 450), 'Bulwark Charm should cast');
assert(state.units[0]._goldShield && state.units[0]._goldShield.amt === 18, 'Bulwark Charm should shield units for 18% max HP');
assert(state.units[1]._goldShield && state.units[1]._goldShield.amt === 18, 'Bulwark Charm should shield every living unit');

assert(runtime.castAbility(1, 250, 450), 'Stasis Pulse should cast');
assert(state.enemies[0].stunned === 120, 'Stasis Pulse should stun non-boss enemies for 2s');
assert(state.enemies[1].stunned === 0, 'Stasis Pulse should not stun bosses');

assert(runtime.castAbility(2, 250, 450), 'Signature Flow should cast');
assert(state.units[0].signature.t === 58, `Signature Flow should recover 30% remaining cooldown, got ${state.units[0].signature.t}`);
assert(state.units[1].signature.t === 24, `Signature Flow should work from empty cooldown, got ${state.units[1].signature.t}`);

console.log('Spell effects smoke passed for Bulwark Charm, Stasis Pulse, and Signature Flow.');
