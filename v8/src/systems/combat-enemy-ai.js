import { GAME_TICK_HZ } from '../core/constants.js';
import { clamp, dist } from '../core/math.js';
import { tickEnemyActionStatusEffects } from './combat-status-effects.js';
import { arenaEngagementBands, effectiveArenaAttackRange } from './combat-targeting.js';

export function updateArenaEnemyAi(enemy, {
  frame,
  width,
  height,
  arenaLeft,
  arenaRight,
  arenaTop,
  arenaBottom,
  arenaPhase,
  units,
  enemies,
  towers,
  playerCastle,
  groundEffects,
  beamFx,
  randomRange,
  moveToward,
  updateEnemyMechanics,
  enemyAttackCooldown,
  applySearingBrandOnBasic,
  applyRoyalStingOnBasic,
  dealDamage,
  fireProjectile,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
  sound,
}) {
  if (enemy.hp <= 0) return;
  if (enemy.isBarrier) return;
  if (enemy.lockedAtTop || enemy.aerial) return;
  if (enemy.entryHold > 0) {
    enemy.entryHold--;
    if (frame % 8 === 0) emitParticle(enemy.x + randomRange(-8, 8), enemy.y + randomRange(-10, 10), enemy.accent || enemy.color || '#ffaa44', 1, 3);
    return;
  }
  if (enemy.royalCarapaceTimer > 0) {
    if (enemy.cd > 0) enemy.cd--;
    return;
  }
  if (enemy.polymorphTimer > 0) {
    enemy.polymorphTimer--;
    return;
  }
  if (enemy.stunned > 0) {
    enemy.stunned--;
    return;
  }
  if (enemy.rootTimer > 0) {
    enemy.rootTimer--;
    enemy.x = enemy.rootX;
    enemy.y = enemy.rootY;
    if (enemy.rootTimer <= 0) enemy.rooted = false;
    if (frame % 6 === 0) emitParticle(enemy.x + randomRange(-8, 8), enemy.y + enemy.size * 0.3, '#33aa33', 1, 3);
    if (enemy.cd > 0) enemy.cd--;
    return;
  }
  if (enemy.demoralizedTimer > 0) enemy.demoralizedTimer--;
  if (enemy.armorBreakTimer > 0) {
    enemy.armorBreakTimer--;
    if (enemy.armorBreakTimer <= 0) enemy.armorBreak = 0;
  }
  updateEnemyMechanics(enemy);
  if (enemy.cd > 0) enemy.cd--;

  if (tickBurrowMovement(enemy, {
    frame,
    width,
    height,
    arenaTop,
    arenaBottom,
    playerCastle,
    randomRange,
    groundEffects,
    emitParticle,
    showFlash,
    shake,
  })) return;

  tickEliteCharge(enemy, {
    frame,
    arenaLeft,
    arenaRight,
    arenaTop,
    arenaBottom,
    units,
    randomRange,
    emitParticle,
    showFlash,
    shake,
  });

  tickEnemyActionStatusEffects(enemy, {
    frame,
    enemies,
    dealDamage,
    emitParticle,
    groundEffects,
    addDamageText,
    shake,
  });

  const targetInfo = chooseEnemyTarget(enemy, {
    arenaPhase,
    units,
    towers,
    playerCastle,
  });
  let bestTarget = targetInfo.target;
  let bestDistance = targetInfo.distance;

  if (handleForcedTarget(enemy, {
    moveToward,
    enemyAttackCooldown,
    applySearingBrandOnBasic,
    applyRoyalStingOnBasic,
    dealDamage,
  })) return;

  if (!bestTarget) {
    moveToward(enemy, enemy.x, arenaBottom - 50, enemy.speed);
    return;
  }

  const snipe = maybeOverrideSnipeTarget(enemy, bestTarget, bestDistance, {
    arenaPhase,
    units,
    randomRange,
  });
  if (snipe) {
    bestTarget = snipe.target;
    bestDistance = snipe.distance;
  }
  enemy.target = bestTarget;
  const attackRange = effectiveArenaAttackRange(enemy, { arenaPhase });

  if (handleSniperWindup(enemy, bestTarget, bestDistance, {
    frame,
    beamFx,
    groundEffects,
    fireProjectile,
    dealDamage,
    addDamageText,
    emitParticle,
    enemyAttackCooldown,
  })) return;

  if (bestDistance > attackRange && !enemy._snipeReady) {
    const approach = enemyApproachPoint(enemy, bestTarget, { arenaTop, arenaBottom, arenaPhase });
    moveToward(enemy, approach.x, approach.y, enemy.speed);
  }
  if ((bestDistance <= attackRange || enemy._snipeReady) && enemy.cd <= 0) {
    performEnemyBasicAttack(enemy, bestTarget, {
      frame,
      units,
      groundEffects,
      enemyAttackCooldown,
      applySearingBrandOnBasic,
      applyRoyalStingOnBasic,
      fireProjectile,
      dealDamage,
      emitParticle,
      addDamageText,
    });
  }

  tickChainBolt(enemy, {
    arenaPhase,
    frame,
    units,
    randomRange,
    dealDamage,
    emitParticle,
    addDamageText,
    shake,
  });
  tickMeteor(enemy, {
    arenaPhase,
    units,
    randomRange,
    groundEffects,
    dealDamage,
    emitParticle,
    addDamageText,
    shake,
    sound,
  });
  enemy.bobPhase += 0.08;
}

