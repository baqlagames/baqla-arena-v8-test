#!/usr/bin/env node

import assert from 'node:assert/strict';
import { findEnemyTargetForUnit, findRangedEnemyTargetForUnit } from '../src/systems/combat-targeting.js';

const bounds = {
  inArena: true,
  arenaPhase: true,
  arenaTop: 42,
  arenaBot: 932,
  arenaBottom: 932,
  arenaLeft: 64,
  arenaRight: 436,
  leashForward: 380,
  leashBack: 160,
  leashSide: 260,
  maxBossEngage: 4,
};

function unit(name, unitIdx, arch, x, y, opts = {}) {
  return {
    name,
    unitIdx,
    id: unitIdx,
    arch,
    isPlayer: true,
    hp: 1000,
    maxHp: 1000,
    x,
    y,
    homeX: x,
    homeY: y,
    range: arch === 'melee' ? 44 : 150,
    prefersRanged: arch === 'ranged' || arch === 'caster' || arch === 'healer',
    ...opts,
  };
}

function enemy(name, x, y, opts = {}) {
  return {
    name,
    hp: 1000,
    maxHp: 1000,
    x,
    y,
    size: 22,
    isEnemy: true,
    ...opts,
  };
}

function view(enemies) {
  return { ...bounds, enemies };
}

const boss = enemy('Stormbound Vizier', 250, 420, {
  id: 13,
  isBoss: true,
  size: 50,
  hp: 26000,
  maxHp: 26000,
});

const caster = unit('Caster', 6, 'caster', 220, 690, { attackType: 'magic' });
const ironWard = enemy('Iron Ward', 214, 480, {
  priorityTarget: true,
  preferredBy: 'magic',
  armor: 16,
  magicRes: 1,
});
const casterPick = findEnemyTargetForUnit(caster, view([boss, ironWard]));
assert.equal(casterPick, ironWard, 'magic caster should prefer Iron Ward over boss');

const hunter = unit('Hunter', 8, 'ranged', 295, 700, { attackType: 'pierce' });
const mirrorWard = enemy('Mirror Ward', 286, 480, {
  priorityTarget: true,
  preferredBy: 'physical',
  armor: 1,
  magicRes: 18,
});
const hunterPick = findEnemyTargetForUnit(hunter, view([boss, mirrorWard]));
assert.equal(hunterPick, mirrorWard, 'physical ranged unit should prefer Mirror Ward over boss');

const stormMote = enemy('Storm Mote', 300, 510, {
  priorityTarget: true,
  preferredBy: 'ranged',
  flying: true,
  arch: 'caster',
});
const rangedPick = findRangedEnemyTargetForUnit(hunter, view([boss, stormMote]));
assert.equal(rangedPick, stormMote, 'ranged unit should focus flying Storm Mote priority target');

const melee = unit('Melee', 5, 'melee', 235, 665, { attackType: 'physical', prefersRanged: false });
const meleePick = findEnemyTargetForUnit(melee, view([boss, stormMote]));
assert.equal(meleePick, boss, 'melee should not get stuck trying to target unreachable flying motes');

console.log('smoke-priority-targeting: ok');
