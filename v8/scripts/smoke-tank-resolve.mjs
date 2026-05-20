#!/usr/bin/env node

import assert from 'node:assert/strict';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { applyPlayerProtectionReductions } from '../src/systems/combat-defense-procs.js';

const noop = () => {};

function makeTank(unitIdx) {
  const tank = {
    unitIdx,
    isPlayer: true,
    arch: 'tank',
    hp: 500,
    maxHp: 1400,
    dmg: 35,
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

for (const unitIdx of [0, 1, 2]) {
  const tank = makeTank(unitIdx);
  assert.ok(tank.tankResolve, `unit ${unitIdx} should gain Tank Resolve at L3`);
  const reduced = applyPlayerProtectionReductions(220, {
    target: tank,
    attacker: { isEnemy: true, isBoss: true },
    units: [tank],
    enemies: [],
    frame: 100,
    emitParticle: noop,
    groundEffects: [],
    addDamageText: noop,
  });
  assert.ok(reduced < 220, `unit ${unitIdx} boss hit should be reduced by Tank Resolve`);
  assert.ok(tank._goldShield && tank._goldShield.amt > 0, `unit ${unitIdx} should gain a resolve shield`);
  assert.ok(tank.tankResolveDRTimer > 0, `unit ${unitIdx} should gain temporary resolve DR`);
  assert.ok(tank.tankResolveCDTimer > 0, `unit ${unitIdx} should put Tank Resolve on cooldown`);
}

const prot = {
  unitIdx: 3,
  isPlayer: true,
  arch: 'tank',
  branch: 'a',
  hp: 500,
  maxHp: 1400,
  dmg: 35,
  armor: 10,
  magicRes: 5,
  size: 30,
  x: 250,
  y: 500,
  abilCD: {},
};
applyUnitPassives(prot, 3, 3, { gameTickHz: 60, signatures: {} });
assert.equal(prot.tankResolve, undefined, 'Prot Paladin should keep Ardent Defender identity, not Tank Resolve');

console.log('smoke-tank-resolve: ok');
