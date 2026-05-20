#!/usr/bin/env node

import assert from 'node:assert/strict';
import { tryArdentDefenderSave } from '../src/systems/combat-death-hooks.js';
import { createUnitAbilityRuntime } from '../src/systems/unit-ability-runtime.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { createArenaSignatures } from '../src/systems/unit-signatures.js';
import { applyZaytOnHitProcs } from '../src/systems/unit-zayt-onhit-procs.js';

const noop = () => {};

function makeProt(extra = {}) {
  const unit = {
    unitIdx: 3,
    branch: 'a',
    isPlayer: true,
    arch: 'tank',
    hp: 1000,
    maxHp: 1000,
    dmg: 50,
    armor: 20,
    magicRes: 10,
    size: 30,
    x: 250,
    y: 500,
    abilCD: {},
    ...extra,
  };
  applyUnitPassives(unit, 3, 3, { gameTickHz: 60, signatures: {} });
  return unit;
}

const ardent = makeProt();
ardent.hp = 0;
let ardentShield = null;
assert.equal(ardent.tankResolve, undefined, 'Prot should not use generic Tank Resolve');
assert.equal(ardent.ardentDefender.revivePct, 0.32, 'Ardent Defender revive should be trimmed to 32%');
tryArdentDefenderSave(ardent, {
  tickHz: 60,
  addGoldShield(unit, amount, duration, cap, noExpireHeal) {
    ardentShield = { unit, amount, duration, cap, noExpireHeal };
  },
  emitParticle: noop,
  groundEffects: [],
  addDamageText: noop,
  showFlash: noop,
  shake: noop,
  playCheatDeathSfx: noop,
});
assert.equal(ardent.hp, Math.round(ardent.maxHp * 0.32), 'Ardent Defender should revive at 32% HP');
assert.equal(ardent.ardentDefenderTimer, 60, 'Ardent Defender should keep 1s invulnerability');
assert.equal(ardentShield.amount, Math.round(ardent.maxHp * 0.08), 'Ardent Defender shield should be 8% max HP');
assert.equal(ardentShield.cap, Math.round(ardent.maxHp * 0.14), 'Ardent Defender shield cap should be 14% max HP');

const target = { isEnemy: true, hp: 1000, maxHp: 1000, size: 28, x: 265, y: 460 };
const ally = { isPlayer: true, hp: 500, maxHp: 800, size: 24, x: 280, y: 520 };
const prot = makeProt();
const shields = [];
const baseDeps = {
  arena: { phase: 'wave' },
  frame: 1,
  damage: 80,
  isCrit: false,
  units: [prot, ally],
  enemies: [target],
  projectiles: [],
  beamFx: [],
  groundEffects: [],
  randomRange: () => 0,
  dealDamage: noop,
  fireDivineStorm: noop,
  addGoldShield(unit, amount, duration, cap, noExpireHeal) {
    shields.push({ unit, amount, duration, cap, noExpireHeal });
    unit._goldShield = { amt: amount, timer: duration, cap };
  },
  applyHealingReceived: value => value,
  beaconSplash: noop,
  findLowestAlly: () => ally,
  soundEffects: { shieldBlock: noop },
  showFlash: noop,
  addHealFx: noop,
  emitParticle: noop,
  addDamageText: noop,
  shake: noop,
};

applyZaytOnHitProcs(prot, target, { ...baseDeps, ohTier: 5 });
assert.equal(shields.at(-1).amount, Math.round(prot.maxHp * 0.045), 'Sacred Bulwark shield should be 4.5% max HP');
assert.ok(prot.sacredBulwarkTimer > 0, 'Sacred Bulwark should still apply');

applyZaytOnHitProcs(prot, target, { ...baseDeps, ohTier: 10 });
const guardianShields = shields.slice(-2);
assert.equal(guardianShields[0].amount, Math.round(prot.maxHp * 0.06), 'Guardian Oath self shield should be 6% max HP');
assert.equal(guardianShields[1].amount, Math.round(prot.maxHp * 0.06), 'Guardian Oath ally shield should be 6% of Prot max HP');
assert.equal(prot.guardianOathDR, 0.06, 'Guardian Oath DR should be 6%');
assert.equal(ally.guardianOathDR, 0.06, 'Guardian Oath ally DR should be 6%');

const abilityRuntime = createUnitAbilityRuntime({ gameTickHz: 60, emitParticle: noop, addDamageText: noop, showFlash: noop });
const goak = makeProt();
abilityRuntime.abilities.guardianOfAncientKings(goak);
assert.equal(goak.goakDR, 0.25, 'Guardian of Ancient Kings DR should be 25%');
assert.equal(goak.goakHealPerTick, Math.round(goak.maxHp * 0.011), 'Guardian of Ancient Kings heal should be 1.1% max HP/sec');

const ashen = makeProt();
ashen.hp = Math.round(ashen.maxHp * 0.40);
let ashenShield = null;
let ashenHeal = 0;
const signatures = createArenaSignatures({
  gameTickHz: 60,
  SFX: { explosion: noop },
  getBattleArray(key) {
    if (key === 'enemies') return [{ isEnemy: true, hp: 1000, maxHp: 1000, isBoss: false, x: 260, y: 460 }];
    if (key === 'units') return [ashen];
    return [];
  },
  distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  addGoldShield(unit, amount, duration, cap, noExpireHeal) {
    ashenShield = { unit, amount, duration, cap, noExpireHeal };
  },
  applyTrackedHeal(unit, amount) {
    ashenHeal = amount;
    unit.hp = Math.min(unit.maxHp, unit.hp + amount);
    return amount;
  },
  emitParticle: noop,
  addDamageText: noop,
  showFlash: noop,
  shake: noop,
});
assert.equal(signatures.ashen_hallow.fire(ashen), undefined, 'Ashen Hallow should cast with nearby enemies');
assert.equal(ashenShield.amount, Math.round(ashen.maxHp * 0.20), 'Ashen Hallow self shield should be 20% max HP');
assert.equal(ashenShield.cap, Math.round(ashen.maxHp * 0.24), 'Ashen Hallow shield cap should be 24% max HP');
assert.equal(ashenHeal, Math.round(ashen.maxHp * 0.07), 'Ashen Hallow low-HP heal should be 7% max HP');
assert.equal(ashen.ashenGuardianTimer, 360, 'Ashen Hallow DR window should still last 6s');

console.log('smoke-prot-survival-nerf: ok');
