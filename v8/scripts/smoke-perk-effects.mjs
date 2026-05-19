import { ARENA_PERKS } from '../src/data/perks.js';
import { getPerkEffects } from '../src/systems/perks.js';
import { tickUnitMeteorAndSignature } from '../src/systems/unit-signature-ticks.js';
import { prepareWaveStartState } from '../src/systems/wave-lifecycle.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const stunSeed = ARENA_PERKS.find(perk => perk.id === 'stunSeed');
const sigFlow = ARENA_PERKS.find(perk => perk.id === 'sigFlow');
assert(stunSeed && stunSeed.effects.openingStunDur === 120, 'Stun Seed should add a 2s stun duration');
assert(sigFlow && sigFlow.effects.signatureRemainingReducePct === 0.30, 'Signature Flow should recover 30% of remaining cooldown');

const effects = getPerkEffects(['stunSeed', 'sigFlow']);
assert(effects.openingStunDur === 120, 'perk effects should include opening stun duration');
assert(effects.signatureRemainingReducePct === 0.30, 'perk effects should include signature cooldown recovery');

const unit = {
  x: 250,
  y: 600,
  size: 24,
  range: 50,
  arch: 'melee',
  signature: {
    id: 'test_sig',
    name: 'Test Sig',
    cd: 100,
    t: 100,
    fire: () => true,
  },
};
const banner = tickUnitMeteorAndSignature(unit, {
  frame: 1,
  enemies: [{ x: 250, y: 520, hp: 100, size: 24 }],
  bombs: [],
  arenaTop: 100,
  perkEffects: effects,
  randomRange: () => 0,
  groundEffects: [],
  emitParticle: () => {},
  addDamageText: () => {},
});
assert(banner, 'signature should fire for nearby enemy');
assert(unit.signature.t === 30, `signature remaining timer should be reduced by 30%, got t=${unit.signature.t}`);

const arena = {};
const perkUnit = { _perkStunUsed: true };
prepareWaveStartState(arena, [perkUnit]);
assert(perkUnit._perkStunUsed === false, 'wave start should refresh Stun Seed usage');

console.log('Perk effects smoke passed for stun and signature cooldown recovery.');
