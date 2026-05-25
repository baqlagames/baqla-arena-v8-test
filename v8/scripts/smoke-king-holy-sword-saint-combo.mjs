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
import { applyArenaIncomingScalarModifiers } from '../src/systems/combat-modifiers.js';

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
    a3: branch === 'a' ? 'hallowedLeap' : (branch === 'b' ? 'holyPrism' : 'astralSever'),
    a5: branch === 'a' ? 'guardianOfAncientKings' : (branch === 'b' ? 'barrierOfFaith' : 'fivefoldEdict'),
    hasL3: level >= 3,
    hasL5: level >= 5,
    artOfWar: branch ? undefined : PLAYER_UNITS[3].artOfWar,
    hammerOfWrath: branch ? undefined : PLAYER_UNITS[3].hammerOfWrath,
    abilCD: {},
  };
  applyUnitPassives(unit, 3, level, {
    gameTickHz: GAME_TICK_HZ,
    signatures: {
      heavenly_arsenal: { name: 'Sword Saint: Heavenly Arsenal', cd: 35, fire: noop },
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
  assert.equal(PLAYER_UNITS[3].role, 'Holy Sword Saint', 'Base King visible role should remain Holy Sword Saint');
  assert.equal(PLAYER_UNITS[3].a3, 'astralSever', 'Base King should use Astral Sever as A3');
  assert.equal(PLAYER_UNITS[3].a5, 'fivefoldEdict', 'Base King should use Fivefold Edict as A5');
  assert.equal(ARENA_UNIT_PASSIVES[3].p1, 'livingArsenal', 'Base King should use Living Arsenal as P1');
  assert.equal(ARENA_UNIT_PASSIVES[3].p2, 'fiveSwordChoir', 'Base King should use Five-Sword Choir as P2');
  assert.equal(ARENA_BASE_SIGNATURES[3], 'heavenly_arsenal', 'Base King should use Heavenly Arsenal signature');

  const king = makeKing(5);
  assert.equal(king.artOfWar, false, 'Base King should not use old Art of War');
  assert.equal(king.hammerOfWrath, false, 'Base King should not use old Hammer of Wrath');
  assert.equal(king.judgmentSeals, undefined, 'Base King should not attach old Judgment Seals');
  assert.equal(king.signature.id, 'heavenly_arsenal', 'Base King should attach Heavenly Arsenal when signatures are available');
}

{
  const holy = makeKing(5, 'b');
  assert.ok(holy.kingHolyCombo, 'King Holy should keep the healer combo');
  assert.equal(holy.holySwordSaintCombo, undefined, 'King Holy should not receive Holy Sword Saint config');

  const prot = makeKing(5, 'a');
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

  assert.deepEqual(tiers, [0, 0, 3], 'L2 should trigger Arsenal Cut on the literal 3rd attack');
  assert.ok(events.includes('ARSENAL CUT'), 'Arsenal Cut text should be emitted');
  assert.equal(enemy.stunned, Math.round(0.55 * GAME_TICK_HZ), 'Crystal stance should stun non-bosses');
  assert.equal(king.holySwordCharges, 1, '3rd hit should grant one sword charge');
  assert.equal(king.livingArsenalStance, 'thunder', '3rd hit should advance Crystal to Thunder');
}

{
  const king = makeKing(3);
  const enemy = makeEnemy(300, 500);
  const others = [makeEnemy(330, 505), makeEnemy(360, 510), makeEnemy(390, 515), makeEnemy(420, 520)];
  const events = [];
  const context = makeOnHitContext(king, [enemy, ...others], events);
  const tiers = [];
  for (let i = 0; i < 5; i++) tiers.push(runAttack(king, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5], 'L3 should add Fivefold Judgment on the literal 5th attack');
  assert.ok(events.includes('FIVEFOLD JUDGMENT'), 'Fivefold Judgment text should be emitted');
  assert.equal(context.projectiles.length, 5, 'Fivefold Judgment should create five sword projectile visuals');
  assert.ok(context.projectiles.every(p => p.projType === 'holySword' && p.speed <= 2.5 && p._swordLen >= 40), 'Fivefold Judgment swords should be large, slow, visible holySword projectiles');
  assert.equal(enemy.slowTimer, 2 * GAME_TICK_HZ, 'Thunder stance should slow the priority target');
  assert.equal(king.crystalGuardDR, 0.10, '5th hit should grant a Saint Guard damage reduction window');
  assert.equal(king.crystalGuardTimer, 2 * GAME_TICK_HZ, '5th hit guard should last 2s');
  assert.equal(king.holySwordDamageBuffMult, 1.08, '5th hit should grant the +8% Saint Edge damage buff');
  assert.equal(king.holySwordDamageBuffTimer, 4 * GAME_TICK_HZ, '5th hit damage buff should last 4s');
  assert.equal(applyArenaIncomingScalarModifiers(100, { target: enemy, attacker: king }), 108, '5th hit damage buff should scale outgoing damage');
  assert.equal(king.holySwordCharges, 3, '3rd plus 5th hit should build to three sword charges');
  assert.equal(king.livingArsenalStance, 'crown', '5th hit should advance Thunder to Crown');
}

{
  const king = makeKing(4);
  const enemy = makeEnemy(300, 500);
  const events = [];
  const context = makeOnHitContext(king, [enemy, makeEnemy(350, 520)], events);
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(king, enemy, context));

  assert.equal(tiers[9], 10, 'L4 should trigger Crown Cross on the literal 10th attack');
  assert.ok(events.includes('CROWN CROSS'), 'Crown Cross text should be emitted');
  assert.equal(king.holySwordCharges, 5, '10th hit should fill sword charges to five');
  assert.equal(king.livingArsenalStance, 'crystal', '10th hit should advance Crown back to Crystal');
  assert.equal(king.crystalGuardDR, 0.12, '10th hit should grant the stronger Crown Cross guard window');
  assert.equal(king.crystalGuardTimer, 3 * GAME_TICK_HZ, '10th hit guard should last 3s');
  assert.equal(king.holySwordDamageBuffMult, 1.15, '10th hit should grant the +15% Arsenal Surge damage buff');
  assert.equal(king.holySwordDamageBuffTimer, 5 * GAME_TICK_HZ, '10th hit damage buff should last 5s');
  assert.equal(applyArenaIncomingScalarModifiers(100, { target: enemy, attacker: king }), 115, '10th hit damage buff should scale outgoing damage');
  assert.ok(king.holySwordEchoes?.some(e => e.type === 'crownCross'), 'Crown Cross should queue delayed lane damage');
  assert.ok(context.groundEffects.some(g => g.holyBladeWarn && g.warnKind === 'line'), 'Crown Cross should use player Holy Sword lane warnings instead of enemy warnings');
}

{
  const king = makeKing(5);
  const enemy = makeEnemy();
  const events = [];
  const context = makeOnHitContext(king, [enemy], events);
  const tiers = [];
  for (let i = 0; i < 10; i++) tiers.push(runAttack(king, enemy, context));

  assert.deepEqual(tiers, [0, 0, 3, 0, 5, 0, 0, 0, 0, 10], 'L5 Base King should keep literal 3/5/10 thresholds');
}

{
  const king = makeKing(2);
  king.livingArsenalStance = 'crown';
  const enemy = makeEnemy(300, 500);
  const boss = makeEnemy(300, 540, 100000, { isBoss: true });
  const context = makeOnHitContext(king, [enemy, boss], []);
  const enemyX = enemy.x;
  for (let i = 0; i < 3; i++) runAttack(king, enemy, context);
  assert.ok(enemy.x > enemyX, 'Crown stance should knock back non-bosses');

  const king2 = makeKing(2);
  king2.livingArsenalStance = 'crown';
  const bossX = boss.x;
  const context2 = makeOnHitContext(king2, [boss], []);
  for (let i = 0; i < 3; i++) runAttack(king2, boss, context2);
  assert.equal(boss.x, bossX, 'Crown stance should not knock back bosses');
}

{
  const king = makeKing(5);
  const main = makeEnemy(330, 500, 100000, { isBoss: true });
  const splash = makeEnemy(365, 515);
  const battle = { units: [king], enemies: [main, splash], projectiles: [], bombs: [], groundFx: [], beamFx: [] };
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
    addDamageText: noop,
    showFlash: noop,
    clampToLeash: noop,
    clampToArena: noop,
    setScreenShake: noop,
  });

  const start = { x: king.x, y: king.y };
  runtime.abilities.astralSever(king);
  assert.deepEqual({ x: king.x, y: king.y }, start, 'Astral Sever should not move King');
  assert.equal(king.crystalGuardDR, 0.08, 'Astral Sever should grant short Crystal Guard');
  assert.ok(king.holySwordEchoes?.some(e => e.type === 'astralSever'), 'Astral Sever should queue delayed lane damage');
  assert.ok(battle.groundFx.some(g => g.holyBladeWarn && g.label === 'SEVER'), 'Astral Sever should create a player Holy Sword telegraph');

  king.abilCD.fivefoldEdict = 0;
  runtime.abilities.fivefoldEdict(king);
  assert.deepEqual({ x: king.x, y: king.y }, start, 'Fivefold Edict should not move King');
  assert.ok(battle.projectiles.length >= 5, 'Fivefold Edict should create sword projectile visuals');
  assert.ok(battle.projectiles.slice(-5).every(p => p.projType === 'holySword' && p.speed <= 2.3 && p._swordLen >= 50), 'Fivefold Edict swords should be oversized and slower for readability');
  assert.ok(king.holySwordEchoes?.some(e => e.type === 'edictPulse'), 'Fivefold Edict should queue landing pulses');
}

