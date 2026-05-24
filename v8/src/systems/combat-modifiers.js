import { armorMultiplier, attackFamily, defenseMultiplier, enemyAttackType, isPhysicalPierceFamily } from './combat-rules.js';
import { enemyBacklineDamageMultiplier } from './combat-protection.js';

function hasMaxShadowWordPainStacks(target) {
  if (!target._swpStacks || target._swpStacks.length <= 0) return false;
  const casters = new Set();
  for (const stack of target._swpStacks) casters.add(stack.from);
  for (const caster of casters) {
    let count = 0;
    for (const stack of target._swpStacks) {
      if (stack.from === caster) count++;
    }
    if (caster.shadowWordPain && count >= caster.shadowWordPain.maxStacks) return true;
  }
  return false;
}

export function applyArenaIncomingScalarModifiers(dmg, {
  target,
  attacker,
  dmgType,
  attackTypeOverride,
}) {
  let next = dmg;
  if (target.cursedTimer > 0) next *= (target.cursedMult || 1.25);
  if (target._rommanaMarkedTimer > 0 && attacker) {
    const source = attacker.unitIdx === 9 ? attacker : (attacker.parent && attacker.parent.unitIdx === 9 ? attacker.parent : null);
    if (source) next = Math.round(next * (1 + (target._rommanaMarkedAmp || 0.10)));
  }
  if (hasMaxShadowWordPainStacks(target)) next = Math.round(next * 1.07);
  if (target._finalReckoning && target._finalReckoning > 0) next = Math.round(next * 1.20);
  if (target._deathMark && target._deathMark.timer > 0) next = Math.round(next * 1.25);
  if (attacker && attacker.unitIdx === 3 && !attacker.branch && target.judgmentSealSource === attacker && target.judgmentSealTimer > 0) {
    const cfg = attacker.holySwordSaintCombo || {};
    const stacks = Math.min(cfg.sealMax || 3, target.judgmentSealStacks || 0);
    if (stacks > 0) next = Math.round(next * (1 + stacks * (cfg.sealDamagePer || 0.06)));
  }
  if (attacker && attacker.unitIdx === 3 && !attacker.branch && attacker.exaltedEdgeTimer > 0 && (target.isBoss || target.elite || target.isElite)) {
    next = Math.round(next * (attacker.exaltedEdgeMult || 1.10));
  }
  if (attacker && attacker.demoralizedTimer > 0) next = Math.round(next * (attacker.demoralizedMult || 0.80));
  if (attacker && attacker.isEnemy && attacker._flameCurseTimer > 0) next = Math.max(1, Math.round(next * (attacker._flameCurseDamageMult || 0.95)));
  if (attacker && attacker.isEnemy && attacker.dentedTimer > 0) next = Math.max(1, Math.round(next * (attacker.dentedMult || 0.90)));
  if (attacker && attacker.isEnemy && attacker.runeWoundTimer > 0) next = Math.max(1, Math.round(next * (attacker.runeWoundMult || 0.92)));
  if (attacker && attacker.isEnemy && attacker.muddiedTimer > 0) next = Math.max(1, Math.round(next * (attacker.muddiedDamageMult || 0.92)));
  if (attacker && attacker.isEnemy && attacker.mudbreakerRoarTimer > 0) next = Math.max(1, Math.round(next * (attacker.mudbreakerRoarMult || 0.88)));
  if (attacker && attacker.isEnemy && attacker.avengedTimer > 0) next = Math.max(1, Math.round(next * (attacker.avengedMult || 0.92)));
  if (attacker && attacker.armorBreak > 0) next = Math.round(next * 1.15);

  if (target.isPlayer) {
    if (attacker && !attacker.isPlayer) {
      if (attacker._ritualBuffTimer > 0 && !attacker.isBoss) next = Math.max(1, Math.round(next * 1.12));
      let enemyAttack = enemyAttackType(attacker);
      if (dmgType === 'magic') enemyAttack = 'magic';
      else if (attackTypeOverride === 'pierce') enemyAttack = 'pierce';
      const playerArmor = target._defenseArmorType || 'mail';
      const defenseMult = defenseMultiplier(enemyAttack, playerArmor);
      if (defenseMult !== 1.0) next = Math.max(1, Math.round(next * defenseMult));
    }
    const backlineMult = enemyBacklineDamageMultiplier({ inArena: true, attacker, target });
    if (backlineMult !== 1) next = Math.max(1, Math.round(next * backlineMult));
  }
  return next;
}

export function applyPostDefenseDamageModifiers(dmg, {
  inArena,
  target,
  attacker,
  dmgType,
  attackTypeOverride,
  emitParticle,
  addDamageText,
}) {
  let next = dmg;
  if (attackTypeOverride !== 'ignoreDefense') {
    if (dmgType === 'magic') next = Math.max(1, next - (target.magicRes || 0) * 0.5);
    else next = Math.max(1, next - (target.armor || 0) * 0.5);
  }
  if (target._armorShred > 0 && target._armorShredTimer > 0) next = Math.round(next * (1 + target._armorShred * 0.15));
  if (target._hunterMark && target._hunterMark.dur > 0) next = Math.round(next * (1 + target._hunterMark.amp));

  if (inArena && !target.isPlayer && attacker && attacker.isPlayer) {
    const family = attackFamily(attacker, dmgType, attackTypeOverride);
    if (isPhysicalPierceFamily(family)) {
      if (target.crackedArmorTimer > 0) next = Math.max(1, Math.round(next * (1 + (target.crackedArmorMult || 0.10))));
      if (target.focusMarkTimer > 0) next = Math.max(1, Math.round(next * (1 + (target.focusMarkMult || 0.12))));
    }
    if (target.markedForRuinTimer > 0 && !target.isBoss) {
      const projectileType = (attackTypeOverride || (attacker && attacker.attackType) || (attacker && attacker.projType) || dmgType || 'normal');
      if (dmgType === 'magic' || projectileType === 'magic' || projectileType === 'curse' || projectileType === 'poison' || projectileType === 'voidShard' || projectileType === 'voidOrb') {
        next = Math.max(1, Math.round(next * (1 + (target.markedForRuinMult || 0.08))));
      }
    }
  }

  if (inArena && !target.isPlayer && attackTypeOverride !== 'ignoreDefense') {
    let attackType = attackTypeOverride || (attacker && attacker.attackType) || null;
    if (!attackType) attackType = dmgType === 'magic' ? 'magic' : 'physical';
    const armorType = target.armorType || 'unarmored';
    const mult = armorMultiplier(attackType, armorType);
    if (mult !== 1.0) {
      next = Math.max(1, Math.round(next * mult));
      if (mult >= 1.3) {
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI * 2 * i / 6;
          emitParticle(target.x + Math.cos(angle) * target.size * 0.6, target.y + Math.sin(angle) * target.size * 0.6, '#7aff7a', 1, 3);
        }
        emitParticle(target.x, target.y, '#aaffaa', 8, 3);
      } else if (mult <= 0.7) {
        for (let i = 0; i < 5; i++) {
          const angle = Math.PI * 2 * i / 5;
          emitParticle(target.x + Math.cos(angle) * target.size * 0.7, target.y + Math.sin(angle) * target.size * 0.7, '#888aaa', 1, 2);
        }
      }
    }
  }
  return next;
}
