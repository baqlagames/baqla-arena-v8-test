import { emitShieldAbsorbFx } from './shield-vfx-events.js?v=72b1f6b-damage-tags';

export function stopInvalidDamageTarget(target, {
  frame,
  emitParticle,
  addDamageText,
}) {
  if (!target || target.hp <= 0) return true;
  if (target.isPlayer && target._gapInvulnerableTimer > 0) {
    if (frame % 18 === 0) {
      const color = target._gapInvulnerableColor || '#ffffff';
      emitParticle(target.x, target.y, color, 6, 2);
      addDamageText(target.x, target.y - target.size, 'INVULN', color, { sz: 10, bold: true });
    }
    return true;
  }
  if (target.burrowing) return true;
  if (target.untargetable && target.isEnemy) return true;
  if (target.isBarrier) return true;
  return false;
}

export function absorbHiveShield(target, raw, attacker, {
  emitParticle,
  addDamageText,
  showFlash,
  groundEffects,
  frame,
}) {
  if (!Number.isFinite(raw) || raw <= 0) return { raw: 0, blocked: true };
  if (!target.hiveShield || target.hiveShield.hp <= 0) return { raw, blocked: false };
  if (!Number.isFinite(target.hiveShield.hp)) {
    target.hiveShield = null;
    return { raw, blocked: false };
  }
  const absorb = Math.min(raw, target.hiveShield.hp);
  target.hiveShield.hp -= absorb;
  const leftover = raw - absorb;
  if (target.hiveShield.reflect && attacker && attacker.hp > 0 && attacker.isPlayer) {
    const reflected = Math.round(absorb * target.hiveShield.reflect);
    if (reflected > 0) {
      attacker.hp = Math.max(1, attacker.hp - reflected);
      addDamageText(attacker.x, attacker.y - attacker.size, 'REFLECT -' + reflected, '#ffdd44');
    }
  }
  emitShieldAbsorbFx(target, { type: 'hive', color: '#ffdd44', amount: absorb, frame, emitParticle, groundEffects, particleCount: 4, particleSize: 3 });
  if (target.hiveShield.hp <= 0) {
    if (target.hiveShield.royalCarapace) target._royalCarapaceBroken = true;
    else showFlash('HIVE SHIELD BROKEN!', '#ffdd44', 40);
    emitShieldAbsorbFx(target, { type: 'hive', color: '#ffdd44', amount: absorb, broken: true, frame, emitParticle, groundEffects, addDamageText, breakText: 'HIVE BREAK', groundPulse: true });
    target.hiveShield = null;
  }
  return { raw: leftover, blocked: leftover <= 0 };
}

export function absorbEnemyShield(target, raw, {
  emitParticle,
  addDamageText,
  groundEffects,
  frame,
}) {
  if (!Number.isFinite(raw) || raw <= 0) return { raw: 0, blocked: true };
  if (!target.isEnemy || target.isBoss || target.isBarrier || target._enemyShield <= 0) return { raw, blocked: false };
  if (!Number.isFinite(target._enemyShield)) {
    target._enemyShield = 0;
    return { raw, blocked: false };
  }
  const absorb = Math.min(raw, target._enemyShield);
  target._enemyShield -= absorb;
  const leftover = raw - absorb;
  emitShieldAbsorbFx(target, { type: 'enemy', color: '#44aaff', amount: absorb, frame, emitParticle, groundEffects, particleCount: 5, particleSize: 2.5 });
  if (target._enemyShield <= 0) {
    target._enemyShield = 0;
    emitShieldAbsorbFx(target, { type: 'enemy', color: '#44aaff', amount: absorb, broken: true, frame, emitParticle, groundEffects, addDamageText, groundPulse: true });
  }
  return { raw: leftover, blocked: leftover <= 0 };
}

export function absorbGoldShield(target, dmg, {
  emitParticle,
  addDamageText,
  groundEffects,
  frame,
}) {
  if (!Number.isFinite(dmg) || dmg <= 0) return { dmg: 0, blocked: true };
  if (!target._goldShield || target._goldShield.amt <= 0) return { dmg, blocked: false };
  if (!Number.isFinite(target._goldShield.amt)) {
    target._goldShield = null;
    return { dmg, blocked: false };
  }
  const absorb = Math.min(dmg, target._goldShield.amt);
  target._goldShield.amt -= absorb;
  const nextDmg = dmg - absorb;
  emitShieldAbsorbFx(target, { type: 'gold', color: '#ffd700', amount: absorb, frame, emitParticle, groundEffects, particleCount: 6, particleSize: 3 });
  if (target._goldShield.amt <= 0) {
    target._goldShield = null;
    emitShieldAbsorbFx(target, { type: 'gold', color: '#ffd700', amount: absorb, broken: true, frame, emitParticle, groundEffects, addDamageText });
  }
  return { dmg: nextDmg, blocked: nextDmg <= 0 };
}

