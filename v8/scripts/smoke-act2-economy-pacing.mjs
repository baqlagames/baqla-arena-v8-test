#!/usr/bin/env node

import assert from 'node:assert/strict';
import { STAGES } from '../src/data/stages.js';
import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES } from '../src/data/bosses.js';
import {
  ARENA_CAMPAIGN_KILL_BOUNTY_MULT,
  ARENA_ROUND_BONUS_CAP,
} from '../src/data/tuning.js';
import { calculateEnemyKillReward } from '../src/systems/combat-death.js';
import { calculateWaveRewards } from '../src/systems/wave-lifecycle.js';
import {
  arena_campaignKillBountyStageMult,
  arena_lateStageNormalGoldMult,
  arena_roundGoldMult,
  arena_roundsForStage,
  arena_stageIncome,
  arena_stageStartGold,
} from '../src/systems/stage-economy.js';
import {
  arena_stageOpenerQueue,
  arena_themedWaveQueue,
} from '../src/systems/wave-planner.js';

const LEVEL_3_CHEAP_UNIT_COST = 50 + 45 + 125;

function roundWavePlan(stage, round, totalRounds, previousWaveGoldMult) {
  if (round >= totalRounds) {
    const queue = stage.bossId != null ? ['BOSS'] : [{ elite: stage.eliteEnemyId }];
    return { queue, waveGoldMult: previousWaveGoldMult || 1, theme: 'BOSS' };
  }

  const wave = (round === 1 ? arena_stageOpenerQueue(stage) : null)
    || arena_themedWaveQueue(round, stage.n || 1, stage.act || 1);
  let queue = [...(wave.queue || [])];
  if ((stage.n || 0) === 10 && round === 4) {
    queue = [{ boss: 13, label: 'MINI BOSS - WINTERGLASS MAGISTRATE', color: '#9fdcff' }];
  }
  return { queue, waveGoldMult: wave.goldMult || 1, theme: wave.theme || 'WAVE' };
}

function rewardUnitForQueueItem(stage, item) {
  if (item === 'BOSS') {
    const boss = BOSSES[stage.bossId];
    assert(boss, `stage ${stage.n}: missing boss ${stage.bossId}`);
    return { ...boss, isEnemy: true, isBoss: true };
  }
  if (item && item.boss != null) {
    const boss = BOSSES[item.boss];
    assert(boss, `stage ${stage.n}: missing mini boss ${item.boss}`);
    return { ...boss, isEnemy: true, isBoss: true };
  }
  if (item && item.elite != null) {
    const enemy = ENEMIES[item.elite];
    assert(enemy, `stage ${stage.n}: missing elite ${item.elite}`);
    return {
      ...enemy,
      isEnemy: true,
      isElite: true,
      points: Math.round((enemy.points || 25) * 5),
    };
  }
  if (Number.isInteger(item)) {
    const enemy = ENEMIES[item];
    assert(enemy, `stage ${stage.n}: missing enemy ${item}`);
    return { ...enemy, isEnemy: true };
  }
  return null;
}

function killRewardForUnit(unit, stage, round, waveGoldMult) {
  return calculateEnemyKillReward(unit, { isPlayer: true }, {
    inArena: true,
    currentStage: stage,
    arenaState: { round, _waveGoldMult: waveGoldMult },
    campaignKillBountyMult: ARENA_CAMPAIGN_KILL_BOUNTY_MULT,
    warmupGoldBonus: 1,
    riftBonusGold: 0,
    campaignStageMult: arena_campaignKillBountyStageMult,
    roundGoldMult: arena_roundGoldMult,
    lateStageNormalGoldMult: arena_lateStageNormalGoldMult,
  });
}

function simulateStageEconomy(stage) {
  const totalRounds = arena_roundsForStage(stage.n || 1);
  let gold = arena_stageStartGold(stage.n || 1);
  let waveGoldMult = 1;
  const rounds = [];

  for (let round = 1; round <= totalRounds; round++) {
    const startGold = gold;
    const plan = roundWavePlan(stage, round, totalRounds, waveGoldMult);
    waveGoldMult = plan.waveGoldMult;

    const killGold = plan.queue.reduce((sum, item) => {
      const unit = rewardUnitForQueueItem(stage, item);
      return sum + (unit ? killRewardForUnit(unit, stage, round, waveGoldMult) : 0);
    }, 0);
    gold += killGold;

    const reward = calculateWaveRewards({
      arena: { round, king: { hp: 1 }, _waveStartKingHp: 1 },
      gold,
      stageN: stage.n || 1,
      stageIncome: arena_stageIncome,
      roundGoldMult: arena_roundGoldMult,
      roundBonusCap: ARENA_ROUND_BONUS_CAP,
    });
    gold = reward.gold;

    rounds.push({
      round,
      theme: plan.theme,
      startGold,
      killGold,
      income: reward.income,
      roundBonus: reward.roundBonus,
      perfectBonus: reward.perfectBonus,
      waveBonus: reward.waveBonus,
      totalGold: gold - startGold,
      endGold: gold,
      actors: plan.queue.filter(item => item !== 'BOSS' && !(item && item.delay)).length,
    });
  }

  return {
    stage: stage.n,
    startGold: arena_stageStartGold(stage.n || 1),
    income: arena_stageIncome(stage.n || 1),
    bountyMult: arena_campaignKillBountyStageMult(stage.n || 1),
    finalGold: gold,
    rounds,
    maxRoundGold: Math.max(...rounds.map(round => round.totalGold)),
  };
}