function enemyApproachPoint(enemy, target, { arenaTop, arenaBottom, arenaPhase }) {
  if (!arenaPhase || !target || !target.isPlayer) return { x: target.x, y: target.y };
  const ranged = enemy.range > 80 || enemy.arch === 'ranged' || enemy.arch === 'caster';
  if (ranged || enemy.prefersBackline || enemy._snipeReady) return { x: target.x, y: target.y };
  const bands = arenaEngagementBands({ arenaTop, arenaBot: arenaBottom });
  return { x: target.x, y: Math.min(target.y, bands.enemyDiveY) };
}

function tickBurrowMovement(enemy, {
  frame,
  width,
  height,
  arenaTop,
  arenaBottom,
  playerCastle,
  randomRange,
  groundEffects,
  emitParticle,
  showFlash,
  shake,
}) {
  if (!enemy.burrow) return false;
  if (enemy.burrowing == null) {
    enemy.burrowing = true;
    enemy.burrowT = enemy.burrowTimer || 240;
    enemy.burrowSpeedMult = 1.6;
    emitParticle(enemy.x, enemy.y, '#7a5028', 16, 5);
  }
  if (!enemy.burrowing) return false;

  enemy.burrowT--;
  const targetX = playerCastle ? playerCastle.x : width / 2;
  const bands = arenaEngagementBands({ arenaTop, arenaBot: arenaBottom });
  const targetY = playerCastle ? Math.min(playerCastle.y - 30, bands.enemyDiveY) : Math.min(height - 100, bands.enemyDiveY);
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = (enemy.speed || 0.3) * enemy.burrowSpeedMult;
  enemy.x += (dx / distance) * speed * GAME_TICK_HZ * 0.0625;
  enemy.y += (dy / distance) * speed * GAME_TICK_HZ * 0.0625;
  if (frame % 6 === 0) emitParticle(enemy.x + randomRange(-6, 6), enemy.y + 8, '#7a5028', 1, 3);
  if (enemy.burrowT <= 0 || distance < 60) {
    enemy.burrowing = false;
    emitParticle(enemy.x, enemy.y, '#aa8050', 24, 6);
    emitParticle(enemy.x, enemy.y, '#5a3010', 16, 4);
    groundEffects.push({ x: enemy.x, y: enemy.y, r: 0, maxR: 50, life: 0.45, color: '#aa8050' });
    shake(6);
    showFlash('AMBUSH!', '#ff8800', 30);
  }
  return true;
}

