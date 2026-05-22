#!/usr/bin/env node

import assert from 'node:assert/strict';
import { GAME_TICK_HZ } from '../src/core/constants.js';
import { STAGES, STAGE_DMG_MULT, STAGE_HP_MULT } from '../src/data/stages.js';
import { BOSSES } from '../src/data/bosses.js';
import { ENEMIES } from '../src/data/enemies.js';
import { applyUnitPassives } from '../src/systems/unit-passives.js';
import { updateBoss } from '../src/systems/boss-mechanics.js';
import { updateArenaBomb } from '../src/systems/combat-projectiles.js';
import { tickUnitStatusTimers } from '../src/systems/unit-status-timers.js';
import { applyNaanaFoulFelfelOnHitProcs } from '../src/systems/unit-naana-foul-felfel-onhit-procs.js';
import { tickUnitPriestPassives } from '../src/systems/unit-priest-ticks.js';
import {
  ARENA_RIFT_MIN_STAGE,
  ARENA_RIFT_TELEGRAPH_FRAMES,
  arenaRiftStagePressureProfile,
  createRiftRuntime,
} from '../src/systems/rift-runtime.js';

const WIDTH = 500;
const ARENA_TOP = 42;
const ARENA_BOT = 932;
const DEPLOY_TOP = 590;
const SPAWN_LEFT = 64;
const SPAWN_RIGHT = 436;

function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function dist(a, b) {
  return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
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
    dmg: arch === 'healer' ? 58 : 110,
    atkSpd: arch === 'healer' ? 58 : 50,
    taunt: arch === 'tank',
    abilCD: {},
    debuffs: {},
  };
}

function makeSquad(stageN) {
  const tank = makeUnit(0, 'Act 2 Tank', 'tank', 2200 + stageN * 430, 235, 660);
  const melee = makeUnit(5, 'Act 2 Blade', 'melee', 1450 + stageN * 120, 205, 705);
  const ranged = makeUnit(8, 'Act 2 Hunter', 'ranged', 1350 + stageN * 110, 292, 725);
  const healer = makeUnit(10, 'Naana Holy', 'healer', 1200 + stageN * 105, 260, 775);
  applyUnitPassives(healer, 10, 5, { gameTickHz: GAME_TICK_HZ, signatures: {} });
  return { tank, melee, healer, units: [tank, melee, ranged, healer] };
}

function applyHealingReceived(unit, amount) {
  if (unit && unit._searingBrandTimer > 0) {
    amount = Math.max(1, Math.round(amount * (1 - (unit._searingBrandHealCut || 0.10))));
  }
  if (unit && unit._gravityBrandTimer > 0) {
    amount = Math.max(1, Math.round(amount * (1 - (unit._gravityBrandHealCut || 0.12))));
  }
  return amount;
}

