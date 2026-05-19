import { createUnitAbilityRuntime } from '../src/systems/unit-ability-runtime.js';
import { createUnitPayoffRuntime } from '../src/systems/unit-payoff-runtime.js';
import { createUnitMinionRuntime } from '../src/systems/unit-minion-runtime.js';
import { createArenaSignatures } from '../src/systems/unit-signatures.js';
import { applyTrackedHeal } from '../src/systems/combat-healing.js';
import {
  actorStatsKey,
  createCombatStats,
  recordCombatDamage,
  recordCombatHeal,
  recordCombatPrevented,
  startCombatRound,
} from '../src/systems/combat-stats.js';

const TICK_HZ = 60;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeStats() {
  const stats = createCombatStats({ n: 1, name: 'Credit Smoke' }, 0);
  startCombatRound(stats, { stage: { n: 1, name: 'Credit Smoke' }, frame: 0, round: 1, tickHz: TICK_HZ });
  return stats;
}

function entryFor(stats, actor) {
  return stats.entries[actorStatsKey(stats, actor)];
}

function unit(id, overrides = {}) {
  return {
    x: 230,
    y: 560,
    hp: 1000,
    maxHp: 1000,
    dmg: 100,
    healAmt: 90,
    level: 5,
    cellLevel: 5,
    hasL3: true,
    hasL5: true,
    a3: '',
    a5: '',
    abilCD: {},
    size: 20,
    range: 220,
    facing: 1,
    isPlayer: true,
    arch: 'ranged',
    unitIdx: id,
    cellKey: 'u' + id + '-' + Math.random().toString(16).slice(2),
    color: '#ffd54a',
    accent: '#ffffff',
    activeBuffs: [],
    ...overrides,
  };
}

function enemy(id, overrides = {}) {
  return {
    x: 250 + id * 18,
    y: 515 + id * 10,
    hp: 2000,
    maxHp: 2000,
    dmg: 40,
    size: 18,
    speed: 1,
    isEnemy: true,
    isPlayer: false,
    ...overrides,
  };
}

function dist(a, b) {
  return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
}

function makeRecorder(stats) {
  const damageEvents = [];
  const healEvents = [];
  function dealDamage(target, amount, attacker) {
    const damage = Math.max(0, Math.min(target.hp || 0, Math.round(amount || 0)));
    target.hp = Math.max(0, (target.hp || 0) - damage);
    damageEvents.push({ target, attacker, damage });
    recordCombatDamage(stats, target, attacker, damage);
    return damage;
  }
  function trackedHeal(target, amount, source, big, alreadyAdjusted) {
    return applyTrackedHeal(target, amount, {
      source,
      big,
      alreadyAdjusted,
      adjustHealingReceived: (_target, value) => Math.max(0, Math.round(value || 0)),
      emitHealFx: (_x, _y, value, _big, healSource, healTarget, meta = {}) => {
        healEvents.push({ source: healSource, target: healTarget, amount: value, overheal: meta.overheal || 0 });
        recordCombatHeal(stats, healSource, healTarget, value, meta.overheal || 0);
      },
    });
  }
  return { dealDamage, trackedHeal, damageEvents, healEvents };
}

function makeAbilityRuntime({ stats, units, enemies, projectiles = [], bombs = [], groundFx = [], beamFx = [], frame = 1000 }) {
  const recorder = makeRecorder(stats);
  const minions = createUnitMinionRuntime({
    tickHz: TICK_HZ,
    view: () => ({ arena: { cells: {} }, units, groundFx, frame, arenaTop: 100, arenaBottom: 900, arenaLeft: 40, arenaRight: 460, vodkaLevel: 1 }),
    randomRange: (min, max) => (min + max) / 2,
    randomFloat: () => 0.25,
    emitParticle: () => {},
    addDamageText: () => {},
    showFlash: () => {},
  });
  const runtime = createUnitAbilityRuntime({
    gameTickHz: TICK_HZ,
    sound: new Proxy({}, { get: () => () => {} }),
    view: () => ({ arena: {}, units, enemies, projectiles, bombs, groundFx, beamFx, frame, arenaTop: 100, arenaBottom: 900, arenaLeft: 40, arenaRight: 460, width: 500, height: 1000, screenShake: 0 }),
    setScreenShake: () => {},
    randomRange: (min, max) => (min + max) / 2,
    distance: dist,
    dealDamage: recorder.dealDamage,
    emitParticle: () => {},
    addDamageText: () => {},
    showFlash: () => {},
    spawnPlayerAbilityCastVfx: () => {},
    clampToLeash: () => {},
    clampToArena: actor => { actor.x = Math.max(40, Math.min(460, actor.x)); actor.y = Math.max(100, Math.min(900, actor.y)); },
    applyFelfelDeadlyPoison: () => {},
    findEnemyForUnit: () => enemies.find(e => e.hp > 0) || null,
    findJafaarDrainTarget: () => enemies.find(e => e.hp > 0) || null,
    fireProjectile: (from, target, dmg, opts) => projectiles.push({ from, target, dmg, attacker: from, ...opts }),
    beaconSplash: () => {},
    addGoldShield: () => 0,
    applyTrackedHeal: recorder.trackedHeal,
    spawnTreant: minions.spawnTreant,
    spawnMinion: minions.spawnMinion,
    spawnPetBear: minions.spawnPetBear,
    spawnDireBeast: minions.spawnDireBeast,
    spawnRepairBot: minions.spawnRepairBot,
    lobBomb: () => {},
  });
  return { runtime, minions, ...recorder };
}