function tickEliteCharge(enemy, {
  arenaLeft,
  arenaRight,
  arenaTop,
  arenaBottom,
  units,
  randomRange,
  emitParticle,
  showFlash,
  shake,
}) {
  if (!enemy.isElite) return;
  if (enemy.eliteChargeT == null) enemy.eliteChargeT = 7 * GAME_TICK_HZ;
  enemy.eliteChargeT--;
  if (enemy.eliteChargeT > 0) return;
  enemy.eliteChargeT = 7 * GAME_TICK_HZ;
  let target = null;
  let bestDistance = Infinity;
  for (const unit of units) {
    if (unit.hp <= 0) continue;
    const distance = dist(enemy, unit);
    if (distance < bestDistance) {
      bestDistance = distance;
      target = unit;
    }
  }
  if (target && bestDistance > 120) {
    const bands = arenaEngagementBands({ arenaTop, arenaBot: arenaBottom });
    emitParticle(enemy.x, enemy.y, '#ff8c00', 24, 5);
    enemy.x = clamp(target.x + randomRange(-20, 20), arenaLeft + enemy.size, arenaRight - enemy.size);
    enemy.y = clamp(target.y - 50, arenaTop + 40, bands.enemyDiveY);
    emitParticle(enemy.x, enemy.y, '#ff8c00', 24, 5);
    shake(8);
    showFlash('CHAMPION CHARGE!', '#ff8c00', 30);
  }
}

function handleForcedTarget(enemy, {
  moveToward,
  enemyAttackCooldown,
  applySearingBrandOnBasic,
  applyRoyalStingOnBasic,
  dealDamage,
}) {
  if (enemy.forcedTargetTimer <= 0) return false;
  enemy.forcedTargetTimer--;
  if (enemy.forcedTarget && enemy.forcedTarget.hp > 0) {
    enemy.target = enemy.forcedTarget;
    const forcedDistance = dist(enemy, enemy.forcedTarget);
    const attackRange = effectiveArenaAttackRange(enemy, { arenaPhase: true });
    if (forcedDistance > attackRange) moveToward(enemy, enemy.forcedTarget.x, enemy.forcedTarget.y, enemy.speed);
    if (forcedDistance <= attackRange && enemy.cd <= 0) {
      enemy.cd = enemyAttackCooldown(enemy);
      applySearingBrandOnBasic(enemy, enemy.forcedTarget);
      applyRoyalStingOnBasic(enemy, enemy.forcedTarget);
      if (enemy.forcedTarget.hp > 0) dealDamage(enemy.forcedTarget, enemy.dmg, enemy, 'normal');
    }
    return true;
  }
  enemy.forcedTargetTimer = 0;
  return false;
}

