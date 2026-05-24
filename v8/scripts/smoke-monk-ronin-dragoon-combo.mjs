#!/usr/bin/env node

import assert from 'node:assert/strict';
import { GAME_TICK_HZ } from '../src/core/constants.js';
import { PLAYER_UNITS } from '../src/data/units.js';
import { ARENA_BASE_SIGNATURES, ARENA_UNIT_PASSIVES } from '../src/data/passives.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { applyJazarOnHitProcs } from '../src/systems/unit-jazar-onhit-procs.js';
import { advanceSharedOnHitCounter } from '../src/systems/unit-onhit-procs.js';
import { createUnitAbilityRuntime } from '../src/systems/unit-ability-runtime.js';
import { createArenaSignatures } from '../src/systems/unit-signatures.js';

const noop = () => {};
const dist = (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));

function makeMonk(level = 5) {
  const unit = {
    unitIdx: 13,
    branch: null,
    level,
    isPlayer: true,
    arch: 'melee',
    hp: 900,
    maxHp: 900,
    dmg: 63,
    armor: 6,
    magicRes: 4,
    size: 23,
    range: 42,
    x: 240,
    y: 500,
    facing: 1,
    a3: 'hissatsuGyoten',
    a5: 'geirskogulDive',
    hasL3: level >= 3,
    hasL5: level >= 5,
    abilCD: {},
  };
  applyUnitPassives(unit, 13, level, {
    gameTickHz: GAME_TICK_HZ,
    signatures: {
      midare_stardiver: { name: 'Midare Stardiver', cd: 35, fire: noop },
    },
  });
  return unit;
}

function makeJazar(level = 5) {
  const unit = {
    unitIdx: 5,
    branch: null,
    level,
    isPlayer: true,
    arch: 'melee',
    hp: 1000,
    maxHp: 1000,
    dmg: 67,
    size: 24,
    range: 40,
    x: 220,
    y: 500,
    facing: 1,
    abilCD: {},
  };
  applyUnitPassives(unit, 5, level, { gameTickHz: GAME_TICK_HZ, signatures: {} });
  return unit;
}

function makeEnemy(x = 300, y = 500, hp = 10000, extra = {}) {
  return { isEnemy: true, hp, maxHp: hp, size: 26, x, y, ...extra };
}

function makeOnHitContext(enemies, events) {
  return {
    frame: 1,
    enemies,
    beamFx: [],
    groundEffects: [],
    randomRange: () => 0,
    dealDamage: (target, amount) => {
      const dmg = Math.round(amount || 0);
      target.hp = Math.max(0, target.hp - dmg);
      events.push({ type: 'damage', target, amount: dmg });
    },
    clampToArena: noop,
    grantJazarGuard: noop,
    showFlash: text => events.push(text),
    emitParticle: noop,
    addDamageText: (_x, _y, text) => events.push(text),
    shake: noop,
  };
}

function runAttack(unit, enemy, context) {
  const ohTier = advanceSharedOnHitCounter(unit);
  applyJazarOnHitProcs(unit, enemy, { ...context, ohTier });
  return ohTier;
}

{
  assert.equal(PLAYER_UNITS[13].role, 'Ronin Dragoon', 'Unit 13 visible role should be Ronin Dragoon');
  assert.equal(PLAYER_UNITS[13].drawFn, 'drawRoninDragoon', 'Unit 13 should use the custom Ronin Dragoon sprite');
  assert.equal(PLAYER_UNITS[13].a3, 'hissatsuGyoten', 'Unit 13 should use Hissatsu Gyoten as A3');
  assert.equal(PLAYER_UNITS[13].a5, 'geirskogulDive', 'Unit 13 should use Geirskogul Dive as A5');
  assert.equal(ARENA_UNIT_PASSIVES[13].p1, 'azureSen', 'Monk should no longer receive bladeRush');
  assert.equal(ARENA_UNIT_PASSIVES[13].p2, 'thirdEye', 'Monk should no longer receive risingSlash');
  assert.equal(ARENA_BASE_SIGNATURES[13], 'midare_stardiver', 'Monk should use Midare Stardiver signature');

  const monk = makeMonk(5);
  assert.equal(monk.bladeRush, undefined, 'Monk should not attach old bladeRush');
  assert.equal(monk.risingSlash, undefined, 'Monk should not attach old risingSlash');
  assert.equal(monk._ragingBlow, undefined, 'Monk should not attach old Raging Blow');
  assert.equal(monk._rampage, undefined, 'Monk should not attach old Rampage');
  assert.equal(monk._warbreaker, undefined, 'Monk should not attach old Warbreaker');
  assert.equal(monk.signature.id, 'midare_stardiver', 'Monk should attach the new signature when signatures are available');

  const jazar = makeJazar(5);
  assert.ok(jazar.bladeRush, 'Jazar should keep bladeRush');
  assert.ok(jazar.risingSlash, 'Jazar should keep risingSlash');
  assert.ok(jazar._ragingBlow, 'Jazar should keep old shared blade procs');
}