function testMovedActiveDamageAndHealCredit() {
  const stats = makeStats();
  const caster = unit(1, { arch: 'tank', hp: 500 });
  const enemies = [enemy(0), enemy(1), enemy(2)];
  const units = [caster];
  const { runtime } = makeAbilityRuntime({ stats, units, enemies });
  runtime.abilities.heartStrike(caster);
  const entry = entryFor(stats, caster);
  assert(entry && entry.damageDone > 0, 'heartStrike should credit caster damage');
  assert(entry.healingDone > 0, 'heartStrike should credit caster self-healing');
}

function testHolyPrismHealCredit() {
  const stats = makeStats();
  const caster = unit(3, { arch: 'healer', hp: 800 });
  const ally = unit(10, { hp: 300, maxHp: 1000, x: 255, y: 570 });
  const enemies = [enemy(0, { x: 260, y: 500 })];
  const units = [caster, ally];
  const { runtime } = makeAbilityRuntime({ stats, units, enemies });
  runtime.abilities.holyPrism(caster);
  const entry = entryFor(stats, caster);
  assert(entry && entry.damageDone > 0, 'holyPrism should credit caster damage');
  assert(entry.healingDone > 0, 'holyPrism should credit caster healing');
}

function testPayoffDamageSources() {
  const stats = makeStats();
  const caster = unit(7, { arch: 'caster', unitIdx: 7, branch: 'base', dmg: 120, agony: { maxStacks: 5, dur: 240, tickMult: 0.25 } });
  const felfel = unit(4, { arch: 'melee', unitIdx: 4, branch: 'b', dmg: 110, poisonPayoff: true });
  const primary = enemy(0, { x: 250, y: 500 });
  const second = enemy(1, { x: 278, y: 510 });
  const enemies = [primary, second];
  const groundFx = [];
  const bombs = [];
  const beamFx = [];
  const recorder = makeRecorder(stats);
  const payoff = createUnitPayoffRuntime({
    tickHz: TICK_HZ,
    view: () => ({ enemies, groundFx, bombs, beamFx, frame: 1000, arenaTop: 100 }),
    distance: dist,
    dealDamage: recorder.dealDamage,
    clampToArena: () => {},
    emitParticle: () => {},
    addDamageText: () => {},
  });

  payoff.applyBasicSecondHit(caster, primary, 200, payoff.basicSecondHitFor(caster), 'magic', 'magic');
  payoff.applyJafaarAgony(caster, primary, false, false);
  assert(primary._agonyFrom === caster, 'agony should store caster source');
  recorder.dealDamage(primary, primary._agonyTickDmg, primary._agonyFrom, 'magic');
  assert(payoff.triggerJafaarCurseBloom(caster, primary), 'curse bloom should spawn');
  recorder.dealDamage(primary, groundFx[0].cbDmg, groundFx[0].cbFrom, 'magic');
  assert(payoff.triggerJafaarFelMeteor(caster, primary), 'fel meteor should spawn');
  assert(bombs.at(-1).attacker === caster, 'fel meteor should store caster attacker');

  payoff.applyFelfelDeadlyPoison(felfel, second, 3, true, false);
  assert(second.deadlyPoisonSource === felfel, 'deadly poison should store felfel source');
  recorder.dealDamage(second, second.deadlyPoisonDmgVal, second.deadlyPoisonSource, 'normal');
  assert(payoff.triggerFelfelToxicBloom(felfel, second), 'toxic bloom should spawn');
  recorder.dealDamage(second, groundFx.at(-1).cbDmg, groundFx.at(-1).cbFrom, 'normal');
  assert(payoff.triggerFelfelVenomMeteor(felfel, second), 'venom meteor should spawn');
  assert(bombs.at(-1).attacker === felfel, 'venom meteor should store felfel attacker');

  const casterEntry = entryFor(stats, caster);
  const felfelEntry = entryFor(stats, felfel);
  assert(casterEntry && casterEntry.damageDone > 0, 'Jafaar payoff damage should credit Jafaar');
  assert(felfelEntry && felfelEntry.damageDone > 0, 'Felfel payoff damage should credit Felfel');
}