const act2Stages = STAGES.filter(stage => stage.n >= 6 && stage.n <= 10);
assert.equal(act2Stages.length, 5, 'expected stage 6-10 coverage');

const summaries = act2Stages.map(simulateStageEconomy);
const stage6 = summaries[0];
const stage10 = summaries.find(summary => summary.stage === 10);
const stage10EarlyRounds = stage10?.rounds.filter(round => round.round >= 1 && round.round <= 3) || [];
const stage10Round4 = stage10?.rounds.find(round => round.round === 4);
const lowGoldReward = calculateWaveRewards({
  arena: { round: 1, king: { hp: 100 }, _waveStartKingHp: 100 },
  gold: 0,
  stageN: 10,
  stageIncome: arena_stageIncome,
  roundGoldMult: arena_roundGoldMult,
  roundBonusCap: ARENA_ROUND_BONUS_CAP,
});
const highGoldReward = calculateWaveRewards({
  arena: { round: 1, king: { hp: 100 }, _waveStartKingHp: 100 },
  gold: 9999,
  stageN: 10,
  stageIncome: arena_stageIncome,
  roundGoldMult: arena_roundGoldMult,
  roundBonusCap: ARENA_ROUND_BONUS_CAP,
});
assert.equal(lowGoldReward.roundBonus, highGoldReward.roundBonus, 'round bonus should not depend on saved gold');
assert.equal(lowGoldReward.gold - 0, highGoldReward.gold - 9999, 'wave-end bonus should be fixed for the same stage/round');
for (const summary of summaries) {
  const round5 = summary.rounds.find(round => round.round === 5);
  const expectedRound5Bonus = summary.stage === 10 ? 85 : 25;
  assert(round5 && round5.waveBonus === expectedRound5Bonus, `stage ${summary.stage}: round 5 should grant fixed ${expectedRound5Bonus}g wave bonus`);
}
assert.equal(stage10EarlyRounds.length, 3, 'stage 10 should have three early-wave bonus rounds');
for (const round of stage10EarlyRounds) {
  assert.equal(round.waveBonus, 15, `stage 10 round ${round.round} should grant fixed 15g early-wave bonus`);
}
assert(stage6.startGold <= 170, `stage 6 start gold too high: ${stage6.startGold}`);
assert(stage6.finalGold <= 950, `stage 6 no-spend clear gold too high: ${stage6.finalGold}`);
assert(stage6.maxRoundGold <= 170, `stage 6 round payout spike too high: ${stage6.maxRoundGold}`);
assert(stage10Round4 && stage10Round4.killGold === 200, `stage 10 round 4 mini-boss should award 200g, got ${stage10Round4?.killGold}`);
assert(stage10Round4 && stage10Round4.waveBonus === 78, `stage 10 round 4 should add fixed 78g Winterglass bonus, got ${stage10Round4?.waveBonus}`);
assert(stage10Round4 && stage10Round4.totalGold === 330, `stage 10 round 4 full-clear total should be 330g, got ${stage10Round4?.totalGold}`);
assert(
  Math.floor(stage6.finalGold / LEVEL_3_CHEAP_UNIT_COST) <= 4,
  `stage 6 still funds too many cheap level-3 units: ${stage6.finalGold}g`
);

const finalGoldCaps = new Map([
  [6, 975],
  [7, 1050],
  [8, 1250],
  [9, 1375],
  [10, 1725],
]);

let previousFinal = 0;
for (const summary of summaries) {
  const cap = finalGoldCaps.get(summary.stage);
  assert(summary.finalGold <= cap, `stage ${summary.stage} no-spend clear gold ${summary.finalGold} exceeds cap ${cap}`);
  assert(summary.finalGold >= previousFinal, `stage ${summary.stage} final gold fell below previous stage`);
  previousFinal = summary.finalGold;

  for (const round of summary.rounds) {
    const capRound = summary.stage < 10 ? 285 : 360;
    assert(round.totalGold <= capRound, `stage ${summary.stage} round ${round.round} paid ${round.totalGold}g`);
  }
}

console.log('Act 2 economy pacing smoke passed.');
for (const summary of summaries) {
  const roundTotals = summary.rounds.map(round => `${round.round}:${round.totalGold}g`).join(' ');
  console.log(
    `- Stage ${summary.stage}: start ${summary.startGold}g, income ${summary.income}g, bounty x${summary.bountyMult.toFixed(2)}, final ${summary.finalGold}g, rounds ${roundTotals}`
  );
}