{
  const king = makeKing(5);
  king.holySwordCharges = 5;
  const main = makeEnemy(300, 500, 100000, { isBoss: true });
  const splash = makeEnemy(350, 500);
  const battle = { units: [king], enemies: [main, splash], projectiles: [], bombs: [], groundFx: [], beamFx: [] };
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
  const start = { x: king.x, y: king.y };
  const result = signatures.heavenly_arsenal.fire(king);

  assert.notEqual(result, false, 'Heavenly Arsenal should fire against a valid boss target');
  assert.deepEqual({ x: king.x, y: king.y }, start, 'Heavenly Arsenal should not move King');
  assert.equal(king.holySwordCharges, 0, 'Heavenly Arsenal should consume sword charges');
  assert.ok(damageEvents.find(event => event.target === main && event.amount > king.dmg * 5.0), 'Heavenly Arsenal should apply sword-charge bonus damage');
  assert.ok(splash.hp < splash.maxHp, 'Heavenly Arsenal should hit secondary enemies');
  assert.ok(battle.projectiles.length >= 5 && battle.projectiles.every(p => p.projType === 'holySword' && p.speed <= 2.1 && p._swordLen >= 56), 'Heavenly Arsenal should create large slow visible sword projectiles');
  assert.ok(battle.groundFx.some(g => g.holyBladeWarn), 'Heavenly Arsenal should create player Holy Sword warning visuals');
  assert.ok(king.holySwordEchoes?.some(e => e.type === 'heavenlyCrown'), 'Five charges should queue delayed Heavenly Crown hit');
}

console.log('King Holy Sword Saint Living Arsenal smoke passed');
