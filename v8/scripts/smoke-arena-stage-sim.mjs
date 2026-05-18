import { STAGES, STAGE_DMG_MULT, STAGE_HP_MULT } from '../src/data/stages.js';
import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES } from '../src/data/bosses.js';
import { ARENA_L, ARENA_R } from '../src/data/tuning.js';
import { spawnBossById } from '../src/systems/boss-spawn.js';
import { spawnEnemyByIndex } from '../src/systems/enemy-spawn.js';
import {
  arena_lateRoundEnemyMult,
  arena_lateStageNormalDamageMult,
  arena_lateStageNormalDurabilityMult,
  arena_lateStageRoleHpMult,
  arena_roundsForStage,
} from '../src/systems/stage-economy.js';
import {
  arena_pickWaveMechanic,
  arena_stageOpenerQueue,
  arena_themedWaveQueue,
  arena_waveEnemyCap,
} from '../src/systems/wave-planner.js';
import { buildWaveThreats } from '../src/systems/wave-threats.js';

const WIDTH = 500;
const AREA = {
  left: ARENA_L + 28,
  right: ARENA_R - 28,
  top: 58,
  bottom: 920,
  spawnY: 104,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertFiniteActor(actor, label) {
  assert(actor, `${label}: missing actor`);
  assert(Number.isFinite(actor.x) && Number.isFinite(actor.y), `${label}: non-finite position`);
  assert(Number.isFinite(actor.hp) && actor.hp > 0, `${label}: invalid hp`);
  if (actor.dmg != null) assert(Number.isFinite(actor.dmg), `${label}: invalid damage`);
}

function assertInside(actor, label) {
  assertFiniteActor(actor, label);
  assert(actor.x >= AREA.left && actor.x <= AREA.right, `${label}: x outside arena (${actor.x})`);
  assert(actor.y >= AREA.top && actor.y <= AREA.bottom, `${label}: y outside arena (${actor.y})`);
}

function deterministicRandom(seed) {
  let x = seed || 1;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function roundQueue(stage, round, totalRounds) {
  if (round >= totalRounds) return stage.bossId != null ? ['BOSS'] : [{ elite: stage.eliteEnemyId }];
  const plan = (round === 1 ? arena_stageOpenerQueue(stage) : null) || arena_themedWaveQueue(round, stage.n || 1, stage.act || 1);
  const queue = [...(plan.queue || [])];
  const miniBossId = ((stage.n || 0) === 10 && round === 4) ? 13 : null;
  if (miniBossId != null) queue.push({ boss: miniBossId, label: 'MINI BOSS', color: '#ff8c22' });
  return queue;
}

function simulateRound(stage, stageIndex, round) {
  const totalRounds = arena_roundsForStage(stage.n || 1);
  const queue = roundQueue(stage, round, totalRounds);
  const isBoss = round >= totalRounds;
  const numericQueue = queue.filter(item => Number.isInteger(item));
  const cap = arena_waveEnemyCap(stage.n || 1, round);
  assert(isBoss || numericQueue.length > 0, `stage ${stage.n} round ${round}: empty wave queue`);
  assert(numericQueue.length <= cap, `stage ${stage.n} round ${round}: queue exceeds cap`);
  for (const id of numericQueue) assert(ENEMIES[id], `stage ${stage.n} round ${round}: missing enemy ${id}`);

  const threats = buildWaveThreats({
    round,
    total: totalRounds,
    isBoss,
    stage,
    queue: numericQueue,
    theme: isBoss ? 'BOSS' : 'SIM',
    miniBossId: queue.find(item => item && item.boss != null)?.boss,
  });
  assert(threats && (Array.isArray(threats.enemies) || threats.bossName), `stage ${stage.n} round ${round}: missing threat data`);
  if (!isBoss) assert(threats.enemies.length > 0, `stage ${stage.n} round ${round}: empty threat list`);

  const enemies = [];
  const rng = deterministicRandom(stage.n * 100 + round);
  let bosses = 0;
  for (const item of queue) {
    if (item === 'BOSS') {
      const boss = spawnBossById({
        bossId: stage.bossId,
        state: 'battle',
        arenaState: { phase: 'wave', round },
        frame: round * 100,
        width: WIDTH,
        arenaTop: AREA.top,
        arenaBottom: AREA.bottom,
        spawnY: AREA.spawnY,
        spawnLeft: AREA.left,
        spawnRight: AREA.right,
        enemies,
        randomFloat: rng,
      });
      assertInside(boss, `stage ${stage.n} boss ${stage.bossId}`);
      bosses++;
    } else if (item && item.boss != null) {
      const boss = spawnBossById({
        bossId: item.boss,
        opts: { label: item.label, color: item.color },
        state: 'battle',
        arenaState: { phase: 'wave', round },
        frame: round * 100,
        width: WIDTH,
        arenaTop: AREA.top,
        arenaBottom: AREA.bottom,
        spawnY: AREA.spawnY,
        spawnLeft: AREA.left,
        spawnRight: AREA.right,
        enemies,
        randomFloat: rng,
      });
      assertInside(boss, `stage ${stage.n} mini boss ${item.boss}`);
      bosses++;
    } else if (item && item.elite != null) {
      const elite = spawnEnemyByIndex({
        typeIdx: item.elite,
        state: 'battle',
        arenaState: { phase: 'wave', round },
        stageTime: round * 1000,
        currentStageIdx: stageIndex,
        currentStage: stage,
        waveIdx: round,
        frame: round * 100,
        arenaTop: AREA.top,
        arenaBottom: AREA.bottom,
        spawnY: AREA.spawnY,
        spawnLeft: AREA.left,
        spawnRight: AREA.right,
        enemies,
        randomFloat: rng,
        isCampaignBossRound: () => false,
        lateRoundEnemyMult: arena_lateRoundEnemyMult,
        lateStageRoleHpMult: arena_lateStageRoleHpMult,
        lateStageNormalDurabilityMult: arena_lateStageNormalDurabilityMult,
        lateStageNormalDamageMult: arena_lateStageNormalDamageMult,
      });
      assertInside(elite, `stage ${stage.n} elite ${item.elite}`);
    } else {
      const enemy = spawnEnemyByIndex({
        typeIdx: item,
        state: 'battle',
        arenaState: { phase: 'wave', round },
        stageTime: round * 1000,
        currentStageIdx: stageIndex,
        currentStage: stage,
        waveIdx: round,
        frame: round * 100,
        arenaTop: AREA.top,
        arenaBottom: AREA.bottom,
        spawnY: AREA.spawnY,
        spawnLeft: AREA.left,
        spawnRight: AREA.right,
        enemies,
        randomFloat: rng,
        isCampaignBossRound: () => false,
        lateRoundEnemyMult: arena_lateRoundEnemyMult,
        lateStageRoleHpMult: arena_lateStageRoleHpMult,
        lateStageNormalDurabilityMult: arena_lateStageNormalDurabilityMult,
        lateStageNormalDamageMult: arena_lateStageNormalDamageMult,
      });
      assertInside(enemy, `stage ${stage.n} enemy ${item}`);
    }
  }

  for (const actor of enemies) {
    if (!actor || actor.isBarrier) continue;
    assertInside(actor, `stage ${stage.n} spawned ${actor.name || actor.id || 'actor'}`);
  }
  const hpBudget = enemies.reduce((sum, enemy) => sum + Math.max(0, enemy && enemy.hp || 0), 0);
  const dmgBudget = enemies.reduce((sum, enemy) => sum + Math.max(0, enemy && enemy.dmg || 0), 0);
  assert(Number.isFinite(hpBudget) && hpBudget > 0, `stage ${stage.n} round ${round}: invalid hp budget`);
  assert(Number.isFinite(dmgBudget), `stage ${stage.n} round ${round}: invalid damage budget`);
  const mechanic = arena_pickWaveMechanic(stage.n || 1, round, isBoss);
  return { enemies: enemies.length, bosses, hpBudget, dmgBudget, mechanic: mechanic && mechanic.type };
}

let rounds = 0;
let enemies = 0;
let bosses = 0;
let hpBudget = 0;
let dmgBudget = 0;
for (let i = 0; i < STAGES.length; i++) {
  const stage = STAGES[i];
  assert(BOSSES[stage.bossId] || stage.bossId == null, `stage ${stage.n}: missing boss ${stage.bossId}`);
  const totalRounds = arena_roundsForStage(stage.n || 1);
  for (let round = 1; round <= totalRounds; round++) {
    const result = simulateRound(stage, i, round);
    rounds++;
    enemies += result.enemies;
    bosses += result.bosses;
    hpBudget += result.hpBudget;
    dmgBudget += result.dmgBudget;
  }
}

console.log(`Arena stage simulation passed for ${STAGES.length} stages and ${rounds} rounds.`);
console.log(`Spawned ${enemies} actors including ${bosses} boss entries; hp budget ${Math.round(hpBudget)}, damage budget ${Math.round(dmgBudget)}.`);
