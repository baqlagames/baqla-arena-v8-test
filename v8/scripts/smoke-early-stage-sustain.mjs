#!/usr/bin/env node

import assert from 'node:assert/strict';
import { GAME_TICK_HZ } from '../src/core/constants.js';
import { STAGES, STAGE_DMG_MULT, STAGE_HP_MULT } from '../src/data/stages.js';
import { BOSSES } from '../src/data/bosses.js';
import { ENEMIES } from '../src/data/enemies.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { updateBoss } from '../src/systems/boss-mechanics.js';
import { applyNaanaFoulFelfelOnHitProcs } from '../src/systems/unit-naana-foul-felfel-onhit-procs.js';
import { tickUnitPriestPassives } from '../src/systems/unit-priest-ticks.js';

const WIDTH = 500;
const ARENA_TOP = 42;
const ARENA_BOT = 932;
const SPAWN_LEFT = 64;
const SPAWN_RIGHT = 436;

function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function makeUnit(id, name, arch, maxHp, x, y) {
  return {
    id,
    name,
    unitIdx: id,
    isPlayer: true,
    arch,
    hp: maxHp,
    maxHp,
    minHp: maxHp,
    x,
    y,
    size: arch === 'tank' ? 28 : 22,
    dmg: arch === 'healer' ? 52 : 92,
    atkSpd: arch === 'healer' ? 60 : 52,
    taunt: arch === 'tank',
    abilCD: {},
    debuffs: {},
  };
}

function makeSquad(stageN) {
  const tank = makeUnit(0, 'Sustain Tank', 'tank', 2200 + stageN * 430, 235, 660);
  const melee = makeUnit(5, 'Sustain Blade', 'melee', 1450 + stageN * 120, 205, 705);
  const ranged = makeUnit(8, 'Sustain Hunter', 'ranged', 1350 + stageN * 110, 292, 725);
  const healer = makeUnit(10, 'Naana Holy', 'healer', 1200 + stageN * 105, 260, 775);
  applyUnitPassives(healer, 10, stageN >= 5 ? 5 : 3, { gameTickHz: GAME_TICK_HZ, signatures: {} });
  return { tank, healer, units: [tank, melee, ranged, healer] };
}

function applyDamage(target, amount, type = 'normal') {
  if (!target || target.hp <= 0) return;
  const isTank = target.arch === 'tank' || target.taunt;
  const mult = isTank ? (type === 'magic' ? 0.74 : 0.58) : (type === 'magic' ? 0.86 : 0.78);
  const damage = Math.max(1, Math.round(amount * mult));
  target.hp = Math.max(0, target.hp - damage);
  target.minHp = Math.min(target.minHp, target.hp);
}

function makeEnemy(template, stageIndex, frame, random) {
  const hpMult = STAGE_HP_MULT[stageIndex] || 1;
  const dmgMult = STAGE_DMG_MULT[stageIndex] || 1;
  const maxHp = Math.round((template.hp || 1) * hpMult);
  return {
    ...template,
    x: SPAWN_LEFT + random() * (SPAWN_RIGHT - SPAWN_LEFT),
    y: ARENA_TOP + 130 + random() * 90,
    maxHp,
    hp: maxHp,
    dmg: Math.round((template.dmg || 1) * dmgMult),
    isEnemy: true,
    spawnFrame: frame,
    despawnFrame: frame + Math.round((8.5 + stageIndex * 0.35) * GAME_TICK_HZ),
    cd: Math.round(random() * (template.atkSpd || 60)),
    facing: -1,
    bobPhase: random() * Math.PI * 2,
    debuffs: {},
  };
}

function chooseTarget(enemy, units, random) {
  const alive = units.filter(unit => unit.hp > 0);
  if (!alive.length) return null;
  const tank = alive.find(unit => unit.arch === 'tank');
  const backline = alive.filter(unit => unit.arch !== 'tank');
  if ((enemy.prefersBackline || enemy.flying || enemy.arch === 'ranged' || enemy.arch === 'caster') && backline.length && random() < 0.42) {
    return backline[Math.floor(random() * backline.length)] || backline[0];
  }
  return tank || alive[0];
}

function lowestAliveEnemy(enemies) {
  return enemies.find(enemy => enemy && enemy.hp > 0 && !enemy.untargetable && !enemy.isBarrier) || null;
}

