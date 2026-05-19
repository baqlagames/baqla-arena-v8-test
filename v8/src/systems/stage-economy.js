import {
  ARENA_BASE_INCOME,
  ARENA_INCOME_PER_STAGE,
  ARENA_ROUNDS_PER_STAGE,
} from '../data/tuning.js';

export function arena_stageStartGold(stageN) {
  stageN = stageN || 1;
  if (stageN <= 5) return 110 + stageN * 5;
  if (stageN <= 10) return 210;
  if (stageN <= 15) return 250;
  if (stageN <= 20) return 315;
  return 375;
}

function arena_campaignIncomeCompression(stageN) {
  stageN = stageN || 1;
  if (stageN <= 5) return 0.84 + stageN * 0.02;
  if (stageN <= 10) return 1.14;
  if (stageN <= 15) return 1.08;
  if (stageN <= 20) return 1.14;
  return 1.20;
}

export function arena_stageIncome(stageN) {
  stageN = stageN || 1;
  return Math.round((ARENA_BASE_INCOME + ARENA_INCOME_PER_STAGE * stageN) * arena_campaignIncomeCompression(stageN));
}

export function arena_campaignKillBountyStageMult(stageN) {
  stageN = stageN || 1;
  if (stageN <= 5) return 0.80 + stageN * 0.02;
  if (stageN <= 10) return 0.92 + Math.max(0, stageN - 6) * 0.018;
  if (stageN <= 15) return 0.86 + Math.max(0, stageN - 11) * 0.012;
  if (stageN <= 20) return 0.91 + Math.max(0, stageN - 16) * 0.010;
  return 0.96 + Math.min(0.06, Math.max(0, stageN - 21) * 0.008);
}

function arena_stageLateRoundTuning(stageN, round) {
  return stageN >= 6 && round >= 4;
}

export function arena_roundGoldMult(round, stageN) {
  stageN = stageN || 1;
  round = round || 1;
  if (!arena_stageLateRoundTuning(stageN, round)) return 1;
  if (stageN >= 11) {
    if (round === 4) return 0.92;
    if (round === 5) return 0.88;
    if (round >= 6) return 1.00;
  }
  if (round === 4) return 0.98;
  if (round === 5) return 0.96;
  if (round >= 6) return 1.00;
  return 1;
}

export function arena_lateRoundEnemyMult(round, stageN) {
  stageN = stageN || 1;
  round = round || 1;
  if (!arena_stageLateRoundTuning(stageN, round)) return { hp: 1, dmg: 1 };
  if (stageN >= 11) {
    if (round === 4) return { hp: 1.18, dmg: 0.98 };
    if (round === 5) return { hp: 1.38, dmg: 0.99 };
    if (round >= 6) return { hp: 1.48, dmg: 1.00 };
    return { hp: 1, dmg: 1 };
  }
  if (round === 4) return { hp: 1.10, dmg: 1.00 };
  if (round === 5) return { hp: 1.22, dmg: 1.00 };
  if (round >= 6) return { hp: 1.32, dmg: 1.00 };
  return { hp: 1, dmg: 1 };
}

export function arena_lateStageRoleHpMult(tmpl, stageN, round) {
  if (!tmpl || stageN < 11) return 1;
  let mult = 1;
  if (tmpl.arch === 'ranged' || tmpl.arch === 'caster' || tmpl.arch === 'aoe') mult = 1.24;
  else if (tmpl.arch === 'dps' || tmpl.arch === 'assassin') mult = 1.18;
  else if (tmpl.arch === 'swarm') mult = 1.16;
  else if (tmpl.arch === 'tank') mult = 1.03;
  if (tmpl.flying) mult += 0.08;
  if (round >= 4) mult += 0.08;
  if (stageN >= 16) mult += 0.06;
  if (stageN >= 21) mult += 0.06;
  return Math.min(1.52, mult);
}

export function arena_lateStageNormalDurabilityMult(tmpl, stageN, round) {
  if (!tmpl || stageN < 11 || round < 3) return 1;
  let mult = 1;
  if (tmpl.arch === 'ranged' || tmpl.arch === 'caster' || tmpl.arch === 'aoe') mult = 1.10;
  else if (tmpl.arch === 'dps' || tmpl.arch === 'assassin' || tmpl.burrow) mult = 1.06;
  else if (tmpl.arch === 'swarm') mult = 1.04;
  if (tmpl.flying) mult += 0.03;
  if (stageN >= 16) mult += 0.02;
  if (stageN >= 21) mult += 0.02;
  return Math.min(1.18, mult);
}

export function arena_lateStageNormalDamageMult(tmpl, stageN, round) {
  if (!tmpl || stageN < 11) return 1;
  let mult = 1;
  if (tmpl.burrow || tmpl.arch === 'assassin') mult = 0.88;
  else if (tmpl.arch === 'dps') mult = 0.92;
  else if (tmpl.arch === 'aoe') mult = 0.94;
  else if (tmpl.arch === 'ranged' || tmpl.arch === 'caster') mult = 0.96;
  if (round >= 4) mult *= 0.97;
  return Math.max(0.85, mult);
}

export function arena_lateStageNormalGoldMult(stageN, round) {
  if (stageN < 11) return 1;
  let mult = stageN <= 15 ? 0.92 : stageN <= 20 ? 0.90 : 0.88;
  if (round >= 4) mult *= 0.96;
  return mult;
}

export function arena_roundsForStage(stageN) {
  return ARENA_ROUNDS_PER_STAGE;
}