export function absorbEarthwardenShield(target, dmg, {
  emitParticle,
  addDamageText,
  groundEffects,
  frame,
}) {
  if (!Number.isFinite(dmg) || dmg <= 0) return { dmg: 0, blocked: true };
  if (target.earthwardenShield <= 0) return { dmg, blocked: false };
  if (!Number.isFinite(target.earthwardenShield)) {
    target.earthwardenShield = 0;
    return { dmg, blocked: false };
  }
  const absorb = Math.min(dmg, target.earthwardenShield);
  target.earthwardenShield -= absorb;
  const nextDmg = dmg - absorb;
  emitShieldAbsorbFx(target, {
    type: 'earthwarden',
    color: '#6b8e23',
    amount: absorb,
    broken: target.earthwardenShield <= 0,
    frame,
    emitParticle,
    groundEffects,
    addDamageText,
    particleCount: 12,
    particleSize: 4,
  });
  if (emitParticle) emitParticle(target.x, target.y, '#aaffaa', 6, 3);
  return { dmg: nextDmg, blocked: nextDmg <= 0 };
}

export function absorbTimedNumericShield(target, dmg, {
  amountKey,
  timerKey,
  color,
  label,
  frame,
  emitParticle,
  addDamageText,
  textColor,
  groundEffects,
}) {
  if (!Number.isFinite(dmg) || dmg <= 0) return { dmg: 0, blocked: true };
  if (target[amountKey] <= 0 || target[timerKey] <= 0) return { dmg, blocked: false };
  if (!Number.isFinite(target[amountKey])) {
    target[amountKey] = 0;
    return { dmg, blocked: false };
  }
  const absorb = Math.min(dmg, target[amountKey]);
  target[amountKey] -= absorb;
  const nextDmg = dmg - absorb;
  emitShieldAbsorbFx(target, {
    type: String(label || amountKey || 'shield').toLowerCase(),
    color,
    amount: absorb,
    broken: target[amountKey] <= 0,
    frame,
    emitParticle,
    groundEffects,
    addDamageText,
    breakText: (label || 'SHIELD') + ' BREAK',
    text: textColor ? null : null,
  });
  return { dmg: nextDmg, blocked: nextDmg <= 0 };
}

export function absorbShieldHp(target, dmg, {
  emitParticle,
  addDamageText,
  groundEffects,
  frame,
}) {
  if (!Number.isFinite(dmg) || dmg <= 0) return { dmg: 0, blocked: true };
  if (target.shieldHp <= 0) return { dmg, blocked: false };
  if (!Number.isFinite(target.shieldHp)) {
    target.shieldHp = 0;
    return { dmg, blocked: false };
  }
  const absorb = Math.min(dmg, target.shieldHp);
  target.shieldHp -= absorb;
  const nextDmg = dmg - absorb;
  emitShieldAbsorbFx(target, {
    type: 'naana',
    color: '#ffd700',
    amount: absorb,
    broken: target.shieldHp <= 0,
    frame,
    emitParticle,
    groundEffects,
    addDamageText,
    particleCount: 6,
    particleSize: 3,
  });
  return { dmg: nextDmg, blocked: nextDmg <= 0 };
}

export function absorbShieldOfVengeance(target, dmg, {
  emitParticle,
  addDamageText,
  groundEffects,
  frame,
}) {
  if (!Number.isFinite(dmg) || dmg <= 0) return { dmg: 0, blocked: true };
  if (!target.shieldOfVengeance || !target.shieldOfVengeance.active || target.shieldOfVengeanceHp <= 0) return { dmg, blocked: false };
  if (!Number.isFinite(target.shieldOfVengeanceHp)) {
    target.shieldOfVengeanceHp = 0;
    return { dmg, blocked: false };
  }
  const absorb = Math.min(dmg, target.shieldOfVengeanceHp);
  target.shieldOfVengeanceHp -= absorb;
  target.shieldOfVengeance.absorbed += absorb;
  const nextDmg = dmg - absorb;
  emitShieldAbsorbFx(target, {
    type: 'vengeance',
    color: '#ffe066',
    amount: absorb,
    broken: target.shieldOfVengeanceHp <= 0,
    frame,
    emitParticle,
    groundEffects,
    addDamageText,
    breakText: 'VENGEANCE',
    particleCount: 6,
    particleSize: 3,
  });
  return { dmg: nextDmg, blocked: nextDmg <= 0 };
}

export function absorbObjectShield(target, dmg, {
  shieldKey,
  hpKey = 'hp',
  color,
  emitParticle,
  addDamageText,
  text,
  textYOffset = 0.5,
  particleCount = 8,
  particleSize = 3,
  groundEffects,
  frame,
  type = shieldKey,
}) {
  if (!Number.isFinite(dmg) || dmg <= 0) return { dmg: 0, blocked: true };
  const shield = target[shieldKey];
  if (!shield || shield[hpKey] <= 0) return { dmg, blocked: false };
  if (!Number.isFinite(shield[hpKey])) {
    shield[hpKey] = 0;
    return { dmg, blocked: false };
  }
  const absorb = Math.min(dmg, shield[hpKey]);
  shield[hpKey] -= absorb;
  const nextDmg = dmg - absorb;
  emitShieldAbsorbFx(target, {
    type,
    color,
    amount: absorb,
    broken: shield[hpKey] <= 0,
    frame,
    emitParticle,
    groundEffects,
    addDamageText,
    breakText: text ? text + ' BREAK' : 'SHIELD BREAK',
    particleCount,
    particleSize,
  });
  return { dmg: nextDmg, blocked: nextDmg <= 0 };
}
