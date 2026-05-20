#!/usr/bin/env node

import assert from 'node:assert/strict';
import { applyPlayerProtectionReductions } from '../src/systems/combat-defense-procs.js';
import { applyCoreFamilyOnHitProcs } from '../src/systems/unit-onhit-core.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';

const noop = () => {};
const sound = { shieldBlock: noop, heal: noop, bossSlam: noop };

function makeTank(unitIdx, branch) {
  const tank = {
    unitIdx,
    branch,
    isPlayer: true,
    arch: 'tank',
    hp: 900,
    maxHp: 1400,
    dmg: 50,
    armor: 10,
    magicRes: 5,
    size: 30,
    x: 250,
    y: 500,
    abilCD: {},
  };
  applyUnitPassives(tank, unitIdx, 3, { gameTickHz: 60, signatures: {} });
  return tank;
}

function applyFifthHit(unit) {
  const target = { isEnemy: true, hp: 1000, maxHp: 1000, size: 28, x: 260, y: 450 };
  applyCoreFamilyOnHitProcs(unit, target, {
    ohTier: 5,
    damage: 80,
    units: [unit],
    enemies: [target],
    beamFx: [],
    groundEffects: [],
    dealDamage(enemy, amount) { enemy.hp -= amount; },
    applyRuneWound: noop,
    isTaoonPriorityEnemy: () => false,
    applyTrackedHeal(targetUnit, amount) {
      const before = targetUnit.hp;
      targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + amount);
      return targetUnit.hp - before;
    },
    applyTaoonBloodTithe: noop,
    addTaoonBloodShield(targetUnit, amount, duration) {
      targetUnit._taoonBloodShield = Math.max(targetUnit._taoonBloodShield || 0, amount);
      targetUnit._taoonBloodShieldTimer = Math.max(targetUnit._taoonBloodShieldTimer || 0, duration);
    },
    addBatataShield(targetUnit, amount, duration) {
      targetUnit._batataMudShield = Math.max(targetUnit._batataMudShield || 0, amount);
      targetUnit._batataMudShieldTimer = Math.max(targetUnit._batataMudShieldTimer || 0, duration);
    },
    isBatataBacklineAlly: () => false,
    isZavsMeleeAlly: ally => ally === unit,
    applyMuddied: noop,
    emitParticle: noop,
    addDamageText: noop,
    sound,
    shake: noop,
  });
}

const zavs = makeTank(0, 'a');
assert.equal(zavs.tankResolve, undefined, 'Zavs should not use generic Tank Resolve');
assert.ok(zavs.zavsShieldBrace, 'Zavs should gain Shield Brace at L3');
applyFifthHit(zavs);
assert.ok(zavs._zavsLineShield > 0, 'Zavs fifth hit should add a line shield');
assert.ok(zavs.zavsBraceTimer > 0, 'Zavs fifth hit should add temporary brace DR');
assert.ok(applyPlayerProtectionReductions(200, {
  target: zavs,
  attacker: { isEnemy: true, isBoss: true },
  units: [zavs],
  enemies: [],
  frame: 10,
  emitParticle: noop,
  groundEffects: [],
  addDamageText: noop,
}) < 200, 'Zavs Shield Brace should reduce incoming damage');

const taoon = makeTank(1, 'a');
assert.equal(taoon.tankResolve, undefined, 'Taoon should not use generic Tank Resolve');
assert.ok(taoon.necropolisGuard, 'Taoon should keep Necropolis Guard as his survival cooldown');
taoon.hp = Math.round(taoon.maxHp * 0.40);
assert.ok(applyPlayerProtectionReductions(220, {
  target: taoon,
  attacker: { isEnemy: true, isBoss: true },
  units: [taoon],
  enemies: [],
  frame: 20,
  emitParticle: noop,
  groundEffects: [],
  addDamageText: noop,
}) < 220, 'Taoon Necropolis Guard should reduce a low-health hit');
assert.ok(taoon.necropolisGuard.timer > 0, 'Taoon Necropolis Guard should activate');
assert.ok(taoon._taoonBloodShield > 0, 'Taoon Necropolis Guard should add a blood shield');

const batata = makeTank(2, 'b');
assert.equal(batata.tankResolve, undefined, 'Batata should not use generic Tank Resolve');
assert.ok(batata.batataMudguard, 'Batata should gain Mudguard at L3');
applyFifthHit(batata);
assert.ok(batata._batataMudShield > 0, 'Batata fifth hit should add a mud shield');
assert.ok(batata.batataMudguardTimer > 0, 'Batata fifth hit should add temporary mudguard DR');
assert.ok(applyPlayerProtectionReductions(200, {
  target: batata,
  attacker: { isEnemy: true, isBoss: true },
  units: [batata],
  enemies: [],
  frame: 30,
  emitParticle: noop,
  groundEffects: [],
  addDamageText: noop,
}) < 200, 'Batata Mudguard should reduce incoming damage');

const prot = makeTank(3, 'a');
assert.equal(prot.tankResolve, undefined, 'Prot Paladin should keep Ardent Defender identity, not Tank Resolve');
assert.ok(prot.ardentDefender, 'Prot Paladin should still use Ardent Defender');

console.log('smoke-tank-survival-identities: ok');