function chooseEnemyTarget(enemy, {
  arenaPhase,
  units,
  towers,
  playerCastle,
}) {
  let target = null;
  let distance = Infinity;
  if (arenaPhase) {
    let nearTank = null;
    let nearTankDistance = Infinity;
    let nearest = null;
    let nearestDistance = Infinity;
    let nearBackline = null;
    let nearBacklineDistance = Infinity;
    let nearMelee = null;
    let nearMeleeDistance = Infinity;
    const isRangedEnemy = enemy.range > 80 || enemy.arch === 'ranged' || enemy.arch === 'caster';
    const isMeleeEnemy = !isRangedEnemy && !enemy.prefersBackline;
    for (const unit of units) {
      if (unit.hp <= 0) continue;
      if (unit.divineShield) continue;
      if (unit.stealth && unit.stealthHits === 0) continue;
      if (unit.untargetable || unit.isGhost) continue;
      const candidateDistance = dist(enemy, unit);
      if (unit.taunt && candidateDistance < nearTankDistance) {
        nearTankDistance = candidateDistance;
        nearTank = unit;
      }
      if (candidateDistance < nearestDistance) {
        nearestDistance = candidateDistance;
        nearest = unit;
      }
      if (unit.arch !== 'tank' && !unit.taunt && !unit.isMinion && candidateDistance < nearBacklineDistance) {
        nearBacklineDistance = candidateDistance;
        nearBackline = unit;
      }
      if (isMeleeEnemy && !unit.taunt && !unit.isMinion && candidateDistance < 100 && candidateDistance < nearMeleeDistance) {
        nearMeleeDistance = candidateDistance;
        nearMelee = unit;
      }
    }
    enemy._v8TargetClass = 'normal';
    if (enemy.prefersBackline && nearBackline) {
      target = nearBackline;
      distance = nearBacklineDistance;
      enemy._v8TargetClass = 'forcedBackline';
    } else if (nearTank && isRangedEnemy && nearBackline) {
      if (enemy._tauntBypassReady) {
        target = nearBackline;
        distance = nearBacklineDistance;
        enemy._v8TargetClass = 'rangedBypass';
      } else {
        target = nearTank;
        distance = nearTankDistance;
        enemy._v8TargetClass = 'rangedTankHold';
      }
    } else if (nearTank && isMeleeEnemy && nearMelee) {
      if (enemy._meleeBypassReady) {
        target = nearMelee;
        distance = nearMeleeDistance;
        enemy._v8TargetClass = 'meleeBypass';
      } else {
        target = nearTank;
        distance = nearTankDistance;
        enemy._v8TargetClass = 'meleeTankHold';
      }
    } else if (nearTank) {
      target = nearTank;
      distance = nearTankDistance;
    } else if (nearest) {
      target = nearest;
      distance = nearestDistance;
    } else if (playerCastle && playerCastle.hp > 0) {
      target = playerCastle;
      distance = dist(enemy, playerCastle);
    }
    return { target, distance };
  }

  for (const unit of units) {
    if (unit.hp <= 0) continue;
    if (unit.divineShield) continue;
    if (unit.stealth && unit.stealthHits === 0) continue;
    const candidateDistance = dist(enemy, unit);
    if (candidateDistance < distance) {
      distance = candidateDistance;
      target = unit;
    }
  }
  for (const tower of towers) {
    if (tower.hp <= 0 || !tower.isPlayer) continue;
    const candidateDistance = dist(enemy, tower);
    if (candidateDistance < distance) {
      distance = candidateDistance;
      target = tower;
    }
  }
  if (playerCastle && playerCastle.hp > 0) {
    const candidateDistance = dist(enemy, playerCastle);
    if (candidateDistance < distance) {
      distance = candidateDistance;
      target = playerCastle;
    }
  }
  return { target, distance };
}

function maybeOverrideSnipeTarget(enemy, bestTarget, bestDistance, {
  arenaPhase,
  units,
  randomRange,
}) {
  if (!(arenaPhase && enemy.snipesBackline && enemy.projType)) return null;
  if (enemy.snipeT == null) enemy.snipeT = Math.floor((enemy.snipeCD || 720) * 0.5) + Math.floor(randomRange(0, 120));
  enemy.snipeT--;
  if (!(enemy.snipeT <= 0 && bestTarget && bestTarget.arch === 'tank')) return null;
  let backTarget = null;
  let backDistance = Infinity;
  const maxRange = enemy.range * 1.4;
  for (const unit of units) {
    if (unit.hp <= 0) continue;
    if (unit.divineShield || unit.untargetable || unit.isGhost) continue;
    if (unit.arch === 'tank' || unit.isMinion) continue;
    if (unit.stealth && unit.stealthHits === 0) continue;
    const distance = dist(enemy, unit);
    if (distance < maxRange && distance < backDistance) {
      backDistance = distance;
      backTarget = unit;
    }
  }
  if (!backTarget) return null;
  enemy._snipeReady = true;
  enemy._v8TargetClass = 'snipeBackline';
  return { target: backTarget, distance: backDistance || bestDistance };
}

