import { attackFamily, isPhysicalPierceFamily } from './combat-rules.js';

export function enemyBacklineDamageMultiplier({ inArena, attacker, target }) {
  if (!inArena || !attacker || attacker.isPlayer || !target || !target.isPlayer) return 1;
  if (attacker.isBoss || target.arch === 'tank' || target.taunt || target.isMinion) return 1;
  const rangedPressure = !!(attacker.projType || attacker.range > 80 || attacker.arch === 'ranged' || attacker.arch === 'caster');
  const dedicatedBackline = !!(attacker.prefersBackline || attacker.flying || attacker._v8TargetClass === 'rangedBypass' || attacker._v8TargetClass === 'snipeBackline');
  if (!rangedPressure && !dedicatedBackline) return 1;
  return dedicatedBackline ? 0.65 : 0.78;
}

export function ashenHallowAllyProtectionMultiplier(target, { units }) {
  if (!target || !target.isPlayer || target.hp <= 0) return 1;
  let mult = 1;
  for (const unit of units) {
    if (!unit || unit === target || unit.hp <= 0 || !unit.isPlayer || unit.unitIdx !== 3 || unit.branch !== 'a') continue;
    const field = unit.consecrationField;
    if (field && field.hallow && field.t > 0 && Math.hypot(target.x - field.x, target.y - field.y) <= field.r) mult = Math.min(mult, 0.88);
  }
  return mult;
}

export function isZavsMeleeAlly(unit) {
  return !!(unit && unit.isPlayer && unit.hp > 0 && !unit.isMinion && !unit.isGhost && !unit.isMirror && (unit.arch === 'melee' || unit.arch === 'paladin'));
}

export function zavsBodyguardCovers(zavs, target, radius) {
  if (!zavs || !target || zavs === target || zavs.hp <= 0 || target.hp <= 0) return false;
  if (!isZavsMeleeAlly(target)) return false;
  if (Math.hypot(zavs.x - target.x, zavs.y - target.y) > radius) return false;
  if (Math.abs(zavs.x - target.x) > 130) return false;
  return target.y >= zavs.y - 22;
}

export function zavsProtectionMultiplier(target, { units }) {
  if (!target || !target.isPlayer || target.hp <= 0) return 1;
  let mult = 1;
  for (const zavs of units) {
    if (!zavs || zavs.hp <= 0 || !zavs.isPlayer || zavs.unitIdx !== 0) continue;
    if (zavs.citadelWallTimer > 0) {
      if (zavs === target) mult = Math.min(mult, 0.55);
      else if (Math.hypot(zavs.x - target.x, zavs.y - target.y) <= 160) {
        mult = Math.min(mult, 0.85);
        if (isZavsMeleeAlly(target)) mult = Math.min(mult, 0.75);
      }
    }
    if (zavs === target && zavs.bannerfallGuardTimer > 0) mult = Math.min(mult, 0.75);
    if (zavs.zavsCitadel && zavsBodyguardCovers(zavs, target, 170)) mult = Math.min(mult, 0.88);
    if (zavs.zavsGuardPulseTimer > 0 && zavsBodyguardCovers(zavs, target, 95)) mult = Math.min(mult, 0.90);
  }
  return mult;
}

export function zavsAllyDamageMultiplier(unit, { units }) {
  if (!unit || !unit.isPlayer || unit.hp <= 0 || unit.isMinion || unit.isGhost) return 1;
  const family = attackFamily(unit);
  if (!isPhysicalPierceFamily(family)) return 1;
  let passive = 1;
  let banner = 1;
  for (const zavs of units) {
    if (!zavs || zavs === unit || zavs.hp <= 0 || !zavs.isPlayer || zavs.unitIdx !== 0) continue;
    if (zavs.zavsVanguard && Math.hypot(zavs.x - unit.x, zavs.y - unit.y) <= 170) passive = Math.max(passive, 1.05);
    const zone = zavs._bannerfallZone;
    if (zone && zone.t > 0 && Math.hypot(zone.x - unit.x, zone.y - unit.y) <= zone.r) banner = Math.max(banner, 1.12);
  }
  return passive * banner;
}