function applyDamage(target, amount, source, type = 'normal', logs, attackType = '') {
  if (!target || target.hp <= 0 || !Number.isFinite(amount) || amount <= 0) return;
  let next = amount;
  if (source && source.stealth && !source.stealthHits) {
    const stealthMult = source.firstHitMult || source.stealthMult || 1;
    if (stealthMult > 1 && (source.vanishCD || source.vanishMult)) logs.vanishStrikes++;
    next *= stealthMult;
    source.firstHitDone = true;
    source.stealthHits = 1;
  }
  if (source && source.vanishEmpower) {
    next *= source.vanishEmpower;
    source.vanishEmpower = null;
    logs.vanishStrikes++;
  }
  if (target.ampTimer > 0) next *= target.ampMult || 1.3;
  if (target.markTimer > 0) next *= target.markMult || 1.5;

  const isTank = target.arch === 'tank' || target.taunt;
  const mult = isTank ? (type === 'magic' ? 0.74 : 0.58) : (type === 'magic' ? 0.86 : 0.78);
  let damage = Math.max(1, Math.round(next * mult));
  if (target._pwBarrier && target._pwBarrier.hp > 0) {
    const absorbed = Math.min(target._pwBarrier.hp, damage);
    target._pwBarrier.hp -= absorbed;
    damage -= absorbed;
    if (target._pwBarrier.hp <= 0) target._pwBarrier = null;
    if (damage <= 0) return;
  }
  target.hp = Math.max(0, target.hp - damage);
  target.minHp = Math.min(target.minHp, target.hp);
  logs.damageTaken[target.name] = (logs.damageTaken[target.name] || 0) + damage;
  const sourceName = source && source.name ? source.name : 'environment';
  logs.damageBySource[sourceName] = (logs.damageBySource[sourceName] || 0) + damage;
  if (source && source.id === 10) {
    logs.wardenDamage[target.name] = (logs.wardenDamage[target.name] || 0) + damage;
    const key = attackType || 'basic';
    logs.wardenDamageByAttack[key] = (logs.wardenDamageByAttack[key] || 0) + damage;
    if (target.arch === 'melee') logs.wardenMeleeByAttack[key] = (logs.wardenMeleeByAttack[key] || 0) + damage;
    if (attackType === 'gravityToll' && target.arch === 'tank') logs.wardenTankAoE += damage;
    if (attackType === 'gravityToll' && target.arch === 'melee') logs.wardenMeleeAoE += damage;
    if (attackType === 'astralBlight') logs.wardenBlightTicks++;
  }
  const stormBoss = source && (source.id === 13 ? source : source._stormBoss);
  if (stormBoss && stormBoss.id === 13) {
    const key = attackType || (source && source.stormWard ? 'ward' : source && source.stormMote ? 'stormMote' : 'basic');
    logs.stormVizierDamageByAttack[key] = (logs.stormVizierDamageByAttack[key] || 0) + damage;
    if (attackType === 'wardPulse') logs.stormWardPulses++;
    if (attackType === 'courtRebuke') logs.courtRebukes++;
    if (attackType === 'stormMote') logs.stormMoteHits++;
    if (attackType === 'chainDecree') logs.stormChains++;
  }
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
    despawnFrame: frame + Math.round((9.5 + stageIndex * 0.25) * GAME_TICK_HZ),
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
    beamEffects: logs.beamFx,
    arena: {},
    randomRange: (min, max) => min + (max - min) * 0.5,
    groundEffects: logs.groundEffects,
    dealDamage: (target, amount, source, type) => applyDamage(target, amount, source, type || 'magic', logs),
    applyHealingReceived,
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
    beamFx: logs.beamFx,
    groundEffects: logs.groundEffects,
    randomRange: (min, max) => min + (max - min) * 0.5,
    dealDamage: (enemy, amount) => { enemy.hp = Math.max(0, enemy.hp - Math.round(amount || 0)); },
    applyHealingReceived,
    addHealFx: (_x, _y, amount) => { logs.heal += Math.round(amount || 0); },
    applyFelfelDeadlyPoison: () => {},
    showFlash: () => {},
    emitParticle: () => { logs.particles++; },
    addDamageText: () => {},
    shake: () => {},
  });
}

function tickUnitDebuffs(frame, units, logs) {
  for (const unit of units) {
    tickUnitStatusTimers(unit, {
      frame,
      randomRange: (min, max) => min + (max - min) * 0.5,
      groundEffects: logs.groundEffects,
      dealDamage: (target, amount, source, type, attackType) => applyDamage(target, amount, source, type || 'magic', logs, attackType || ''),
      emitParticle: () => { logs.particles++; },
      addDamageText: () => {},
    });
  }
}

function tickGroundEffects(units, logs) {
  for (const effect of logs.groundEffects) {
    if (!effect) continue;
    if (effect.bossTel) {
      effect.telTimer--;
      if (effect.telTimer === 5) {
        if (effect.telSlowAll) {
          for (const unit of units) if (unit.hp > 0) unit.slowTimer = Math.max(unit.slowTimer || 0, effect.telSlowAll);
        } else {
          for (const unit of units) {
            if (unit.hp <= 0 || dist(effect, unit) > (effect.maxR || 0)) continue;
            if (effect.emberDecree && effect.emberDecreeCast) {
              if (unit._emberDecreeLastHit === effect.emberDecreeCast) continue;
              unit._emberDecreeLastHit = effect.emberDecreeCast;
            }
            applyDamage(unit, effect.telDmg || 0, effect.telFrom, effect.telDmgType || 'normal', logs);
            logs.telegraphHits++;
          }
        }
      }
      if (effect.telTimer <= 0) effect.life = 0;
    } else if (effect.poisonCloud) {
      effect.pcTimer--;
      if (effect.pcTimer % 30 === 0) {
        for (const unit of units) if (unit.hp > 0 && dist(effect, unit) < effect.maxR) applyDamage(unit, effect.pcDmg || 0, effect.pcFrom, 'magic', logs);
      }
      if (effect.pcTimer <= 0) effect.life = 0;
    } else if (effect.blizzard) {
      effect.blizTimer--;
      if (effect.blizTimer % 30 === 0) {
        for (const unit of units) if (unit.hp > 0 && dist(effect, unit) < effect.maxR) applyDamage(unit, effect.blizDmg || 0, effect.blizFrom, 'magic', logs);
      }
      if (effect.blizTimer <= 0) effect.life = 0;
    } else if (effect.life != null) {
      effect.life -= 1 / GAME_TICK_HZ;
    }
  }
  logs.groundEffects = logs.groundEffects.filter(effect => effect && (effect.life == null || effect.life > 0));
}

