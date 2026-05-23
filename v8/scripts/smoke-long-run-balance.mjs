import { STAGES, STAGE_DMG_MULT, STAGE_HP_MULT } from '../src/data/stages.js';
import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES } from '../src/data/bosses.js';
import { ARENA_L, ARENA_R, HP_MULT_ENEMY, UNIT_VISUAL_SCALE, ARENA_UNIT_SIZE_SCALE } from '../src/data/tuning.js';
import { GAME_TICK_HZ } from '../src/core/constants.js';
import { spawnBossById } from '../src/systems/boss-spawn.js';
import { spawnEnemyByIndex } from '../src/systems/enemy-spawn.js';
import {
  arena_lateRoundEnemyMult,
  arena_lateStageNormalDamageMult,
  arena_lateStageNormalDurabilityMult,
  arena_lateStageRoleHpMult,
  arena_roundsForStage,
  arena_stageIncome,
  arena_stageStartGold,
  arena_campaignKillBountyStageMult,
} from '../src/systems/stage-economy.js';
import { createStageFlowRuntime } from '../src/systems/stage-flow-runtime.js';
import {
  arena_pickWaveMechanic,
  arena_stageOpenerQueue,
  arena_themedWaveQueue,
} from '../src/systems/wave-planner.js';

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

function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function rndFrom(next) {
  return (min, max) => min + next() * (max - min);
}

function assertActor(actor, label) {
  assert(actor, `${label}: missing actor`);
  assert(Number.isFinite(actor.x) && actor.x >= AREA.left && actor.x <= AREA.right, `${label}: x outside arena (${actor.x})`);
  assert(Number.isFinite(actor.y) && actor.y >= AREA.top && actor.y <= AREA.bottom, `${label}: y outside arena (${actor.y})`);
  assert(Number.isFinite(actor.hp) && actor.hp > 0, `${label}: invalid hp`);
  assert(Number.isFinite(actor.maxHp) && actor.maxHp >= actor.hp, `${label}: invalid max hp`);
  assert(actor.dmg == null || Number.isFinite(actor.dmg), `${label}: invalid damage`);
  assert((actor.size || 0) > 0 && actor.size < 180, `${label}: invalid size`);
}

function waveQueue(stage, round, totalRounds) {
  if (round >= totalRounds) return stage.bossId != null ? ['BOSS'] : [{ elite: stage.eliteEnemyId }];
  const plan = (round === 1 ? arena_stageOpenerQueue(stage) : null) || arena_themedWaveQueue(round, stage.n || 1, stage.act || 1);
  const queue = [...(plan.queue || [])];
  if ((stage.n || 0) === 10 && round === 4) queue.push({ boss: 13, label: 'MINI BOSS - WINTERGLASS MAGISTRATE', color: '#9fdcff' });
  return queue;
}

function spawnChampionForStage(stage, stageIndex, seed) {
  const enemies = [];
  const next = rng(seed);
  const view = {
    state: 'battle',
    arena: { phase: 'wave', round: arena_roundsForStage(stage.n || 1) },
    stageTime: 0,
    currentStageIdx: stageIndex,
    currentStage: stage,
    waveIdx: arena_roundsForStage(stage.n || 1),
    frame: seed,
    arenaTop: AREA.top,
    arenaBottom: AREA.bottom,
    spawnY: AREA.spawnY,
    spawnLeft: AREA.left,
    spawnRight: AREA.right,
    width: WIDTH,
    enemies,
  };
  const runtime = createStageFlowRuntime({
    tickHz: GAME_TICK_HZ,
    view: () => view,
    enemyTemplates: ENEMIES,
    stageHpMult: STAGE_HP_MULT,
    stageDmgMult: STAGE_DMG_MULT,
    enemyHpMultiplier: HP_MULT_ENEMY,
    unitVisualScale: UNIT_VISUAL_SCALE,
    arenaUnitSizeScale: ARENA_UNIT_SIZE_SCALE,
    randomRange: rndFrom(next),
    showFlash: () => {},
    shake: () => {},
    emitParticle: () => {},
    clampValue: (value, min, max) => Math.max(min, Math.min(max, value)),
  });
  runtime.spawnEliteEnemy(stage.eliteEnemyId);
  return enemies[0];
}

