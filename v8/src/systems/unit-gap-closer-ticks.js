import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitSupportAndGapClosers(unit, deps) {
  tickCleanse(unit, deps);
  tryStartShieldCharge(unit, deps);
  if (tickShieldChargeLeap(unit, deps)) return true;
  tickShieldChargeRepeat(unit);
  tickBullCharge(unit, deps);
  tickLegacyDeathGrip(unit, deps);
  tickMaulLeap(unit, deps);
  if (tickHallowedLeap(unit, deps)) return true;
  return false;
}

function tickCleanse(unit, {
  units,
  emitParticle,
  addDamageText,
}) {
  if (!unit.cleanse) return;

  unit.cleanse.counter++;
  if (unit.cleanse.counter < unit.cleanse.every) return;

  unit.cleanse.counter = 0;
  for (const ally of units) {
    if (ally === unit || ally.hp <= 0 || !ally.isPlayer) continue;
    if (dist(unit, ally) >= 160) continue;
    let cleansed = false;
    if (ally.poisonTimer > 0) {
      ally.poisonTimer = 0;
      cleansed = true;
    } else if (ally.slowTimer > 0) {
      ally.slowTimer = 0;
      ally.slowMult = 1;
      cleansed = true;
    } else if (ally.ampTimer > 0) {
      ally.ampTimer = 0;
      cleansed = true;
    } else if (ally.bleedTimer > 0) {
      ally.bleedTimer = 0;
      cleansed = true;
    }
    if (!cleansed) continue;

    emitParticle(ally.x, ally.y, '#aaffaa', 24, 5);
    addDamageText(ally.x, ally.y - ally.size, 'CLEANSED', '#aaffaa');
    if (unit.purify) {
      ally.debuffImmune = (ally.debuffImmune || 0) + 480;
      addDamageText(ally.x, ally.y - ally.size - 14, 'IMMUNE 4s', '#88ffdd');
    }
    break;
  }
}

function tryStartShieldCharge(unit, {
  enemies,
  isGripReserved,
  isGapCloserReserved,
  reserveGapCloserTarget,
  showFlash,
  emitParticle,
  sound,
  shake,
}) {
  if (!unit.chargePending || unit.chargeLeapActive) return;

  let farthest = null;
  let farthestDistance = 0;
  let ranged = null;
  let rangedDistance = Infinity;
  let triggered = false;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    if (isGripReserved(enemy, unit) || isGapCloserReserved(enemy, unit)) continue;
    const distance = dist(unit, enemy);
    if (distance <= 100 && distance >= 50) {
      triggered = true;
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthest = enemy;
      }
    }
    if ((enemy.arch === 'ranged' || enemy.arch === 'caster') && distance <= 100 && distance >= 50 && distance < rangedDistance) {
      rangedDistance = distance;
      ranged = enemy;
    }
  }

  if (!triggered || !(ranged || farthest)) return;

  const target = ranged || farthest;
  reserveGapCloserTarget(target, unit, 40);
  unit.chargePending = false;
  unit.chargeLeapActive = true;
  unit.chargeLeapT = 0;
  unit.chargeLeapDur = 22;
  unit.chargeLeapFromX = unit.x;
  unit.chargeLeapFromY = unit.y;
  unit.chargeLeapToX = target.x;
  unit.chargeLeapToY = target.y + 22;
  unit.chargeLeapTarget = target;
  showFlash('SHIELD CHARGE!', '#ffaa44', 30);
  emitParticle(unit.x, unit.y, '#ffaa44', 24, 5);
  shake(5);
  sound.taunt();
}

