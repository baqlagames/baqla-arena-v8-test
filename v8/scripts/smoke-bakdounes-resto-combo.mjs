#!/usr/bin/env node

import assert from 'node:assert/strict';
import { GAME_TICK_HZ } from '../src/core/constants.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { applyEarlyOnHitProcs } from '../src/systems/unit-early-onhit-procs.js';
import { advanceSharedOnHitCounter } from '../src/systems/unit-onhit-procs.js';

const noop = () => {};

function makeBakdounes(level = 5, branch = null) {
  const unit = {
    unitIdx: 11,
    branch,
    level,
    isPlayer: true,
    arch: branch ? 'ranged' : 'healer',
    hp: 950,
    maxHp: 950,
    healAmt: 115,
    dmg: 40,
    size: 24,
    x: 240,
    y: 520,
    abilCD: {},
  };
  applyUnitPassives(unit, 11, level, { gameTickHz: GAME_TICK_HZ, signatures: {} });
  return unit;
}

function makeAlly(hp, maxHp, x = 260, y = 500) {
  return { isPlayer: true, hp, maxHp, size: 24, x, y };
}

function makeEnemy() {
  return { isEnemy: true, hp: 10000, maxHp: 10000, size: 26, x: 260, y: 430 };
}

function makeContext(unit, allies, enemy, events) {
  return {
    arena: {},
    frame: 1,
    damage: unit.dmg,
    units: [unit, ...allies],
    enemies: [enemy],
    projectiles: [],
    beamFx: [],
    groundEffects: [],
    randomRange: () => 0,
    dealDamage: (target, amount) => {
      target.hp = Math.max(0, target.hp - Math.round(amount || 0));
    },
    findLowestAlly: () => allies.filter(ally => ally.hp > 0 && ally.hp < ally.maxHp).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || null,
    applyTrackedHeal: (target, amount) => {
      const before = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + Math.max(0, Math.round(amount || 0)));
      return Math.round(target.hp - before);
    },
    moonkinControlBurst: noop,
    moonkinDisplaceEnemy: noop,
    showFlash: text => events.push(text),
    addHealFx: noop,
    emitParticle: noop,
    addDamageText: (_x, _y, text) => events.push(text),
    shake: noop,
  };
}

function runAttack(unit, enemy, context) {
  const ohTier = advanceSharedOnHitCounter(unit);
  applyEarlyOnHitProcs(unit, enemy, { ...context, ohTier });
  return ohTier;
}

{
  const bakdounes = makeBakdounes(2);
  const ally = makeAlly(100, 1000);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(bakdounes, [ally], enemy, events);
  const tiers = [runAttack(bakdounes, enemy, context), runAttack(bakdounes, enemy, context), runAttack(bakdounes, enemy, context)];

  assert.deepEqual(tiers, [0, 0, 3], 'L2 should trigger Regrowth on the literal 3rd attack');
  assert.ok(events.includes('REGROWTH'), 'Regrowth text should be emitted on the 3rd attack');
  assert.ok(ally.hp > 100, 'Regrowth should heal the lowest wounded ally');
}

{
  const bakdounes = makeBakdounes(3);
  const allies = [
    makeAlly(200, 2000, 250, 500),
    makeAlly(350, 2000, 290, 500),
    makeAlly(500, 2000, 330, 500),
  ];
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(bakdounes, allies, enemy, events);
  const tiers = [];
  for (let i = 0; i < 5; i++) tiers.push(runAttack(bakdounes, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5], 'L3 should add Medica Bloom on the literal 5th attack');
  assert.ok(events.includes('MEDICA BLOOM'), 'Medica Bloom text should be emitted on the 5th attack');
  assert.equal(allies.filter(ally => ally._wgHot && ally._wgHot.healPct === 0.012).length, 3, 'Medica Bloom should apply HoTs to three wounded allies');
}

{
  const bakdounes = makeBakdounes(4);
  const focus = makeAlly(300, 3000, 260, 500);
  const splash = makeAlly(700, 3000, 330, 500);
  const far = makeAlly(700, 3000, 520, 500);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(bakdounes, [focus, splash, far], enemy, events);
  const focusBefore = focus.hp;
  const splashBefore = splash.hp;
  const farBefore = far.hp;
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(bakdounes, enemy, context));

  assert.equal(tiers[9], 10, 'L4 should trigger Benediction Bloom on the literal 10th attack');
  assert.ok(events.includes('BENEDICTION BLOOM'), 'Benediction Bloom text should be emitted on the 10th attack');
  assert.ok(focus.hp > focusBefore, 'Benediction Bloom should heal the lowest wounded ally');
  assert.ok(splash.hp > splashBefore, 'Benediction Bloom should heal nearby wounded allies');
  assert.ok(far.hp >= farBefore, 'Far allies should not be harmed by Benediction Bloom');
}

{
  const bakdounes = makeBakdounes(5);
  const ally = makeAlly(500, 2000);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(bakdounes, [ally], enemy, events);
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(bakdounes, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5, 0, 0, 0, 0, 10], 'L5 Bakdounes Resto should keep literal 3/5/10 thresholds');
}

{
  const branched = makeBakdounes(3, 'a');
  assert.equal(branched.bakdounesRestoCombo, undefined, 'Bakdounes branches should not receive the Resto combo');
  assert.equal(branched._onHitMax, undefined, 'Bakdounes branches should not expose the shared healer on-hit counter');
}

console.log('Bakdounes Resto 3/5/10 smoke passed');
