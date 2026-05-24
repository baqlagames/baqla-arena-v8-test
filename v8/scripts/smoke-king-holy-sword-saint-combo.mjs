#!/usr/bin/env node

import assert from 'node:assert/strict';
import { GAME_TICK_HZ } from '../src/core/constants.js';
import { PLAYER_UNITS } from '../src/data/units.js';
import { ARENA_BASE_SIGNATURES, ARENA_UNIT_PASSIVES } from '../src/data/passives.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { applyZaytOnHitProcs } from '../src/systems/unit-zayt-onhit-procs.js';
import { advanceSharedOnHitCounter } from '../src/systems/unit-onhit-procs.js';
import { createUnitAbilityRuntime } from '../src/systems/unit-ability-runtime.js';
import { createArenaSignatures } from '../src/systems/unit-signatures.js';
import { tickEnemyPostUpdateStatusEffects } from '../src/systems/combat-status-effects.js';

const noop = () => {};
const dist = (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));

function makeKing(level = 5, branch = null) {
  const unit = {
    unitIdx: 3,
    branch,
    level,
    isPlayer: true,
    arch: branch === 'a' ? 'tank' : (branch === 'b' ? 'healer' : 'paladin'),
    paladinHybrid: branch !== 'b',
    hp: 950,
    maxHp: 950,
    dmg: 64,
    healAmt: 120,
    armor: 8,
    magicRes: 5,
    size: 24,
    range: branch === 'b' ? 170 : 60,
    x: 240,
    y: 500,
    facing: 1,
    a3: branch === 'a' ? 'hallowedLeap' : (branch === 'b' ? 'holyPrism' : 'crushJudgment'),
    a5: branch === 'a' ? 'guardianOfAncientKings' : (branch === 'b' ? 'barrierOfFaith' : 'hallowedBladefall'),
    hasL3: level >= 3,
    hasL5: level >= 5,
    artOfWar: branch ? undefined : PLAYER_UNITS[3].artOfWar,
    hammerOfWrath: branch ? undefined : PLAYER_UNITS[3].hammerOfWrath,
    abilCD: {},
  };
  applyUnitPassives(unit, 3, level, {
    gameTickHz: GAME_TICK_HZ,
    signatures: {
      divine_ruination: { name: 'Sword Saint: Divine Ruination', cd: 35, fire: noop },
      beacon_of_virtue: { name: 'Beacon of Virtue', cd: 35, fire: noop },
      ashen_hallow: { name: 'Ashen Hallow', cd: 35, fire: noop },
    },
  });
  return unit;
}

function makeEnemy(x = 300, y = 500, hp = 100000, extra = {}) {
  return { isEnemy: true, hp, maxHp: hp, size: 26, x, y, ...extra };
}