function tickShieldChargeLeap(unit, {
  frame,
  enemies,
  groundEffects,
  randomRange,
  dealDamage,
  showFlash,
  emitParticle,
  sound,
  shake,
}) {
  if (!unit.chargeLeapActive) return false;

  unit.chargeLeapT++;
  const t = unit.chargeLeapT / unit.chargeLeapDur;
  unit.x = unit.chargeLeapFromX + (unit.chargeLeapToX - unit.chargeLeapFromX) * t;
  const arcHeight = Math.sin(t * Math.PI) * 35;
  unit.y = unit.chargeLeapFromY + (unit.chargeLeapToY - unit.chargeLeapFromY) * t - arcHeight;
  unit.facing = unit.chargeLeapToX >= unit.chargeLeapFromX ? 1 : -1;
  if (frame % 2 === 0) {
    emitParticle(unit.x, unit.y + arcHeight, '#aa7733', 2, 2);
    emitParticle(unit.x + randomRange(-8, 8), unit.y + unit.size * 0.4, '#886633', 1, 2);
  }
  if (frame % 3 === 0) emitParticle(unit.x + randomRange(-5, 5), unit.y - unit.size * 0.3, '#ffcc44', 1, 3);

  if (unit.chargeLeapT >= unit.chargeLeapDur) {
    unit.chargeLeapActive = false;
    const target = unit.chargeLeapTarget;
    if (target && target.hp > 0) {
      const mult = unit.chargeFirstHitMult || 1.6;
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (dist(target, enemy) < 70) {
          dealDamage(enemy, Math.round(unit.dmg * mult), unit, 'normal');
          if (!enemy.isBoss) enemy.stunned = Math.max(enemy.stunned || 0, 90);
        }
      }
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * Math.PI * 2;
        emitParticle(target.x + Math.cos(angle) * 25, target.y + Math.sin(angle) * 25, '#ffaa44', 18, 3);
      }
      emitParticle(target.x, target.y, '#ffffff', 12, 5);
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 70, life: 0.6, color: '#ffaa44' });
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 40, life: 0.4, color: '#ffffff' });
      for (let i = 0; i < 5; i++) emitParticle(target.x + randomRange(-30, 30), target.y + randomRange(-5, 15), '#886633', 12, 2);
      shake(12);
      showFlash('SHIELD IMPACT!', '#ffaa44', 30);
      sound.shieldBash();
    }
    if (unit.chargeRepeatCD) unit._chargeRepeatT = 0;
  }

  return true;
}

function tickShieldChargeRepeat(unit) {
  if (!unit.chargeRepeatCD || unit.chargePending || unit.chargeLeapActive) return;

  unit._chargeRepeatT = (unit._chargeRepeatT || 0) + 1;
  if (unit._chargeRepeatT >= unit.chargeRepeatCD) {
    unit.chargePending = true;
    unit.chargeFirstUsed = false;
  }
}

function tickBullCharge(unit, {
  arena,
  frame,
  groundEffects,
  randomRange,
  findUnreservedEnemyInRange,
  grantGapInvulnerability,
  emitParticle,
  addDamageText,
  sound,
}) {
  if (unit.bullCharge && !unit._bullCharged && arena && arena.phase === 'wave') {
    if (!unit._bullChargeCheck) {
      const near = findUnreservedEnemyInRange(unit, 300, 0);
      if (near && dist(unit, near) < 300) {
        unit._bullCharging = 180;
        unit._bullCharged = true;
        unit._bullChargeCheck = true;
        if (unit.unitIdx === 1) {
          grantGapInvulnerability(unit, 'BULL GUARD', '#aa66ff');
          emitParticle(unit.x, unit.y, '#88bbff', 12, 5);
          emitParticle(unit.x, unit.y, '#aa44ff', 8, 3);
          groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 35, life: 0.4, color: '#6644cc' });
          addDamageText(unit.x, unit.y - unit.size, 'UNHOLY CHARGE!', '#aa66ff', { sz: 14, bold: true });
        } else {
          emitParticle(unit.x, unit.y, '#88aa44', 12, 5);
          emitParticle(unit.x, unit.y, '#cc8833', 8, 3);
          groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 35, life: 0.4, color: '#886622' });
          addDamageText(unit.x, unit.y - unit.size, 'STAMPEDE!', '#ccaa44', { sz: 14, bold: true });
        }
        sound.taunt();
      }
    }
  }

  if (unit._bullCharging > 0) {
    unit._bullCharging--;
    if (frame % 4 === 0) {
      if (unit.unitIdx === 1) {
        emitParticle(unit.x + randomRange(-6, 6), unit.y + unit.size * 0.3, '#6644cc', 1, 2);
        emitParticle(unit.x + randomRange(-4, 4), unit.y + unit.size * 0.4, '#88bbff', 1, 2);
      } else {
        emitParticle(unit.x + randomRange(-6, 6), unit.y + unit.size * 0.3, '#886633', 1, 2);
        emitParticle(unit.x + randomRange(-4, 4), unit.y + unit.size * 0.4, '#ccaa44', 1, 2);
      }
    }
  }
}

