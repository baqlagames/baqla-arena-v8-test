#!/usr/bin/env node

import assert from 'node:assert/strict';
import { GAME_TICK_HZ } from '../src/core/constants.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { applyEarlyOnHitProcs } from '../src/systems/unit-early-onhit-procs.js';
import { advanceSharedOnHitCounter } from '../src/systems/unit-onhit-procs.js';

const noop = () => {};

function makeHabaq(level = 5, branch = null) {
  const unit = {
    unitIdx: 12,
    branch,
    level,
    isPlayer: true,
    arch: branch === 'b' ? 'ranged' : 'healer',
    hp: 900,
    maxHp: 900,
    healAmt: 120,
    dmg: 13,
    size: 22,
    x: 240,
    y: 520,
    abilCD: {},
  };
  applyUnitPassives(unit, 12, level, { gameTickHz: GAME_TICK_HZ, signatures: {} });
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
  const habaq = makeHabaq(2);
  const ally = makeAlly(100, 1000);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(habaq, [ally], enemy, events);
  const tiers = [runAttack(habaq, enemy, context), runAttack(habaq, enemy, context), runAttack(habaq, enemy, context)];

  assert.deepEqual(tiers, [0, 0, 3], 'L2 should trigger Aroma Bolt on the literal 3rd attack');
  assert.ok(events.includes('AROMA BOLT'), 'Aroma Bolt text should be emitted on the 3rd attack');
  assert.ok(ally.hp > 100, 'Aroma Bolt should heal the lowest wounded ally');
}

{
  const habaq = makeHabaq(3);
  const ally = makeAlly(220, 1200);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(habaq, [ally], enemy, events);
  const tiers = [];
  for (let i = 0; i < 5; i++) tiers.push(runAttack(habaq, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5], 'L3 should add Essence Infusion on the literal 5th attack');
  assert.ok(events.includes('ESSENCE INFUSION'), 'Essence Infusion text should be emitted on the 5th attack');
  assert.ok(ally._essenceHot && ally._essenceHot.timer === 4 * GAME_TICK_HZ, 'Essence Infusion should apply the Habaq HoT');
}

{
  const habaq = makeHabaq(4);
  const near = makeAlly(300, 1400, 265, 505);
  const far = makeAlly(300, 1400, 520, 505);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(habaq, [near, far], enemy, events);
  const nearBefore = near.hp;
  const farBefore = far.hp;
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(habaq, enemy, context));

  assert.equal(tiers[9], 10, 'L4 should trigger Blooming Shrine on the literal 10th attack');
  assert.ok(events.includes('BLOOMING SHRINE'), 'Blooming Shrine text should be emitted on the 10th attack');
  assert.ok(habaq._aromaStatues.some(statue => statue.bloomingShrine), 'Blooming Shrine should plant a temporary shrine when no statues exist');
  assert.ok(near.hp > nearBefore, 'Blooming Shrine should pulse-heal nearby wounded allies');
  assert.ok(far.hp >= farBefore, 'Blooming Shrine should not harm far allies');
}

{
  const habaq = makeHabaq(5);
  const ally = makeAlly(500, 2000);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(habaq, [ally], enemy, events);
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(habaq, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5, 0, 0, 0, 0, 10], 'L5 Habaq Aromancer should keep literal 3/5/10 thresholds');
}

{
  const branched = makeHabaq(3, 'a');
  assert.equal(branched.habaqAromancerCombo, undefined, 'Habaq branches should not receive the base Aromancer combo');
  assert.equal(branched._onHitMax, undefined, 'Habaq branches should not expose the shared healer on-hit counter');
}

console.log('Habaq Aromancer 3/5/10 smoke passed');