{
  const monk = makeMonk(2);
  const enemy = makeEnemy();
  const events = [];
  const context = makeOnHitContext([enemy], events);
  const tiers = [runAttack(monk, enemy, context), runAttack(monk, enemy, context), runAttack(monk, enemy, context)];

  assert.deepEqual(tiers, [0, 0, 3], 'L2 should trigger Hakaze Thrust on the literal 3rd attack');
  assert.ok(events.includes('HAKAZE THRUST'), 'Hakaze Thrust text should be emitted');
  assert.equal(monk.azureSenFlags.setsu, true, 'Hakaze Thrust should grant Setsu');
  assert.equal(monk.azureSenStacks, 1, 'Hakaze Thrust should set Sen stacks to 1');
}

{
  const monk = makeMonk(3);
  const enemy = makeEnemy();
  const splash = makeEnemy(335, 500);
  const events = [];
  const context = makeOnHitContext([enemy, splash], events);
  const splashBefore = splash.hp;
  const tiers = [];
  for (let i = 0; i < 5; i++) tiers.push(runAttack(monk, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5], 'L3 should add Gekko Dive on the literal 5th attack');
  assert.ok(events.includes('GEKKO DIVE'), 'Gekko Dive text should be emitted');
  assert.equal(monk.azureSenFlags.getsu, true, 'Gekko Dive should grant Getsu');
  assert.equal(monk.thirdEyeDR, 0.20, 'Gekko Dive should grant Third Eye DR');
  assert.equal(monk.thirdEyeTimer, Math.round(1.5 * GAME_TICK_HZ), 'Gekko Dive should grant a 1.5s Third Eye window');
  assert.ok(splash.hp < splashBefore, 'Gekko Dive should damage nearby enemies');
  assert.ok(monk.roninEchoes?.some(e => e.type === 'gekko' && e.label === 'DRAGOON AFTERIMAGE'), 'Gekko Dive should queue a flashy delayed afterimage hit');
}

{
  const monk = makeMonk(4);
  const enemy = makeEnemy(300, 500);
  const lineEnemy = makeEnemy(390, 500);
  const events = [];
  const context = makeOnHitContext([enemy, lineEnemy], events);
  const lineBefore = lineEnemy.hp;
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(monk, enemy, context));

  assert.equal(tiers[9], 10, 'L4 should trigger Midare Nastrond on the literal 10th attack');
  assert.ok(events.includes('MIDARE NASTROND'), 'Midare Nastrond text should be emitted');
  assert.equal(monk.azureSenFlags.ka, true, 'Midare Nastrond should grant Ka Sen');
  assert.equal(monk.azureSenStacks, 3, 'The three unique Sen should cap at 3');
  assert.ok(lineEnemy.hp < lineBefore, 'Midare Nastrond should damage enemies in the path');
  assert.ok(monk.roninEchoes?.some(e => e.type === 'nastrond' && e.label === 'NASTROND ECHO'), 'Midare Nastrond should queue a delayed Nastrond echo');
}

{
  const monk = makeMonk(5);
  const enemy = makeEnemy(300, 500);
  const events = [];
  const context = makeOnHitContext([enemy], events);
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(monk, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5, 0, 0, 0, 0, 10], 'L5 Monk should keep literal 3/5/10 thresholds');
  assert.equal(monk.azureSenStacks, 3, 'Sen stacks should cap at 3');
  for (let i = 0; i < 10; i++) runAttack(monk, enemy, context);
  assert.equal(monk.azureSenStacks, 3, 'Repeated combo cycles should not exceed 3 Sen stacks');
}