function tickLegacyDeathGrip(unit, {
  arena,
  frame,
  enemies,
  beamEffects,
  groundEffects,
  randomRange,
  findUnreservedEnemyInRange,
  isGapCloserReserved,
  reserveGripTarget,
  emitParticle,
  addDamageText,
  sound,
  shake,
}) {
  if (!unit.deathGrip || typeof unit.deathGrip === 'object' || !arena || arena.phase !== 'wave') return;

  if (!unit._dgCharged) {
    const near = findUnreservedEnemyInRange(unit, 300, 0);
    if (near && dist(unit, near) < 300) {
      unit._dgCharging = 180;
      unit._dgCharged = true;
      emitParticle(unit.x, unit.y, '#8844cc', 8, 4);
      addDamageText(unit.x, unit.y - unit.size, 'CHARGE!', '#aa66dd', { sz: 13, bold: true });
      sound.taunt();
    }
  }

  if (unit._dgCharging > 0) {
    unit._dgCharging--;
    if (frame % 4 === 0) {
      emitParticle(unit.x + randomRange(-6, 6), unit.y + unit.size * 0.3, '#6644cc', 1, 2);
      emitParticle(unit.x + randomRange(-4, 4), unit.y + unit.size * 0.4, '#88bbff', 1, 2);
    }
  }

  if (unit._deathGripT == null) unit._deathGripT = Math.max(0, (unit.deathGripCD || 480) - 2 * GAME_TICK_HZ);
  else unit._deathGripT++;
  if (unit._deathGripT < (unit.deathGripCD || 480)) return;

  let best = null;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.isBoss) continue;
    if (isGapCloserReserved(enemy, unit)) continue;
    const distance = dist(unit, enemy);
    if (distance < 200 && distance < bestDistance) {
      bestDistance = distance;
      best = enemy;
    }
  }
  if (!best) return;

  unit._deathGripT = 0;
  const oldX = best.x;
  const oldY = best.y;
  best.x = unit.x + (unit.facing || 1) * 30;
  best.y = unit.y;
  reserveGripTarget(best, unit, 60);
  best.stunned = Math.max(best.stunned || 0, 60);
  beamEffects.push({ x1: unit.x, y1: unit.y, x2: oldX, y2: oldY, color: '#aa44ff', width: 5, life: 0.35, maxLife: 0.35, wavy: true });
  beamEffects.push({ x1: unit.x, y1: unit.y, x2: oldX, y2: oldY, color: '#6622aa', width: 2, life: 0.3, maxLife: 0.3, straight: true });
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2;
    emitParticle(best.x + Math.cos(angle) * 18, best.y + Math.sin(angle) * 18, '#aa44ff', 14, 2);
  }
  emitParticle(best.x, best.y, '#ff44ff', 16, 4);
  emitParticle(oldX, oldY, '#aa44ff', 8, 3);
  groundEffects.push({ x: best.x, y: best.y, r: 0, maxR: 30, life: 0.4, color: '#8833cc' });
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 25, life: 0.3, color: '#6622aa' });
  addDamageText(unit.x, unit.y - unit.size, 'DEATH GRIP!', '#cc66ff', { sz: 14, bold: true });
  shake(4);
  sound.debuff();
}

