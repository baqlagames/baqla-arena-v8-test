import { HP_MULT_ENEMY, UNIT_VISUAL_SCALE, ARENA_L, ARENA_R, ARENA_UNIT_SIZE_SCALE } from '../data/tuning.js';
import { STAGE_HP_MULT, STAGE_DMG_MULT } from '../data/stages.js';
import { ENEMIES } from '../data/enemies.js';
import { GAME_TICK_HZ } from '../core/constants.js';

export const WARMUP_FRAMES = 18 * GAME_TICK_HZ;
export const WARMUP_HP_MULT = 0.60;
export const WARMUP_DMG_MULT = 0.70;
export const WARMUP_GOLD_BONUS = 1.4;

export function isEnemyWarmup({ state, arenaState, stageTime }) {
  if (state === 'battle' && arenaState && arenaState.phase) {
    return (arenaState.round || 1) <= 2;
  }
  return stageTime < WARMUP_FRAMES;
}

export function applyEarlyRoundPressureTuning(enemy, template, { state, arenaState }) {
  if (!enemy || !template) return;
  if (!(state === 'battle' && arenaState && arenaState.phase)) return;
  if (enemy.isBoss || enemy.isElite || template.isBoss || template.isElite) return;
  const pressure = template.flying || template.arch === 'ranged' || template.arch === 'caster';
  if (!pressure) return;
  const earlyRound = (arenaState.round || 1) <= 2;
  if (!earlyRound) return;
  const isFlying = !!template.flying;
  enemy.dmg = Math.max(1, Math.round(enemy.dmg * (isFlying ? 0.90 : 0.84)));
  if (enemy.range) enemy.range = Math.max(40, Math.round(enemy.range - (isFlying ? 5 : 8)));
  enemy.atkSpd = Math.round((enemy.atkSpd || template.atkSpd || 60) + (isFlying ? 4 : 8));
  if (enemy.poisonDmg) enemy.poisonDmg = Math.max(1, Math.round(enemy.poisonDmg * 0.85));
  if (enemy.chainBoltDmgMult) enemy.chainBoltDmgMult = Math.max(0.25, enemy.chainBoltDmgMult * 0.85);
  enemy._earlyRoundPressureTuned = true;
}

export function spawnEnemyByIndex({
  typeIdx,
  state,
  arenaState,
  stageTime,
  currentStageIdx,
  currentStage,
  waveIdx,
  frame,
  arenaTop,
  spawnLeft,
  spawnRight,
  enemies,
  randomFloat = Math.random,
  randomRange,
  isCampaignBossRound,
  applyWaveMechanic,
  lateRoundEnemyMult,
  lateStageRoleHpMult,
  lateStageNormalDurabilityMult,
  lateStageNormalDamageMult,
}) {
  const template = ENEMIES[typeIdx];
  if (!template) return null;
  const rnd = typeof randomRange === 'function'
    ? randomRange
    : ((min, max) => min + randomFloat() * (max - min));
  const tankBuff = template.arch === 'tank' ? 1.10 : 1.06;
  const inArena = state === 'battle' && arenaState && arenaState.phase;
  let stageHpM = (STAGE_HP_MULT[currentStageIdx] || 1) * HP_MULT_ENEMY * tankBuff;
  let stageDmgM = STAGE_DMG_MULT[currentStageIdx] || 1;
  const warmup = isEnemyWarmup({ state, arenaState, stageTime });
  if (warmup) {
    stageHpM *= WARMUP_HP_MULT;
    stageDmgM *= WARMUP_DMG_MULT;
  }

  const roundN = inArena ? (arenaState.round || 1) : waveIdx;
  const stageN = (currentStage && currentStage.n) || 1;
  const waveGrowth = stageN <= 5 ? 1.10 : stageN <= 10 ? 1.08 : 1.09;
  const waveScale = Math.pow(waveGrowth, Math.max(0, roundN - 1));
  const dmgWaveScale = inArena ? 1 : waveScale;
  if (inArena) {
    const late = lateRoundEnemyMult(roundN, stageN);
    stageHpM *= late.hp;
    stageDmgM *= late.dmg;
    stageHpM *= lateStageRoleHpMult(template, stageN, roundN);
    if (!isCampaignBossRound()) {
      stageHpM *= lateStageNormalDurabilityMult(template, stageN, roundN);
      stageDmgM *= lateStageNormalDamageMult(template, stageN, roundN);
    }
  }

  const sizeScale = inArena ? ARENA_UNIT_SIZE_SCALE : UNIT_VISUAL_SCALE;
  const laneLeft = Number.isFinite(spawnLeft) ? spawnLeft : ARENA_L;
  const laneRight = Number.isFinite(spawnRight) ? spawnRight : ARENA_R;
  const spawnMin = laneLeft + 34;
  const spawnMax = Math.max(spawnMin + 1, laneRight - 34);
  const hp = Math.round(template.hp * stageHpM * waveScale);
  const enemy = {
    ...template,
    x: spawnMin + randomFloat() * (spawnMax - spawnMin),
    y: arenaTop + 75 + randomFloat() * 30,
    size: (template.size || 16) * sizeScale,
    maxHp: hp,
    hp,
    dmg: Math.round(template.dmg * stageDmgM * dmgWaveScale),
    isEnemy: true,
    cd: 0,
    facing: -1,
    bobPhase: randomFloat() * Math.PI * 2,
    debuffs: {},
    spawnFrame: frame,
    fromWarmup: warmup,
  };

  if (typeof applyWaveMechanic === 'function') applyWaveMechanic(enemy, template);
  applyEarlyRoundPressureTuning(enemy, template, { state, arenaState });
  enemies.push(enemy);

  if (template.swarm && !inArena) {
    for (let i = 1; i < template.swarm; i++) {
      enemies.push({
        ...enemy,
        x: Math.max(spawnMin, Math.min(spawnMax, enemy.x + rnd(-22, 22))),
        y: enemy.y + rnd(-12, 12),
        maxHp: enemy.maxHp,
        hp: enemy.maxHp,
        bobPhase: randomFloat() * Math.PI * 2,
        debuffs: {},
        fromWarmup: warmup,
      });
    }
  }
  return enemy;
}
