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

const boss = enemy('Winterglass Magistrate', 250, 420, {
  id: 13,
  isBoss: true,
  size: 50,
  hp: 26000,
  maxHp: 26000,
  stormVizier: true,
  _stormShieldActive: true,
});

const caster = unit('Caster', 6, 'caster', 220, 690, { attackType: 'magic' });
const ironWard = enemy('Frostglass Prism', 188, 480, {
  priorityTarget: true,
  preferredBy: 'magic',
  stormWard: true,
  stormWardKind: 'iron',
  _stormBoss: boss,
  armor: 16,
  magicRes: 1,
});
const mirrorWard = enemy('Mirrorice Bulwark', 286, 480, {
  priorityTarget: true,
  preferredBy: 'physical',
  stormWard: true,
  stormWardKind: 'mirror',
  _stormBoss: boss,
  armor: 1,
  magicRes: 18,
});
const casterPick = findEnemyTargetForUnit(caster, view([boss, ironWard, mirrorWard]));
assert.equal(casterPick, ironWard, 'magic caster should prefer Frostglass Prism over boss and Mirrorice Bulwark');

const healer = unit('Healer', 10, 'healer', 260, 720, { attackType: 'magic' });
const healerPick = findEnemyTargetForUnit(healer, view([boss, ironWard, mirrorWard]));
assert.equal(healerPick, ironWard, 'healer/caster family should prefer Frostglass Prism over shielded boss and Mirrorice Bulwark');

const hunter = unit('Hunter', 8, 'ranged', 295, 700, { attackType: 'pierce' });
const hunterPick = findEnemyTargetForUnit(hunter, view([boss, ironWard, mirrorWard]));
assert.equal(hunterPick, mirrorWard, 'physical ranged unit should prefer Mirrorice Bulwark over boss');

const melee = unit('Melee', 5, 'melee', 235, 665, { attackType: 'physical', prefersRanged: false });
const meleePick = findEnemyTargetForUnit(melee, view([boss, ironWard, mirrorWard]));
assert.equal(meleePick, mirrorWard, 'physical melee should prefer Mirrorice Bulwark over shielded boss');

const tank = unit('Tank', 0, 'tank', 250, 660, { attackType: 'physical', prefersRanged: false, taunt: true, range: 44 });
const tankPick = findEnemyTargetForUnit(tank, view([boss, ironWard, mirrorWard]));
assert.equal(tankPick, mirrorWard, 'tank should prefer Mirrorice Bulwark over shielded boss');

mirrorWard.hp = 0;
const meleeFallbackPick = findEnemyTargetForUnit(melee, view([boss, ironWard, mirrorWard]));
assert.equal(meleeFallbackPick, ironWard, 'melee should swap to remaining Frostglass Prism before shielded boss when Mirrorice Bulwark dies');
const tankFallbackPick = findEnemyTargetForUnit(tank, view([boss, ironWard, mirrorWard]));
assert.equal(tankFallbackPick, ironWard, 'tank should swap to remaining Frostglass Prism before shielded boss when Mirrorice Bulwark dies');

mirrorWard.hp = 1000;
ironWard.hp = 0;
const casterFallbackPick = findEnemyTargetForUnit(caster, view([boss, ironWard, mirrorWard]));
assert.equal(casterFallbackPick, mirrorWard, 'caster should swap to remaining Mirrorice Bulwark before shielded boss when Frostglass Prism dies');
const healerFallbackPick = findEnemyTargetForUnit(healer, view([boss, ironWard, mirrorWard]));
assert.equal(healerFallbackPick, mirrorWard, 'healer should swap to remaining Mirrorice Bulwark before shielded boss when Frostglass Prism dies');

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

const dragon = enemy('Winterglass Dragon', 250, 420, {
  id: 4,
  isBoss: true,
  winterglassDragon: true,
  _dragonSkyPhase: true,
  flying: true,
  priorityTarget: true,
  preferredBy: 'ranged',
});
const whelp = enemy('Winter Whelp', 250, 560, {
  winterWhelp: true,
  _dragonBoss: dragon,
  priorityTarget: true,
  preferredBy: 'melee',
  arch: 'melee',
});
const skyMeleePick = findEnemyTargetForUnit(melee, view([dragon, whelp]));
assert.equal(skyMeleePick, whelp, 'melee should switch to grounded Winter Whelps during Dragon sky phase');
const skyTankPick = findEnemyTargetForUnit(tank, view([dragon, whelp]));
assert.equal(skyTankPick, whelp, 'tank should switch to grounded Winter Whelps during Dragon sky phase');
const skyCasterPick = findEnemyTargetForUnit(caster, view([dragon, whelp]));
assert.equal(skyCasterPick, dragon, 'caster should keep attacking airborne Winterglass Dragon during sky phase');
const skyHunterPick = findEnemyTargetForUnit(hunter, view([dragon, whelp]));
assert.equal(skyHunterPick, dragon, 'ranged physical unit should keep attacking airborne Winterglass Dragon during sky phase');

console.log('smoke-priority-targeting: ok');