function tickMaulLeap(unit, {
  arena,
  frame,
  arenaTop,
  enemies,
  beamEffects,
  groundEffects,
  randomRange,
  dealDamage,
  clampToArena,
  isGripReserved,
  isGapCloserReserved,
  reserveGapCloserTarget,
  grantGapInvulnerability,
  emitParticle,
  addDamageText,
  sound,
  shake,
}) {
  if (!unit.maulLeap || !arena || arena.phase !== 'wave') return;

  unit._maulLeapT = (unit._maulLeapT || 0) + 1;
  if (unit._maulLeapAnim) {
    unit._maulLeapAnim.t++;
    const leap = unit._maulLeapAnim;
    const t = leap.t / leap.dur;
    unit.x = leap.fx + (leap.tx - leap.fx) * t;
    const arc = Math.sin(t * Math.PI) * 40;
    unit.y = leap.fy + (leap.ty - leap.fy) * t - arc;
    if (frame % 2 === 0) {
      emitParticle(unit.x + randomRange(-5, 5), unit.y + unit.size * 0.4, '#886633', 1, 2);
      emitParticle(unit.x, unit.y, '#44aa22', 1, 2);
    }
    if (t >= 1) {
      unit._maulLeapAnim = null;
      clampToArena(unit);
      const target = leap.target;
      if (target && target.hp > 0) {
        dealDamage(target, Math.round(unit.dmg * 1.5), unit, 'normal');
        for (let i = 0; i < 3; i++) {
          const cleaveAngle = (-0.3 + i * 0.3) + Math.atan2(target.y - unit.y, target.x - unit.x);
          beamEffects.push({ x1: unit.x, y1: unit.y, x2: unit.x + Math.cos(cleaveAngle) * 30, y2: unit.y + Math.sin(cleaveAngle) * 30, color: '#ffcc44', width: 3, life: 0.2, maxLife: 0.2, straight: true });
        }
      }
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2;
        emitParticle(unit.x + Math.cos(angle) * 20, unit.y + Math.sin(angle) * 20, '#886633', 12, 2);
      }
      emitParticle(unit.x, unit.y, '#ffcc66', 16, 5);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 40, life: 0.4, color: '#88662288' });
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 25, life: 0.3, color: '#44aa22' });
      addDamageText(unit.x, unit.y - unit.size, 'MAUL!', '#ffaa33', { sz: 15, bold: true });
      shake(6);
      sound.heavySlash();
    }
    return;
  }

  if (unit._maulLeapT < 720) return;

  let target = null;
  let targetDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    if (isGripReserved(enemy, unit) || isGapCloserReserved(enemy, unit)) continue;
    const distance = dist(unit, enemy);
    if (distance < 100 && distance < targetDistance) {
      targetDistance = distance;
      target = enemy;
    }
  }
  if (!target) return;

  unit._maulLeapT = 0;
  reserveGapCloserTarget(target, unit, 28);
  const toX = target.x + randomRange(-15, 15);
  const toY = Math.max(arenaTop + 20, target.y - 30);
  unit._maulLeapAnim = { fx: unit.x, fy: unit.y, tx: toX, ty: toY, t: 0, dur: 14, target };
  grantGapInvulnerability(unit, 'MAUL GUARD', '#ccaa44');
  emitParticle(unit.x, unit.y, '#88aa44', 10, 4);
  sound.roar();
}