function tickBombs(units, enemies, logs) {
  for (let i = logs.bombs.length - 1; i >= 0; i--) {
    const keep = updateArenaBomb(logs.bombs[i], {
      bombs: logs.bombs,
      units,
      enemies,
      groundEffects: logs.groundEffects,
      randomRange: (min, max) => min + (max - min) * 0.5,
      dealDamage: (target, amount, source, type) => applyDamage(target, amount, source, type || 'normal', logs),
      emitParticle: () => { logs.particles++; },
      addDamageText: () => {},
      shake: () => {},
    });
    if (!keep) logs.bombs.splice(i, 1);
  }
}

function applyOnHitDebuffs(enemy, target, logs) {
  if (!enemy || !target || target.hp <= 0) return;
  if (enemy.poisonOnHit) {
    target.poisonTimer = Math.max(target.poisonTimer || 0, enemy.poisonDur || 180);
    target.poisonDmgVal = enemy.poisonDmg || 4;
  }
}

function applySearingBrandOnBasic(attacker, target, logs) {
  if (!attacker || !target || target.hp <= 0 || !attacker.searingBrandEvery) return;
  if (!(target.arch === 'tank' || target.taunt)) return;
  attacker._searingBrandHits = (attacker._searingBrandHits || 0) + 1;
  if (attacker._searingBrandHits < attacker.searingBrandEvery) return;
  attacker._searingBrandHits = 0;
  target._searingBrandTimer = attacker.searingBrandDur || Math.round(4 * GAME_TICK_HZ);
  target._searingBrandHealCut = attacker.searingBrandHealCut || 0.10;
  applyDamage(target, (target.maxHp || target.hp || 1) * (attacker.searingBrandHpPct || 0.05), attacker, 'magic', logs);
  logs.searingBrands++;
}

function tickEnemyBasics(frame, enemies, units, random, logs) {
  for (const enemy of enemies) {
    if (!enemy || enemy.hp <= 0 || enemy.isBarrier || enemy.isBoss) continue;
    if (enemy.entryHold > 0) { enemy.entryHold--; continue; }
    if (frame > enemy.despawnFrame) {
      enemy.hp = 0;
      continue;
    }
    enemy.cd = Math.max(0, (enemy.cd || 0) - 1);
    if (enemy.cd > 0) continue;
    enemy.cd = enemy.atkSpd || 60;
    const target = chooseTarget(enemy, units, random);
    if (!target) continue;
    const type = ['curse', 'fire', 'lightning', 'frost'].includes(enemy.projType) ? 'magic' : 'normal';
    applyDamage(target, enemy.dmg || 1, enemy, type, logs);
    applyOnHitDebuffs(enemy, target, logs);
  }
}

function tickBossBasic(boss, tank, units, logs) {
  if (!boss || boss.hp <= 0 || boss.isBarrier || boss.untargetable || boss.aerial || boss.lockedAtTop) return;
  if (boss.entryHold > 0) return;
  boss._sustainBasicCd = Math.max(0, (boss._sustainBasicCd || 0) - 1);
  if (boss._sustainBasicCd > 0) return;
  boss._sustainBasicCd = Math.max(32, boss.atkSpd || 60);
  const target = tank.hp > 0 ? tank : units.find(unit => unit.hp > 0);
  if (!target) return;
  applySearingBrandOnBasic(boss, target, logs);
  if (target.hp > 0) applyDamage(target, boss.dmg || 1, boss, boss.projType === 'fire' || boss.projType === 'curse' ? 'magic' : 'normal', logs);
  applyOnHitDebuffs(boss, target, logs);
}