function testSummonRootCreditAndSignatureMinionDeps() {
  const stats = makeStats();
  const owner = unit(8, { arch: 'ranged', unitIdx: 8, dmg: 100 });
  const units = [owner];
  const enemies = [enemy(0, { x: 235, y: 500 })];
  const groundFx = [];
  const recorder = makeRecorder(stats);
  const minions = createUnitMinionRuntime({
    tickHz: TICK_HZ,
    unitVisualScale: 1,
    view: () => ({ arena: { cells: {} }, units, groundFx, frame: 2000, arenaTop: 100, arenaBottom: 900, arenaLeft: 40, arenaRight: 460, vodkaLevel: 1 }),
    randomRange: (min, max) => (min + max) / 2,
    randomFloat: () => 0.2,
    emitParticle: () => {},
    addDamageText: () => {},
    showFlash: () => {},
  });
  const beast = minions.spawnDireBeast(owner);
  recorder.dealDamage(enemies[0], 50, beast, 'normal');
  assert(entryFor(stats, owner).damageDone >= 50, 'dire beast damage should roll up to owner');

  const signatures = createArenaSignatures({
    gameTickHz: TICK_HZ,
    getBattleArray: key => ({ units, enemies, projectiles: [], bombs: [], groundFx, beamFx: [] })[key],
    getArenaBounds: () => ({ top: 100, bottom: 900, left: 40, right: 460 }),
    addDamageText: () => {},
    emitParticle: () => {},
    showFlash: () => {},
    dealDamage: recorder.dealDamage,
    randomRange: (min, max) => (min + max) / 2,
    distance: dist,
    nerfMinion: minions.nerfMinion,
    unitVisualScale: 1,
    shake: () => {},
  });
  const warlock = unit(7, { arch: 'caster', unitIdx: 7, dmg: 120, x: 230, y: 560 });
  units.push(warlock);
  const before = units.length;
  signatures.summon_infernal.fire(warlock);
  assert(units.length > before, 'summon infernal should create a minion without monolith globals');
  const infernal = units.at(-1);
  recorder.dealDamage(enemies[0], 40, infernal, 'magic');
  assert(entryFor(stats, warlock).damageDone > 0, 'infernal damage should roll up to warlock');
}

function testDamageTakenTypeShieldAndEnemyRoleReports() {
  const stats = makeStats();
  const tank = unit(0, { arch: 'tank', hp: 700, maxHp: 1000 });
  const casterEnemy = enemy(0, { arch: 'caster', projType: 'fire', isPlayer: false });
  recordCombatDamage(stats, tank, casterEnemy, 140, { dmgType: 'magic', attackType: 'fire' });
  recordCombatPrevented(stats, tank, casterEnemy, 80, { kind: 'guard' });
  const entry = entryFor(stats, tank);
  assert(entry.damageTaken === 140, 'player damage taken should be tracked');
  assert(entry.damageTakenByType.magic === 140, 'elemental damage taken should group under magic');
  assert(entry.damageTakenByRole.caster === 140, 'damage taken should split by enemy role');
  assert(entry.shieldPrevented === 80, 'shield prevented value should be tracked');
  assert(entry.shieldPreventedByType.guard === 80, 'shield prevented should split by shield kind');
  assert(stats.enemyDamageByRole.caster === 140, 'stage report should track enemy damage by role');
}

testMovedActiveDamageAndHealCredit();
testHolyPrismHealCredit();
testPayoffDamageSources();
testSummonRootCreditAndSignatureMinionDeps();
testDamageTakenTypeShieldAndEnemyRoleReports();

console.log('Combat report source-credit smoke passed for moved actives, payoffs, DOTs, zones, meteors, summons, and heals.');
