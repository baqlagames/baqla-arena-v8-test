#!/usr/bin/env node

import assert from 'node:assert/strict';
import { findEnemyTargetForUnit, findRangedEnemyTargetForUnit } from '../src/systems/combat-targeting.js';
import { tickUnitMeteorAndSignature } from '../src/systems/unit-signature-ticks.js';
import { createArenaSignatures } from '../src/systems/unit-signatures.js';
import { isValidPlayerOffensiveTarget } from '../src/systems/player-target-validity.js';

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
  _dragonJudgmentImmune: true,
  untargetable: true,
});
const colossus = enemy('Frostglass Colossus', 188, 540, {
  dragonSkyGuard: true,
  dragonGuardKind: 'magic',
  _dragonBoss: dragon,
  priorityTarget: true,
  preferredBy: 'magic',
  arch: 'melee',
});
const juggernaut = enemy('Mirrorice Juggernaut', 286, 540, {
  dragonSkyGuard: true,
  dragonGuardKind: 'physical',
  _dragonBoss: dragon,
  priorityTarget: true,
  preferredBy: 'physical',
  arch: 'melee',
});
const dragonCasterPick = findEnemyTargetForUnit(caster, view([dragon, colossus, juggernaut]));
assert.equal(dragonCasterPick, colossus, 'caster should prefer Frostglass Colossus while Dragon is immune');
const dragonHealerPick = findEnemyTargetForUnit(healer, view([dragon, colossus, juggernaut]));
assert.equal(dragonHealerPick, colossus, 'healer attacker should prefer Frostglass Colossus while Dragon is immune');
const dragonMeleePick = findEnemyTargetForUnit(melee, view([dragon, colossus, juggernaut]));
assert.equal(dragonMeleePick, juggernaut, 'melee should prefer Mirrorice Juggernaut while Dragon is immune');
const dragonTankPick = findEnemyTargetForUnit(tank, view([dragon, colossus, juggernaut]));
assert.equal(dragonTankPick, juggernaut, 'tank should prefer Mirrorice Juggernaut while Dragon is immune');
const dragonHunterPick = findEnemyTargetForUnit(hunter, view([dragon, colossus, juggernaut]));
assert.equal(dragonHunterPick, juggernaut, 'physical ranged should prefer Mirrorice Juggernaut while Dragon is immune');
juggernaut.hp = 0;
const dragonMeleeFallback = findEnemyTargetForUnit(melee, view([dragon, colossus, juggernaut]));
assert.equal(dragonMeleeFallback, colossus, 'melee should swap to remaining Colossus before immune Dragon');
juggernaut.hp = 1000;
colossus.hp = 0;
const dragonCasterFallback = findEnemyTargetForUnit(caster, view([dragon, colossus, juggernaut]));
assert.equal(dragonCasterFallback, juggernaut, 'caster should swap to remaining Juggernaut before immune Dragon');
juggernaut.hp = 0;
const dragonImmuneNoGuardPick = findEnemyTargetForUnit(hunter, view([dragon, colossus, juggernaut]));
assert.equal(dragonImmuneNoGuardPick, null, 'units should not target the untargetable Dragon during Judgment even if guards are dead');
dragon._dragonSkyPhase = false;
dragon._dragonJudgmentImmune = false;
dragon.untargetable = false;
dragon.flying = false;
const dragonReturnPick = findEnemyTargetForUnit(hunter, view([dragon, colossus, juggernaut]));
assert.equal(dragonReturnPick, dragon, 'units should return to Dragon after Judgment guards die');

dragon._dragonSkyPhase = true;
dragon._dragonJudgmentImmune = true;
dragon.untargetable = true;
assert.equal(isValidPlayerOffensiveTarget(dragon), false, 'immune Dragon should be invalid for player offensive abilities');
assert.equal(isValidPlayerOffensiveTarget(colossus), false, 'dead guards should be invalid for player offensive abilities');
colossus.hp = 1000;
assert.equal(isValidPlayerOffensiveTarget(colossus), true, 'living Judgment guards should remain valid offensive targets');

let firedSignature = false;
const sigUnit = unit('Signature Rogue', 4, 'melee', 250, 690, {
  signature: { t: 9, cd: 10, name: 'Test Strike', fire() { firedSignature = true; } },
});
const noBanner = tickUnitMeteorAndSignature(sigUnit, {
  frame: 1,
  enemies: [dragon],
  bombs: [],
  arenaTop: 42,
  randomRange: () => 0,
  groundEffects: [],
  emitParticle() {},
  addDamageText() {},
});
assert.equal(noBanner, null, 'signature should not fire when the only enemy is an immune Dragon');
assert.equal(firedSignature, false, 'immune Dragon should not spend signature fire callbacks');
assert.ok(sigUnit.signature.t >= sigUnit.signature.cd, 'signature cooldown should stay ready when no valid target exists');

const meteorUnit = unit('Meteor Caster', 6, 'caster', 250, 690, {
  meteor: { t: 9, cd: 10, dmg: 120, radius: 45 },
});
const bombs = [];
tickUnitMeteorAndSignature(meteorUnit, {
  frame: 2,
  enemies: [dragon],
  bombs,
  arenaTop: 42,
  randomRange: () => 0,
  groundEffects: [],
  emitParticle() {},
  addDamageText() {},
});
assert.equal(bombs.length, 0, 'player meteors should not target an immune Dragon');

const battle = { enemies: [dragon], units: [], projectiles: [], bombs: [], groundFx: [], beamFx: [] };
const signatures = createArenaSignatures({
  gameTickHz: 120,
  getBattleArray: key => battle[key] || [],
  randomRange: () => 0,
  distance: (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)),
  addDamageText() {},
  emitParticle() {},
  showFlash() {},
  dealDamage() {},
  shake() {},
});
const rogue = unit('Felfel', 4, 'melee', 250, 530, { size: 22, dmg: 100 });
assert.equal(signatures.death_from_above.fire(rogue), false, 'Death from Above should not fire on immune Dragon');
assert.equal(signatures.killing_spree.fire(rogue), false, 'Killing Spree should not fire on immune Dragon');
assert.equal(signatures.deathmark.fire(rogue), false, 'Deathmark should not fire on immune Dragon');
assert.equal(rogue.dfaTimer || 0, 0, 'Death from Above should not start when target is immune');
assert.equal(rogue.killingSpree || null, null, 'Killing Spree should not queue immune Dragon targets');
battle.enemies = [dragon, colossus];
assert.notEqual(signatures.death_from_above.fire(rogue), false, 'Death from Above should fire on living Judgment guards');

console.log('smoke-priority-targeting: ok');