function makeOnHitContext(unit, enemies, events) {
  return {
    arena: {},
    frame: 1,
    damage: unit.dmg,
    isCrit: false,
    units: [unit],
    enemies,
    projectiles: [],
    beamFx: [],
    groundEffects: [],
    randomRange: () => 0,
    dealDamage: (target, amount) => {
      const dmg = Math.round(amount || 0);
      target.hp = Math.max(0, target.hp - dmg);
      events.push({ type: 'damage', target, amount: dmg });
    },
    fireDivineStorm: () => events.push('DIVINE_STORM'),
    addGoldShield: noop,
    applyHealingReceived: (_target, amount) => Math.max(0, Math.round(amount || 0)),
    beaconSplash: noop,
    findLowestAlly: () => null,
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
  assert.equal(PLAYER_UNITS[3].role, 'Holy Sword Saint', 'Base King visible role should be Holy Sword Saint');
  assert.equal(PLAYER_UNITS[3].a3, 'crushJudgment', 'Base King should use Crush Judgment as A3');
  assert.equal(PLAYER_UNITS[3].a5, 'hallowedBladefall', 'Base King should use Hallowed Bladefall as A5');
  assert.equal(ARENA_UNIT_PASSIVES[3].p1, 'swordSaintCycle', 'Base King should no longer receive Wings of Light');
  assert.equal(ARENA_UNIT_PASSIVES[3].p2, 'judgmentSeals', 'Base King should no longer receive Shield of Vengeance');
  assert.equal(ARENA_BASE_SIGNATURES[3], 'divine_ruination', 'Base King should use Divine Ruination signature');

  const king = makeKing(5);
  assert.equal(king.artOfWar, false, 'Base King should no longer use old Art of War');
  assert.equal(king.hammerOfWrath, false, 'Base King should no longer use old Hammer of Wrath');
  assert.equal(king.paladinWings, undefined, 'Base King should not attach Wings of Light');
  assert.equal(king.shieldOfVengeance, undefined, 'Base King should not attach Shield of Vengeance');
  assert.equal(king._bladeOfJustice, undefined, 'Base King should not attach Blade of Justice');
  assert.equal(king._hammerOfLight, undefined, 'Base King should not attach Hammer of Light');
  assert.equal(king._wakeOfAshesProc, undefined, 'Base King should not attach Wake of Ashes proc');
  assert.equal(king.divineStorm, undefined, 'Base King should no longer fire the old every-4 Divine Storm');
  assert.equal(king.signature.id, 'divine_ruination', 'Base King should attach Divine Ruination when signatures are available');
}

{
  const holy = makeKing(5, 'b');
  assert.ok(holy.kingHolyCombo, 'King Holy should keep the healer combo');
  assert.equal(holy.holySwordSaintCombo, undefined, 'King Holy should not receive Holy Sword Saint config');
  assert.equal(holy.lightOfDawn, undefined, 'King Holy should keep old independent Light of Dawn disabled');
  assert.equal(holy.wordOfGlory, undefined, 'King Holy should keep old independent Word of Glory disabled');

  const prot = makeKing(5, 'a');
  assert.equal(prot.artOfWar, undefined, 'King Protection test fixture should not force the base Ret Art of War flag');
  assert.ok(prot.avengersShield, 'King Protection should keep Avenger Shield');
  assert.ok(prot.ardentDefender, 'King Protection should keep Ardent Defender');
  assert.ok(prot.divineStorm, 'King Protection should keep the paladin Divine Storm passive');
}

{
  const king = makeKing(2);
  const enemy = makeEnemy();
  const events = [];
  const context = makeOnHitContext(king, [enemy], events);
  const tiers = [runAttack(king, enemy, context), runAttack(king, enemy, context), runAttack(king, enemy, context)];

  assert.deepEqual(tiers, [0, 0, 3], 'L2 should trigger Stasis Sword on the literal 3rd attack');
  assert.ok(events.includes('STASIS SWORD'), 'Stasis Sword text should be emitted');
  assert.equal(king.crystalGuardDR, 0.08, 'Stasis Sword should grant Crystal Guard');
  assert.equal(king.crystalGuardTimer, 3 * GAME_TICK_HZ, 'Crystal Guard should last 3s');
  assert.equal(enemy.judgmentSealStacks || 0, 0, 'Judgment Seals should not apply before P2 unlocks');
}

{
  const king = makeKing(3);
  const enemy = makeEnemy(300, 500);
  const lineEnemy = makeEnemy(390, 500);
  const events = [];
  const context = makeOnHitContext(king, [enemy, lineEnemy], events);
  const lineBefore = lineEnemy.hp;
  const tiers = [];
  for (let i = 0; i < 5; i++) tiers.push(runAttack(king, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5], 'L3 should add Lightning Stab on the literal 5th attack');
  assert.ok(events.includes('LIGHTNING STAB'), 'Lightning Stab text should be emitted');
  assert.equal(king.saintSwiftnessTimer, 3 * GAME_TICK_HZ, 'Lightning Stab should grant 3s Saint Swiftness');
  assert.equal(king.saintSwiftnessAtkMult, 0.86, 'Saint Swiftness should store a stronger faster attack multiplier');
  assert.ok(lineEnemy.hp < lineBefore, 'Lightning Stab should hit enemies in the line');
  assert.equal(enemy.judgmentSealStacks, 2, 'Stasis + Lightning should build Judgment Seals after P2 unlock');
}

{
  const king = makeKing(4);
  const enemy = makeEnemy(300, 500);
  const splash = makeEnemy(360, 520);
  const events = [];
  const context = makeOnHitContext(king, [enemy, splash], events);
  const splashBefore = splash.hp;
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(king, enemy, context));

  assert.equal(tiers[9], 10, 'L4 should trigger Holy Explosion on the literal 10th attack');
  assert.ok(events.includes('HOLY EXPLOSION'), 'Holy Explosion text should be emitted');
  assert.equal(enemy.judgmentSealStacks, 3, 'Holy Explosion should bring Judgment Seals to the cap');
  assert.ok(splash.hp < splashBefore, 'Holy Explosion should splash nearby enemies');
  assert.equal(king.exaltedEdgeTimer, 4 * GAME_TICK_HZ, 'Holy Explosion should grant 4s Exalted Edge');
}

