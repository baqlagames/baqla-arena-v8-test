import { dist } from '../core/math.js';

export function triggerGalacticGuardian(target, {
  enemies,
  randomFloat = Math.random,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!target.galacticGuardian || target.galacticGuardian.cd > 0 || randomFloat() >= target.galacticGuardian.chance) return false;
  target.galacticGuardian.cd = target.galacticGuardian.cooldown;
  let hits = 0;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || dist(target, enemy) > target.galacticGuardian.radius) continue;
    dealDamage(enemy, Math.round(target.dmg * target.galacticGuardian.mult), target, 'magic');
    groundEffects.push({ x: enemy.x, y: enemy.y, r: 0, maxR: 35, life: 0.55, moonfire: true });
    emitParticle(enemy.x, enemy.y, '#bb66ff', 12, 5);
    emitParticle(enemy.x, enemy.y, '#ddaaff', 6, 3);
    hits++;
  }
  if (hits) {
    addDamageText(target.x, target.y - target.size, 'MOONFIRE!', '#bb66ff');
    shake(5);
  }
  return true;
}

export function applyPreShieldPlayerReactions(dmg, {
  target,
  dmgType,
  attackTypeOverride,
  tickHz,
  emitParticle,
  addDamageText,
  showFlash,
}) {
  let next = dmg;
  if (target.cloakOfShadows && !target.cloakOfShadows.active && target.cloakOfShadows.cd <= 0 && (dmgType === 'magic' || attackTypeOverride === 'magic')) {
    target.cloakOfShadows.active = true;
    target.cloakOfShadows.dur = 3 * tickHz;
    emitParticle(target.x, target.y, '#440066', 20, 4);
    addDamageText(target.x, target.y - target.size, 'CLOAK OF SHADOWS!', '#aa66ff');
  }
  if (target.incarnationCCImmune) {
    target.stunned = 0;
    target.slowTimer = 0;
    target.slowMult = 1.0;
  }
  if (target.lastStand && !target.lastStand.used && target.hp < target.maxHp * target.lastStand.threshold) {
    target.lastStand.used = true;
    target.lastStandV6Timer = 300;
    showFlash('LAST STAND!', '#ffaa00', 60);
    emitParticle(target.x, target.y, '#ffaa00', 20, 4);
  }
  if (target.lastStandV6Timer > 0) next *= (1 - target.lastStand.dr);
  return next;
}