function tickHallowedLeap(unit, {
  arena,
  frame,
  enemies,
  groundEffects,
  randomRange,
  dealDamage,
  reserveGapCloserTarget,
  clampToLeash,
  addGoldShield,
  showFlash,
  emitParticle,
  addDamageText,
  sound,
  shake,
}) {
  if (!unit.hallowedLeap || !arena || arena.phase !== 'wave' || unit.hp <= 0) return false;

  if (unit._hallowedLeapAnim) {
    unit._hallowedLeapAnim.t++;
    const leap = unit._hallowedLeapAnim;
    const t = Math.min(1, leap.t / leap.dur);
    unit.x = leap.fx + (leap.tx - leap.fx) * t;
    const arc = Math.sin(t * Math.PI) * 38;
    unit.y = leap.fy + (leap.ty - leap.fy) * t - arc;
    unit.facing = leap.tx >= leap.fx ? 1 : -1;
    if (frame % 2 === 0) {
      emitParticle(unit.x + randomRange(-6, 6), unit.y + unit.size * 0.35, '#ffd700', 1, 3);
      emitParticle(unit.x, unit.y, '#ffffff', 1, 2);
    }
    if (t >= 1) {
      unit._hallowedLeapAnim = null;
      unit.x = leap.tx;
      unit.y = leap.ty;
      clampToLeash(unit);
      const radius = unit.hallowedLeap.radius || 90;
      const damage = Math.max(1, Math.round(unit.dmg * (unit.hallowedLeap.dmgMult || 0.45)));
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || enemy.burrowing || enemy.untargetable || enemy.isBarrier) continue;
        if (dist(unit, enemy) > radius) continue;
        dealDamage(enemy, damage, unit, 'magic');
        emitParticle(enemy.x, enemy.y, '#ffe066', 5, 3);
        if (!enemy.isBoss) {
          enemy.avengedTimer = Math.max(enemy.avengedTimer || 0, Math.round(3 * GAME_TICK_HZ));
          enemy.avengedMult = Math.min(enemy.avengedMult || 1, 0.92);
          enemy.forcedTarget = unit;
          enemy.forcedTargetTimer = Math.max(enemy.forcedTargetTimer || 0, unit.hallowedLeap.tauntDur || Math.round(2 * GAME_TICK_HZ));
        }
      }
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.55, color: '#ffd700' });
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: Math.round(radius * 0.55), life: 0.35, color: '#ffffff' });
      emitParticle(unit.x, unit.y, '#ffd700', 28, 5);
      emitParticle(unit.x, unit.y, '#ffffff', 12, 3);
      addDamageText(unit.x, unit.y - unit.size, 'HALLOWED LEAP!', '#ffd700', { sz: 15, bold: true });
      shake(8);
      sound.shieldBlock();
    }
    return true;
  }

  unit._hallowedLeapT = (unit._hallowedLeapT || 0) + 1;
  if (unit._hallowedLeapT < unit.hallowedLeap.cd) return false;

  const range = unit.hallowedLeap.range || 320;
  const clusterRadius = 95;
  const valid = enemy => enemy && enemy.hp > 0 && !enemy.burrowing && !enemy.untargetable && !enemy.isBarrier && dist(unit, enemy) <= range;
  let best = null;
  let bestScore = -Infinity;
  for (const enemy of enemies) {
    if (!valid(enemy)) continue;
    const casterish = enemy.arch === 'ranged' || enemy.arch === 'caster' || enemy.arch === 'support' || enemy.range > 70;
    if (!casterish) continue;
    let cluster = 0;
    for (const other of enemies) if (other.hp > 0 && !other.untargetable && !other.isBarrier && dist(enemy, other) <= clusterRadius) cluster++;
    const distance = dist(unit, enemy);
    const score = 1000 + cluster * 45 - distance - (enemy.isBoss ? 180 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = enemy;
    }
  }
  if (!best) {
    for (const enemy of enemies) {
      if (!valid(enemy)) continue;
      let cluster = 0;
      for (const other of enemies) if (other.hp > 0 && !other.untargetable && !other.isBarrier && dist(enemy, other) <= clusterRadius) cluster++;
      const distance = dist(unit, enemy);
      const score = cluster * 80 - distance - (enemy.isBoss ? 80 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
  }
  if (!best) return false;

  unit._hallowedLeapT = 0;
  reserveGapCloserTarget(best, unit, 36);
  const gap = Math.max(48, (unit.size || 24) + (best.size || 22) + 10);
  const land = { x: best.x, y: best.y + gap, isPlayer: true, size: unit.size || 24, homeX: unit.homeX, homeY: unit.homeY };
  clampToLeash(land);
  const duration = 18;
  const shield = Math.round((unit.maxHp || unit.hp || 1) * (unit.hallowedLeap.shieldPct || 0.10));
  const currentShield = unit._goldShield && unit._goldShield.amt > 0 ? unit._goldShield.amt : 0;
  addGoldShield(unit, shield, duration + Math.round(2 * GAME_TICK_HZ), currentShield + shield, true);
  unit.hallowedLeapShieldTimer = duration + Math.round(2 * GAME_TICK_HZ);
  unit._hallowedLeapAnim = { fx: unit.x, fy: unit.y, tx: land.x, ty: land.y, t: 0, dur: duration, target: best };
  emitParticle(unit.x, unit.y, '#ffd700', 18, 5);
  emitParticle(unit.x, unit.y, '#ffffff', 8, 3);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 45, life: 0.35, color: '#ffd700' });
  showFlash('HALLOWED LEAP!', '#ffd700', 35);
  sound.taunt();
  return true;
}