{
  const monk = makeMonk(5);
  monk.azureSenFlags = { setsu: true, getsu: true, ka: true };
  monk.azureSenStacks = 3;
  monk.lifeOfDragonTimer = 0;
  const main = makeEnemy(300, 500);
  const splash = makeEnemy(350, 500);
  const battle = { units: [monk], enemies: [main, splash], projectiles: [], bombs: [], groundFx: [], beamFx: [] };
  const damageEvents = [];
  const signatures = createArenaSignatures({
    gameTickHz: GAME_TICK_HZ,
    getBattleArray: key => battle[key] || [],
    randomRange: () => 0,
    distance: dist,
    dealDamage: (target, amount) => {
      const dmg = Math.round(amount || 0);
      target.hp = Math.max(0, target.hp - dmg);
      damageEvents.push({ target, amount: dmg });
    },
    addDamageText: noop,
    emitParticle: noop,
    showFlash: noop,
    clampToLeash: noop,
    shake: noop,
  });
  const result = signatures.midare_stardiver.fire(monk);

  assert.notEqual(result, false, 'Midare Stardiver should fire against a valid cluster');
  assert.equal(monk.azureSenStacks, 0, 'Midare Stardiver should consume active Sen');
  assert.equal(monk.azureSenFlags.ka, false, 'Midare Stardiver should clear Sen flags');
  assert.equal(monk.lifeOfDragonTimer, 4 * GAME_TICK_HZ, 'Three Sen should extend Life of Dragon by 4s');
  assert.ok(damageEvents.find(event => event.target === main && event.amount > monk.dmg * 4.5), 'Signature should apply Sen bonus damage to the main target');
  assert.ok(splash.hp < splash.maxHp, 'Signature should splash nearby enemies');
  assert.ok(monk.roninEchoes?.some(e => e.type === 'stardiver' && e.label === 'THREE-SEN STARDIVER'), 'Midare Stardiver should queue a delayed second-impact Stardiver echo');
}

{
  const monk = makeMonk(5);
  const gyotenTarget = makeEnemy(350, 500, 10000, { isBoss: true });
  const geirTarget = makeEnemy(320, 500);
  const geirSplash = makeEnemy(355, 520);
  const battle = { units: [monk], enemies: [gyotenTarget, geirTarget, geirSplash], projectiles: [], bombs: [], groundFx: [], beamFx: [] };
  const events = [];
  const runtime = createUnitAbilityRuntime({
    gameTickHz: GAME_TICK_HZ,
    view: () => ({
      arena: {},
      units: battle.units,
      enemies: battle.enemies,
      projectiles: battle.projectiles,
      bombs: battle.bombs,
      groundFx: battle.groundFx,
      beamFx: battle.beamFx,
      frame: 1,
      arenaTop: 100,
      arenaBottom: 900,
      arenaLeft: 40,
      arenaRight: 460,
      width: 500,
      height: 1000,
      screenShake: 0,
    }),
    sound: new Proxy({}, { get: () => noop }),
    randomRange: () => 0,
    distance: dist,
    dealDamage: (target, amount) => {
      target.hp = Math.max(0, target.hp - Math.round(amount || 0));
    },
    emitParticle: noop,
    addDamageText: (_x, _y, text) => events.push(text),
    showFlash: text => events.push(text),
    clampToLeash: noop,
    clampToArena: noop,
    setScreenShake: noop,
  });

  const gyotenBefore = gyotenTarget.hp;
  runtime.abilities.hissatsuGyoten(monk);
  assert.ok(gyotenTarget.hp < gyotenBefore, 'Hissatsu Gyoten should damage a priority target within 245px');
  assert.equal(monk.thirdEyeDR, 0.20, 'Hissatsu Gyoten should grant Third Eye');
  assert.ok(events.includes('HISSATSU: GYOTEN'), 'Hissatsu Gyoten should emit readable VFX text');
  assert.ok(monk.roninEchoes?.some(e => e.label === 'IAI AFTERIMAGE'), 'Hissatsu Gyoten should queue an iai afterimage hit');

  monk.abilCD.geirskogulDive = 0;
  const geirBefore = geirTarget.hp;
  runtime.abilities.geirskogulDive(monk);
  assert.ok(geirTarget.hp < geirBefore, 'Geirskogul Dive should damage a nearby cluster');
  assert.equal(monk.lifeOfDragonTimer, 5 * GAME_TICK_HZ, 'Geirskogul Dive should grant 5s Life of Dragon');
  assert.equal(monk.lifeOfDragonAtkMult, 0.80, 'Life of Dragon should store a stronger faster attack multiplier');
  assert.ok(events.includes('GEIRSKOGUL DIVE'), 'Geirskogul Dive should emit readable VFX text');
  assert.ok(monk.roninEchoes?.some(e => e.label === 'DRAGONFALL AFTERSHOCK'), 'Geirskogul Dive should queue a delayed dragonfall aftershock');
}

console.log('Monk Ronin Dragoon 3/5/10 smoke passed');