export function zavsAllyAttackSpeedFactor(unit, { units }) {
  if (!unit || !unit.isPlayer || unit.hp <= 0 || unit.isMinion || unit.isGhost) return 1;
  const family = attackFamily(unit);
  if (!isPhysicalPierceFamily(family)) return 1;
  let factor = 1;
  for (const zavs of units) {
    if (!zavs || zavs === unit || zavs.hp <= 0 || !zavs.isPlayer || zavs.unitIdx !== 0) continue;
    if (zavs.zavsVanguard && family === 'pierce' && Math.hypot(zavs.x - unit.x, zavs.y - unit.y) <= 170) factor = Math.min(factor, 0.96);
    const zone = zavs._bannerfallZone;
    if (zone && zone.t > 0 && Math.hypot(zone.x - unit.x, zone.y - unit.y) <= zone.r) {
      factor = Math.min(factor, 0.90);
      if (family === 'pierce') factor = Math.min(factor, 0.86);
    }
  }
  return factor;
}

export function isBatataBacklineAlly(unit) {
  return !!(unit && unit.isPlayer && unit.hp > 0 && !unit.isMinion && !unit.isGhost && !unit.isMirror && (unit.arch === 'healer' || unit.arch === 'ranged' || unit.arch === 'caster'));
}

export function batataCovers(batata, target, radius) {
  if (!batata || !target || batata === target || batata.hp <= 0 || target.hp <= 0) return false;
  if (!isBatataBacklineAlly(target)) return false;
  if (Math.hypot(batata.x - target.x, batata.y - target.y) > radius) return false;
  if (Math.abs(batata.x - target.x) > 190) return false;
  return target.y >= batata.y - 80;
}

export function hasStonehideMaulerFor(target, { units }) {
  if (!target || !isBatataBacklineAlly(target)) return false;
  for (const batata of units) {
    if (batata && batata.hp > 0 && batata.isPlayer && batata.unitIdx === 2 && batata.batataMauler && Math.hypot(batata.x - target.x, batata.y - target.y) <= 190) return true;
  }
  return false;
}

export function batataProtectionMultiplier(target, { units, enemies }) {
  if (!target || !target.isPlayer || target.hp <= 0) return 1;
  let mult = 1;
  for (const batata of units) {
    if (!batata || batata.hp <= 0 || !batata.isPlayer || batata.unitIdx !== 2) continue;
    if (target === batata && batata.livingBulwarkTimer > 0) mult = Math.min(mult, 0.70);
    if (target === batata && batata.quakebreakRampartTimer > 0) mult = Math.min(mult, 0.75);
    if (batata.backlineGarden && batataCovers(batata, target, 170)) mult = Math.min(mult, 0.90);
    if (batata.shelterPulseTimer > 0 && batataCovers(batata, target, 120)) mult = Math.min(mult, 0.90);
    if (batata.livingBulwarkTimer > 0 && batataCovers(batata, target, 160)) mult = Math.min(mult, 0.85);
    if (target === batata && batata.batataMauler) {
      let nearby = 0;
      for (const enemy of enemies) {
        if (enemy.hp > 0 && !enemy.isBoss && Math.hypot(batata.x - enemy.x, batata.y - enemy.y) <= 120) nearby++;
      }
      if (nearby >= 3) mult = Math.min(mult, 0.90);
    }
  }
  return mult;
}

export function batataHealingReceivedMultiplier(target, { units }) {
  if (!target || !target.isPlayer || target.hp <= 0) return 1;
  let mult = 1;
  for (const batata of units) {
    if (!batata || batata.hp <= 0 || !batata.isPlayer || batata.unitIdx !== 2) continue;
    if (batata.backlineGarden && batataCovers(batata, target, 170)) mult = Math.max(mult, 1.08);
    if (batata.shelterPulseTimer > 0 && batataCovers(batata, target, 120)) mult = Math.max(mult, 1.08);
    if (batata.livingBulwarkTimer > 0 && batataCovers(batata, target, 160)) mult = Math.max(mult, 1.12);
  }
  return mult;
}
