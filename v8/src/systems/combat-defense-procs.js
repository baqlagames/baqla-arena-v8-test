import {
  ashenHallowAllyProtectionMultiplier,
  batataProtectionMultiplier,
  hasStonehideMaulerFor,
  zavsProtectionMultiplier,
} from './combat-protection.js';

export function stopPlayerDefenseGates(target, {
  frame,
  randomFloat = Math.random,
  emitParticle,
  groundEffects,
  addDamageText,
}) {
  if (target._omnislashImmune) {
    if (frame % 6 === 0) {
      emitParticle(target.x, target.y, '#ffcc00', 8, 3);
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: target.size + 18, life: 0.2, color: '#ffcc00' });
    }
    addDamageText(target.x, target.y - target.size, 'IMMUNE', '#ffcc00');
    return true;
  }
  if (target.block && randomFloat() < target.block.chance) {
    emitParticle(target.x, target.y, '#ffd700', 16, 5);
    emitParticle(target.x, target.y, '#fff7c4', 8, 4);
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: target.size + 10, life: 0.3, color: '#ffd700' });
    addDamageText(target.x, target.y - target.size, 'BLOCK', '#ffd700');
    return true;
  }
  return false;
}

export function applyIronSkinReduction(target, dmg, {
  frame,
  emitParticle,
  addDamageText,
}) {
  if (!target.ironSkin) return dmg;
  const reduced = Math.min(target.ironSkin, dmg - 1);
  if (reduced > 0) {
    const next = Math.max(1, dmg - target.ironSkin);
    emitParticle(target.x, target.y - target.size * 0.3, '#cccccc', 6, 3);
    for (let a = 0; a < 4; a++) {
      const ang = a * Math.PI / 2 + frame * 0.05;
      emitParticle(target.x + Math.cos(ang) * target.size * 0.6, target.y + Math.sin(ang) * target.size * 0.6, '#aaaaaa', 1, 2);
    }
    if (frame % 6 === 0) addDamageText(target.x, target.y - target.size, '-' + reduced, '#bbbbbb');
    return next;
  }
  return Math.max(1, dmg - target.ironSkin);
}

export function applyPlayerProtectionReductions(dmg, {
  target,
  attacker,
  units,
  enemies,
  frame,
  emitParticle,
  groundEffects,
  addDamageText,
}) {
  let next = dmg;
  if (target.thickHide) next = Math.round(next * 0.83);
  if (target.ironWill) next = Math.round(next * 0.85);
  if (target.meleeResilience) next = Math.round(next * (1 - target.meleeResilience));

  const zavsProt = zavsProtectionMultiplier(target, { units });
  if (zavsProt !== 1) next = Math.max(1, Math.round(next * zavsProt));

  const batataProt = batataProtectionMultiplier(target, { units, enemies });
  if (batataProt !== 1) next = Math.max(1, Math.round(next * batataProt));

  if (attacker && attacker.isEnemy && attacker.muddiedTimer > 0 && hasStonehideMaulerFor(target, { units })) {
    next = Math.max(1, Math.round(next * 0.90));
  }
  if (target.bloodOathTimer > 0 && target.bloodOathDR > 0) {
    next = Math.max(1, Math.round(next * (1 - target.bloodOathDR)));
  }
  if (target.zavsBraceTimer > 0 && target.zavsBraceDR > 0) {
    next = Math.max(1, Math.round(next * (1 - target.zavsBraceDR)));
  }
  if (target.batataMudguardTimer > 0 && target.batataMudguardDR > 0) {
    next = Math.max(1, Math.round(next * (1 - target.batataMudguardDR)));
  }
  if (target.guardianOathTimer > 0 && target.guardianOathDR > 0) {
    next = Math.max(1, Math.round(next * (1 - target.guardianOathDR)));
  }
  if (target.crimsonCovenantTimer > 0) next = Math.max(1, Math.round(next * 0.65));
  if (target.mawOfGrave && target.mawOfGrave.t > 0) next = Math.max(1, Math.round(next * 0.75));
  if (target.ashenGuardianTimer > 0) next = Math.max(1, Math.round(next * 0.65));

  const ashenProt = ashenHallowAllyProtectionMultiplier(target, { units });
  if (ashenProt !== 1) next = Math.max(1, Math.round(next * ashenProt));

  if (target.necropolisGuard) {
    if (target.necropolisGuard.timer > 0) {
      next = Math.max(1, Math.round(next * (1 - target.necropolisGuard.dr)));
    } else if ((target.necropolisGuard.cdTimer || 0) <= 0 && target.hp < target.maxHp * target.necropolisGuard.threshold) {
      target.necropolisGuard.timer = target.necropolisGuard.dur;
      target.necropolisGuard.cdTimer = target.necropolisGuard.cd;
      target.necropolisGuardTimer = target.necropolisGuard.timer;
      if (target.necropolisGuard.shieldPct > 0) {
        const shield = Math.round((target.maxHp || 1) * target.necropolisGuard.shieldPct);
        target._taoonBloodShield = Math.max(target._taoonBloodShield || 0, shield);
        target._taoonBloodShieldTimer = Math.max(target._taoonBloodShieldTimer || 0, target.necropolisGuard.timer);
      }
      next = Math.max(1, Math.round(next * (1 - target.necropolisGuard.dr)));
      emitParticle(target.x, target.y, '#6622aa', 24, 5);
      emitParticle(target.x, target.y, '#111111', 10, 4);
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 55, life: 0.45, color: '#6622aa' });
      addDamageText(target.x, target.y - target.size, 'NECROPOLIS GUARD', '#aa66ff', { sz: 12, bold: true });
    }
  }

  if (target.bladeGuardTimer > 0 && target.bladeGuardDR > 0) {
    next = Math.max(1, Math.round(next * (1 - target.bladeGuardDR)));
    if (frame % 10 === 0) {
      emitParticle(target.x, target.y - target.size * 0.2, '#44ccff', 3, 2);
      emitParticle(target.x, target.y, '#ffffff', 1, 2);
    }
  }

  if (attacker && attacker.roarWeaken && attacker.roarWeakenTimer > 0) next = Math.round(next * 0.80);
  if (attacker && attacker.toothAndClawDebuff && attacker.toothAndClawTimer > 0) next = Math.round(next * 0.80);
  return next;
}
