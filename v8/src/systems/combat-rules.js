import { ARENA_ARMOR_MATRIX, ARENA_DEFENSE_MATRIX } from '../data/tuning.js?v=9d6b186-combat-feedback';

export function armorMultiplier(attackType, armorType) {
  const at = attackType || 'physical';
  const dt = armorType || 'unarmored';
  const row = ARENA_ARMOR_MATRIX[at];
  if (!row) return 1.0;
  const mult = row[dt];
  return mult == null ? 1.0 : mult;
}

export function defenseMultiplier(enemyAttackType, playerArmorType) {
  const at = enemyAttackType || 'physical';
  const dt = playerArmorType || 'mail';
  const row = ARENA_DEFENSE_MATRIX[at];
  if (!row) return 1.0;
  const mult = row[dt];
  return mult == null ? 1.0 : mult;
}

export function enemyAttackType(enemy) {
  if (enemy.projType === 'curse' || enemy.projType === 'frost' || enemy.projType === 'fire' || enemy.projType === 'lightning') return 'magic';
  if (enemy.projType === 'normal' || enemy.arch === 'ranged') return 'pierce';
  return 'physical';
}

export function attackFamily(unit, dmgType, attackTypeOverride) {
  if (attackTypeOverride) return attackTypeOverride;
  if (unit && unit.attackType) return unit.attackType;
  return dmgType === 'magic' ? 'magic' : 'physical';
}

export function isPhysicalPierceFamily(family) {
  return family === 'physical' || family === 'pierce' || family === 'normal';
}