function handleSniperWindup(enemy, bestTarget, bestDistance, {
  frame,
  beamFx,
  groundEffects,
  fireProjectile,
  dealDamage,
  addDamageText,
  emitParticle,
  enemyAttackCooldown,
}) {
  if (!(enemy._sniperWindup && !enemy._snipeReady)) return false;
  const windup = enemy._sniperWindup;
  if (windup.charge > 0) {
    if (!bestTarget || bestTarget.hp <= 0 || bestDistance > enemy.range + 12) {
      windup.charge = 0;
      return true;
    }
    windup.charge--;
    if (frame % 5 === 0) {
      beamFx.push({ x1: enemy.x, y1: enemy.y - enemy.size * 0.35, x2: bestTarget.x, y2: bestTarget.y - bestTarget.size * 0.25, life: 0.12, maxLife: 0.12, color: '#ff4444', width: 1.5, straight: true });
      emitParticle(bestTarget.x, bestTarget.y, '#ff4444', 1, 2);
    }
    if (windup.charge <= 0 && bestTarget && bestTarget.hp > 0) {
      const shotDamage = Math.max(1, Math.round(enemy.dmg * (windup.shotMult || 1.35)));
      if (enemy.projType) fireProjectile(enemy, bestTarget, shotDamage, { projType: enemy.projType, color: '#ff4444' });
      else dealDamage(bestTarget, shotDamage, enemy, 'normal');
      addDamageText(bestTarget.x, bestTarget.y - bestTarget.size, 'SNIPER SHOT', '#ff4444', { sz: 13, bold: true });
      emitParticle(enemy.x, enemy.y, '#ff4444', 10, 3);
      enemy.cd = enemyAttackCooldown(enemy) + Math.round(1.5 * GAME_TICK_HZ);
    }
    return true;
  }
  if (bestDistance <= enemy.range && enemy.cd <= 0) {
    windup.charge = windup.chargeMax || 70;
    addDamageText(enemy.x, enemy.y - enemy.size, 'AIMING', '#ff4444', { sz: 12, bold: true });
    groundEffects.push({ x: bestTarget.x, y: bestTarget.y, r: 0, maxR: 32, life: 0.42, color: '#ff4444' });
    return true;
  }
  return false;
}