function spawnBoss(template, frame, yOffset = 150) {
  return {
    ...template,
    x: WIDTH / 2,
    y: ARENA_TOP + yOffset,
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
}

function assertRiftGateAndProfile() {
  const stage5 = { n: ARENA_RIFT_MIN_STAGE - 1, act: 1 };
  const stage6 = { n: ARENA_RIFT_MIN_STAGE, act: 2 };
  const arena5 = {};
  createRiftRuntime({ view: () => ({ arena: arena5, currentStage: stage5 }), randomRange: () => 0 }).rollStageRift();
  assert.equal(arena5.scheduledRiftRound, null, 'rift should not schedule before stage 6');

  const arena6 = {};
  const rolls = [0.01, 0.25];
  createRiftRuntime({ view: () => ({ arena: arena6, currentStage: stage6 }), randomRange: () => rolls.shift() ?? 0 }).rollStageRift();
  assert.equal(arena6.scheduledRiftRound, 4, 'rift should be able to schedule on stage 6');

  const intro = arenaRiftStagePressureProfile(6);
  const settled = arenaRiftStagePressureProfile(10);
  assert.equal(intro.countAdjust, -1, 'stage 6 rift should use intro count smoothing');
  assert(intro.dmg < settled.dmg, 'stage 6 rift should be gentler than stage 10 rift');
}

function simulateStage(stage, stageIndex, seed) {
  const random = rng(seed);
  const { tank, melee, healer, units } = makeSquad(stage.n || 1);
  const enemies = [];
  const arena = { phase: 'wave', round: 1, waveElapsed: 0, scheduledRiftRound: 4, riftFiredThisRound: false, activeBarrier: null, lieutenants: [], aerialBombs: [] };
  const logs = {
    heal: 0,
    silentHeals: 0,
    particles: 0,
    groundEffects: [],
    bombs: [],
    beamFx: [],
    damageTaken: {},
    damageBySource: {},
    riftMinions: 0,
    vanishCasts: 0,
    vanishStrikes: 0,
    wardenCasts: { starfall: 0, eclipse: 0, gravity: 0, orbit: 0 },
    wardenDamage: {},
    wardenDamageByAttack: {},
    wardenMeleeByAttack: {},
    wardenTankAoE: 0,
    wardenMeleeAoE: 0,
    wardenShields: 0,
    wardenWardBreaks: 0,
    wardenBlightBursts: 0,
    wardenBlightTicks: 0,
    wardenGravityBrands: 0,
    stormVizierCasts: { wards: 0, motes: 0, chain: 0, rebuke: 0, expose: 0 },
    stormVizierDamageByAttack: {},
    stormWardPulses: 0,
    stormMoteHits: 0,
    stormChains: 0,
    courtRebukes: 0,
    stormMotesSeen: 0,
    stormWardsSeen: 0,
    searingBrands: 0,
    telegraphHits: 0,
    meteors: 0,
    miniBossSeen: false,
    sultanSeen: false,
    sonsSeen: false,
    tankDeathFrame: null,
  };

  const lastWaveSecond = Math.max(...stage.waves.map(wave => wave[0]));
  const firstBossStart = lastWaveSecond * GAME_TICK_HZ + 10 * GAME_TICK_HZ;
  const miniBossStart = stage.n === 10 ? firstBossStart : null;
  const bossStart = stage.n === 10 ? firstBossStart + 38 * GAME_TICK_HZ : firstBossStart;
  const bossSustainFrames = stage.n === 10 ? 62 * GAME_TICK_HZ : 66 * GAME_TICK_HZ;
  const totalFrames = bossStart + (stage.bossId != null ? bossSustainFrames : 24 * GAME_TICK_HZ);
  const riftFrame = 40 * GAME_TICK_HZ;
  let mainBoss = null;
  let miniBoss = null;
  let riftTriggered = false;

  function spawnSupportEnemy(enemyIdx, frame) {
    const template = ENEMIES[enemyIdx] || ENEMIES[0];
    const enemy = makeEnemy(template, stageIndex, frame, random);
    enemies.push(enemy);
    return enemy;
  }

  const riftRuntime = createRiftRuntime({
    view: () => ({
      arena,
      width: WIDTH,
      arenaTop: ARENA_TOP,
      arenaBottom: ARENA_BOT,
      deployTop: DEPLOY_TOP,
      arenaLeft: SPAWN_LEFT,
      arenaRight: SPAWN_RIGHT,
      currentStage: stage,
      currentStageIdx: stageIndex,
      enemies,
      enemiesData: ENEMIES,
      units,
      groundFx: logs.groundEffects,
      stageHpMult: STAGE_HP_MULT,
      stageDmgMult: STAGE_DMG_MULT,
      hpMultEnemy: 1,
      unitSizeScale: 1,
    }),
    randomRange: (min, max) => min + (max - min) * random(),
    distance: dist,
    emitParticle: () => { logs.particles++; },
    showFlash: () => {},
    shake: () => {},
  });

  const ctx = {
    arena,
    units,
    enemies,
    bombs: logs.bombs,
    groundFx: logs.groundEffects,
    beamFx: logs.beamFx,
    frame: 0,
    width: WIDTH,
    arenaTop: ARENA_TOP,
    arenaBottom: ARENA_BOT,
    spawnLeft: SPAWN_LEFT,
    spawnRight: SPAWN_RIGHT,
    dealDamage: (target, amount, source, type, attackType) => applyDamage(target, amount, source, type || 'normal', logs, attackType || ''),
    addParticle: () => { logs.particles++; },
    addDamageText: (_x, _y, text) => {
      if (text === 'GRAVITY BRAND') logs.wardenGravityBrands++;
      if (text === 'WARD PULSE') logs.stormWardPulses++;
      if (text === 'STORM MOTE') logs.stormMoteHits++;
      if (text === 'CHAIN') logs.stormChains++;
      if (text === 'COURT REBUKE') logs.courtRebukes++;
    },
    showFlash: text => {
      if (text === 'VANISH!') logs.vanishCasts++;
      if (text === 'STARFALL!') logs.wardenCasts.starfall++;
      if (text === 'ECLIPSE BEAM!') logs.wardenCasts.eclipse++;
      if (text === 'GRAVITY TOLL!') logs.wardenCasts.gravity++;
      if (text === 'LANTERN ORBIT!') logs.wardenCasts.orbit++;
      if (text === 'LANTERN WARD!') logs.wardenShields++;
      if (text === 'WARD BROKEN!') logs.wardenWardBreaks++;
      if (text === 'ASTRAL BLIGHT!') logs.wardenBlightBursts++;
      if (text === 'METEOR!') logs.meteors++;
      if (text === 'TWIN WARDS!') logs.stormVizierCasts.wards++;
      if (text === 'STORM MOTES!') logs.stormVizierCasts.motes++;
      if (text === 'CHAIN DECREE!') logs.stormVizierCasts.chain++;
      if (text === 'COURT REBUKE!') logs.stormVizierCasts.rebuke++;
      if (text === 'JUDGMENT WINDOW!') logs.stormVizierCasts.expose++;
    },
    fireProjectile: (source, target, damage, opts = {}) => applyDamage(target, damage, source, ['curse', 'fire', 'lightning', 'frost'].includes(opts.projType) ? 'magic' : 'normal', logs),
    spawnEnemyByIndex: enemyIdx => spawnSupportEnemy(enemyIdx, ctx.frame),
    tuneBossSupportMinion(enemy, sourceBoss, template) {
      if (!enemy || !sourceBoss || !template) return;
      enemy.bossSupport = true;
      enemy.maxHp = Math.max(1, Math.round((template.hp || enemy.maxHp || 1) * (sourceBoss.bossMinionHpMult || 0.5)));
      enemy.hp = enemy.maxHp;
      enemy.dmg = Math.max(1, Math.round((template.dmg || enemy.dmg || 1) * (sourceBoss.bossMinionDmgMult || 0.5)));
      enemy.despawnFrame = ctx.frame + 10 * GAME_TICK_HZ;
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
    arena.waveElapsed++;
    for (const wave of stage.waves) {
      const [second, count, enemyIdx] = wave;
      if (frame !== second * GAME_TICK_HZ) continue;
      for (let i = 0; i < count; i++) spawnSupportEnemy(enemyIdx, frame);
    }

    if (!riftTriggered && frame === riftFrame) {
      arena.round = 4;
      arena.waveElapsed = 10 * GAME_TICK_HZ;
      arena.scheduledRiftRound = 4;
      riftRuntime.tryTriggerRift();
      riftTriggered = !!arena.rift;
    }
    if (arena.rift) {
      arena.rift.telegraphTimer--;
      if (arena.rift.telegraphTimer <= 0) {
        const before = enemies.length;
        riftRuntime.spawnRiftMinions();
        for (const enemy of enemies.slice(before)) {
          if (!enemy.fromRift) continue;
          enemy.despawnFrame = frame + 13 * GAME_TICK_HZ;
          enemy.cd = Math.round(random() * (enemy.atkSpd || 60));
          logs.riftMinions++;
        }
      }
    }

    if (miniBossStart && !miniBoss && frame === miniBossStart) {
      miniBoss = spawnBoss(BOSSES[13], frame, 145);
      enemies.push(miniBoss);
      logs.miniBossSeen = true;
    }
    if (miniBoss && miniBoss.hp > 0 && frame === bossStart - 1) {
      miniBoss.hp = 0;
      for (const enemy of enemies) if (enemy && enemy._stormBoss === miniBoss) enemy.hp = 0;
    }

    if (!mainBoss && stage.bossId != null && frame === bossStart) {
      mainBoss = spawnBoss(BOSSES[stage.bossId], frame, 150);
      enemies.push(mainBoss);
      if (stage.bossId === 4) logs.sultanSeen = true;
    }

    tickEnemyBasics(frame, enemies, units, random, logs);

    for (const boss of enemies.filter(enemy => enemy && enemy.hp > 0 && enemy.isBoss)) {
      updateBoss(boss, ctx);
      tickBossBasic(boss, tank, units, logs);
      if (frame % 30 === 0 && !boss.isLieutenant) {
        let damage = 220 + (stage.n || 1) * 22;
        if (boss.hiveShield && boss.hiveShield.hp > 0) {
          const absorbed = Math.min(boss.hiveShield.hp, damage);
          boss.hiveShield.hp -= absorbed;
          damage -= absorbed;
          if (boss.hiveShield.hp <= 0) boss.hiveShield.hp = 0;
        }
        const keepAliveForMechanics = boss === mainBoss || boss === miniBoss;
        if (damage > 0) boss.hp = keepAliveForMechanics ? Math.max(1, boss.hp - damage) : Math.max(0, boss.hp - damage);
      }
    }
    if (enemies.some(enemy => enemy && enemy.hp > 0 && enemy.name === 'Son of Embers')) logs.sonsSeen = true;
    if (enemies.some(enemy => enemy && enemy.hp > 0 && (enemy.name === 'Iron Ward' || enemy.name === 'Mirror Ward'))) logs.stormWardsSeen++;
    if (enemies.some(enemy => enemy && enemy.hp > 0 && enemy.name === 'Storm Mote')) logs.stormMotesSeen++;

    tickGroundEffects(units, logs);
    tickBombs(units, enemies, logs);
    tickUnitDebuffs(frame, units, logs);
    tickHolySustain(frame, units, healer, enemies, logs);
    for (const unit of units) unit.minHp = Math.min(unit.minHp, unit.hp);
    if (tank.hp <= 0 && logs.tankDeathFrame == null) logs.tankDeathFrame = frame;
    assert(
      units.some(unit => unit.hp > 0),
      `stage ${stage.n}: squad wiped at ${Math.round(frame / GAME_TICK_HZ)}s, damage ${JSON.stringify(logs.damageTaken)}`
    );
  }

  const tankFloor = stage.n >= 10 ? 0.12 : stage.n >= 8 ? 0.14 : 0.16;
  assert(tank.hp > 0, `stage ${stage.n}: tank died at ${Math.round((logs.tankDeathFrame || totalFrames) / GAME_TICK_HZ)}s, min ${Math.round(100 * tank.minHp / tank.maxHp)}%, damage ${JSON.stringify(logs.damageTaken)}, by source ${JSON.stringify(logs.damageBySource)}`);
  assert(healer.hp > 0, `stage ${stage.n}: Naana died, min ${Math.round(100 * healer.minHp / healer.maxHp)}%, damage ${JSON.stringify(logs.damageTaken)}, by source ${JSON.stringify(logs.damageBySource)}`);
  assert(tank.minHp / tank.maxHp >= tankFloor, `stage ${stage.n}: tank dipped too low (${Math.round(100 * tank.minHp / tank.maxHp)}%)`);
  assert(healer.minHp / healer.maxHp >= 0.18, `stage ${stage.n}: healer dipped too low (${Math.round(100 * healer.minHp / healer.maxHp)}%)`);
  assert(logs.riftMinions > 0, `stage ${stage.n}: forced rift did not spawn minions`);
  if (stage.n === 8) {
    assert(logs.wardenCasts.starfall > 0, 'stage 8: Astral Warden Starfall was not exercised');
    assert(logs.wardenCasts.eclipse > 0, 'stage 8: Astral Warden Eclipse Beam was not exercised');
    assert(logs.wardenCasts.gravity > 0, 'stage 8: Astral Warden Gravity Toll was not exercised');
    assert(logs.wardenCasts.orbit > 0, 'stage 8: Astral Warden Lantern Orbit was not exercised');
    assert(logs.wardenDamageByAttack.starfall > 0, 'stage 8: Starfall did not damage the squad');
    assert(logs.wardenDamageByAttack.eclipseBeam > 0, 'stage 8: Eclipse Beam did not damage the squad');
    assert(logs.wardenDamageByAttack.gravityToll > 0, 'stage 8: Gravity Toll did not damage the squad');
    assert(logs.wardenDamageByAttack.lanternOrbit > 0, 'stage 8: Lantern Orbit did not damage the squad');
    assert(logs.wardenMeleeByAttack.starfall > 0, 'stage 8: melee unit did not receive Starfall pressure');
    assert(logs.wardenMeleeByAttack.eclipseBeam > 0, 'stage 8: melee unit did not receive Eclipse wake pressure');
    assert(logs.wardenMeleeByAttack.gravityToll > 0, 'stage 8: melee unit did not receive Gravity pressure');
    assert(logs.wardenTankAoE > 0, 'stage 8: tank unit did not receive Warden Gravity pressure');
    assert(logs.wardenMeleeAoE > 0, 'stage 8: melee unit did not receive reduced Warden AoE pressure');
    assert(tank.minHp / tank.maxHp <= 0.84, `stage 8: tank stayed too healthy (${Math.round(100 * tank.minHp / tank.maxHp)}%)`);
    assert(melee.minHp / melee.maxHp <= 0.88, `stage 8: melee stayed too healthy (${Math.round(100 * melee.minHp / melee.maxHp)}%)`);
    assert(logs.wardenShields >= 2, 'stage 8: Lantern Ward phase shields were not exercised');
    assert(logs.wardenWardBreaks >= 2, 'stage 8: Lantern Ward breaks were not exercised');
    assert(logs.wardenBlightBursts >= 2, 'stage 8: Astral Blight shield-break bursts were not exercised');
    assert(logs.wardenBlightTicks > 0, 'stage 8: Astral Blight DoT ticks were not exercised');
    assert(logs.wardenGravityBrands > 0, 'stage 8: Gravity Brand was not applied to tank/melee units');
  }
  if (stage.n === 10) {
    assert(logs.miniBossSeen, 'stage 10: Stormbound Vizier was not exercised');
    assert(logs.stormVizierCasts.wards > 0, 'stage 10: Stormbound Vizier Twin Wards were not exercised');
    assert(logs.stormVizierCasts.motes > 0, 'stage 10: Stormbound Vizier Storm Motes were not exercised');
    assert(logs.stormVizierCasts.chain > 0 || logs.stormChains > 0, 'stage 10: Stormbound Vizier Chain Decree was not exercised');
    assert(logs.stormWardsSeen > 0, 'stage 10: Stormbound Vizier priority wards were not present');
    assert(logs.stormMotesSeen > 0, 'stage 10: Stormbound Vizier flying motes were not present');
    assert(logs.courtRebukes > 0 || logs.stormVizierCasts.expose > 0, 'stage 10: Stormbound Vizier Judgment/Court outcome was not exercised');
    assert(logs.sultanSeen, 'stage 10: Sultan was not exercised');
    assert(logs.searingBrands > 0, 'stage 10: Sultan searing brand was not exercised');
    assert(logs.meteors > 0, 'stage 10: Sultan meteor was not exercised');
    assert(logs.sonsSeen, 'stage 10: Sons of Embers were not exercised');
  }

  return {
    stage: stage.n,
    tankMin: Math.round(100 * tank.minHp / tank.maxHp),
    meleeMin: Math.round(100 * melee.minHp / melee.maxHp),
    healerMin: Math.round(100 * healer.minHp / healer.maxHp),
    heal: logs.heal,
    silentHeals: logs.silentHeals,
    riftMinions: logs.riftMinions,
    wardenCasts: logs.wardenCasts,
    wardenDamageByAttack: logs.wardenDamageByAttack,
    wardenMeleeByAttack: logs.wardenMeleeByAttack,
    wardenTankAoE: logs.wardenTankAoE,
    wardenMeleeAoE: logs.wardenMeleeAoE,
    wardenShields: logs.wardenShields,
    wardenWardBreaks: logs.wardenWardBreaks,
    wardenBlightTicks: logs.wardenBlightTicks,
    wardenGravityBrands: logs.wardenGravityBrands,
    stormVizierCasts: logs.stormVizierCasts,
    stormVizierDamageByAttack: logs.stormVizierDamageByAttack,
    stormWardPulses: logs.stormWardPulses,
    stormMoteHits: logs.stormMoteHits,
    stormChains: logs.stormChains,
    courtRebukes: logs.courtRebukes,
    searingBrands: logs.searingBrands,
    meteors: logs.meteors,
    sonsSeen: logs.sonsSeen,
  };
}

assertRiftGateAndProfile();

const summaries = [];
for (const stage of STAGES.filter(item => item.n >= 6 && item.n <= 10)) {
  const stageIndex = STAGES.indexOf(stage);
  summaries.push(simulateStage(stage, stageIndex, 7600 + stage.n * 131));
}

console.log('Act 2 sustain smoke passed for stages 6-10.');
for (const summary of summaries) {
  const details = [
    `rift minions ${summary.riftMinions}`,
    summary.wardenCasts ? `warden casts ${Object.values(summary.wardenCasts).join('/')}` : null,
    summary.wardenDamageByAttack ? `warden damage ${Object.entries(summary.wardenDamageByAttack).map(([k, v]) => `${k}:${v}`).join('/')}` : null,
    summary.wardenMeleeByAttack ? `melee hits ${Object.entries(summary.wardenMeleeByAttack).map(([k, v]) => `${k}:${v}`).join('/')}` : null,
    summary.wardenTankAoE ? `tank Gravity ${summary.wardenTankAoE}` : null,
    summary.wardenMeleeAoE ? `melee Gravity ${summary.wardenMeleeAoE}` : null,
    summary.wardenShields ? `wards ${summary.wardenShields}/${summary.wardenWardBreaks}` : null,
    summary.wardenBlightTicks ? `blight ticks ${summary.wardenBlightTicks}` : null,
    summary.wardenGravityBrands ? `gravity brands ${summary.wardenGravityBrands}` : null,
    summary.stormVizierCasts ? `vizier casts ${Object.values(summary.stormVizierCasts).join('/')}` : null,
    summary.stormVizierDamageByAttack ? `vizier damage ${Object.entries(summary.stormVizierDamageByAttack).map(([k, v]) => `${k}:${v}`).join('/')}` : null,
    summary.stormWardPulses ? `ward pulses ${summary.stormWardPulses}` : null,
    summary.stormMoteHits ? `mote hits ${summary.stormMoteHits}` : null,
    summary.stormChains ? `chain hits ${summary.stormChains}` : null,
    summary.courtRebukes ? `court rebukes ${summary.courtRebukes}` : null,
    summary.searingBrands ? `searing brands ${summary.searingBrands}` : null,
    summary.meteors ? `meteors ${summary.meteors}` : null,
    summary.sonsSeen ? 'sons exercised' : null,
  ].filter(Boolean).join(', ');
  console.log(`- Stage ${summary.stage}: tank floor ${summary.tankMin}%, melee floor ${summary.meleeMin}%, healer floor ${summary.healerMin}%, tracked heal ${summary.heal}, silent aura ticks ${summary.silentHeals}, ${details}`);
}
