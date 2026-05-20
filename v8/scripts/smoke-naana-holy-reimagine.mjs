#!/usr/bin/env node

import assert from 'node:assert/strict';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { applyNaanaFoulFelfelOnHitProcs } from '../src/systems/unit-naana-foul-felfel-onhit-procs.js';
import { tickUnitPriestPassives } from '../src/systems/unit-priest-ticks.js';
import { createArenaSignatures } from '../src/systems/unit-signatures.js';

const noop = () => {};

function makeNaana(level = 3) {
  const unit = {
    unitIdx: 10,
    isPlayer: true,
    arch: 'healer',
    hp: 900,
    maxHp: 1000,
    dmg: 50,
    size: 24,
    x: 240,
    y: 520,
    abilCD: {},
  };
  applyUnitPassives(unit, 10, level, { gameTickHz: 60, signatures: {} });
  return unit;
}

const naana = makeNaana(3);
assert.equal(naana.prayerOfMending.every, 420, 'Holy Prayer of Mending should cast every 7s');
assert.equal(naana.prayerOfMending.maxBounces, 5, 'Holy Prayer of Mending should start at 5 bounces');
assert.equal(naana.holyRenew.healPct, 0.025, 'Holy Renew should exist at L3');
assert.equal(naana.holySanctify.healPct, 0.07, 'Holy Sanctify should exist at L3');
assert.equal(naana.tankResolve, undefined, 'Naana Holy should not use generic tank survival');

const l5 = makeNaana(5);
assert.equal(l5.prayerOfMending.maxBounces, 7, 'Holy L5 should increase Prayer bounces');
assert.equal(l5.holyRenew.healPct, 0.03, 'Holy L5 should strengthen Renew');
assert.equal(l5.holySanctify.healPct, 0.09, 'Holy L5 should strengthen Sanctify');

const ally = { isPlayer: true, hp: 300, maxHp: 1000, size: 24, x: 260, y: 500 };
const target = { isEnemy: true, hp: 1000, maxHp: 1000, size: 26, x: 260, y: 440 };
const heals = [];
applyNaanaFoulFelfelOnHitProcs(naana, target, {
  frame: 1,
  ohTier: 5,
  damage: 80,
  units: [naana, ally],
  enemies: [target],
  beamFx: [],
  groundEffects: [],
  randomRange: () => 0,
  dealDamage: noop,
  applyHealingReceived: (_unit, amount) => amount,
  addHealFx: (x, y, amount) => heals.push({ x, y, amount }),
  applyFelfelDeadlyPoison: noop,
  showFlash: noop,
  emitParticle: noop,
  addDamageText: noop,
  shake: noop,
});
assert.ok(heals.some(entry => entry.amount === 70), 'Sanctify should heal low allies for 7% max HP');

naana.holyRenew.cd = naana.holyRenew.every - 1;
tickUnitPriestPassives(naana, {
  frame: 60,
  units: [naana, ally],
  enemies: [],
  projectiles: [],
  beamEffects: [],
  arena: {},
  randomRange: () => 0,
  groundEffects: [],
  dealDamage: noop,
  applyHealingReceived: (_unit, amount) => amount,
  addHealFx: noop,
  findEnemyForUnit: () => null,
  emitParticle: noop,
  addDamageText: noop,
  shake: noop,
});
assert.ok(ally._holyRenew, 'Holy Renew should mark the lowest ally');

const signatures = createArenaSignatures({
  gameTickHz: 60,
  SFX: {},
  getBattleArray(key) {
    if (key === 'units') return [naana, ally];
    if (key === 'enemies') return [target];
    return [];
  },
  distance: (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)),
  emitParticle: noop,
  addDamageText: noop,
  showFlash: noop,
  shake: noop,
});
signatures.divine_hymn.fire(naana);
assert.equal(naana._divineHymn.timer, 420, 'Divine Hymn should last 7s');
assert.equal(naana._divineHymn.healPct, 0.09, 'Divine Hymn should heal for 9% per tick');
assert.equal(naana._divineHymn.radius, 220, 'Divine Hymn should have a wider Holy raid-heal radius');
assert.equal(naana._divineHymn.renew, true, 'Divine Hymn should refresh Renew');

console.log('smoke-naana-holy-reimagine: ok');