function tickHolySustain(frame, units, healer, enemies, logs) {
  tickUnitPriestPassives(healer, {
    frame,
    units,
    enemies,
    projectiles: [],
    beamEffects: [],
    arena: {},
    randomRange: (min, max) => min + (max - min) * 0.5,
    groundEffects: logs.groundEffects,
    dealDamage: (target, amount) => applyDamage(target, amount, 'magic'),
    applyHealingReceived: (_unit, amount) => amount,
    addHealFx: (_x, _y, amount, _big, _source, _target, meta) => {
      logs.heal += Math.round(amount || 0);
      if (meta && meta.silent) logs.silentHeals++;
    },
    findEnemyForUnit: () => lowestAliveEnemy(enemies),
    emitParticle: () => { logs.particles++; },
    addDamageText: () => {},
    shake: () => {},
  });

  if (frame % healer.atkSpd !== 0) return;
  const target = lowestAliveEnemy(enemies);
  if (!target) return;
  healer._sustainHits = (healer._sustainHits || 0) + 1;
  applyNaanaFoulFelfelOnHitProcs(healer, target, {
    frame,
    ohTier: healer._sustainHits % 5 === 0 ? 5 : 0,
    damage: healer.dmg,
    units,
    enemies,
    beamFx: [],
    groundEffects: logs.groundEffects,
    randomRange: (min, max) => min + (max - min) * 0.5,
    dealDamage: (enemy, amount) => { enemy.hp = Math.max(0, enemy.hp - Math.round(amount || 0)); },
    applyHealingReceived: (_unit, amount) => amount,
    addHealFx: (_x, _y, amount) => { logs.heal += Math.round(amount || 0); },
    applyFelfelDeadlyPoison: () => {},
    showFlash: () => {},
    emitParticle: () => { logs.particles++; },
    addDamageText: () => {},
    shake: () => {},
  });
}