function assertChampionTuning() {
  let champions = 0;
  let rangedChampions = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    if (stage.eliteEnemyId == null) continue;
    const template = ENEMIES[stage.eliteEnemyId];
    assert(template, `stage ${stage.n}: missing elite template ${stage.eliteEnemyId}`);
    const champion = spawnChampionForStage(stage, i, 9000 + stage.n);
    assertActor(champion, `stage ${stage.n} champion`);
    assert(champion.isElite, `stage ${stage.n} champion: not marked elite`);
    assert(champion.splashOnHit === true && champion.splashRadius >= 58, `stage ${stage.n} champion: missing cleave/splash`);
    assert(champion.range >= 180, `stage ${stage.n} champion: insufficient range pressure`);
    const isRanged = template.arch === 'ranged' || template.arch === 'caster' || (template.range || 0) > 90;
    const isTank = template.arch === 'tank' || template.taunt || template.armorType === 'heavy';
    const hpFloor = Math.round(template.hp * (STAGE_HP_MULT[i] || 1) * HP_MULT_ENEMY * (isTank ? 3.05 : 3.25));
    const dmgFloor = Math.round(template.dmg * (STAGE_DMG_MULT[i] || 1) * (isRanged ? 1.78 : 1.70));
    assert(champion.maxHp >= hpFloor, `stage ${stage.n} champion: hp below tuned floor`);
    assert(champion.dmg >= dmgFloor, `stage ${stage.n} champion: damage below tuned floor`);
    if (isRanged) {
      rangedChampions++;
      assert(champion.aoeRadius >= 62 && champion.aoeMult >= 0.30, `stage ${stage.n} ranged champion: missing AoE hit`);
      assert(champion.meteorCD > 0 && champion.meteorRadius >= 64, `stage ${stage.n} ranged champion: missing meteor pressure`);
    }
    if (template.arch === 'caster') {
      assert(champion.chainBoltCD > 0 && champion.chainBoltDmgMult >= 0.40, `stage ${stage.n} caster champion: missing chain bolt`);
    }
    champions++;
  }
  assert(champions >= 10, `expected broad champion coverage, saw ${champions}`);
  assert(rangedChampions >= 3, `expected ranged champion AoE coverage, saw ${rangedChampions}`);
  return { champions, rangedChampions };
}

function spawnRound(stage, stageIndex, round, seed) {
  const totalRounds = arena_roundsForStage(stage.n || 1);
  const next = rng(seed);
  const enemies = [];
  const queue = waveQueue(stage, round, totalRounds);
  for (const item of queue) {
    if (item === 'BOSS') {
      spawnBossById({
        bossId: stage.bossId,
        state: 'battle',
        arenaState: { phase: 'wave', round },
        frame: seed,
        width: WIDTH,
        arenaTop: AREA.top,
        arenaBottom: AREA.bottom,
        spawnY: AREA.spawnY,
        spawnLeft: AREA.left,
        spawnRight: AREA.right,
        enemies,
        randomFloat: next,
      });
    } else if (item && item.boss != null) {
      spawnBossById({
        bossId: item.boss,
        opts: { label: item.label, color: item.color },
        state: 'battle',
        arenaState: { phase: 'wave', round },
        frame: seed,
        width: WIDTH,
        arenaTop: AREA.top,
        arenaBottom: AREA.bottom,
        spawnY: AREA.spawnY,
        spawnLeft: AREA.left,
        spawnRight: AREA.right,
        enemies,
        randomFloat: next,
      });
    } else if (item && item.elite != null) {
      const champion = spawnChampionForStage(stage, stageIndex, seed);
      enemies.push(champion);
    } else {
      spawnEnemyByIndex({
        typeIdx: item,
        state: 'battle',
        arenaState: { phase: 'wave', round },
        stageTime: round * 1000,
        currentStageIdx: stageIndex,
        currentStage: stage,
        waveIdx: round,
        frame: seed,
        arenaTop: AREA.top,
        arenaBottom: AREA.bottom,
        spawnY: AREA.spawnY,
        spawnLeft: AREA.left,
        spawnRight: AREA.right,
        enemies,
        randomFloat: next,
        isCampaignBossRound: () => false,
        lateRoundEnemyMult: arena_lateRoundEnemyMult,
        lateStageRoleHpMult: arena_lateStageRoleHpMult,
        lateStageNormalDurabilityMult: arena_lateStageNormalDurabilityMult,
        lateStageNormalDamageMult: arena_lateStageNormalDamageMult,
      });
    }
  }
  for (const actor of enemies) {
    if (actor && !actor.isBarrier) assertActor(actor, `stage ${stage.n} round ${round} ${actor.name || 'actor'}`);
  }
  return {
    count: enemies.length,
    hp: enemies.reduce((sum, actor) => sum + Math.max(0, actor && actor.maxHp || 0), 0),
    dmg: enemies.reduce((sum, actor) => sum + Math.max(0, actor && actor.dmg || 0), 0),
  };
}