function performEnemyBasicAttack(enemy, bestTarget, {
  frame,
  units,
  groundEffects,
  enemyAttackCooldown,
  applySearingBrandOnBasic,
  applyRoyalStingOnBasic,
  fireProjectile,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  const needsWarning = !!(enemy.splashOnHit && enemy.splashRadius);
  if (needsWarning) {
    if (!enemy._aoeAttackWarn) {
      const radius = enemy.splashRadius;
      enemy._aoeAttackWarn = { timer: 18, maxTimer: 18, target: bestTarget };
      groundEffects.push({ x: bestTarget.x, y: bestTarget.y, r: 0, maxR: radius, life: 0.45, color: '#ff8c00', enemyWarn: true, warnTimer: 18, warnMax: 18, warnKind: 'cleave' });
      addDamageText(bestTarget.x, bestTarget.y - bestTarget.size - 6, enemy.arch === 'aoe' ? 'AOE!' : 'CLEAVE!', '#ff8c00', { sz: 11, bold: true });
      emitParticle(enemy.x, enemy.y, '#ff8c00', 5, 2);
      return;
    }
    enemy._aoeAttackWarn.timer--;
    if (!bestTarget || bestTarget.hp <= 0 || enemy._aoeAttackWarn.timer > 0) {
      if (frame % 5 === 0 && bestTarget && bestTarget.hp > 0) emitParticle(bestTarget.x, bestTarget.y, '#ff8c00', 1, 2);
      if (!bestTarget || bestTarget.hp <= 0) enemy._aoeAttackWarn = null;
      return;
    }
    enemy._aoeAttackWarn = null;
  }
  enemy.cd = enemyAttackCooldown(enemy);
  applySearingBrandOnBasic(enemy, bestTarget);
  applyRoyalStingOnBasic(enemy, bestTarget);
  if (bestTarget.hp > 0) {
    if (enemy.projType) fireProjectile(enemy, bestTarget, enemy.dmg, { projType: enemy.projType });
    else dealDamage(bestTarget, enemy.dmg, enemy, enemy.projType === 'curse' ? 'magic' : 'normal');
  }
  emitParticle(bestTarget.x, bestTarget.y, '#fff', 3, 2);
  if (enemy._v8TargetClass === 'rangedBypass') {
    enemy._tauntBypassReady = false;
    enemy._tauntBypassHits = 0;
  } else if (enemy._v8TargetClass === 'rangedTankHold') {
    enemy._tauntBypassHits = (enemy._tauntBypassHits || 0) + 1;
    if (enemy._tauntBypassHits >= 6) enemy._tauntBypassReady = true;
  }
  if (enemy._v8TargetClass === 'meleeBypass') {
    enemy._meleeBypassReady = false;
    enemy._meleeBypassHits = 0;
  } else if (enemy._v8TargetClass === 'meleeTankHold') {
    enemy._meleeBypassHits = (enemy._meleeBypassHits || 0) + 1;
    if (enemy._meleeBypassHits >= 5) enemy._meleeBypassReady = true;
  }
  if (enemy._snipeReady) {
    enemy.snipeT = enemy.snipeCD || 720;
    enemy._snipeReady = false;
    addDamageText(bestTarget.x, bestTarget.y - bestTarget.size - 4, 'SNIPE!', '#ff4444');
    emitParticle(enemy.x, enemy.y, '#ff4444', 6, 3);
    emitParticle(bestTarget.x, bestTarget.y, '#ff4444', 8, 4);
  }
  if (enemy.splashOnHit && enemy.splashRadius && bestTarget && bestTarget.x != null) {
    const radius = enemy.splashRadius;
    const splashDamage = Math.round(enemy.dmg * 0.60);
    for (const unit of units) {
      if (unit === bestTarget || unit.hp <= 0 || !unit.isPlayer || unit.untargetable || unit.isGhost) continue;
      const splashDistance = Math.hypot(unit.x - bestTarget.x, unit.y - bestTarget.y);
      if (splashDistance <= radius) {
        dealDamage(unit, splashDamage, enemy, 'normal');
        emitParticle(unit.x, unit.y, '#ff8c00', 4, 3);
      }
    }
    groundEffects.push({ x: bestTarget.x, y: bestTarget.y, r: 0, maxR: radius, life: 0.35, color: '#ff8c00' });
  }
}

function tickChainBolt(enemy, {
  arenaPhase,
  frame,
  units,
  randomRange,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!(enemy.chainBoltCD && arenaPhase)) return;
  if (enemy.chainBoltT == null) enemy.chainBoltT = Math.floor(enemy.chainBoltCD * 0.5) + Math.floor(randomRange(0, 90));
  enemy.chainBoltT--;
  if (enemy.chainBoltT > 0) return;
  enemy.chainBoltT = enemy.chainBoltCD;
  const baseDamage = Math.round(enemy.dmg * (enemy.chainBoltDmgMult || 0.5));
  let from = { x: enemy.x, y: enemy.y };
  const hit = new Set();
  let landed = 0;
  for (let jump = 0; jump < 3; jump++) {
    let next = null;
    let nextDistance = Infinity;
    const maxRange = jump === 0 ? (enemy.range || 220) : 170;
    for (const unit of units) {
      if (unit.hp <= 0 || hit.has(unit)) continue;
      if (unit.divineShield || unit.untargetable || unit.isGhost) continue;
      if (unit.stealth && unit.stealthHits === 0) continue;
      const distance = Math.hypot(unit.x - from.x, unit.y - from.y);
      if (distance < maxRange && distance < nextDistance) {
        nextDistance = distance;
        next = unit;
      }
    }
    if (!next) break;
    hit.add(next);
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const x = from.x + (next.x - from.x) * (i / steps);
      const y = from.y + (next.y - from.y) * (i / steps);
      emitParticle(x + randomRange(-3, 3), y + randomRange(-3, 3), '#fff700', 1, 3);
    }
    emitParticle(next.x, next.y, '#fff700', 8, 4);
    emitParticle(next.x, next.y, '#ffffff', 4, 2);
    dealDamage(next, baseDamage, enemy, 'magic');
    from = { x: next.x, y: next.y };
    landed++;
  }
  if (landed) {
    addDamageText(enemy.x, enemy.y - enemy.size - 8, 'CHAIN!', '#fff700');
    shake(3);
  }
}