export function applyPlayerSpecialDefenses(dmg, {
  target,
  attacker,
  units,
  dmgType,
  attackTypeOverride,
  frame,
  tickHz,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
}) {
  let next = dmg;
  for (const ally of units) {
    if (ally === target || ally.hp <= 0 || !ally.isPlayer || !ally.auraMastery) continue;
    if (dist(ally, target) <= 150) {
      next = Math.round(next * 0.95);
      break;
    }
  }
  if (target.mountTimer > 0 && target.mountDR) {
    next = Math.round(next * (1 - target.mountDR));
    if (frame % 8 === 0) emitParticle(target.x, target.y, '#ffe066', 4, 2);
  }

  if (target.heartOfEarthTimer > 0) {
    emitParticle(target.x, target.y, '#a06030', 8, 3);
    addDamageText(target.x, target.y - target.size, 'INVULNERABLE', '#cc8855');
    return { dmg: next, blocked: true };
  }
  if (target.invulnerableTimer > 0) {
    emitParticle(target.x, target.y, '#ffeeaa', 6, 3);
    addDamageText(target.x, target.y - target.size, 'INVULN', '#ffeeaa');
    return { dmg: next, blocked: true };
  }
  if (target.aegisShieldTimer > 0) {
    if (attacker && attacker.hp > 0 && attacker.isEnemy) {
      const back = Math.max(1, Math.round(next * 1.0));
      attacker.hp -= back;
      addDamageText(attacker.x, attacker.y - attacker.size / 2, back, '#ffd700');
    }
    emitParticle(target.x, target.y, '#ffd700', 8, 3);
    addDamageText(target.x, target.y - target.size, 'AEGIS', '#ffd700');
    return { dmg: next, blocked: true };
  }

  if (target._consecDR > 0) next = Math.round(next * (1 - target._consecDR));
  if (target.goakDR > 0) next = Math.round(next * (1 - target.goakDR));
  if (target.cheatDeathTimer > 0 && target.cheatDeathDR > 0) next = Math.round(next * (1 - target.cheatDeathDR));
  if (target.cloakOfShadows && target.cloakOfShadows.active && (dmgType === 'magic' || attackTypeOverride === 'magic')) {
    emitParticle(target.x, target.y, '#440066', 8, 3);
    addDamageText(target.x, target.y - target.size, 'CLOAK!', '#aa66ff');
    return { dmg: next, blocked: true };
  }
  if (target.ardentDefenderDR > 0) next = Math.round(next * (1 - target.ardentDefenderDR));
  if (target.guardiansMercyDR > 0) next = Math.round(next * (1 - target.guardiansMercyDR));
  if (target.thirdEyeDR > 0) next = Math.round(next * (1 - target.thirdEyeDR));
  if (target.crystalGuardDR > 0) next = Math.round(next * (1 - target.crystalGuardDR));
  if (target.ardentDefenderTimer > 0) {
    emitParticle(target.x, target.y, '#ffd700', 6, 3);
    addDamageText(target.x, target.y - target.size, 'INVULN', '#ffd700');
    return { dmg: next, blocked: true };
  }
  if (target.lastStandSigTimer > 0) {
    emitParticle(target.x, target.y, '#ff4444', 6, 3);
    addDamageText(target.x, target.y - target.size, 'LAST STAND', '#ff4444');
    return { dmg: next, blocked: true };
  }
  if (target._elixirDR > 0) next = Math.round(next * 0.50);

  if (target.spellReflectReady && (dmgType === 'magic' || attackTypeOverride === 'magic') && attacker && attacker.hp > 0) {
    target.spellReflectReady = false;
    target.spellReflectCD = 8 * tickHz;
    const refDmg = Math.round(next * 1.5);
    dealDamage(attacker, refDmg, target, 'magic');
    emitParticle(target.x, target.y, '#6688ff', 16, 5);
    emitParticle(attacker.x, attacker.y, '#6688ff', 12, 4);
    addDamageText(target.x, target.y - target.size, 'REFLECTED!', '#6688ff');
    return { dmg: next, blocked: true };
  }
  if (target.divineShieldTimer > 0 && target.divineShieldDR) next = next * (1 - target.divineShieldDR);

  if (dmgType === 'magic') {
    for (const ally of units) {
      if (!ally.mageWardZone || ally.hp <= 0) continue;
      if (dist({ x: ally.mageWardZone.x, y: ally.mageWardZone.y }, target) <= ally.mageWardZone.r) {
        next = next * 0.30;
        emitParticle(target.x, target.y, '#5a8aff', 4, 2);
        break;
      }
    }
  }

  if (target.magicWard && target.magicWard.ready && dmgType === 'magic') {
    target.magicWard.ready = false;
    target.magicWard.t = 0;
    emitParticle(target.x, target.y, '#aa66ff', 24, 4);
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: target.size + 12, life: 0.35, color: '#aa66ff' });
    addDamageText(target.x, target.y - target.size, 'WARDED', '#aa66ff');
    return { dmg: next, blocked: true };
  }

  if (target.reflect && attacker && attacker.hp > 0 && attacker.isEnemy && dmgType === 'magic') {
    const back = Math.max(1, Math.round(next * target.reflect.pct));
    attacker.hp -= back;
    addDamageText(attacker.x, attacker.y - attacker.size / 2, back, '#88ccff');
    emitParticle(attacker.x, attacker.y, '#88ccff', 8, 3);
    for (let i = 1; i <= 4; i++) {
      const pX = target.x + (attacker.x - target.x) * (i / 4);
      const pY = target.y + (attacker.y - target.y) * (i / 4);
      emitParticle(pX, pY, '#88ccff', 1, 2);
    }
  }
  if (target.thorns && attacker && attacker.hp > 0 && attacker.isEnemy) {
    const reflected = Math.max(1, Math.round(next * target.thorns));
    attacker.hp -= reflected;
    addDamageText(attacker.x, attacker.y - attacker.size / 2, reflected, '#ffaa00');
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const pX = target.x + (attacker.x - target.x) * (i / steps);
      const pY = target.y + (attacker.y - target.y) * (i / steps);
      emitParticle(pX, pY, '#ffaa00', 1, 2);
    }
  }
  if (target.willOfNecropolis && target.hp < target.maxHp * target.willOfNecropolisThreshold) {
    next = Math.round(next * (1 - target.willOfNecropolis));
    if (frame % 8 === 0) emitParticle(target.x, target.y, '#6622aa', 4, 2);
  }
  if (target.antiMagicBarrier && dmgType === 'magic') {
    const shieldGain = Math.round(next * 0.25);
    target.shieldHp = (target.shieldHp || 0) + shieldGain;
    next = Math.round(next * 0.75);
    emitParticle(target.x, target.y, '#8844cc', 6, 2);
  }
  if (target.boneShield && target.boneShield.charges > 0) {
    target.boneShield.charges--;
    next = Math.round(next * (1 - target.boneShield.dr));
    emitParticle(target.x, target.y, '#ccddcc', 4, 2);
  }
  return { dmg: next, blocked: false };
}