function simulateStage(stage, stageIndex, seed) {
  const random = rng(seed);
  const { tank, healer, units } = makeSquad(stage.n || 1);
  const enemies = [];
  const logs = { heal: 0, silentHeals: 0, particles: 0, groundEffects: [] };
  let boss = null;
  let carapaceSeen = false;
  let warningSeen = false;
  const bossStart = Math.max(...stage.waves.map(wave => wave[0])) * GAME_TICK_HZ + 10 * GAME_TICK_HZ;
  const totalFrames = bossStart + (stage.bossId != null ? 50 * GAME_TICK_HZ : 16 * GAME_TICK_HZ);

  function spawnSupportEnemy(enemyIdx, frame) {
    const template = ENEMIES[enemyIdx] || ENEMIES[0];
    const enemy = makeEnemy(template, stageIndex, frame, random);
    enemies.push(enemy);
    return enemy;
  }

  const ctx = {
    arena: { phase: 'wave', activeBarrier: null, lieutenants: [], aerialBombs: [] },
    units,
    enemies,
    bombs: [],
    groundFx: logs.groundEffects,
    beamFx: [],
    frame: 0,
    width: WIDTH,
    arenaTop: ARENA_TOP,
    arenaBottom: ARENA_BOT,
    spawnLeft: SPAWN_LEFT,
    spawnRight: SPAWN_RIGHT,
    dealDamage: (target, amount, _from, type) => applyDamage(target, amount, type),
    addParticle: () => { logs.particles++; },
    addDamageText: () => {},
    showFlash: text => { if (text === 'ENRAGE SOON!') warningSeen = true; },
    fireProjectile: (_from, target, damage) => applyDamage(target, damage, 'normal'),
    spawnEnemyByIndex: enemyIdx => spawnSupportEnemy(enemyIdx, ctx.frame),
    tuneBossSupportMinion(enemy, sourceBoss, template) {
      if (!enemy || !sourceBoss || !template) return;
      enemy.bossSupport = true;
      enemy.maxHp = Math.max(1, Math.round((template.hp || enemy.maxHp || 1) * (sourceBoss.bossMinionHpMult || 0.5)));
      enemy.hp = enemy.maxHp;
      enemy.dmg = Math.max(1, Math.round((template.dmg || enemy.dmg || 1) * (sourceBoss.bossMinionDmgMult || 0.5)));
      enemy.despawnFrame = ctx.frame + 9 * GAME_TICK_HZ;
    },
    clampToArena(actor) {
      if (!actor) return;
      actor.x = Math.max(SPAWN_LEFT, Math.min(SPAWN_RIGHT, actor.x || WIDTH / 2));
      actor.y = Math.max(ARENA_TOP + 40, Math.min(ARENA_BOT - 40, actor.y || ARENA_TOP + 160));
    },
    SFX: { bossSlam() {} },
    shake: () => {},
  };

  for (let frame = 1; frame <= totalFrames; frame++) {
    ctx.frame = frame;
    for (const wave of stage.waves) {
      const [second, count, enemyIdx] = wave;
      if (frame !== second * GAME_TICK_HZ) continue;
      for (let i = 0; i < count; i++) spawnSupportEnemy(enemyIdx, frame);
    }

    if (!boss && stage.bossId != null && frame === bossStart) {
      const template = BOSSES[stage.bossId];
      boss = {
        ...template,
        x: WIDTH / 2,
        y: ARENA_TOP + 150,
        maxHp: template.hp,
        hp: template.hp,
        isEnemy: true,
        isBoss: true,
        spawnFrame: frame,
        cd: 0,
        facing: -1,
        bobPhase: 0,
        debuffs: {},
        mechCD: {},
      };
      enemies.push(boss);
    }

    for (const enemy of enemies) {
      if (!enemy || enemy.hp <= 0 || enemy.isBarrier || enemy === boss) continue;
      if (frame > enemy.despawnFrame) {
        enemy.hp = 0;
        continue;
      }
      enemy.cd = Math.max(0, (enemy.cd || 0) - 1);
      if (enemy.cd <= 0) {
        enemy.cd = enemy.atkSpd || 60;
        const target = chooseTarget(enemy, units, random);
        if (target) applyDamage(target, enemy.dmg || 1, enemy.projType === 'curse' ? 'magic' : 'normal');
      }
    }

    if (boss && boss.hp > 0) {
      if (frame % Math.max(32, boss.atkSpd || 60) === 0) applyDamage(tank, boss.dmg || 1, 'normal');
      if (frame % 30 === 0) {
        const damage = 185 + (stage.n || 1) * 18;
        if (boss.hiveShield && boss.hiveShield.hp > 0) {
          boss.hiveShield.hp = Math.max(0, boss.hiveShield.hp - damage);
        } else {
          boss.hp = Math.max(1, boss.hp - damage);
        }
      }
      updateBoss(boss, ctx);
      if (boss.royalCarapaceTimer > 0 || boss.hiveShield) carapaceSeen = true;
    }

    tickHolySustain(frame, units, healer, enemies, logs);
    for (const unit of units) unit.minHp = Math.min(unit.minHp, unit.hp);
    assert(units.some(unit => unit.hp > 0), `stage ${stage.n}: squad wiped`);
  }

  const tankFloor = stage.n >= 5 ? 0.16 : stage.n >= 3 ? 0.18 : 0.22;
  assert(tank.hp > 0, `stage ${stage.n}: tank died`);
  assert(healer.hp > 0, `stage ${stage.n}: Naana died`);
  assert(tank.minHp / tank.maxHp >= tankFloor, `stage ${stage.n}: tank dipped too low (${Math.round(100 * tank.minHp / tank.maxHp)}%)`);
  assert(healer.minHp / healer.maxHp >= 0.20, `stage ${stage.n}: healer dipped too low (${Math.round(100 * healer.minHp / healer.maxHp)}%)`);
  if (stage.n === 5) assert(carapaceSeen, 'stage 5: Hornet carapace was not exercised');

  return {
    stage: stage.n,
    tankMin: Math.round(100 * tank.minHp / tank.maxHp),
    healerMin: Math.round(100 * healer.minHp / healer.maxHp),
    heal: logs.heal,
    silentHeals: logs.silentHeals,
    carapaceSeen,
    warningSeen,
  };
}

const summaries = [];
for (const stage of STAGES.filter(item => item.n >= 1 && item.n <= 5)) {
  const stageIndex = STAGES.indexOf(stage);
  summaries.push(simulateStage(stage, stageIndex, 6000 + stage.n * 97));
}

console.log('Early stage sustain smoke passed for stages 1-5.');
for (const summary of summaries) {
  const extra = summary.carapaceSeen ? ', carapace exercised' : '';
  console.log(`- Stage ${summary.stage}: tank floor ${summary.tankMin}%, healer floor ${summary.healerMin}%, tracked heal ${summary.heal}, silent aura ticks ${summary.silentHeals}${extra}`);
}
