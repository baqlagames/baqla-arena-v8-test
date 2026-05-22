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
  stormVizier: true,
  _stormShieldActive: true,
});

const caster = unit('Caster', 6, 'caster', 220, 690, { attackType: 'magic' });
const ironWard = enemy('Iron Ward', 214, 480, {
  priorityTarget: true,
  preferredBy: 'magic',
  stormWard: true,
  stormWardKind: 'iron',
  _stormBoss: boss,
  armor: 16,
  magicRes: 1,
});
const casterPick = findEnemyTargetForUnit(caster, view([boss, ironWard]));
assert.equal(casterPick, ironWard, 'magic caster should prefer Iron Ward over boss');

const healer = unit('Healer', 10, 'healer', 260, 720, { attackType: 'magic' });
const healerPick = findEnemyTargetForUnit(healer, view([boss, ironWard]));
assert.equal(healerPick, ironWard, 'healer/caster family should prefer Iron Ward over shielded boss');

const hunter = unit('Hunter', 8, 'ranged', 295, 700, { attackType: 'pierce' });
const mirrorWard = enemy('Mirror Ward', 286, 480, {
  priorityTarget: true,
  preferredBy: 'physical',
  stormWard: true,
  stormWardKind: 'mirror',
  _stormBoss: boss,
  armor: 1,
  magicRes: 18,
});
const hunterPick = findEnemyTargetForUnit(hunter, view([boss, mirrorWard]));
assert.equal(hunterPick, mirrorWard, 'physical ranged unit should prefer Mirror Ward over boss');

const melee = unit('Melee', 5, 'melee', 235, 665, { attackType: 'physical', prefersRanged: false });
const meleePick = findEnemyTargetForUnit(melee, view([boss, mirrorWard]));
assert.equal(meleePick, mirrorWard, 'physical melee should prefer Mirror Ward over shielded boss');

const tank = unit('Tank', 0, 'tank', 250, 660, { attackType: 'physical', prefersRanged: false, taunt: true });
const tankPick = findEnemyTargetForUnit(tank, view([boss, mirrorWard]));
assert.equal(tankPick, mirrorWard, 'tank should prefer Mirror Ward over shielded boss');

boss._stormShieldActive = false;
ironWard.hp = 0;
mirrorWard.hp = 0;
const returnPick = findEnemyTargetForUnit(hunter, view([boss]));
assert.equal(returnPick, boss, 'units should return to boss after wards die');

const futureFlyingPriority = enemy('Future Flying Priority', 300, 510, {
  priorityTarget: true,
  preferredBy: 'ranged',
  flying: true,
  arch: 'caster',
});
const rangedPick = findRangedEnemyTargetForUnit(hunter, view([boss, futureFlyingPriority]));
assert.equal(rangedPick, futureFlyingPriority, 'ranged units should still handle future flying priority targets');
const meleeFlyingPick = findEnemyTargetForUnit(melee, view([boss, futureFlyingPriority]));
assert.equal(meleeFlyingPick, boss, 'melee should not get stuck trying to target unreachable flying priority targets');

console.log('smoke-priority-targeting: ok');