export function triggerPrayerOfMending(target, dmg, {
  units,
  projectiles,
  applyHealingReceived,
  addHealEffect,
  emitParticle,
}) {
  if (!target._pom || target._pom.bounces <= 0 || dmg <= 0) return false;
  const heal = applyHealingReceived(target, Math.round(target.maxHp * target._pom.healPct));
  target.hp = Math.min(target.maxHp, target.hp + heal);
  addHealEffect(target.x, target.y, heal);
  emitParticle(target.x, target.y, '#66ffaa', 16, 5);
  target._pom.bounces--;
  if (target._pom.bounces > 0) {
    let nextTarget = null;
    let nextPct = Infinity;
    for (const ally of units) {
      if (ally.isPlayer && ally.hp > 0 && ally !== target && !ally.isGhost && !ally._pom) {
        const pct = ally.hp / ally.maxHp;
        if (pct < nextPct) {
          nextPct = pct;
          nextTarget = ally;
        }
      }
    }
    if (nextTarget) {
      nextTarget._pom = { bounces: target._pom.bounces, healPct: target._pom.healPct, from: target._pom.from };
      projectiles.push({ x: target.x, y: target.y, target: nextTarget, tx: nextTarget.x, ty: nextTarget.y, speed: 2.5, projType: 'pomOrb', visualOnly: true, color: '#66ffaa', _arrN: 10, _arrSz: 4, _arrGnd: 25, isPlayer: true, dmg: 0 });
    }
  }
  target._pom = null;
  return true;
}

export function tryGuardianSpiritSave(target, dmg, {
  randomRange,
  addHealEffect,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
}) {
  if (!target._guardianSpirit || target.hp - dmg > 0) return false;
  target.hp = Math.round(target.maxHp * target._guardianSpirit.healPct);
  target._guardianSpirit = null;
  addHealEffect(target.x, target.y, target.hp, true);
  for (let i = 0; i < 24; i++) emitParticle(target.x + randomRange(-15, 15), target.y + randomRange(-15, 5), '#ffd700', 1, 5);
  groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 60, life: 0.8, color: '#ffd700' });
  groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 40, life: 0.5, color: '#ffffff' });
  addDamageText(target.x, target.y - target.size, 'SAVED!', '#ffd700');
  showFlash('GUARDIAN SPIRIT SAVES', '#ffd700', 60);
  shake(8);
  return true;
}

export function applySoulLinkRedirect(target, dmg, {
  units,
  frame,
  emitParticle,
}) {
  if (!target.soulLink || dmg <= 0) return dmg;
  let minion = null;
  let minionHp = 0;
  for (const unit of units) {
    if (unit.isMinion && unit.parent === target && unit.hp > 0 && unit.hp > minionHp) {
      minionHp = unit.hp;
      minion = unit;
    }
  }
  if (!minion) return dmg;
  const redirected = Math.round(dmg * target.soulLink.pct);
  const next = dmg - redirected;
  minion.hp = Math.max(1, minion.hp - redirected);
  if (frame % 8 === 0) emitParticle(minion.x, minion.y, '#5a3a8a', 4, 2);
  return next;
}
