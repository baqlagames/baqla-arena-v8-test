#!/usr/bin/env node

import assert from 'node:assert/strict';
import { GAME_TICK_HZ } from '../src/core/constants.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { applyZaytOnHitProcs } from '../src/systems/unit-zayt-onhit-procs.js';
import { advanceSharedOnHitCounter } from '../src/systems/unit-onhit-procs.js';

const noop = () => {};

function makeKing(level = 5, branch = 'b') {
  const holy = branch === 'b';
  const unit = {
    unitIdx: 3,
    branch,
    level,
    isPlayer: true,
    arch: holy ? 'healer' : (branch === 'a' ? 'tank' : 'paladin'),
    paladinHybrid: !holy,
    hp: 900,
    maxHp: 900,
    healAmt: 120,
    dmg: 28,
    size: 24,
    x: 240,
    y: 520,
    abilCD: {},
  };
  applyUnitPassives(unit, 3, level, { gameTickHz: GAME_TICK_HZ, signatures: {} });
  return unit;
}

function makeAlly(hp, maxHp, arch = 'melee', x = 260, y = 500) {
  return { isPlayer: true, hp, maxHp, arch, size: 24, x, y };
}

function makeEnemy() {
  return { isEnemy: true, hp: 10000, maxHp: 10000, size: 26, x: 260, y: 430 };
}

function makeContext(unit, allies, enemy, events) {
  return {
    arena: {},
    frame: 1,
    damage: unit.dmg,
    isCrit: false,
    units: [unit, ...allies],
    enemies: [enemy],
    projectiles: [],
    beamFx: [],
    groundEffects: [],
    randomRange: () => 0,
    dealDamage: (target, amount) => {
      target.hp = Math.max(0, target.hp - Math.round(amount || 0));
    },
    fireDivineStorm: noop,
    addGoldShield: (target, amount, duration) => {
      target._goldShield = { amt: Math.round(amount || 0), timer: duration };
      target._lastGoldShield = Math.round(amount || 0);
      return target._lastGoldShield;
    },
    applyHealingReceived: (_target, amount) => Math.max(0, Math.round(amount || 0)),
    beaconSplash: (_healer, _target, amount) => {
      if (amount > 0) events.push('BEACON_SPLASH');
    },
    findLowestAlly: (_unit, _range, skip) => allies.filter(ally => ally !== skip && ally.hp > 0 && ally.hp < ally.maxHp).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || null,
    soundEffects: { holyLight: noop, shieldBlock: noop },
    showFlash: text => events.push(text),
    addHealFx: noop,
    emitParticle: noop,
    addDamageText: (_x, _y, text) => events.push(text),
    shake: noop,
  };
}

function runAttack(unit, enemy, context) {
  const ohTier = advanceSharedOnHitCounter(unit);
  applyZaytOnHitProcs(unit, enemy, { ...context, ohTier });
  return ohTier;
}

{
  const king = makeKing(2);
  const tank = makeAlly(600, 1000, 'tank', 250, 500);
  const lowest = makeAlly(120, 1000, 'melee', 300, 500);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(king, [tank, lowest], enemy, events);
  const tiers = [runAttack(king, enemy, context), runAttack(king, enemy, context), runAttack(king, enemy, context)];

  assert.deepEqual(tiers, [0, 0, 3], 'L2 should trigger Judgment of Light on the literal 3rd attack');
  assert.ok(events.includes('JUDGMENT OF LIGHT'), 'Judgment of Light text should be emitted on the 3rd attack');
  assert.ok(tank.hp > 600, 'Judgment of Light should prioritize a wounded tank under 65% HP');
  assert.equal(lowest.hp, 120, 'Judgment of Light should not choose a lower non-tank over a tank under 65% HP');
  assert.ok(events.includes('BEACON_SPLASH'), 'Judgment of Light should call Beacon splash with the actual heal');
}

{
  const king = makeKing(3);
  const ally = makeAlly(300, 1000);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(king, [ally], enemy, events);
  const tiers = [];
  for (let i = 0; i < 5; i++) tiers.push(runAttack(king, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5], 'L3 should add Word of Glory on the literal 5th attack');
  assert.ok(events.includes('WORD OF GLORY'), 'Word of Glory text should be emitted on the 5th attack');
  assert.equal(ally.hotAmt, 25, 'Word of Glory should apply a 2.5% max HP/sec Eternal Flame HoT');
  assert.equal(ally._eternalFlame, 4 * GAME_TICK_HZ, 'Word of Glory should apply Eternal Flame for 4s');
}

{
  const king = makeKing(4);
  const tank = makeAlly(300, 2000, 'tank', 260, 500);
  const ally = makeAlly(200, 1000, 'melee', 320, 500);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(king, [tank, ally], enemy, events);
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(king, enemy, context));

  assert.equal(tiers[9], 10, 'L4 should trigger Guardian\'s Mercy on the literal 10th attack');
  assert.ok(events.includes("GUARDIAN'S MERCY"), 'Guardian\'s Mercy text should be emitted on the 10th attack');
  assert.equal(tank._lastGoldShield, 280, 'Guardian\'s Mercy should add a 14% max HP shield when target is below 40%');
  assert.equal(tank.guardiansMercyDR, 0.10, 'Guardian\'s Mercy should add 10% damage reduction');
  assert.equal(tank.guardiansMercyTimer, 4 * GAME_TICK_HZ, 'Guardian\'s Mercy damage reduction should last 4s');
}

{
  const king = makeKing(5);
  const ally = makeAlly(500, 2000);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(king, [ally], enemy, events);
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(king, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5, 0, 0, 0, 0, 10], 'L5 King Holy should keep literal 3/5/10 thresholds');
}

{
  const king = makeKing(3);
  const ally = makeAlly(400, 1000);
  const enemy = makeEnemy();
  const events = [];
  const context = makeContext(king, [ally], enemy, events);
  assert.equal(king.lightOfDawn, undefined, 'King Holy should no longer attach the old every-4 Light of Dawn proc');
  assert.equal(king.wordOfGlory, undefined, 'King Holy should no longer attach the old every-5 Word of Glory proc');
  for (let i = 0; i < 4; i++) runAttack(king, enemy, context);
  assert.equal(events.includes('LIGHT OF DAWN'), false, 'King Holy should not fire the old every-4 Light of Dawn proc');
}

{
  const ret = makeKing(5, null);
  assert.equal(ret._hit3, 3, 'Base King Holy Sword Saint should keep literal L5 3rd threshold');
  assert.equal(ret._hit5, 5, 'Base King Holy Sword Saint should keep literal L5 5th threshold');
  assert.equal(ret._hit10, 10, 'Base King Holy Sword Saint should keep literal L5 10th threshold');
  assert.equal(ret._bladeOfJustice, undefined, 'Base King should no longer attach Blade of Justice');
  assert.ok(ret.holySwordSaintCombo, 'Base King should attach Holy Sword Saint combo config');

  const prot = makeKing(5, 'a');
  assert.equal(prot._hit3, 2, 'Prot King should keep accelerated L5 shared thresholds');
  assert.ok(prot.avengersShield, 'Prot King should keep Avenger Shield');
}

console.log('King Holy 3/5/10 smoke passed');