function tickMeteor(enemy, {
  arenaPhase,
  units,
  randomRange,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
  sound,
}) {
  if (!(enemy.meteorCD && arenaPhase)) return;
  if (enemy._meteorWarn) {
    const warn = enemy._meteorWarn;
    warn.timer--;
    if (warn.timer > 0) {
      if (warn.timer % 5 === 0) emitParticle(warn.x + randomRange(-warn.radius * 0.35, warn.radius * 0.35), warn.y + randomRange(-warn.radius * 0.25, warn.radius * 0.25), '#ff6622', 1, 2.5);
      return;
    }
    for (const unit of units) {
      if (unit.hp <= 0 || unit.divineShield || unit.untargetable || unit.isGhost) continue;
      if (Math.hypot(unit.x - warn.x, unit.y - warn.y) <= warn.radius) dealDamage(unit, warn.damage, enemy, 'magic');
    }
    groundEffects.push({ x: warn.x, y: warn.y, r: 0, maxR: warn.radius, life: 0.6, color: '#ff4400' });
    groundEffects.push({ x: warn.x, y: warn.y, r: 0, maxR: warn.radius * 0.5, life: 0.3, color: '#ffcc0066' });
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      emitParticle(warn.x + Math.cos(angle) * warn.radius * 0.4, warn.y + Math.sin(angle) * warn.radius * 0.4, '#ff6622', 2, 4);
    }
    emitParticle(warn.x, warn.y, '#ffaa44', 8, 3);
    emitParticle(warn.x, warn.y, '#ffffff', 4, 2);
    addDamageText(warn.x, warn.y - 30, 'METEOR!', '#ff4400', { sz: 15, bold: true });
    shake(5);
    sound.meteor();
    enemy._meteorWarn = null;
    return;
  }
  if (enemy._meteorT == null) enemy._meteorT = Math.floor(enemy.meteorCD * 0.6) + Math.floor(randomRange(0, 120));
  enemy._meteorT--;
  if (enemy._meteorT > 0) return;
  enemy._meteorT = enemy.meteorCD;
  const candidates = [];
  for (const unit of units) {
    if (unit.hp <= 0 || unit.divineShield || unit.untargetable || unit.isGhost) continue;
    if (unit.stealth && unit.stealthHits === 0) continue;
    candidates.push(unit);
  }
  const backline = candidates.filter(unit => unit.arch === 'ranged' || unit.arch === 'healer' || unit.arch === 'paladin');
  const target = backline.length ? backline[Math.floor(Math.random() * backline.length)] : (candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null);
  if (!target) return;
  const damage = Math.round(enemy.dmg * (enemy.meteorDmgMult || 0.6));
  const radius = enemy.meteorRadius || 55;
  enemy._meteorWarn = { x: target.x, y: target.y, radius, damage, timer: 36, maxTimer: 36 };
  groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: radius, life: 0.75, color: '#ff4400', enemyWarn: true, warnTimer: 36, warnMax: 36, warnKind: 'meteor' });
  addDamageText(target.x, target.y - 30, 'METEOR', '#ff8844', { sz: 13, bold: true });
  emitParticle(target.x, target.y, '#ff8844', 8, 3);
}