function assertLateBossPacing() {
  const lateBossStages = STAGES.filter(stage => (stage.n || 0) >= 20 && stage.bossId != null);
  assert(lateBossStages.length >= 5, 'missing late boss stage coverage');
  for (const stage of lateBossStages) {
    const boss = BOSSES[stage.bossId];
    assert(boss, `stage ${stage.n}: missing boss`);
    assert((boss.timeEnrageAt || 0) >= 10500, `stage ${stage.n} ${boss.name}: enrage window too short`);
    assert(!boss.spawnCD || boss.spawnCD >= 480, `stage ${stage.n} ${boss.name}: support spawn cadence too fast`);
    assert(!boss.stormCD || boss.stormCD >= 240, `stage ${stage.n} ${boss.name}: storm cadence too fast`);
    assert((boss.dmg || 0) <= 180, `stage ${stage.n} ${boss.name}: boss damage spike too high`);
  }
  return lateBossStages.length;
}

function assertEarlyEconomyTuning() {
  const startGold = [1, 2, 3, 4, 5].map(arena_stageStartGold);
  const incomes = [1, 2, 3, 4, 5].map(arena_stageIncome);
  const bounties = [1, 2, 3, 4, 5].map(arena_campaignKillBountyStageMult);
  assert(startGold[0] <= 120 && startGold[4] <= 140, `early start gold still too high: ${startGold.join(',')}`);
  assert(incomes[0] <= 13 && incomes[4] <= 26, `early income still too high: ${incomes.join(',')}`);
  assert(bounties[0] < 0.85 && bounties[4] <= 0.91, `early kill bounties still too high: ${bounties.join(',')}`);
  for (let i = 1; i < startGold.length; i++) {
    assert(startGold[i] >= startGold[i - 1], 'early start gold should not go down between stages');
    assert(incomes[i] >= incomes[i - 1], 'early income should not go down between stages');
    assert(bounties[i] >= bounties[i - 1], 'early bounty multiplier should not go down between stages');
  }
  return { startGold, incomes, bounties };
}

const economySummary = assertEarlyEconomyTuning();
const championSummary = assertChampionTuning();
const lateBosses = assertLateBossPacing();
let simulatedRounds = 0;
let simulatedActors = 0;
let totalHp = 0;
let totalDmg = 0;
let previousStageHp = 0;

for (let seed = 1; seed <= 8; seed++) {
  previousStageHp = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const totalRounds = arena_roundsForStage(stage.n || 1);
    let stageHp = 0;
    let stageDmg = 0;
    for (let round = 1; round <= totalRounds; round++) {
      const result = spawnRound(stage, i, round, seed * 10000 + stage.n * 100 + round);
      assert(result.count > 0, `stage ${stage.n} round ${round}: spawned no actors`);
      assert(result.hp > 0 && Number.isFinite(result.hp), `stage ${stage.n} round ${round}: invalid hp budget`);
      assert(result.dmg >= 0 && result.dmg < 30000, `stage ${stage.n} round ${round}: invalid damage budget`);
      stageHp += result.hp;
      stageDmg += result.dmg;
      simulatedRounds++;
      simulatedActors += result.count;
    }
    assert(stageHp > previousStageHp * 0.55, `stage ${stage.n}: hp budget collapsed versus previous stage`);
    assert(stageDmg < 90000, `stage ${stage.n}: damage budget too high`);
    previousStageHp = stageHp;
    totalHp += stageHp;
    totalDmg += stageDmg;
  }
}

console.log(`Long-run balance smoke passed: ${simulatedRounds} seeded rounds, ${simulatedActors} actors.`);
console.log(`Champion checks: ${championSummary.champions} final-wave champions, ${championSummary.rangedChampions} ranged AoE champions; late boss pacing checks: ${lateBosses}.`);
console.log(`Early economy: start ${economySummary.startGold.join('/')}, income ${economySummary.incomes.join('/')}, bounty x${economySummary.bounties.map(n => n.toFixed(2)).join('/')}.`);
console.log(`Seeded budget totals: hp ${Math.round(totalHp)}, damage ${Math.round(totalDmg)}.`);