{
  const king = makeKing(5);
  const enemy = makeEnemy();
  const events = [];
  const context = makeOnHitContext(king, [enemy], events);
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(king, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5, 0, 0, 0, 0, 10], 'L5 Base King should keep literal 3/5/10 thresholds');
  assert.equal(enemy.judgmentSealStacks, 3, 'Repeated combo should cap seals at 3');
  for (let i = 0; i < 10; i++) runAttack(king, enemy, context);
  assert.equal(enemy.judgmentSealStacks, 3, 'Judgment Seals should remain capped at 3');
}

{
  const king = makeKing(5);
  const enemy = makeEnemy();
  enemy.judgmentSealSource = king;
  enemy.judgmentSealStacks = 3;
  enemy.judgmentSealTimer = 1;
  tickEnemyPostUpdateStatusEffects(enemy, {
    frame: 1,
    enemies: [enemy],
    dealDamage: noop,
    emitParticle: noop,
    groundEffects: [],
    addDamageText: noop,
    showFlash: noop,
    onDeath: noop,
    randomRange: () => 0,
    shake: noop,
  });
  assert.equal(enemy.judgmentSealStacks, 0, 'Judgment Seals should clear when their timer expires');
  assert.equal(enemy.judgmentSealSource, null, 'Expired Judgment Seals should clear their source');
}

{
  const king = makeKing(5);
  const main = makeEnemy(300, 500, 100000, { isBoss: true });
  const splash = makeEnemy(350, 500);
  main.judgmentSealSource = king;
  main.judgmentSealStacks = 3;
  main.judgmentSealTimer = 7 * GAME_TICK_HZ;
  const battle = { units: [king], enemies: [main, splash], projectiles: [], bombs: [], groundFx: [], beamFx: [] };
  const damageEvents = [];
  const signatures = createArenaSignatures({
    gameTickHz: GAME_TICK_HZ,
    getBattleArray: key => battle[key] || [],
    randomRange: (min = 0) => min,
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
  const result = signatures.divine_ruination.fire(king);

  assert.notEqual(result, false, 'Divine Ruination should fire against a valid boss target');
  assert.equal(main.judgmentSealStacks, 0, 'Divine Ruination should consume Judgment Seals');
  assert.equal(main.judgmentSealSource, null, 'Divine Ruination should clear the seal source');
  assert.ok(damageEvents.find(event => event.target === main && event.amount > king.dmg * 5.0), 'Divine Ruination should gain seal bonus damage');
  assert.ok(splash.hp < splash.maxHp, 'Divine Ruination should splash nearby enemies');
  assert.ok(king.divineRuinationEcho, 'Divine Ruination should queue the 3-seal echo hit');
}

{
  const king = makeKing(5);
  const main = makeEnemy(330, 500, 100000, { isBoss: true });
  const splash = makeEnemy(365, 515);
  const battle = { units: [king], enemies: [main, splash], projectiles: [], bombs: [], groundFx: [], beamFx: [] };
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

  const mainBefore = main.hp;
  runtime.abilities.crushJudgment(king);
  assert.ok(main.hp < mainBefore, 'Crush Judgment should damage a priority target within 230px');
  assert.equal(main.judgmentSealStacks, 1, 'Crush Judgment should apply one Judgment Seal');
  assert.ok(events.includes('CRUSH JUDGMENT'), 'Crush Judgment should emit readable VFX text');

  king.abilCD.hallowedBladefall = 0;
  const splashBefore = splash.hp;
  runtime.abilities.hallowedBladefall(king);
  assert.ok(splash.hp < splashBefore, 'Hallowed Bladefall should splash nearby enemies');
  assert.equal(main.judgmentSealStacks, 2, 'Hallowed Bladefall should apply one more Judgment Seal to the main target');
  assert.equal(king.crystalGuardDR, 0.12, 'Hallowed Bladefall should grant stronger Crystal Guard');
  assert.ok(events.includes('HALLOWED BLADEFALL'), 'Hallowed Bladefall should emit readable VFX text');
}

console.log('King Holy Sword Saint 3/5/10 smoke passed');
